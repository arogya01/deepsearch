"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function FloatingOrbs() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Purple Orb */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)",
          filter: "blur(40px)",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.2, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        initial={{ x: "10%", y: "20%" }}
      />

      {/* Blue Orb */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)",
          filter: "blur(40px)",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -80, 0],
                y: [0, 80, 0],
                scale: [1, 1.1, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        initial={{ right: "10%", top: "40%" }}
      />

      {/* Pink Orb */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0) 70%)",
          filter: "blur(40px)",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 60, 0],
                y: [0, -60, 0],
                scale: [1, 1.15, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        initial={{ left: "50%", bottom: "20%" }}
      />
    </div>
  );
}

export function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function ParticleField() {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-purple-400 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 3,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
