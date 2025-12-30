# DeepSearch Frontend Redesign Plan

## Design Direction: Brutalist Research/Academic

This aesthetic positions DeepSearch as a serious, authoritative research tool rather than another generic AI product.

### Visual Foundation

**Typography:**
- Display: **"Cormorant Garamond"** (elegant, distinctive serif for headlines)
- Body: **"JetBrains Mono"** (technical mono for body/copy)
- Creates intellectual + technical contrast

**Color Palette:**
- Background: `#080808` (near-black)
- Primary: `#F4A460` (Sandy Brown - warm amber accent)
- Secondary: `#E5E5E5` (near-white for text)
- Tertiary: `#1A1A1A` (dark gray for sections)
- *No purple/pink gradients*

**Texture:**
- Subtle grain overlay
- Paper-like noise in hero background
- Sharp, unblurred edges (brutalist approach)

---

## Hero Element: Synthesis Visualization

**Concept**: A brutally elegant visualization showing the core value proposition - synthesizing knowledge from multiple sources.

### Desktop Layout
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Source 1]      [Source 2]      [Source 3]        │
│  (left)   →     (top)      →     (right)           │
│                                                     │
│           ┌─────────────────┐                      │
│           │   SYNTHESIS     │                      │
│           │   (center)      │                      │
│           └─────────────────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Content
- **Source 1**: "Nature 2024: Quantum error correction breakthrough"
- **Source 2**: "Science Daily: New qubit stability achieved"
- **Source 3**: "MIT Tech Review: Commercial quantum computing timeline"
- **Synthesis**: "Combined analysis suggests quantum error correction has reached critical threshold for practical applications, with commercial viability emerging within 2-3 years."

### Design
- Sources: Dark cards (`#1A1A1A`) with amber top border (2px)
- Synthesis: Larger card, amber background (`#F4A460`) with dark text
- Arrows: Thin amber lines connecting sources → synthesis
- Typography: Mono for sources, serif for synthesis
- Animations: Arrows pulse slowly, synthesis card fades in

---

## Implementation Phases

### Phase 1: Foundation (Fonts + Theme)

**File: `src/app/layout.tsx`**

```typescript
import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weights: [400, 600, 700, 800]
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains"
})

// Apply to body
body {
  className: `${cormorant.variable} ${jetbrains.variable} antialiased font-sans`
}
```

**File: `src/app/globals.css`**

**Remove:**
- `.glassmorphism` utility
- `.gradient-text` utility
- `.glow` utility
- All purple/pink gradient references

**Update Color Variables:**
```css
:root {
  --background: 8 0% 4%; /* #080808 */
  --foreground: 230 10% 90%; /* #E5E5E5 */
  --card: 220 10% 10%; /* #1A1A1A */
  --accent: 25 70% 65%; /* #F4A460 (amber) */
  --accent-muted: 25 30% 15%; /* Darker amber for borders */
  --border: 220 5% 20%; /* Subtle borders */
}
```

**Add New Utilities:**
```css
/* Typography */
.font-display {
  font-family: var(--font-cormorant);
  letter-spacing: -0.02em;
}

.font-mono {
  font-family: var(--font-jetbrains);
}

/* Brutalist Borders */
.border-brutal {
  border: 2px solid #F4A460;
}

.border-brutal-top {
  border-top: 2px solid #F4A460;
}

/* Amber Accent Variants */
.bg-amber {
  background-color: #F4A460;
}

.bg-amber-muted {
  background-color: rgba(244, 164, 96, 0.1);
}

.text-amber {
  color: #F4A460;
}

/* Grain Overlay */
.grain-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}

/* Scanlines */
.scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(244, 164, 96, 0.02) 2px,
    rgba(244, 164, 96, 0.02) 4px
  );
}
```

**Update Body:**
```css
body {
  background: #080808;
  color: hsl(var(--foreground));
  min-height: 100vh;
}
```

---

### Phase 2: Hero Section Redesign

**File: `src/components/landing/hero-section.tsx`**

**Remove:**
- Search simulation component
- Floating orbs animation references
- Sparkles icon
- All purple gradient references
- Stats from bottom of hero

**Add:**

1. **Badge with Research-Ready AI:**
```tsx
<motion.div className="inline-flex items-center gap-2 border border-amber/30 px-4 py-2">
  <div className="w-2 h-2 bg-amber rounded-full" />
  <span className="text-sm text-white/80 font-mono">
    RESEARCH-READY AI
  </span>
</motion.div>
```

2. **Asymmetric Serif Headlines:**
```tsx
<motion.div className="mt-8 space-y-2">
  <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-white">
    Search Deeper.
  </h1>
  <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-amber">
    Discover More.
  </h1>
</motion.div>
```

3. **Subtitle in Mono:**
```tsx
<motion.p className="mt-6 text-xl text-white/60 font-mono max-w-2xl">
  Transform scattered information into synthesized knowledge.
  DeepSearch reads, analyzes, and connects insights across the entire web.
</motion.p>
```

4. **Synthesis Visualization:**
```tsx
<motion.div className="mt-16 relative">
  {/* Sources - 3 cards in grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    {/* Source 1 */}
    <div className="bg-card p-6 border-brutal-top font-mono">
      <div className="text-amber text-xs mb-2">SOURCE 01</div>
      <p className="text-white/80 text-sm leading-relaxed">
        "Quantum error correction has reached a threshold enabling stable qubits..."
      </p>
      <div className="mt-3 text-amber/60 text-xs">Nature, 2024</div>
    </div>

    {/* Source 2 */}
    <div className="bg-card p-6 border-brutal-top font-mono">
      <div className="text-amber text-xs mb-2">SOURCE 02</div>
      <p className="text-white/80 text-sm leading-relaxed">
        "New qubit architecture demonstrates 99.9% coherence retention..."
      </p>
      <div className="mt-3 text-amber/60 text-xs">MIT Tech, 2024</div>
    </div>

    {/* Source 3 */}
    <div className="bg-card p-6 border-brutal-top font-mono">
      <div className="text-amber text-xs mb-2">SOURCE 03</div>
      <p className="text-white/80 text-sm leading-relaxed">
        "Commercial quantum computing timeline accelerated to 2026..."
      </p>
      <div className="mt-3 text-amber/60 text-xs">Science Daily, 2024</div>
    </div>
  </div>

  {/* Arrows - Pulse animation (hidden on mobile) */}
  <div className="hidden md:flex justify-center gap-32 mb-4">
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="w-32 h-px bg-amber/60"
    />
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      className="w-32 h-px bg-amber/60"
    />
  </div>

  {/* Synthesis Card - Amber background */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
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

  {/* Mobile vertical arrow */}
  <div className="md:hidden flex justify-center mb-4">
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4], y: [0, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="w-px h-8 bg-amber/60"
    />
  </div>
</motion.div>
```

5. **CTA Buttons:**
```tsx
<motion.div className="mt-12 flex flex-wrap gap-4">
  {/* Primary CTA */}
  <button className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors">
    START RESEARCHING →
  </button>

  {/* Secondary CTA */}
  <button className="px-8 py-4 bg-transparent text-white font-mono font-semibold border-2 border-white/20 hover:border-amber hover:text-amber transition-colors">
    VIEW DEMO
  </button>
</motion.div>
```

**Animations (Reduced):**
- Hero elements: Single fade-in with stagger (0s, 0.1s, 0.2s, 0.4s)
- Arrows: Slow pulse (3s duration)
- Buttons: Simple border/color swap on hover (no scale or shadow)

**Mobile Adaptation:**
- Stack sources above synthesis card
- Use vertical arrows instead of horizontal
- Synthesis card maintains amber background

---

### Phase 3: Background Effects

**File: `src/components/landing/background-effects.tsx`**

**Remove:**
- `FloatingOrbs` component
- `GridPattern` component
- `ParticleField` component

**Add:**

1. **GrainOverlay:**
```tsx
export function GrainOverlay() {
  return (
    <div className="grain-overlay" />
  );
}
```

2. **Scanlines:**
```tsx
export function Scanlines() {
  return (
    <div className="absolute inset-0 scanlines pointer-events-none" />
  );
}
```

3. **SubtleGradient (replaces multiple orbs):**
```tsx
import { motion, useReducedMotion } from "framer-motion";

export function SubtleGradient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute top-20 left-20 w-[600px] h-[600px] rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, rgba(244, 164, 96, 0.08) 0%, transparent 70%)",
        filter: "blur(80px)"
      }}
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: [0.3, 0.5, 0.3] }
      }
      transition={
        shouldReduceMotion
          ? undefined
          : { duration: 10, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}
```

---

### Phase 4: CTA Section

**File: `src/components/landing/cta-section.tsx`**

**Remove:**
- Sparkles icon
- Gradient animations
- Glassmorphism card
- Animated background gradient
- Spring physics animations

**Add:**

1. **Full-width Amber Background:**
```tsx
<section className="bg-amber py-24 px-4 sm:px-6 lg:px-8">
```

2. **Massive Serif Headline:**
```tsx
<h2 className="font-display text-5xl sm:text-7xl font-bold text-black leading-tight mb-8">
  Ready to Research<br/>Deeper Than Ever?
</h2>
```

3. **Mono Subtext:**
```tsx
<p className="font-mono text-black/70 text-lg mb-8 max-w-2xl">
  Join researchers, analysts, and knowledge workers who've transformed their workflow with AI-powered synthesis.
</p>
```

4. **Brutalist Outline Button:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="px-10 py-5 bg-transparent text-black font-mono font-semibold border-2 border-black hover:bg-black hover:text-amber transition-colors"
>
  BEGIN YOUR RESEARCH →
</motion.button>
```

5. **Serif Italic Quote:**
```tsx
<p className="font-display text-2xl italic text-black/60 mt-12">
  "DeepSearch reduced my research time by 70%. I don't search anymore—I explore."
</p>
```

**Animations:**
- Simple scroll reveal (opacity + y-axis)
- No spring physics
- No complex delays

---

### Phase 5: Features Section

**File: `src/components/landing/features-section.tsx`**

**Remove:**
- Icon-based cards
- Gradient icons
- Hover scale effects
- Rotation animations
- Spring physics

**Add:**

1. **Masonry Layout:**
```tsx
<div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
  {/* Feature cards use break-inside-avoid */}
</div>
```

2. **Each Feature Card:**
```tsx
<div className="break-inside-avoid bg-card border-brutal-top p-8">
  {/* Large serif number */}
  <div className="font-display text-6xl font-bold text-amber/20 mb-4">01</div>

  {/* Serif headline */}
  <h3 className="font-display text-2xl font-bold text-white mb-3">
    Deep Source Analysis
  </h3>

  {/* Mono description */}
  <p className="font-mono text-white/70 text-sm leading-relaxed">
    AI reads and understands context across academic papers, news sources, and technical documentation simultaneously.
  </p>
</div>
```

3. **Section Divider with Quote:**
```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true }}
  className="my-16 pl-4 border-l-4 border-amber"
>
  <p className="font-display text-3xl italic text-white/90">
    "The future of research is not in finding more information, but in finding the right connections."
  </p>
</motion.div>
```

4. **Feature Data (Updated):**
```typescript
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
```

**Mobile Adaptation:**
- Single column stack (via `columns-1`)
- All cards full width

**Animations:**
- Simple fade-up on scroll
- No rotation
- No spring physics

---

### Phase 6: How It Works

**File: `src/components/landing/how-it-works.tsx`**

**Remove:**
- Horizontal grid layout
- Gradient icons
- Connection lines between steps
- Icon rotation on hover
- Spring physics

**Add:**

1. **Vertical Timeline Layout:**
```tsx
<div className="max-w-4xl mx-auto">
  <div className="relative">
    {/* Vertical Line */}
    <div className="absolute left-8 top-0 bottom-0 w-px bg-amber/20" />

    {/* Steps */}
    {steps.map((step, index) => (
      <motion.div
        key={index}
        className={`relative pl-20 ${index % 2 === 1 ? 'md:pl-0 md:pr-20 md:text-right' : ''}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        {/* Number Circle */}
        <div className={`absolute left-4 top-0 w-9 h-9 bg-card border-2 border-amber flex items-center justify-center font-mono text-amber font-bold ${index % 2 === 1 ? 'md:left-auto md:right-4' : ''}`}>
          0{index + 1}
        </div>

        {/* Content */}
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
```

2. **Updated Step Data:**
```typescript
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
```

**Mobile Adaptation:**
- All steps left-aligned
- Remove alternating layout
- Vertical line stays on left

**Animations:**
- Fade-in when in view
- Stagger: 0.1s per step
- No spring physics

---

### Phase 7: Page Structure

**File: `src/app/page.tsx`**

**Remove:**
- `StatsSection` import
- `StatsSection` component from JSX
- `SearchSimulation` reference (already in hero-section)

**Update:**
```tsx
"use client";

import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="bg-[#080808] overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  );
}
```

---

### Phase 8: Polish & Testing

**Tasks:**

1. **Verify all purple gradient references removed:**
   - Check all component files
   - Check globals.css
   - Search for `purple`, `pink`, `violet` in codebase

2. **Test mobile responsiveness:**
   - Hero: Stack sources above synthesis ✓
   - Features: Single column ✓
   - Timeline: Left-aligned ✓
   - CTA: Full width ✓

3. **Verify font loading:**
   - Cormorant Garamond loading correctly
   - JetBrains Mono loading correctly
   - CSS variables applied correctly

4. **Test animations (reduced complexity):**
   - Hero: Single fade-in with stagger ✓
   - Scroll: Simple opacity + y-axis ✓
   - Arrows: Slow pulse (3s) ✓
   - Buttons: Border/color swap (no scale) ✓
   - No spring physics ✓
   - No rotation effects ✓

5. **Verify amber accent contrast ratios:**
   - Amber on black: Check WCAG compliance
   - Amber text on dark backgrounds: Readable
   - Amber borders: Visible but not overwhelming

6. **Check accessibility:**
   - Focus states on all buttons/links
   - Semantic HTML structure maintained
   - ARIA labels where needed
   - Motion reduced preference respected

---

## Implementation Sequence

| Step | File | Priority | Dependencies |
|------|------|----------|--------------|
| 1 | `layout.tsx` | High | None |
| 2 | `globals.css` | High | Step 1 |
| 3 | `hero-section.tsx` | High | Steps 1-2 |
| 4 | `background-effects.tsx` | High | None |
| 5 | `cta-section.tsx` | Medium | None |
| 6 | `features-section.tsx` | Medium | None |
| 7 | `how-it-works.tsx` | Medium | None |
| 8 | `page.tsx` | Low | None |
| 9 | Testing & Polish | Low | All steps |

---

## Summary of Changes

**Files Modified:** 8 files
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/background-effects.tsx`
- `src/components/landing/cta-section.tsx`
- `src/components/landing/features-section.tsx`
- `src/components/landing/how-it-works.tsx`
- `src/app/page.tsx`

**New Components:** 4
- Synthesis Visualization (in hero)
- GrainOverlay
- Scanlines
- SubtleGradient

**Components Removed:** 4
- FloatingOrbs
- GridPattern
- ParticleField
- StatsSection

**Lines Changed:** ~800 lines

---

## Design Transformation

**From:**
- Generic purple AI gradient
- Glassmorphism effects
- Floating orbs
- Particle field
- Grid pattern
- Stats section with social proof
- Icon-based feature cards
- Horizontal step layout

**To:**
- Brutalist Research aesthetic
- Serif/mono typography contrast
- Amber accent color (bold & prominent)
- Grain texture overlay
- Scanline effects
- Synthesis visualization
- Masonry feature layout
- Vertical timeline
- Full-width amber CTA section

---

## Key Design Decisions

### Typography
- **Cormorant Garamond**: Elegant serif for headlines and emphasis
- **JetBrains Mono**: Technical mono for body text and labels
- Creates intellectual authority + technical precision

### Color Strategy
- **Bold amber usage**: Full sections, large backgrounds, strong borders
- **High contrast**: Black/amber/white palette for readability
- **No gradients**: Solid colors, brutalist approach

### Layout
- **Asymmetric hero**: Shifted elements, visual interest
- **Masonry features**: Varied card heights, organic feel
- **Vertical timeline**: Clear progression, easy to scan

### Animation (Reduced)
- **Purposeful over abundant**: Only where it adds value
- **Slower timing**: 3s pulses, 0.6s reveals
- **Simple transitions**: No complex spring physics
- **No rotation/scale**: Subtle movements only

### Mobile First
- **Stack layouts**: Single column on mobile
- **Touch-friendly**: Larger tap targets
- **Readable**: Maintain typography hierarchy

---

## Success Criteria

✅ No purple/pink gradients anywhere
✅ Cormorant Garamond + JetBrains Mono fonts loaded
✅ Amber accent used prominently (sections, backgrounds, borders)
✅ Grain texture overlay visible
✅ Synthesis visualization in hero
✅ Masonry layout for features (3 cols desktop, 2 tablet, 1 mobile)
✅ Vertical timeline for how it works
✅ Full-width amber CTA section
✅ Stats section removed
✅ Animations reduced (no spring physics, no rotation)
✅ Mobile responsive (stack layouts working)
✅ WCAG compliant contrast ratios
✅ Accessibility (focus states, semantic HTML)

---

## Notes

- All animations respect `useReducedMotion` preference
- Framer Motion animations are optional (no critical functionality)
- Design is responsive across mobile, tablet, desktop
- SEO considerations: Semantic HTML, descriptive alt text
- Performance: CSS-only effects where possible, minimal JS animations
