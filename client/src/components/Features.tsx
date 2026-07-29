/*
  ============================================================
  FILE: client/src/components/Features.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Renders the "Features" section of the Home page. Shows a 3-column
    grid of feature cards, each sliding up and fading in when scrolled
    into view. After the entrance animation, hover animations are added
    dynamically via refs.

  WHAT IT TEACHES:
    • useRef for accessing DOM elements directly
    • Framer Motion scroll-triggered animations
    • Dynamically adding CSS classes after animation completes
    • Mapping data arrays to JSX
  ─────────────────────────────────────────────────────────────
*/

import { useRef } from 'react';
/*
  useRef — creates a mutable reference that persists across renders.
  
  TWO MAIN USES OF useRef:
  1. Accessing DOM elements directly (used here)
  2. Storing mutable values that DON'T trigger re-renders (like timers)
  
  INTERVIEW Q: What is useRef?
  A: useRef returns an object { current: value } that persists across renders.
     Unlike useState, updating .current does NOT trigger a re-render.
     Primary use: directly accessing DOM nodes for imperative operations
     (focus, scrollTo, animations, measurements).
*/

import { featuresData } from '../assets/dummy-data';
/*
  featuresData = array of feature objects from a static data file.
  Example shape:
    [
      { icon: <SparkleIcon />, title: "AI Image Generation", desc: "..." },
      { icon: <VideoIcon />,   title: "Video Automation",    desc: "..." },
      { icon: <CloudIcon />,   title: "Instant CDN Delivery", desc: "..." },
    ]
  
  WHY SEPARATE DATA FILE?
  Keeping content data separate from UI logic follows the Separation of Concerns principle.
  If the content changes, you only edit dummy-data.ts — not this component.
  The component is purely responsible for HOW to display data, not WHAT data to show.
*/

import Title from './Title';
import { motion } from 'framer-motion';

export default function Features() {

    const refs = useRef<(HTMLDivElement | null)[]>([]);
    /*
      WHAT THIS IS:
      A ref that holds an ARRAY of DOM element references.
      One reference per feature card.
      
      useRef<(HTMLDivElement | null)[]>([])
        Generic: <(HTMLDivElement | null)[]>
          The ref holds an array where each element is either:
          - HTMLDivElement (a reference to the card's DOM node)
          - null (before the ref is attached)
        Initial value: [] (empty array)
      
      HOW IT'S POPULATED:
        Each motion.div has:
          ref={(el) => { refs.current[i] = el; }}
        When React renders each card, it calls this callback with the DOM element.
        refs.current[0] = first card's DOM node
        refs.current[1] = second card's DOM node
        refs.current[2] = third card's DOM node
      
      INTERVIEW Q: What is a ref callback?
      A: Instead of passing a ref object directly, you pass a function.
         React calls the function with the DOM element when it mounts,
         and with null when it unmounts. Used here to build an array of refs
         (React's createRef/useRef only stores one element, not an array).
    */

    return (
        <section id="features" className="py-20 2xl:py-32">
        {/*
          id="features" → enables anchor link navigation:
          <a href="#features"> → Lenis smoothly scrolls to this section.
          Lenis's anchors.offset: -100 prevents the fixed Navbar from covering it.
          
          py-20 → 80px vertical padding on top and bottom
          2xl:py-32 → 128px on very large screens (2560px+ = 2xl breakpoint)
        */}
            <div className="max-w-6xl mx-auto px-4">
            {/* max-w-6xl = 72rem wide, centered with mx-auto, px-4 = 16px horizontal padding */}

                <Title
                    title="Features"
                    heading="Built for modern brands"
                    description="our AI instantly produces professional lifestyle imagery and short-form videos optimized for commercials & Reels."
                />
                {/* Reusable section heading component — consistent across all sections */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/*
                  CSS Grid Layout:
                  grid-cols-1    → mobile: single column (cards stack vertically)
                  md:grid-cols-3 → tablet/desktop (768px+): 3 equal columns
                  gap-6          → 24px gap between all grid cells
                  
                  INTERVIEW Q: When to use Grid vs Flexbox?
                  A: Grid is for TWO-DIMENSIONAL layouts (rows AND columns).
                     Flexbox is for ONE-DIMENSIONAL layouts (row OR column).
                     3-column card grid = Grid. Navbar items in a row = Flexbox.
                     Use Grid when you need items to align in both axes simultaneously.
                */}

                    {featuresData.map((feature, i) => (
                    /*
                      .map() transforms each item in the array into JSX.
                      feature = the current feature object ({ icon, title, desc })
                      i = the current index (0, 1, 2)
                      
                      The callback returns a JSX element → map() returns an array of JSX.
                      React renders arrays of elements automatically.
                      
                      INTERVIEW Q: Why do we need a `key` prop when using .map()?
                      A: React uses keys to identify which items changed between renders.
                         Keys must be unique within the list.
                         With keys, React surgically updates only changed items.
                         Without keys, React has to re-render the entire list on any change.
                         Here we use `key={i}` (index) — acceptable for static lists,
                         but for dynamic lists (items can be reordered/deleted),
                         use a stable unique ID from the data instead.
                    */
                        <motion.div
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            /*
                              ref callback: called by React with the DOM element when mounted.
                              Stores each card's DOM node in refs.current[i].
                              Used in onAnimationComplete below to add hover classes.
                            */

                            initial={{ y: 100, opacity: 0 }}
                            /*
                              Starting state: 100px below, invisible.
                              Cards start off-screen and animate up into position.
                            */

                            whileInView={{ y: 0, opacity: 1 }}
                            /*
                              Target state: normal position, fully visible.
                              Triggers when the card enters the viewport.
                            */

                            viewport={{ once: true }}
                            /*
                              Animate only once — don't replay every time user scrolls past.
                            */

                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            /*
                              delay: 0.1 + i * 0.1
                              Staggered delays per card:
                                Card 0 (i=0): delay = 0.1 + 0*0.1 = 0.1s
                                Card 1 (i=1): delay = 0.1 + 1*0.1 = 0.2s
                                Card 2 (i=2): delay = 0.1 + 2*0.1 = 0.3s
                              
                              Cards slide in one after another, left to right.
                              This staggering creates a polished, sequential reveal.
                              The 0.1 * i formula is a clean way to calculate stagger delays.
                            */

                            key={i}
                            /*
                              key = unique identifier for React reconciliation.
                              Using index is fine here because featuresData is STATIC
                              (never reordered or filtered at runtime).
                            */

                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-300", "hover:border-white/15", "hover:-translate-y-1");
                                }
                            }}
                            /*
                              onAnimationComplete = framer-motion callback after animation finishes.
                              
                              WHY NOT ADD HOVER CLASSES FROM THE START?
                              Problem: Framer Motion controls the element's transform property
                              during the entrance animation (y: 100 → y: 0).
                              If hover:-translate-y-1 was active from the start, CSS transitions
                              would CONFLICT with the Framer Motion spring animation → jerky behavior.
                              
                              SOLUTION: Add hover classes AFTER the entrance animation completes.
                              Now Framer Motion is done → CSS transitions take over for hover.
                              
                              card.classList.add("transition", "duration-300", "hover:border-white/15", "hover:-translate-y-1")
                              Dynamically adds Tailwind classes to the DOM element via JavaScript.
                              
                              hover:-translate-y-1 → card lifts 4px on hover
                              hover:border-white/15 → border becomes slightly more visible on hover
                              duration-300 → 300ms transition for smooth hover effect
                              
                              INTERVIEW Q: Why add hover classes dynamically instead of in className?
                              A: Framer Motion controls CSS transforms during animations.
                                 If hover transforms (translate-y) were applied while Framer is
                                 also controlling translate (for the slide-up entrance), they conflict.
                                 Adding them after animation ensures Framer is done and CSS can take over.
                            */

                            className="rounded-2xl p-6 bg-white/3 border border-white/6"
                        >
                            <div className="w-12 h-12 rounded-lg bg-violet-900/20 flex items-center justify-center mb-4">
                                {feature.icon}
                                {/*
                                  feature.icon = a pre-rendered React element (Lucide icon).
                                  From dummy-data.ts: icon: <SparkleIcon className="..." />
                                  React can render JSX stored in variables/arrays.
                                */}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                            {/* leading-relaxed = line-height: 1.625 = comfortable reading line spacing */}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ useRef<(HTMLDivElement | null)[]>([]) = array of DOM element refs
  ✔ ref callback (el) => refs.current[i] = el → builds array of refs
  ✔ onAnimationComplete → add hover classes AFTER framer-motion finishes
  ✔ delay: 0.1 + i * 0.1 → staggered card entrance (each 100ms later)
  ✔ whileInView + viewport={{ once: true }} → scroll-triggered, one time
  ✔ .map() returns array of JSX → React renders it
  ✔ key={i} = acceptable for static lists, use stable ID for dynamic lists
  ✔ grid-cols-1 md:grid-cols-3 = responsive grid (1 col mobile, 3 col desktop)
*/