"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Shield, Sparkles, Globe, Brain, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Get comprehensive search results in seconds with our optimized AI-powered engine.",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Advanced language models analyze and synthesize information from multiple sources.",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Globe,
    title: "Web-Scale Search",
    description:
      "Access and analyze information from across the entire web in real-time.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your searches are private and secure. We don't track or store your queries.",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "Smart Summarization",
    description:
      "Receive concise, relevant summaries of complex topics tailored to your needs.",
    gradient: "from-indigo-400 to-purple-500",
  },
  {
    icon: TrendingUp,
    title: "Continuous Learning",
    description:
      "Our system improves with every search, delivering increasingly accurate results.",
    gradient: "from-red-400 to-pink-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="group relative"
    >
      <div className="glassmorphism rounded-2xl p-6 h-full border-white/10 hover:border-white/30 transition-all duration-300 relative overflow-hidden">
        {/* Gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          initial={false}
        />

        {/* Icon with gradient background */}
        <motion.div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-2.5 mb-4 relative z-10`}
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-full h-full text-white" />
        </motion.div>

        <h3 className="text-xl font-bold text-white mb-3 relative z-10">
          {title}
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          {description}
        </p>

        {/* Glow effect */}
        <motion.div
          className={`absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          layoutId={`glow-${index}`}
        />
      </div>
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
            Powerful Features for{" "}
            <span className="gradient-text">Deep Research</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Everything you need to dive deep into any topic and extract
            meaningful insights
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
