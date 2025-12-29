"use client";

import { motion } from "framer-motion";

interface ActionCardProps {
  action: {
    type: string;
    title?: string;
    description?: string;
    step: number;
  };
}

export const ActionCard = ({ action }: ActionCardProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "search":
        return "🔍";
      case "scrape":
        return "📄";
      case "answer":
        return "💡";
      default:
        return "🤖";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-3 my-2 bg-muted/40 border border-border rounded-xl shadow-sm"
    >
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-lg shadow-inner">
          {getIcon(action.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {action.title || `Action: ${action.type}`}
          </h4>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            STEP {action.step}/10
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          {action.description ||
            `The agent is performing a ${action.type} action.`}
        </p>
      </div>
    </motion.div>
  );
};
