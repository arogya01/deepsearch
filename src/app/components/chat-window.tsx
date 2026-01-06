"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Streamdown } from "streamdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ToolCallCard } from "./tool-call-card";
import { ActionCard } from "./action-card";
import { generateNanoId } from "@/app/utils/common";
import { revalidateSidebar } from "@/app/actions/chat";
import { motion, useReducedMotion } from "framer-motion";
import { User, Bot, Search, Copy, ArrowDown, RotateCcw } from "lucide-react";

import { type AppUIMessage, type AppUIDataTypes } from "@/lib/ui-types";

export type MessagePart = NonNullable<AppUIMessage["parts"]>[number];

const TOOL_MESSAGE_PREFIX = "tool-";

type NormalizedToolMessagePart = {
  type: string;
  toolCallId: string;
  toolName: string;
  args?: unknown;
  result?: unknown;
  input?: unknown;
  output?: unknown;
  state?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isToolMessagePart = (part: MessagePart): part is any => {
  if (!part || typeof part !== "object") {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!("type" in part) || typeof (part as any).type !== "string") {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const type = (part as any).type as string;
  // Handle both streaming format (tool-${toolName}) and stored format (tool-call, tool-result)
  return (
    type.startsWith(TOOL_MESSAGE_PREFIX) ||
    type === "tool-call" ||
    type === "tool-result"
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeToolMessagePart = (part: any): NormalizedToolMessagePart => {
  const type = typeof part.type === "string" ? part.type : "";

  // Extract tool name from different formats
  let fromType: string | undefined;
  if (type.startsWith(TOOL_MESSAGE_PREFIX)) {
    // Streaming format: tool-${toolName}
    fromType = type.slice(TOOL_MESSAGE_PREFIX.length);
  } else if (type === "tool-call" || type === "tool-result") {
    // Stored format: use toolName field directly
    fromType = undefined;
  }

  const toolName =
    typeof part.toolName === "string" && part.toolName.length > 0
      ? part.toolName
      : fromType || "tool";

  const toolCallId =
    typeof part.toolCallId === "string" && part.toolCallId.length > 0
      ? part.toolCallId
      : `tool_${generateNanoId(12)}`;

  return {
    type,
    toolCallId,
    toolName,
    args: "args" in part ? part.args : undefined,
    result: "result" in part ? part.result : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: "input" in part ? (part as any).input : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: "output" in part ? (part as any).output : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: "state" in part ? (part as any).state : undefined,
  };
};

export const ChatWindow = ({
  chatId,
  initialMessages,
  newChat,
}: {
  chatId?: string;
  newChat?: boolean;
  initialMessages?: AppUIMessage[];
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const sessionId = useMemo(() => {
    return chatId || `chat_${generateNanoId()}`;
  }, [chatId]);

  const {
    messages,
    sendMessage,
    status, // 'submitted' | 'streaming' | 'ready' | 'error'
    regenerate, // retry last failed turn
    stop,
  } = useChat({
    id: sessionId,
    resume: !newChat, // Enable automatic stream resumption for existing chats
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
        },
      }),
    }),
    messages: initialMessages,
    onFinish: async () => {
      if (newChat) {
        router.push(`/chat/${sessionId}`);
      }
      // Revalidate sidebar to show updated chat list
      await revalidateSidebar();
      router.refresh();
    },
  });

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming";
  const isReady = status === "ready";
  const isErrored = status === "error";

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to stop generation
      if (e.key === "Escape" && (isSubmitted || isStreaming)) {
        e.preventDefault();
        stop();
      }

      // Ctrl/Cmd + / or Ctrl/Cmd + K to focus input
      if ((e.metaKey || e.ctrlKey) && (e.key === "/" || e.key === "k")) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitted, isStreaming, stop]);

  const getMessageText = (m: AppUIMessage): string => {
    if (Array.isArray(m.parts) && m.parts.length > 0) {
      return m.parts
        .filter((part) => part?.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join("");
    }
    return "";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const formatTimestamp = (createdAt?: Date | string | number): string => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (m: AppUIMessage) => {
    if (Array.isArray(m.parts) && m.parts.length > 0) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {m.parts.map((part, idx: number) => {
            if (!part) return null;

            switch (part.type as string) {
              case "text":
                return (
                  <Streamdown key={idx}>
                    {"text" in part ? part.text : ""}
                  </Streamdown>
                );

              default:
                if (part.type === "data-agent-action" && "data" in part) {
                  const data = part.data as AppUIDataTypes["agent-action"];
                  if (data && data.action) {
                    return <ActionCard key={idx} action={data.action} />;
                  }
                }

                if (isToolMessagePart(part)) {
                  const toolPart = normalizeToolMessagePart(part);
                  if (toolPart.toolName === "searchWeb") {
                    return <ToolCallCard key={idx} part={toolPart} />;
                  }
                }
                return null;
            }
          })}
        </div>
      );
    }
    return <div className="whitespace-pre-wrap break-words"></div>;
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || !isReady) return;
    await sendMessage({ text: trimmed });
    setInput("");
    // Refocus textarea after submission
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastAssistantStreaming = useMemo(() => {
    const last = messages[messages.length - 1];
    return (isSubmitted || isStreaming) && last?.role === "assistant";
  }, [messages, isSubmitted, isStreaming]);

  return (
    <div className="w-full flex flex-col h-screen">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-brutal-top px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="font-display text-xl font-bold text-white">
            Deep Search
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <span className="hidden sm:inline-flex items-center border border-blue-500/30 bg-blue-500/10 text-blue-500 px-3 py-1 text-xs font-body">
              Waiting for response…
            </span>
          )}
          {isStreaming && (
            <span className="hidden sm:inline-flex items-center border border-amber/30 bg-amber/10 text-amber px-3 py-1 text-xs font-body">
              Streaming…
            </span>
          )}
          {isErrored && (
            <span className="hidden sm:inline-flex items-center border border-red-500/30 bg-red-500/10 text-red-500 px-3 py-1 text-xs font-body">
              Error
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <StickToBottom
        className="flex-1 overflow-y-auto bg-background"
        resize="smooth"
        initial="smooth"
      >
        <StickToBottom.Content className="px-2 py-3 sm:px-4 sm:py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="max-w-4xl mx-auto text-center px-4">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                  <div className="w-16 h-16 bg-black text-amber flex items-center justify-center border-2 border-amber">
                    <Search className="w-8 h-8" />
                  </div>
                </div>

                {/* Title */}
                <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6">
                  Deep Search
                </h1>
                <p className="font-body text-lg text-white/60 mb-12 max-w-2xl mx-auto">
                  Explore topics in depth with AI-powered research and analysis
                </p>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      icon: "🔬",
                      title: "Scientific Research",
                      prompt:
                        "What are the latest developments in quantum computing?",
                    },
                    {
                      icon: "💡",
                      title: "Explore Ideas",
                      prompt: "How does blockchain technology work?",
                    },
                    {
                      icon: "📊",
                      title: "Market Analysis",
                      prompt: "What are the trends in renewable energy?",
                    },
                    {
                      icon: "🌍",
                      title: "Global Events",
                      prompt: "What are the current geopolitical challenges?",
                    },
                  ].map((example) => (
                    <button
                      key={example.title}
                      onClick={() => {
                        setInput(example.prompt);
                      }}
                      className="flex items-start gap-4 p-6 text-left bg-[#1A1A1A] border-brutal-top font-body hover:bg-amber-muted transition-colors"
                    >
                      <span className="text-2xl">
                        {example.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm font-semibold text-white mb-2">
                          {example.title}
                        </div>
                        <div className="text-sm text-white/60 line-clamp-2">
                          {example.prompt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-white/40 font-body">
                  Start by typing your question or click an example above
                </p>
              </div>
            </div>
          )}

          {(messages as AppUIMessage[]).map((m) => {
            const isUser = m.role === "user";
            const messageText = getMessageText(m);
            const timestamp = formatTimestamp(
              (m as { createdAt?: string | number | Date }).createdAt
            );

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.4 }}
                className={`flex ${
                  isUser ? "justify-end" : "justify-start"
                } group mt-4 sm:mt-6`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar - always show */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-black text-amber flex items-center justify-center border-2 border-amber">
                      {isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col min-w-0">
                    <div
                      className={`p-4 transition-colors ${
                        isUser
                          ? "bg-amber p-4 border-2 border-amber"
                          : "bg-[#1A1A1A] border-brutal-top"
                      }`}
                    >
                      <div className={isUser ? "font-body text-black" : "font-body text-white/80"}>
                        {renderMessageContent(m)}
                      </div>
                    </div>

                    {/* Timestamp and Actions */}
                    <div
                      className={`flex items-center gap-2 mt-1 px-1 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {timestamp && (
                        <span className="text-[10px] sm:text-xs text-white/40 font-body">
                          {timestamp}
                        </span>
                      )}

                      {/* Copy Button - only for assistant messages */}
                      {!isUser && messageText && (
                        <button
                          onClick={() => copyToClipboard(messageText)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-amber"
                          aria-label="Copy message"
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {lastAssistantStreaming && (
            <div className="flex justify-start group">
              <div className="flex gap-3">
                {/* AI Avatar */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-black text-amber flex items-center justify-center border-2 border-amber animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>

                {/* Thinking Animation */}
                <div className="bg-[#1A1A1A] border-brutal-top p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-amber rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-amber rounded-full animate-bounce"></span>
                    </div>
                    <span className="font-body text-sm text-white/60">Processing…</span>
                  </div>
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-px bg-amber/60 mt-3"
                  />
                </div>
              </div>
            </div>
          )}

          {isErrored && (
            <div className="flex justify-center">
              <div className="w-full max-w-md border-2 border-red-500 bg-[#1A1A1A] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-black text-red-500 flex items-center justify-center border-2 border-red-500">
                      <span className="font-display text-xl font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display text-xl font-bold text-white mb-2">
                      Error
                    </h4>
                    <p className="font-body text-white/60 text-sm">
                      We encountered an error. Please try again or contact
                      support if the problem persists.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>

      {/* Composer */}
      <div className="border-t border-white/10 bg-[#080808] p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              isSubmitted || isStreaming
                ? "Receiving response…"
                : isErrored
                ? "Fix or retry…"
                : "Ask anything…"
            }
            className="flex-1 resize-none bg-[#1A1A1A] border-2 border-white/20 text-white font-body px-4 py-3 text-sm sm:text-base placeholder:text-white/40 focus:border-amber focus:outline-none min-h-[48px] max-h-[200px]"
            rows={1}
            disabled={!isReady}
          />

          {/* Resumable streams enabled - Stop button removed for compatibility */}
          {isErrored ? (
            <button
              type="button"
              onClick={() => regenerate()}
              className="shrink-0 px-6 py-3 bg-amber text-black font-body font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 px-6 py-3 bg-amber text-black font-body font-semibold border-2 border-amber hover:bg-black hover:text-amber disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Send
              <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/40 font-body">
          <span>
            <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-white/20 text-[10px] sm:text-[11px] font-body">
              Enter
            </kbd>{" "}
            to send
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-white/20 text-[10px] sm:text-[11px] font-body">
              Shift+Enter
            </kbd>{" "}
            for newline
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-white/20 text-[10px] sm:text-[11px] font-body">
              Esc
            </kbd>{" "}
            to stop
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-white/20 text-[10px] sm:text-[11px] font-body">
              ⌘/
            </kbd>{" "}
            to focus
          </span>
        </div>
      </div>
    </div>
  );
};

const ScrollToBottomButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      onClick={() => scrollToBottom("smooth")}
      className="absolute bottom-20 right-4 sm:bottom-4 sm:right-4 bg-amber text-black p-3 border-2 border-amber hover:bg-black hover:text-amber transition-colors z-10"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="w-5 h-5" />
    </button>
  );
};
