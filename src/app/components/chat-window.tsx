"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Streamdown } from "streamdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ToolCallCard } from "./tool-call-card";
import { generateNanoId } from "@/app/utils/common";
import { revalidateSidebar } from "@/app/actions/chat";

import type { UIMessage } from "ai";

export type MessagePart = NonNullable<UIMessage["parts"]>[number];

const TOOL_MESSAGE_PREFIX = "tool-";

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
  const router = useRouter();
  const sessionId = useMemo(() => {
    return chatId || `chat_${generateNanoId()}`;
  }, [chatId]);
  console.log({ sessionId });
  const {
    messages,
    sendMessage,
    status, // 'submitted' | 'streaming' | 'ready' | 'error'
    regenerate, // retry last failed turn
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
      if(newChat){
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

  const renderMessageContent = (m: UIMessage) => {
    console.log({ m });
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
      <div className="bg-gray-50 px-3 py-2 md:px-4 md:py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Deep Search a topic
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-2 py-1 text-xs">
              Waiting for response…
            </span>
          )}
          {isStreaming && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-blue-100 text-blue-700 px-2 py-1 text-xs">
              Streaming…
            </span>
          )}
          {isErrored && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-red-100 text-red-700 px-2 py-1 text-xs">
              Error
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <StickToBottom
        className="flex-1 overflow-y-auto bg-white"
        resize="smooth"
        initial="smooth"
      >
        <StickToBottom.Content className="px-2 py-3 sm:px-4 sm:py-4 space-y-2 sm:space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900",
                  ].join(" ")}
                >
                  {renderMessageContent(m)}
                </div>
              </div>
            );
          })}

          {lastAssistantStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gray-500" />
                  </span>
                  Thinking…
                </span>
              </div>
            </div>
          )}

          {isErrored && (
            <div className="flex justify-center">
              <div className="w-full max-w-md text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md">
                Something went wrong. Please try again.
              </div>
            </div>
          )}
        </StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>

      {/* Composer */}
      <div className="border-t bg-white p-2 sm:p-3">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <textarea
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
            className="flex-1 resize-none rounded-lg border border-gray-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 min-h-[44px]"
            rows={2}
            disabled={!isReady}
          />

          {/* Resumable streams enabled - Stop button removed for compatibility */}
          {isErrored ? (
            <button
              type="button"
              onClick={() => regenerate()}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 sm:px-4 text-sm sm:text-base text-white hover:bg-blue-700"
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 sm:px-4 text-sm sm:text-base text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-gray-500">
          Enter to send • Shift+Enter for newline
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
