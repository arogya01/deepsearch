"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

export const ChatWindow = () => {
  const [input, setInput] = useState("");

  // useChat streams updates into `messages` as parts arrive
  const {
    messages,
    sendMessage,
    status,       // 'ready' | 'submitted' | 'streaming' | ...
    stop,         // cancel current stream
    error,        // optional error from last attempt
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    // Optional: handle transient data parts if you stream them from the server
    // onData: (dataPart) => { /* show toasts/progress bars for transient updates */ },
  });

  const isStreaming = status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  // Compose assistant text for display (supports both parts-based and legacy content)
  const renderMessageContent = (m: any) => {
    // AI SDK v5: message.parts is an array of typed parts; stream updates mutate parts incrementally
    if (Array.isArray(m.parts) && m.parts.length > 0) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {m.parts
            .filter((p: any) => p?.type === "text")
            .map((p: any, idx: number) => (
              <span key={idx}>{p.text}</span>
            ))}
        </div>
      );
    }
    // Fallback for legacy content shape
    return <div className="whitespace-pre-wrap break-words">{m.content}</div>;
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    // sendMessage in AI SDK v5 accepts `{ text }` to append a user message and start streaming
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
    // If the last message is assistant and we're streaming, we can show a subtle typing indicator
    const last = messages[messages.length - 1];
    return isStreaming && last?.role === "assistant";
  }, [messages, isStreaming]);

  return (
    <div className="w-full max-w-2xl mx-auto h-[640px] flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Deep Search a topic</h2>
        {status !== "ready" && (
          <span className="text-xs text-gray-500">Status: {status}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
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

        {error && (
          <div className="flex justify-center">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {String(error)}
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything…"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Stop
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
