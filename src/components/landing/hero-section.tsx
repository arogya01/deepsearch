"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { GrainOverlay, Scanlines, SubtleGradient } from "./background-effects";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GrainOverlay />
      <Scanlines />
      <SubtleGradient />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: shouldReduceMotion ? 0.4 : 0.6 }}
            className="inline-flex items-center gap-2 border border-amber/30 px-4 py-2"
          >
            <div className="w-2 h-2 bg-amber rounded-full" />
            <span className="text-sm text-white/80 font-mono">
              RESEARCH-READY AI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: shouldReduceMotion ? 0.4 : 0.6 }}
            className="space-y-2"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-white">
              Search Deeper.
            </h1>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-amber">
              Discover More.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: shouldReduceMotion ? 0.4 : 0.6 }}
            className="text-xl text-white/60 font-mono max-w-2xl"
          >
            Transform scattered information into synthesized knowledge. DeepSearch reads, analyzes, and connects insights across entire web.
          </motion.p>

          <div className="mt-16 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#1A1A1A] p-6 border-brutal-top font-mono">
                <div className="text-amber text-xs mb-2">SOURCE 01</div>
                <p className="text-white/80 text-sm leading-relaxed">
                  &quot;Quantum error correction has reached a threshold enabling stable qubits...&quot;
                </p>
                <div className="mt-3 text-amber/60 text-xs">Nature, 2024</div>
              </div>

              <div className="bg-[#1A1A1A] p-6 border-brutal-top font-mono">
                <div className="text-amber text-xs mb-2">SOURCE 02</div>
                <p className="text-white/80 text-sm leading-relaxed">
                  &quot;New qubit architecture demonstrates 99.9% coherence retention...&quot;
                </p>
                <div className="mt-3 text-amber/60 text-xs">MIT Tech, 2024</div>
              </div>

              <div className="bg-[#1A1A1A] p-6 border-brutal-top font-mono">
                <div className="text-amber text-xs mb-2">SOURCE 03</div>
                <p className="text-white/80 text-sm leading-relaxed">
                  &quot;Commercial quantum computing timeline accelerated to 2026...&quot;
                </p>
                <div className="mt-3 text-amber/60 text-xs">Science Daily, 2024</div>
              </div>
            </div>

            <div className="hidden md:flex justify-center gap-32 mb-4">
              <motion.div
                animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity }}
                className="w-32 h-px bg-amber/60"
              />
              <motion.div
                animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity, delay: 0.5 }}
                className="w-32 h-px bg-amber/60"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: shouldReduceMotion ? 0.4 : 0.6 }}
              className="bg-amber p-8 border-2 border-amber"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black text-amber flex items-center justify-center font-mono text-sm font-bold">
                  AI
                </div>
                <span className="font-mono text-black/60 text-sm">SYNTHESIS</span>
              </div>
              <p className="font-display text-2xl md:text-3xl font-bold text-black leading-relaxed">
                Combined analysis reveals quantum error correction has achieved critical threshold for practical applications, positioning commercial viability within 2-3 years based on convergence of qubit stability and architectural advances.
              </p>
            </motion.div>

            <div className="md:hidden flex justify-center mb-4 mt-6">
              <motion.div
                animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4], y: [0, 5, 0] }}
                transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity }}
                className="w-px h-8 bg-amber/60"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: shouldReduceMotion ? 0.4 : 0.6 }}
            className="mt-12 flex flex-wrap gap-4"
          >
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors">
                  START RESEARCHING →
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link href="/chat">
                <button className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors">
                  START RESEARCHING →
                </button>
              </Link>
            </SignedIn>

            <a
              href="#features"
              className="px-8 py-4 bg-transparent text-white font-mono font-semibold border-2 border-white/20 hover:border-amber hover:text-amber transition-colors"
            >
              VIEW DEMO
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
