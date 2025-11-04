"use client";

import { useMemo, useState } from "react";
import type { UIMessage } from "ai";

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface MessageUsage {
  messageId: string;
  role: string;
  usage: TokenUsage;
}

interface ContextPanelProps {
  messages: UIMessage[];
  isOpen: boolean;
  onToggle: () => void;
}

const GEMINI_CONTEXT_LIMIT = 1_000_000; // 1M tokens for Gemini 2.5 Flash

export const ContextPanel = ({ messages, isOpen, onToggle }: ContextPanelProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const { totalUsage, messageUsages } = useMemo(() => {
    const messageUsages: MessageUsage[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    messages.forEach((message) => {
      if (message.metadata && typeof message.metadata === 'object' && 'usage' in message.metadata) {
        const usage = message.metadata.usage as TokenUsage;
        if (usage && typeof usage === 'object') {
          messageUsages.push({
            messageId: message.id,
            role: message.role,
            usage: {
              promptTokens: usage.promptTokens || 0,
              completionTokens: usage.completionTokens || 0,
              totalTokens: usage.totalTokens || 0,
            },
          });

          totalPromptTokens += usage.promptTokens || 0;
          totalCompletionTokens += usage.completionTokens || 0;
          totalTokens += usage.totalTokens || 0;
        }
      }
    });

    return {
      totalUsage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens,
      },
      messageUsages,
    };
  }, [messages]);

  const usagePercentage = (totalUsage.totalTokens / GEMINI_CONTEXT_LIMIT) * 100;

  // Determine color based on usage percentage
  const getColorClasses = () => {
    if (usagePercentage < 25) {
      return {
        bg: "bg-green-500",
        text: "text-green-700",
        lightBg: "bg-green-50",
        border: "border-green-200",
      };
    } else if (usagePercentage < 75) {
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-700",
        lightBg: "bg-yellow-50",
        border: "border-yellow-200",
      };
    } else {
      return {
        bg: "bg-red-500",
        text: "text-red-700",
        lightBg: "bg-red-50",
        border: "border-red-200",
      };
    }
  };

  const colors = getColorClasses();

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 border-l border-t border-b border-gray-300 rounded-l-lg px-2 py-4 shadow-lg transition-colors z-10"
        aria-label="Open context panel"
      >
        <div className="flex flex-col items-center gap-1">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs text-gray-600 writing-mode-vertical">Context</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Context Usage</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close context panel"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Total Usage Card */}
        <div className={`${colors.lightBg} ${colors.border} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Tokens</span>
            <span className={`text-2xl font-bold ${colors.text}`}>
              {formatNumber(totalUsage.totalTokens)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className={`${colors.bg} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{usagePercentage.toFixed(2)}% used</span>
            <span>{formatNumber(GEMINI_CONTEXT_LIMIT)} limit</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Breakdown</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">Prompt Tokens</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(totalUsage.promptTokens)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-700">Completion Tokens</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(totalUsage.completionTokens)}
              </span>
            </div>
          </div>
        </div>

        {/* Per-Message Details */}
        {messageUsages.length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">
                Per-Message Details ({messageUsages.length})
              </span>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  showDetails ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDetails && (
              <div className="mt-2 space-y-2">
                {messageUsages.map((msgUsage, idx) => (
                  <div
                    key={msgUsage.messageId}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Message #{idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          msgUsage.role === "assistant"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {msgUsage.role}
                      </span>
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <div className="flex justify-between">
                        <span>Prompt:</span>
                        <span className="font-medium">
                          {formatNumber(msgUsage.usage.promptTokens)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion:</span>
                        <span className="font-medium">
                          {formatNumber(msgUsage.usage.completionTokens)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">
                          {formatNumber(msgUsage.usage.totalTokens)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium mb-1">About Context Usage</p>
              <p className="text-blue-700">
                Gemini 2.5 Flash has a 1M token context window. This shows how much
                of that capacity your conversation is using.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
