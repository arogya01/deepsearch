"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Streamdown } from "streamdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ToolCallCard } from "./tool-call-card";

import type { UIMessage } from "ai";

export type MessagePart = NonNullable<UIMessage["parts"]>[number];

function generateNanoId(size: number = 21): string {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";

  for (let i = 0; i < size; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return id;
}

export const ChatWindow = ({
  chatId,
  initialMessages,
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
}) => {
  const [input, setInput] = useState("");
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | undefined>(
    chatId || `chat_${generateNanoId()}`
  );
  const [hasRedirected, setHasRedirected] = useState(false);
  const {
    messages,
    sendMessage,
    status, // 'submitted' | 'streaming' | 'ready' | 'error'
    stop, // cancel current stream
    regenerate, // retry last failed turn
  } = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
    onData: ({ data, type }) => {
      // Handle custom data-session part from backend (for validation/confirmation)
      if (type === "data-session") {
        // Backend confirms the session ID
        // We already have the sessionId generated client-side, so this is mainly for validation
        const backendSessionId = (data as { sessionId: string; isNew: boolean })
          .sessionId;

        // Log if there's a mismatch (shouldn't happen in normal flow)
        if (backendSessionId !== sessionId) {
          console.warn(
            `Session ID mismatch: client=${sessionId}, backend=${backendSessionId}`
          );
        }
      }
    },
  });

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming";
  const isReady = status === "ready";
  const isErrored = status === "error";

  // Sync chatId from URL params with state, and redirect when starting new chat
  useEffect(() => {
    if (chatId && chatId !== sessionId) {
      setSessionId(chatId);
    }
  }, [chatId, sessionId]);

  // Redirect to the chat URL when first message is sent on base /chat route
  useEffect(() => {
    if (!chatId && !hasRedirected && messages.length > 0 && sessionId) {
      setHasRedirected(true);
      router.push(`/chat/${sessionId}`);
    }
  }, [chatId, hasRedirected, messages.length, sessionId, router]);

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
                // Handle tool calls (type starts with "tool-")
                if (part.type.startsWith("tool-")) {
                  // Check if this is a searchWeb tool call
                  if ("toolName" in part && part.toolName === "searchWeb") {
                    // Cast to a compatible type for ToolCallCard
                    const toolPart = part as unknown as {
                      type: string;
                      toolCallId: string;
                      toolName: string;
                      args?: unknown;
                      result?: unknown;
                    };
                    return (
                      <ToolCallCard
                        key={toolPart.toolCallId || idx}
                        part={toolPart}
                      />
                    );
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
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-base font-semibold text-gray-900">
            Deep Search a topic
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-800 px-2 py-1 text-xs">
              Waiting for response…
            </span>
          )}
          {isStreaming && (
            <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-700 px-2 py-1 text-xs">
              Streaming…
            </span>
          )}
          {isErrored && (
            <span className="inline-flex items-center rounded-md bg-red-100 text-red-700 px-2 py-1 text-xs">
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
        <StickToBottom.Content className="px-4 py-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
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
              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl shadow-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500" />
                  </span>
                  Thinking…
                </span>
              </div>
            </div>
          )}

          {isErrored && (
            <div className="flex justify-center">
              <div className="w-full max-w-md text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                Something went wrong. Please try again.
              </div>
            </div>
          )}
        </StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>

      {/* Composer */}
      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
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
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            rows={2}
            disabled={!isReady}
          />

          {isSubmitted || isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
            >
              Stop
            </button>
          ) : isErrored ? (
            <button
              type="button"
              onClick={() => regenerate()}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-1 text-[11px] text-gray-500">
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
      className="absolute bottom-4 right-4 rounded-full bg-blue-600 text-white p-3 shadow-lg hover:bg-blue-700 transition-colors z-10"
      aria-label="Scroll to bottom"
    >
      <svg
        className="w-5 h-5"
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
