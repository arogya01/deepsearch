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

import type { UIMessage } from "ai";

export type MessagePart = NonNullable<UIMessage["parts"]>[number];

const TOOL_MESSAGE_PREFIX = "tool-";

interface AgentActionData {
  type: "agent-action";
  action: {
    type: string;
    title: string;
    description: string;
    step: number;
  };
}

type ToolMessagePart = MessagePart & {
  type: string;
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
  input?: unknown;
  output?: unknown;
  state?: string;
};

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

const isToolMessagePart = (part: MessagePart): part is ToolMessagePart => {
  if (!part || typeof part !== "object") {
    return false;
  }

  if (!("type" in part) || typeof part.type !== "string") {
    return false;
  }

  // Handle both streaming format (tool-${toolName}) and stored format (tool-call, tool-result)
  return (
    part.type.startsWith(TOOL_MESSAGE_PREFIX) ||
    part.type === "tool-call" ||
    part.type === "tool-result"
  );
};

const normalizeToolMessagePart = (
  part: ToolMessagePart
): NormalizedToolMessagePart => {
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
    input: "input" in part ? part.input : undefined,
    output: "output" in part ? part.output : undefined,
    state: "state" in part ? part.state : undefined,
  };
};

export const ChatWindow = ({
  chatId,
  initialMessages,
  newChat,
}: {
  chatId?: string;
  newChat?: boolean;
  initialMessages?: UIMessage[];
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
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

  const getMessageText = (m: UIMessage): string => {
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

  const renderMessageContent = (m: UIMessage) => {
    if (Array.isArray(m.parts) && m.parts.length > 0) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {m.parts.map((part, idx: number) => {
            if (!part) return null;

            switch (part.type) {
              case "text":
                return (
                  <Streamdown key={idx}>
                    {"text" in part ? part.text : ""}
                  </Streamdown>
                );

              default:
                if (part.type === "data-agent-action" && "data" in part) {
                  const data = part.data as unknown as AgentActionData;
                  if (data?.type === "agent-action" && data.action) {
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
      <div className="bg-muted/30 px-3 py-2 md:px-4 md:py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-sm md:text-base font-semibold text-foreground">
            Deep Search a topic
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 text-xs">
              Waiting for response…
            </span>
          )}
          {isStreaming && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 text-xs">
              Streaming…
            </span>
          )}
          {isErrored && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-2 py-1 text-xs">
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
              <div className="max-w-2xl mx-auto text-center px-4">
                {/* Icon */}
                <div className="mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                  Deep Search
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                  Explore topics in depth with AI-powered research and analysis
                </p>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
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
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(example.prompt);
                      }}
                      className="flex items-start gap-3 p-3 sm:p-4 text-left bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-accent transition-all shadow-sm hover:shadow-md"
                    >
                      <span className="text-xl sm:text-2xl">
                        {example.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-card-foreground mb-1">
                          {example.title}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {example.prompt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Start by typing your question or click an example above
                </p>
              </div>
            </div>
          )}

          {messages.map((m, index) => {
            const isUser = m.role === "user";
            const messageText = getMessageText(m);
            const timestamp = formatTimestamp(
              (m as { createdAt?: string | number | Date }).createdAt
            );

            // Check if previous message is from the same sender
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const isGrouped = previousMessage?.role === m.role;
            const isLastInGroup =
              index === messages.length - 1 ||
              (index < messages.length - 1 &&
                messages[index + 1]?.role !== m.role);

            return (
              <div
                key={m.id}
                className={`flex ${
                  isUser ? "justify-end" : "justify-start"
                } group ${isGrouped ? "mt-1" : "mt-4 sm:mt-6"}`}
              >
                <div
                  className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar - only show for first message in group */}
                  <div className="flex-shrink-0 mt-1">
                    {!isGrouped ? (
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                          isUser
                            ? "bg-blue-600 text-white"
                            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        }`}
                      >
                        {isUser ? "U" : "AI"}
                      </div>
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col min-w-0">
                    <div
                      className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-md transition-shadow hover:shadow-lg ${
                        isUser
                          ? "bg-blue-600 dark:bg-blue-700 text-white"
                          : "bg-muted/50 dark:bg-muted text-foreground"
                      }`}
                    >
                      {renderMessageContent(m)}
                    </div>

                    {/* Timestamp and Actions - only show for last message in group */}
                    {isLastInGroup && (
                      <div
                        className={`flex items-center gap-2 mt-1 px-1 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {timestamp && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {timestamp}
                          </span>
                        )}

                        {/* Copy Button - only for assistant messages */}
                        {!isUser && messageText && (
                          <button
                            onClick={() => copyToClipboard(messageText)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                            aria-label="Copy message"
                            title="Copy message"
                          >
                            <svg
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {lastAssistantStreaming && (
            <div className="flex justify-start group">
              <div className="flex gap-2 sm:gap-3">
                {/* AI Avatar */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold animate-pulse">
                    AI
                  </div>
                </div>

                {/* Thinking Animation */}
                <div className="bg-muted/50 dark:bg-muted text-muted-foreground px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/80 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xs sm:text-sm">Thinking…</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isErrored && (
            <div className="flex justify-center">
              <div className="w-full max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-md overflow-hidden">
                <div className="flex items-start gap-3 p-3 sm:p-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                      Something went wrong
                    </h4>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
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
      <div className="border-t border-border bg-card p-2 sm:p-3">
        <div className="flex items-end gap-1.5 sm:gap-2">
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
            className="flex-1 resize-none rounded-lg border border-input bg-background px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed min-h-[44px] max-h-[200px] transition-all"
            rows={1}
            disabled={!isReady}
          />

          {/* Resumable streams enabled - Stop button removed for compatibility */}
          {isErrored ? (
            <button
              type="button"
              onClick={() => regenerate()}
              className="shrink-0 rounded-lg bg-blue-600 dark:bg-blue-700 px-3 py-2 sm:px-4 text-sm sm:text-base text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 rounded-lg bg-blue-600 dark:bg-blue-700 px-3 py-2 sm:px-4 text-sm sm:text-base text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-0.5 sm:mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-muted-foreground">
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] sm:text-[10px] font-mono">
              Enter
            </kbd>{" "}
            to send
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] sm:text-[10px] font-mono">
              Shift+Enter
            </kbd>{" "}
            for newline
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] sm:text-[10px] font-mono">
              Esc
            </kbd>{" "}
            to stop
          </span>
          <span className="hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] sm:text-[10px] font-mono">
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
      className="absolute bottom-20 right-3 sm:bottom-4 sm:right-4 rounded-full bg-blue-600 text-white p-2.5 sm:p-3 shadow-lg hover:bg-blue-700 transition-colors z-10"
      aria-label="Scroll to bottom"
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
};
