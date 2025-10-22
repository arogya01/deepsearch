"use client";

import { useState } from "react";

// AI SDK v5 tool-call part structure
// Using a flexible type that works with AI SDK's actual types
interface ToolCallPart {
  type: string;
  toolCallId: string;
  toolName: string;
  args?: unknown;
  result?: unknown;
  input?: unknown;
  output?: unknown;
  state?: string;
}

const toDisplayValue = (value: unknown) => {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.warn("Failed to stringify tool call value", error);
    return String(value);
  }
};

export const ToolCallCard = ({ part }: { part: ToolCallPart }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasResult = part.result !== undefined || part.output !== undefined;
  const isPartialCall = part.state === "partial-call";

  const getStatusInfo = () => {
    if (isPartialCall) {
      return {
        label: "Preparing search...",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        animated: true,
      };
    }

    if (!hasResult) {
      return {
        label: "Searching",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        animated: true,
      };
    }

    return {
      label: "Completed",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      animated: false,
    };
  };

  const status = getStatusInfo();

  const getQueryValue = () => {
    if (
      typeof part.args === "object" &&
      part.args !== null &&
      "query" in part.args
    ) {
      return String((part.args as { query?: string }).query || "");
    }

    if (
      typeof part.input === "object" &&
      part.input !== null &&
      "query" in part.input
    ) {
      return String((part.input as { query?: string }).query || "");
    }

    return "";
  };

  const query = getQueryValue();

  const detailSections: Array<{
    label: string;
    value: unknown;
  }> = [
    { label: "Input", value: part.input ?? part.args },
    { label: "Result", value: part.result ?? part.output },
  ];

  return (
    <div
      className={`rounded-lg border ${status.borderColor} ${status.bgColor} p-3 my-2 transition-all`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => hasResult && setIsExpanded(!isExpanded)}
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
            {query && !isPartialCall && (
              <span className="text-xs text-gray-600 mt-1">
                {!hasResult ? "Searching for: " : "Query: "}
                <span className="font-medium">{query}</span>
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse indicator */}
        {hasResult && (
          <div
            className={`text-gray-400 text-sm transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </div>
        )}
      </div>

      {isExpanded && hasResult && (
        <div className="mt-3 border-t border-green-200 pt-3 space-y-3">
          {detailSections.map(({ label, value }) => {
            if (value === undefined) {
              return null;
            }

            return (
              <div key={label}>
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  {label}:
                </div>
                <pre className="text-xs bg-white rounded p-2 overflow-x-auto max-h-64 overflow-y-auto border border-green-100">
                  {toDisplayValue(value)}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
