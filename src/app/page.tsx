"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Search, Sparkles, Globe, Layers } from 'lucide-react';
import { useRef, useState } from 'react';

// Magnetic Button Component
function MagneticButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const { x, y } = position;

  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: x * 0.2, y: y * 0.2 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.button>
  );
}

// 3D Tilt Card Component
function TiltCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="relative group perspective-1000"
    >
      <div className="glass-card p-8 rounded-3xl h-full relative overflow-hidden transition-colors duration-500 group-hover:bg-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 transform-gpu transition-transform duration-500 group-hover:translate-z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/20">
            {icon}
          </div>
          <h3 className="text-2xl font-display font-bold text-white mb-4">{title}</h3>
          <p className="text-muted-foreground leading-relaxed font-light text-lg">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-purple-500/30">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-purple-900/30 rounded-full blur-[150px] animate-aurora mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/20 rounded-full blur-[150px] animate-aurora animation-delay-2000 mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-16 mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 max-w-5xl"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-medium text-white/80 mb-8 shadow-2xl shadow-purple-500/10">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="tracking-wide uppercase text-xs">Next Gen Intelligence</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-display font-bold tracking-tighter leading-[0.9]">
              <span className="block text-white drop-shadow-2xl">Search Beyond</span>
              <span className="aurora-text block">The Surface</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Experience the web through a prism of pure intelligence. Context-aware, grounded, and beautifully instant.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center"
          >
            <SignedOut>
              <SignUpButton forceRedirectUrl="/chat">
                <MagneticButton className="group relative px-10 py-5 bg-white text-black font-bold rounded-full text-lg shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_-5px_rgba(255,255,255,0.5)] transition-shadow">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Exploring <Search className="w-5 h-5" />
                  </span>
                </MagneticButton>
              </SignUpButton>
              <SignInButton forceRedirectUrl="/chat">
                <MagneticButton className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full backdrop-blur-md transition-colors">
                  Sign In
                </MagneticButton>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <MagneticButton className="group relative px-10 py-5 bg-white text-black font-bold rounded-full text-lg shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_-5px_rgba(255,255,255,0.5)] transition-shadow">
                  <span className="relative z-10 flex items-center gap-2">
                    Open Terminal <Search className="w-5 h-5" />
                  </span>
                </MagneticButton>
              </Link>
            </SignedIn>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 perspective-1000">
          <TiltCard
            delay={0.2}
            icon={<Search className="w-8 h-8 text-purple-400" />}
            title="Semantic Core"
            description="Understanding intent beyond keywords. Our AI weaves through the web's noise to find the signal you're looking for."
          />
          <TiltCard
            delay={0.4}
            icon={<Globe className="w-8 h-8 text-emerald-400" />}
            title="Global Grounding"
            description="Real-time verification against live data sources. Every insight is anchored in truth, not hallucination."
          />
          <TiltCard
            delay={0.6}
            icon={<Layers className="w-8 h-8 text-orange-400" />}
            title="Context Layers"
            description="Deep memory that builds upon your journey. Peel back layers of information without losing your original thread."
          />
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-40 text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent blur-3xl -z-10" />
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-12 tracking-tight">
            Ready to transcend <br /> <span className="text-white/50">traditional search?</span>
          </h2>
          <SignedOut>
            <SignUpButton forceRedirectUrl="/chat">
              <MagneticButton className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full text-xl shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-shadow">
                Initialize System
              </MagneticButton>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/chat">
              <MagneticButton className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full text-xl shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-shadow">
                Resume Session
              </MagneticButton>
            </Link>
          </SignedIn>
        </motion.div>
      </main>
    </div>
  );
}
