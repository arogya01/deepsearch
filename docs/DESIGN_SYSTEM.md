# DeepSearch Design System - Brutalist Research Aesthetic

## Overview

This design system establishes the visual language for DeepSearch, embodying a **Brutalist Research/Academic** aesthetic that positions the product as a serious, authoritative knowledge tool.

### Design Philosophy

- **Authority**: Serif + sans-serif typography conveys intellectual credibility
- **Precision**: Sharp edges, high contrast, intentional spacing
- **Clarity**: Clear hierarchy, unambiguous visual language
- **Boldness**: Prominent amber accent color, not timid or diluted
- **Simplicity**: Purposeful elements, no decorative excess

---

## Typography

### Font Families

| Font | Usage | Variable | Weights |
|------|--------|----------|---------|
| **EB Garamond** | Headlines, emphasis, quotes | `--font-ebgaramond` | 400, 500, 600, 700 |
| **Inter** | Body text, labels, technical content | `--font-inter` | 400, 500, 600, 700 |

### Typography Scale

| Element | Class | Size | Weight | Line Height |
|---------|-------|------|--------|-------------|
| H1 (Hero) | `text-6xl sm:text-7xl lg:text-8xl` | 60px → 96px | 700 (Bold) | 1.0 - 1.1 |
| H2 (Section) | `text-4xl sm:text-5xl` | 36px → 48px | 700 (Bold) | 1.1 - 1.2 |
| H3 (Card) | `text-2xl` | 24px | 700 (Bold) | 1.2 - 1.3 |
| Body | `text-lg` | 18px | 400 (Regular) | 1.5 - 1.6 |
| Small | `text-sm` | 14px | 400 (Regular) | 1.5 - 1.6 |
| Caption | `text-xs` | 12px | 400 (Regular) | 1.4 - 1.5 |

### Usage Guidelines

#### EB Garamond (`font-display`)
- **Use for**: Headlines, quotes, emphasis, large numbers
- **Avoid**: Body paragraphs, technical content
- **Special feature**: Exceptionally elegant calligraphic italics

```tsx
<h1 className="font-display text-6xl font-bold">Search Deeper.</h1>
<p className="font-display text-3xl italic">"Research is curiosity in action."</p>
```

#### Inter (`font-body`)
- **Use for**: Body text, technical labels, data, UI elements
- **Avoid**: Large headlines (use serif instead)

```tsx
<p className="font-body text-lg">
  Transform scattered information into synthesized knowledge.
</p>
<span className="font-body text-xs text-amber/60">SOURCE 01</span>
```

### Special Text Patterns

#### Large Serif Numbers
Used for section markers or emphasis.

```tsx
<div className="font-display text-6xl font-bold text-amber/20">01</div>
```

#### Italic Quotes
Used for testimonials or pull quotes.

```tsx
<p className="font-display text-3xl italic text-white/90">
  &quot;The future of research is not in finding more information.&quot;
</p>
```

---

## Color Palette

### Primary Colors

| Color | Hex | HSL | Usage |
|-------|-----|-----|-------|
| **Background** | `#080808` | 8 0% 4% | Page background, dark sections |
| **Card** | `#1A1A1A` | 220 10% 10% | Card backgrounds, elevated surfaces |
| **Foreground** | `#E5E5E5` | 230 10% 90% | Primary text, headings |

### Accent Colors

| Color | Hex | HSL | Usage |
|-------|-----|-----|-------|
| **Amber (Primary)** | `#F4A460` | 25 70% 65% | CTAs, accents, emphasis, borders |
| **Amber Muted** | `rgba(244, 164, 96, 0.1)` | - | Subtle backgrounds, hover states |

### Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| **Success** | `#10B981` | Success states, confirmations |
| **Warning** | `#F59E0B` | Warnings, alerts |
| **Error** | `#EF4444` | Error states, destructive actions |
| **Info** | `#3B82F6` | Informational content |

### Opacity Scales

Use amber opacity for hierarchy and subtlety:

| Opacity | Class | Usage |
|---------|-------|-------|
| 100% | `text-amber` | Primary accents, headings |
| 80% | `text-amber/80` | Subtle text |
| 60% | `text-amber/60` | Secondary text, labels |
| 30% | `text-amber/30` | Borders, dividers |
| 20% | `text-amber/20` | Background decoration, large numbers |
| 10% | `text-amber/10` | Very subtle backgrounds |

### Color Guidelines

#### Do's
- ✅ Use amber boldly (full sections, large backgrounds, strong borders)
- ✅ High contrast ratios (amber on black, white on dark gray)
- ✅ Use opacity for visual hierarchy

#### Don'ts
- ❌ Purple, pink, violet gradients
- ❌ Multiple competing accent colors
- ❌ Timid or diluted amber usage
- ❌ Gradient text (use solid colors)

---

## Spacing

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Tight spacing, inline elements |
| `gap-4` | 16px | Default spacing, cards |
| `gap-6` | 24px | Section spacing, masonry |
| `gap-8` | 32px | Card groups, features |
| `gap-12` | 48px | Major sections |
| `gap-16` | 64px | Section dividers |

### Section Padding

```tsx
<section className="py-24 px-4 sm:px-6 lg:px-8">
  {/* Content */}
</section>
```

- **Mobile**: `py-16` (64px)
- **Tablet**: `py-20` (80px)
- **Desktop**: `py-24` (96px)

---

## Layout

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid Systems

#### Standard Grid (3 columns)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

#### Masonry Layout

Used for features with varied heights.

```tsx
<div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
  <div className="break-inside-avoid bg-card border-brutal-top p-8">
    {/* Content */}
  </div>
</div>
```

#### Centered Content

```tsx
<div className="max-w-4xl mx-auto">
  {/* Content */}
</div>
```

### Asymmetric Layout

Shift content off-center for visual interest.

```tsx
<div className="ml-auto max-w-2xl">
  {/* Right-aligned content */}
</div>
```

---

## Components

### Buttons

#### Primary Button (Amber Background)

```tsx
<button className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors">
  START RESEARCHING →
</button>
```

#### Secondary Button (Outline)

```tsx
<button className="px-8 py-4 bg-transparent text-white font-mono font-semibold border-2 border-white/20 hover:border-amber hover:text-amber transition-colors">
  VIEW DEMO
</button>
```

#### Button States

- **Hover**: Border color swap, background fill
- **Active**: No scale, simple color change
- **Focus**: Visible outline (accessibility)

### Cards

#### Standard Card

```tsx
<div className="bg-[#1A1A1A] p-6 border-brutal-top">
  <div className="text-amber text-xs mb-2">SOURCE 01</div>
  <p className="text-white/80 text-sm font-mono">Card content...</p>
</div>
```

#### Feature Card (with number)

```tsx
<div className="break-inside-avoid bg-[#1A1A1A] border-brutal-top p-8">
  <div className="font-display text-6xl font-bold text-amber/20 mb-4">01</div>
  <h3 className="font-display text-2xl font-bold text-white mb-3">
    Feature Title
  </h3>
  <p className="font-mono text-white/70 text-sm">
    Feature description...
  </p>
</div>
```

#### Amber Card (Highlight)

```tsx
<div className="bg-amber p-8 border-2 border-amber">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-black text-amber flex items-center justify-center font-mono text-sm font-bold">
      AI
    </div>
    <span className="font-mono text-black/60 text-sm">LABEL</span>
  </div>
  <p className="font-display text-2xl font-bold text-black">
    Content in amber card
  </p>
</div>
```

### Inputs

```tsx
<input
  type="text"
  placeholder="Search..."
  className="w-full px-4 py-3 bg-[#1A1A1A] border-2 border-white/10 text-white font-mono placeholder:text-white/40 focus:border-amber focus:outline-none"
/>
```

### Badges

```tsx
<div className="inline-flex items-center gap-2 border border-amber/30 px-4 py-2">
  <div className="w-2 h-2 bg-amber rounded-full" />
  <span className="text-sm text-white/80 font-mono">
    RESEARCH-READY AI
  </span>
</div>
```

### Quotes

```tsx
<motion.div className="pl-4 border-l-4 border-amber">
  <p className="font-display text-3xl italic text-white/90">
    &quot;The future of research is not in finding more information, but in finding right connections.&quot;
  </p>
</motion.div>
```

---

## Borders

### Border Utilities

| Class | Description |
|-------|-------------|
| `.border-brutal` | 2px solid amber border on all sides |
| `.border-brutal-top` | 2px solid amber border on top only |
| `.border-white/10` | Subtle white border (10% opacity) |
| `.border-white/20` | Medium white border (20% opacity) |

### Usage Patterns

#### Card Top Border (default)

```tsx
<div className="bg-[#1A1A1A] border-brutal-top">
  {/* Content */}
</div>
```

#### All Sides Amber (highlight)

```tsx
<div className="bg-[#1A1A1A] border-brutal">
  {/* Content */}
</div>
```

#### Subtle White Border (dividers)

```tsx
<div className="border-t border-white/10">
  {/* Divider */}
</div>
```

---

## Visual Effects

### Grain Overlay

Add subtle texture to backgrounds.

```tsx
<div className="relative">
  <div className="grain-overlay" />
  {/* Content */}
</div>
```

### Scanlines

Add subtle horizontal lines (terminal/paper effect).

```tsx
<div className="absolute inset-0 scanlines pointer-events-none" />
```

### Gradient Blur (Ambient)

Use sparingly for ambient glow.

```tsx
<motion.div
  className="absolute w-[600px] h-[600px] rounded-full"
  style={{
    background: "radial-gradient(circle, rgba(244, 164, 96, 0.08) 0%, transparent 70%)",
    filter: "blur(80px)"
  }}
/>
```

---

## Animations

### Animation Principles

- **Purposeful**: Every animation serves a purpose (attention, feedback, flow)
- **Subtle**: Slow timing, minimal motion
- **Respectful**: Honor `useReducedMotion` preference

### Timing

| Use Case | Duration | Easing |
|----------|-----------|--------|
| Fade-in (hero) | 0.4 - 0.6s | easeOut |
| Scroll reveal | 0.6s | easeOut |
| Pulse (ambient) | 3s | easeInOut |
| Hover state | 200ms | easeOut |
| Stagger delay | 0.1s per item | - |

### Fade-up Animation

```tsx
import { motion, useReducedMotion } from "framer-motion";

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: shouldReduceMotion ? 0.4 : 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

### Pulse Animation

```tsx
<motion.div
  animate={{ opacity: [0.4, 1, 0.4] }}
  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  className="w-32 h-px bg-amber/60"
/>
```

### Scroll-triggered Animation

```tsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

### Hover Animations

Simple color/border swap (no scale):

```tsx
<motion.button
  whileHover={{ backgroundColor: "#000", color: "#F4A460" }}
  whileTap={{ scale: 0.98 }}
  className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber transition-colors"
>
  BUTTON
</motion.button>
```

---

## Layout Patterns

### Hero Section

```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div className="grain-overlay" />
  <div className="scanlines" />

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 border border-amber/30 px-4 py-2">
      <div className="w-2 h-2 bg-amber rounded-full" />
      <span className="text-sm text-white/80 font-mono">BADGE</span>
    </div>

    {/* Headlines */}
    <div className="space-y-2">
      <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-white">
        Headline One
      </h1>
      <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-amber">
        Headline Two
      </h1>
    </div>

    {/* Subtitle */}
    <p className="text-xl text-white/60 font-mono max-w-2xl mt-6">
      Subtitle text goes here.
    </p>
  </div>
</section>
```

### Section with Dividers

```tsx
<section className="py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="text-center mb-16">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
        Section <span className="text-amber">Title</span>
      </h2>
      <p className="text-white/70 text-lg max-w-2xl mx-auto font-mono">
        Section description
      </p>
    </div>

    {/* Content */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cards */}
    </div>

    {/* Quote Divider */}
    <div className="pl-4 border-l-4 border-amber my-16">
      <p className="font-display text-3xl italic text-white/90">
        &quot;Quote goes here.&quot;
      </p>
    </div>
  </div>
</section>
```

### Vertical Timeline

```tsx
<div className="max-w-4xl mx-auto">
  <div className="relative">
    {/* Vertical Line */}
    <div className="absolute left-8 top-0 bottom-0 w-px bg-amber/20" />

    {/* Steps */}
    {steps.map((step, index) => (
      <div className={`relative pl-20 ${index % 2 === 1 ? 'md:pl-0 md:pr-20 md:text-right' : ''}`}>
        {/* Number */}
        <div className={`absolute left-4 top-0 w-9 h-9 bg-[#1A1A1A] border-2 border-amber flex items-center justify-center font-mono text-amber font-bold ${index % 2 === 1 ? 'md:left-auto md:right-4' : ''}`}>
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
      </div>
    ))}
  </div>
</div>
```

---

## Mobile Responsiveness

### Breakpoints

| Breakpoint | Class | Width |
|------------|-------|-------|
| Mobile | Default | < 640px |
| Tablet | `sm:` / `md:` | 640px - 1024px |
| Desktop | `lg:` | ≥ 1024px |

### Common Patterns

#### Stack on Mobile, Grid on Desktop

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

#### Hide on Mobile, Show on Desktop

```tsx
<div className="hidden md:flex">
  {/* Desktop-only content */}
</div>
```

#### Hide on Desktop, Show on Mobile

```tsx
<div className="md:hidden flex">
  {/* Mobile-only content */}
</div>
```

#### Adjust Text Size

```tsx
<h1 className="text-5xl sm:text-6xl lg:text-7xl">
  Responsive headline
</h1>
```

---

## Accessibility

### Focus States

Always ensure focus states are visible:

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-black">
  Button
</button>
```

### Motion Reduction

Always respect user preferences:

```tsx
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
  transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity }}
/>
```

### Color Contrast

- Amber on black: ✓ (WCAG AA/AAA)
- White on dark gray: ✓ (WCAG AA/AAA)
- Amber/20 on black: ✓ (WCAG AA)

### Semantic HTML

Use proper semantic elements:

```tsx
<section>
  <header>
    <h2>Section Title</h2>
  </header>
  <article>
    <h3>Article Title</h3>
    <p>Content...</p>
  </article>
</section>
```

### ARIA Labels

For icons and buttons without text:

```tsx
<button
  className="..."
  aria-label="Close"
>
  <X className="w-5 h-5" />
</button>
```

---

## Iconography

### Icon Style

- **Color**: Amber for primary, white/70 for secondary
- **Size**: `w-5 h-5` (20px) for standard, `w-4 h-4` (16px) for small
- **Stroke**: Use Lucide React icons (already installed)

### Usage

```tsx
import { Search, ArrowRight, Sparkles } from "lucide-react";

// Primary icon
<Search className="w-5 h-5 text-amber" />

// Secondary icon
<ArrowRight className="w-4 h-4 text-white/70" />

// Icon in badge
<div className="w-8 h-8 bg-black text-amber flex items-center justify-center">
  <Sparkles className="w-4 h-4" />
</div>
```

---

## Utilities Reference

### Typography

```css
.font-display  /* EB Garamond */
.font-body     /* Inter */
```

### Color

```css
.bg-amber       /* Amber background */
.text-amber     /* Amber text */
.border-amber   /* Amber border */
.bg-[#1A1A1A]  /* Dark gray card background */
.bg-[#080808]  /* Black background */
```

### Border

```css
.border-brutal      /* 2px solid amber on all sides */
.border-brutal-top  /* 2px solid amber on top */
```

### Texture

```css
.grain-overlay  /* SVG noise texture */
.scanlines     /* Horizontal scan lines */
```

---

## Best Practices

### Do's

✅ Use amber boldly (sections, backgrounds, borders)
✅ Serif for headlines, mono for body
✅ High contrast ratios
✅ Subtle, purposeful animations
✅ Semantic HTML structure
✅ Responsive design (mobile-first)
✅ Accessible focus states
✅ Clean, readable code

### Don'ts

❌ Purple, pink, violet gradients
❌ Glassmorphism effects
❌ Spring physics animations
❌ Scale/rotate on hover (use color swap)
❌ Floating orbs or particles
❌ Multiple competing colors
❌ Timid or diluted accent usage
❌ Complex gradients

---

## Quick Reference

### Headline Pattern
```tsx
<h1 className="font-display text-6xl lg:text-8xl font-bold text-white">
  Headline
</h1>
```

### Body Text Pattern
```tsx
<p className="font-body text-lg text-white/60">
  Body text
</p>
```

### Card Pattern
```tsx
<div className="bg-[#1A1A1A] border-brutal-top p-6">
  <div className="text-amber text-xs mb-2 font-mono">LABEL</div>
  <h3 className="font-display text-xl font-bold text-white mb-2">Title</h3>
  <p className="font-mono text-white/70 text-sm">Content</p>
</div>
```

### Button Pattern
```tsx
<button className="px-8 py-4 bg-amber text-black font-mono font-semibold border-2 border-amber hover:bg-black hover:text-amber transition-colors">
  BUTTON →
</button>
```

---

## File Structure

When creating new components, follow this pattern:

```
src/components/
├── component-name.tsx       (component implementation)
├── component-name.test.tsx  (tests, if applicable)
```

### Component Template

```tsx
"use client";

import { motion } from "framer-motion";

interface ComponentProps {
  title: string;
  description: string;
}

export function ComponentName({ title, description }: ComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#1A1A1A] border-brutal-top p-6"
    >
      <div className="text-amber text-xs mb-2 font-mono">LABEL</div>
      <h3 className="font-display text-xl font-bold text-white mb-2">
        {title}
      </h3>
      <p className="font-body text-white/70 text-sm">
        {description}
      </p>
    </motion.div>
  );
}
```

---

## Examples from Landing Page

### Synthesis Visualization
See: `src/components/landing/hero-section.tsx:51-113`

### Masonry Features
See: `src/components/landing/features-section.tsx:49-72`

### Vertical Timeline
See: `src/components/landing/how-it-works.tsx:39-85`

### Amber CTA Section
See: `src/components/landing/cta-section.tsx:14-60`

---

## Resources

- **Typography**: [EB Garamond](https://fonts.google.com/specimen/EB+Garamond), [Inter](https://fonts.google.com/specimen/Inter)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Color**: Amber #F4A460

---

**Version**: 1.0
**Last Updated**: December 2025
**Maintainer**: DeepSearch Design Team
