"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  {
    value: 50000,
    suffix: "+",
    label: "Searches Performed",
    description: "Users trust DeepSearch for their research needs",
  },
  {
    value: 98,
    suffix: "%",
    label: "Satisfaction Rate",
    description: "Of users report finding exactly what they need",
  },
  {
    value: 150,
    suffix: "+",
    label: "Countries Reached",
    description: "Global community of knowledge seekers",
  },
  {
    value: 1.5,
    suffix: "s",
    label: "Average Response",
    description: "Lightning-fast results powered by AI",
  },
];

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Trusted by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Join a growing community of researchers, students, and professionals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                isInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.8 }
              }
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glassmorphism rounded-2xl p-8 border-white/10 hover:border-purple-500/30 transition-all"
            >
              <div className="text-center">
                <motion.div
                  className="text-5xl sm:text-6xl font-bold gradient-text mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {stat.label}
                </h3>
                <p className="text-white/60 text-sm">{stat.description}</p>
              </div>

              {/* Decorative element */}
              <motion.div
                className="mt-6 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                style={{ originX: 0 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
