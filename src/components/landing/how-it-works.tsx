"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, FileText, Sparkles, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Ask Anything",
    description:
      "Type your question or topic. Our AI understands context and complexity.",
    gradient: "from-blue-400 to-cyan-500",
    delay: 0,
  },
  {
    icon: Sparkles,
    title: "AI Analyzes",
    description:
      "Advanced models search and analyze information from across the web in real-time.",
    gradient: "from-purple-400 to-pink-500",
    delay: 0.2,
  },
  {
    icon: FileText,
    title: "Get Results",
    description:
      "Receive comprehensive, well-organized answers with source citations.",
    gradient: "from-orange-400 to-red-500",
    delay: 0.4,
  },
  {
    icon: CheckCircle,
    title: "Dive Deeper",
    description:
      "Follow-up questions and explore related topics to gain complete understanding.",
    gradient: "from-green-400 to-emerald-500",
    delay: 0.6,
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Four simple steps to unlock the knowledge you need
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={
                isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.6, delay: step.delay }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
              )}

              <div className="relative text-center">
                {/* Step Number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: step.delay + 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center z-10"
                >
                  {index + 1}
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.gradient} p-6 shadow-lg`}
                >
                  <step.icon className="w-full h-full text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="mt-16 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full origin-left"
        />
      </div>
    </section>
  );
}
