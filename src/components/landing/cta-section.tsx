"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="bg-amber py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-5xl sm:text-7xl font-bold text-black leading-tight mb-8">
            Ready to Research<br/>Deeper Than Ever?
          </h2>

          <p className="font-mono text-black/70 text-lg mb-8 max-w-2xl">
            Join researchers, analysts, and knowledge workers who&apos;ve transformed their workflow with AI-powered synthesis.
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-5 bg-transparent text-black font-mono font-semibold border-2 border-black hover:bg-black hover:text-amber transition-colors"
              >
                BEGIN YOUR RESEARCH →
              </motion.button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-5 bg-transparent text-black font-mono font-semibold border-2 border-black hover:bg-black hover:text-amber transition-colors"
              >
                GO TO DASHBOARD →
              </motion.button>
            </Link>
          </SignedIn>

          <p className="font-display text-2xl italic text-black/60 mt-12">
            &quot;DeepSearch reduced my research time by 70%. I don&apos;t search anymore—I explore.&quot;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
