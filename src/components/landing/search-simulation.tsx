"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

const queries = [
  "What are the latest advancements in quantum computing?",
  "Explain the impact of AI on healthcare",
  "Best practices for sustainable architecture",
];

const results = [
  {
    title: "Quantum Computing Breakthrough 2024",
    description: "Recent developments in quantum error correction have enabled more stable qubits...",
    source: "nature.com",
  },
  {
    title: "AI in Medical Diagnostics",
    description: "Machine learning models are achieving 95% accuracy in early cancer detection...",
    source: "nejm.org",
  },
  {
    title: "Green Building Standards",
    description: "LEED certification requirements have been updated to include net-zero energy...",
    source: "usgbc.org",
  },
];

export function SearchSimulation() {
  const [currentQuery, setCurrentQuery] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    const query = queries[currentQuery];

    if (prefersReducedMotion) {
      if (displayText !== query) {
        setDisplayText(query);
      }
      if (!showResults) {
        setShowResults(true);
      }
      if (isTyping) {
        setIsTyping(false);
      }

      timeout = setTimeout(() => {
        setCurrentQuery((prev) => (prev + 1) % queries.length);
      }, 4000);
    } else if (isTyping) {
      if (displayText.length < query.length) {
        timeout = setTimeout(() => {
          setDisplayText(query.slice(0, displayText.length + 1));
        }, 50);
      } else {
        setIsTyping(false);
        setShowResults(true);
        timeout = setTimeout(() => {
          setShowResults(false);
          setIsTyping(true);
          setDisplayText("");
          setCurrentQuery((prev) => (prev + 1) % queries.length);
        }, 3000);
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [displayText, currentQuery, isTyping, prefersReducedMotion, showResults]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism rounded-2xl p-4 border-white/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
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
          <div className="flex-1 text-white/90 font-medium">
            {displayText}
            <span className="animate-pulse">|</span>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-3"
        >
          {results[currentQuery] && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism rounded-xl p-5 border-white/20 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                    {results[currentQuery].title}
                  </h3>
                  <p className="text-white/70 text-sm mb-2 line-clamp-2">
                    {results[currentQuery].description}
                  </p>
                  <span className="text-purple-400 text-xs">
                    {results[currentQuery].source}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
