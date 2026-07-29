/*
  ============================================================
  FILE: client/src/components/Title.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    A reusable section heading component used on every page section
    (Features, Pricing, FAQ, Plans). It renders a small label, a main
    heading, and a description — all with scroll-triggered animations.
    Using a shared Title component ensures ALL sections have consistent
    typography, spacing, and animation behavior.

  WHERE IT'S USED:
    Features.tsx, Faq.tsx, Pricing.tsx, Genetator.tsx
  ─────────────────────────────────────────────────────────────
*/

import { motion } from 'framer-motion';
/*
  framer-motion = React animation library.
  motion.p, motion.h2 = standard HTML elements upgraded with animation superpowers.
  
  You add animation via props:
    initial    → starting animation state (before visible)
    animate    → target state (when rendered)
    whileInView → state when scrolled into the viewport
    viewport   → settings for the in-view trigger
    transition → how to animate between states (spring, tween, duration)
*/

interface TitleProps {
    title?: string;
    heading?: string;
    description?: string;
}
/*
  Inline TypeScript interface (defined in the same file, not imported from types/).
  All three props are OPTIONAL (?) — callers can use any combination:
    <Title heading="Features" />
    <Title title="FAQ" heading="Frequently Asked Questions" description="..." />
    <Title title="Create" />
  
  INTERVIEW Q: When would you define types inline vs in a separate types/ file?
  A: Inline when the type is only used in ONE file. In types/ when it's shared
     across multiple components. TitleProps is only used here → inline is correct.
     Shared types like Project or User belong in types/index.ts.
*/

export default function Title({ title, heading, description }: TitleProps) {
/*
  Props are destructured directly in the parameter list.
  Since all are optional, TypeScript knows they can be undefined.
  The conditional rendering below (title &&) handles the undefined case.
*/

    return (
        <div className="text-center mb-16">
        {/*
          text-center → center-aligns all text inside.
          mb-16 → 64px margin below the title block before the section content.
        */}

            {title && (
                <motion.p
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                    className="text-sm font-medium text-violet-400 uppercase tracking-wide mb-3"
                >
                    {title}
                </motion.p>
            )}
            {/*
              {title && (...)}
              SHORT-CIRCUIT EVALUATION for conditional rendering.
              If title = undefined → renders nothing.
              If title = "Features" → renders the <motion.p>.
              
              WHY SHORT-CIRCUIT INSTEAD OF TERNARY?
              When you only want to render something IF a condition is true
              (no else case), && is cleaner than:
              {title ? <motion.p>{title}</motion.p> : null}
              
              GOTCHA: If title = 0 (the number zero), `0 && <p>` renders "0" on screen.
              The fix: use !! to convert to boolean: {!!title && <p>...}
              Or use ternary: {title ? <p>...</p> : null}
              
              FRAMER MOTION ANIMATION:
              initial={{ y: 60, opacity: 0 }}
                → Start state: 60px BELOW normal position, invisible (opacity 0).
                  The element begins off-screen or shifted down.
              
              whileInView={{ y: 0, opacity: 1 }}
                → Target state when element enters the viewport: normal position, fully visible.
              
              viewport={{ once: true }}
                → Trigger the animation ONLY THE FIRST TIME the element enters the viewport.
                  Without `once: true`: the animation replays every time you scroll
                  past it (going up and down). That's annoying.
                  With once: true: it plays once and stays in the final state.
              
              transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                → Physics-based spring animation:
                  type: "spring" → uses spring physics (bouncy, natural feel)
                  stiffness: 250 → how rigid the spring is (higher = faster, snappier)
                  damping: 70    → energy dissipation (higher = less bounce, more gentle)
                  mass: 1        → mass of the animated object (higher = more inertia, slower)
                  
                  These values = a fast, slightly springy entrance. Not too bouncy, not too stiff.
              
              className:
              text-sm uppercase tracking-wide = small all-caps label style (like "FEATURES", "FAQ")
              text-violet-400 = purple-ish color for the label, distinct from the white heading
              mb-3 = 12px gap between label and heading
            */}

            {heading && (
                <motion.h2 className="text-2xl md:text-4xl text-white font-semibold"
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                >
                    {heading}
                </motion.h2>
            )}
            {/*
              delay: 0.1 → start this animation 100ms after the title animation begins.
              STAGGERED ANIMATIONS: each element has a slightly later delay:
                title      → delay: 0 (immediate)
                heading    → delay: 0.1 (100ms later)
                description→ delay: 0.2 (200ms later)
              
              Result: the three elements appear one after another — like text "typing in".
              This creates a much more polished and intentional feel than all three
              appearing at the same time.
              
              INTERVIEW Q: What is animation staggering?
              A: Applying incremental delays to related animations so they start
                 one after another. Creates a cascading reveal effect.
                 Common in lists: each item slides in 50ms after the previous.
                 Makes complex UIs feel organized and premium.
              
              text-2xl md:text-4xl
                Mobile: 24px text. Desktop (768px+): 36px text.
                Responsive typography — big heading on desktop, smaller on mobile.
              
              Why <h2> not <h1>?
              The page likely has an <h1> in the Hero section.
              Each page should have ONE h1 (SEO best practice).
              Section headings use h2 → correct heading hierarchy.
            */}

            {description && (
                <motion.p className='max-w-md mx-auto text-sm text-gray-400 my-3'
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                >
                    {description}
                </motion.p>
            )}
            {/*
              max-w-md mx-auto → constrain paragraph to 448px wide, centered.
              Long description text spanning the full page width is hard to read.
              max-w-md creates a readable line length (~60-70 characters per line).
              
              text-gray-400 → muted gray, lower visual weight than the heading.
              Establishes hierarchy: white heading → gray description.
              
              delay: 0.2 → 200ms after the start → appears last.
            */}
        </div>
    )
}

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Title = reusable section heading (label + h2 + description)
  ✔ All props optional — renders only what's provided
  ✔ {prop && <element>} = conditional rendering (short-circuit)
  ✔ whileInView = animate when element scrolls into viewport
  ✔ viewport={{ once: true }} = animate only once (not on every scroll)
  ✔ Staggered delays (0, 0.1, 0.2) = cascading reveal animation
  ✔ type: "spring" = physics-based animation (stiffness, damping, mass)
  ✔ max-w-md mx-auto = centered, readable paragraph width
  ✔ Use h2 for section headings (h1 is reserved for page-level heading)
*/