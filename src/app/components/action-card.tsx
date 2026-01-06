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
      className="flex items-start gap-3 p-4 my-2 bg-[#1A1A1A] border-brutal-top"
    >
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 bg-black text-amber flex items-center justify-center">
          {getIcon(action.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-body text-sm font-semibold text-white truncate">
            {action.title || `Action: ${action.type}`}
          </h4>
          <span className="text-[10px] font-body text-amber/60">
            STEP {action.step}/10
          </span>
        </div>
        <p className="font-body text-xs text-white/60 leading-relaxed">
          {action.description ||
            `The agent is performing a ${action.type} action.`}
        </p>
      </div>
    </motion.div>
  );
};
