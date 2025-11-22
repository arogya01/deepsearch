"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { FloatingOrbs, GridPattern, ParticleField } from "./background-effects";
import { SearchSimulation } from "./search-simulation";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const baseEase: [number, number, number, number] = [0.6, 0.05, 0.01, 0.9];

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: shouldReduceMotion ? 0.4 : 0.8, ease: baseEase },
  });

  const fadeScale = (delay = 0) => ({
    initial: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay, duration: shouldReduceMotion ? 0.4 : 0.6, ease: baseEase },
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridPattern />
      <ParticleField />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            {...fadeScale(0)}
            className="inline-flex items-center gap-2 glassmorphism px-4 py-2 rounded-full border-white/20"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/90 font-medium">
              Powered by Advanced AI
            </span>
          </motion.div>

          {/* Main Headline with Staggered Animation */}
          <div className="space-y-2">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white"
              {...fadeUp(0)}
            >
              Search Deeper,
            </motion.h1>
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold"
              {...fadeUp(0.1)}
            >
              <span className="gradient-text">Discover More</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed"
          >
            Harness the power of AI to explore the web like never before. Get
            comprehensive, accurate answers to your most complex questions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
                >
                  Open DeepSearch
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </SignedIn>

            <motion.a
              href="#features"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 glassmorphism text-white rounded-xl font-semibold text-lg border-white/20 hover:border-white/40 transition-all duration-300"
            >
              Learn More
            </motion.a>
          </motion.div>

          {/* Search Simulation Demo */}
          <motion.div {...fadeUp(shouldReduceMotion ? 0.4 : 1)} className="pt-16">
            <SearchSimulation />
          </motion.div>

          {/* Stats or Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0.6 : 1.5, duration: 0.8 }}
            className="pt-16 flex flex-wrap justify-center gap-12"
          >
            {[
              { value: "10K+", label: "Searches Performed" },
              { value: "95%", label: "Accuracy Rate" },
              { value: "<2s", label: "Average Response" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white/70 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
