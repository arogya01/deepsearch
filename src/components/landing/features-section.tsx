"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    number: "01",
    title: "Deep Source Analysis",
    description: "AI reads and understands context across academic papers, news sources, and technical documentation simultaneously.",
  },
  {
    number: "02",
    title: "Synthesized Insights",
    description: "Multiple perspectives are analyzed and synthesized into coherent narratives with clear attribution.",
  },
  {
    number: "03",
    title: "Real-Time Updates",
    description: "Monitor live sources and receive alerts when new relevant information becomes available.",
  },
  {
    number: "04",
    title: "Contextual Relevance",
    description: "Every result is ranked and organized based on your specific research context and goals.",
  },
  {
    number: "05",
    title: "Source Verification",
    description: "Automated citation tracking ensures every insight is properly attributed to its original source.",
  },
  {
    number: "06",
    title: "Collaborative Research",
    description: "Share research projects with teams and build collective knowledge repositories.",
  },
];

export function FeatureCard({
  number,
  title,
  description,
  index,
}: {
  number: string;
  title: string;
  description: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="break-inside-avoid bg-[#1A1A1A] border-brutal-top p-8"
    >
      <div className="font-display text-6xl font-bold text-amber/20 mb-4">{number}</div>
      <h3 className="font-display text-2xl font-bold text-white mb-3">
        {title}
      </h3>
      <p className="font-body text-white/70 text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function FeaturesSection() {
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
            Powerful Features for <span className="text-amber">Deep Research</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-body">
            Everything you need to dive deep into any topic and extract meaningful insights
          </p>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="my-16 pl-4 border-l-4 border-amber"
        >
          <p className="font-display text-3xl italic text-white/90">
            &quot;The future of research is not in finding more information, but in finding the right connections.&quot;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
