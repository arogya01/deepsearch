"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    title: "Formulate Query",
    description: "Enter your research question with context. Our system understands nuance, domain, and intent.",
  },
  {
    title: "Source Discovery",
    description: "AI scans academic databases, news sources, and technical documentation for relevant information.",
  },
  {
    title: "Intelligent Synthesis",
    description: "Multiple perspectives are analyzed and synthesized into coherent, well-structured insights.",
  },
  {
    title: "Explore & Iterate",
    description: "Follow-up on sources, refine your query, and dive deeper into specific aspects of your research.",
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
            How It <span className="text-amber">Works</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-mono">
            Four simple steps to unlock the knowledge you need
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-amber/20" />

            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative pl-20 ${index % 2 === 1 ? 'md:pl-0 md:pr-20 md:text-right' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className={`absolute left-4 top-0 w-9 h-9 bg-[#1A1A1A] border-2 border-amber flex items-center justify-center font-mono text-amber font-bold ${index % 2 === 1 ? 'md:left-auto md:right-4' : ''}`}>
                  0{index + 1}
                </div>

                <div className="py-8">
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="font-mono text-white/60">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
