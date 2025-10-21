"use client";

import { useState } from "react";
import type { MessagePart } from "./chat-window";

type ToolCallPart = Extract<MessagePart, { type: string }> & {
  toolCallId?: string;
  state?:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export const ToolCallCard = ({ part }: { part: ToolCallPart }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusInfo = () => {
    switch (part.state) {
      case "input-streaming":
        return {
          label: "Preparing search...",
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
          animated: true,
        };
      case "input-available":
        return {
          label: "Searching",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          animated: true,
        };
      case "output-available":
        return {
          label: "Completed",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
          animated: false,
        };
      case "output-error":
        return {
          label: "Error",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
          animated: false,
        };
      default:
        return {
          label: "Unknown",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          animated: false,
        };
    }
  };

  const status = getStatusInfo();
  const query =
    typeof part.input === "object" &&
    part.input !== null &&
    "query" in part.input
      ? String((part.input as { query?: string }).query || "")
      : "";

  return (
    <div
      className={`rounded-lg border ${status.borderColor} ${status.bgColor} p-3 my-2 transition-all`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() =>
          part.state === "output-available" && setIsExpanded(!isExpanded)
        }
      >
        <div className="flex items-center gap-2">
          {/* Tool Icon */}
          <div className={`text-lg ${status.animated ? "animate-pulse" : ""}`}>
            🔍
          </div>

          {/* Tool Name & Query */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Web Search</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}
              >
                {status.label}
              </span>
            </div>
            {query && part.state !== "input-streaming" && (
              <span className="text-xs text-gray-600 mt-1">
                {part.state === "input-available"
                  ? "Searching for: "
                  : "Query: "}
                <span className="font-medium">{query}</span>
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse indicator */}
        {part.state === "output-available" && (
          <div
            className={`text-gray-400 text-sm transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </div>
        )}
      </div>

      {/* Error Message */}
      {part.state === "output-error" && part.errorText && (
        <div className="mt-2 text-sm text-red-600 border-t border-red-200 pt-2">
          {part.errorText}
        </div>
      )}

      {/* Expanded Content - Only for successful results */}
      {isExpanded &&
        part.state === "output-available" &&
        part.output !== undefined && (
          <div className="mt-3 border-t border-green-200 pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Results:
            </div>
            <pre className="text-xs bg-white rounded p-2 overflow-x-auto max-h-64 overflow-y-auto border border-green-100">
              {typeof part.output === "string"
                ? part.output
                : JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}
    </div>
  );
};
