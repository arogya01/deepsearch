"use client";

import { motion, useReducedMotion } from "framer-motion";

export function GrainOverlay() {
  return (
    <div className="grain-overlay" />
  );
}

export function Scanlines() {
  return (
    <div className="absolute inset-0 scanlines pointer-events-none" />
  );
}

export function SubtleGradient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute top-20 left-20 w-[600px] h-[600px] rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, rgba(244, 164, 96, 0.08) 0%, transparent 70%)",
        filter: "blur(80px)"
      }}
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: [0.3, 0.5, 0.3] }
      }
      transition={
        shouldReduceMotion
          ? undefined
          : { duration: 10, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}
