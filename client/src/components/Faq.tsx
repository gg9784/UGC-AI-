/*
  ============================================================
  FILE: client/src/components/Faq.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Renders the FAQ (Frequently Asked Questions) accordion section.
    Uses the native HTML <details>/<summary> elements — no JavaScript
    needed for the open/close toggle. Framer Motion adds scroll-triggered
    entrance animations to each item.

  KEY CONCEPT — NATIVE HTML ACCORDION:
    <details> and <summary> are built-in HTML elements for collapsible content.
    No JavaScript required — the browser handles show/hide natively.
    CSS can target the [open] attribute to style the expanded state.
  ─────────────────────────────────────────────────────────────
*/

import { ChevronDownIcon } from 'lucide-react';
/*
  lucide-react = icon library.
  ChevronDownIcon = a downward-pointing arrow "˅"
  Used as the visual indicator for expand/collapse state.
  Rotated 180° when the <details> is open (group-open:rotate-180 class).
*/

import Title from './Title';
import { faqData } from '../assets/dummy-data';
/*
  faqData = static array of FAQ items from dummy-data.ts.
  Shape: [{ question: string, answer: string }, ...]
*/

import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function Faq() {

    const refs = useRef<(HTMLDetailsElement | null)[]>([]);
    /*
      Array ref for <details> elements.
      HTMLDetailsElement — the TypeScript type for <details> DOM nodes.
      Used in onAnimationComplete to add CSS transition classes after animation.
      Same pattern as Features.tsx — avoids hover/animation conflicts with framer-motion.
    */

    return (
        <section id="faq" className="py-20 2xl:py-32">
        {/* id="faq" → enables anchor link: <a href="#faq"> from navbar or CTA */}

            <div className="max-w-3xl mx-auto px-4">
            {/*
              max-w-3xl = 48rem (768px) wide.
              Narrower than Features (6xl) because text content reads better in narrow columns.
              FAQ is text-heavy → constrained width = better readability (60-75 chars per line).
            */}

                <Title
                    title="FAQ"
                    heading="Frequently asked questions"
                    description="Everything you need to know about using the platform. If you have any questions, feel free to contact us."
                />

                <div className="space-y-3">
                {/*
                  space-y-3 = 12px vertical gap between each FAQ item.
                  Tailwind's space-y-N adds margin-top to all children except the first.
                  Simpler than adding mb-3 to each item individually.
                */}

                    {faqData.map((faq, i) => (
                        <motion.details

                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            key={i}
                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-300");
                                }
                            }}
                            /*
                              Same pattern as Features.tsx:
                              Add CSS transition class ONLY after framer-motion finishes the entrance animation.
                              Prevents animation conflicts between Framer Motion transforms and CSS transitions.
                            */
                            className="group bg-white/6 rounded-xl select-none"
                            /*
                              group → enables Tailwind's group-hover and group-open modifiers.
                                Any child with group-open:className will apply that class when
                                the nearest parent with class "group" has the [open] attribute.
                              
                              select-none → CSS: user-select: none
                                Prevents text from being accidentally selected when clicking
                                the summary to toggle the accordion.
                              
                              bg-white/6 → very slightly white background (6% opacity = dark card).
                            */
                        >
                            <summary className="flex items-center justify-between p-4 cursor-pointer">
                            {/*
                              <summary> = the CLICKABLE header of the accordion item.
                              The browser makes it clickable by default.
                              cursor-pointer = shows hand cursor on hover.
                              flex justify-between = question on left, chevron icon on right.
                            */}
                                <h4 className="font-medium">{faq.question}</h4>
                                {/* h4 — appropriate heading level for FAQ items (below h3 section headings) */}

                                <ChevronDownIcon className="w-5 h-5 text-gray-300 group-open:rotate-180 transition-transform" />
                                {/*
                                  group-open:rotate-180
                                    This is Tailwind's variant for the [open] attribute.
                                    When the <details> element has `open` attribute (accordion is expanded):
                                    the group-open variant activates → rotate-180 applies.
                                    
                                    The chevron (˅) rotates 180° to become (˄) when the accordion opens.
                                    Rotates back when it closes.
                                    
                                    transition-transform → animates the rotation smoothly (300ms default).
                                    
                                    HOW group-open WORKS:
                                    The `group` class is on the <details> element.
                                    When <details open> is toggled by the browser:
                                    Tailwind's group-open modifier activates on ALL descendants with group-open: prefixed classes.
                                    
                                    INTERVIEW Q: How do group modifiers work in Tailwind?
                                    A: Add `group` class to a parent element.
                                       Children can then use `group-hover:`, `group-focus:`, `group-open:` etc.
                                       These apply when the PARENT is in that state.
                                       Example: group-hover:text-white makes child text white when PARENT is hovered.
                                       group-open works similarly but with the HTML `open` attribute.
                                */}
                            </summary>

                            <p className="p-4 pt-0 text-sm text-gray-300 leading-relaxed">
                                {faq.answer}
                            </p>
                            {/*
                              This <p> is the hidden content.
                              When <details> is closed → browser hides everything after <summary>.
                              When <details> is open → this paragraph becomes visible.
                              No CSS or JS needed — the browser handles show/hide.
                              
                              p-4 pt-0 → 16px padding on sides and bottom, 0 padding on top.
                              The summary already provides top spacing.
                            */}
                        </motion.details>
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
  ✔ <details>/<summary> = native HTML accordion (zero JS needed)
  ✔ Browser adds `open` attribute automatically when expanded
  ✔ group-open:rotate-180 = rotate chevron when parent [open] exists
  ✔ group class on parent → group-open: variants work on children
  ✔ select-none = prevents text selection on click
  ✔ Framer Motion wraps <details>: motion.details = animated native element
  ✔ onAnimationComplete → add CSS transitions after Framer finishes
  ✔ space-y-3 = vertical gap between list items (margin-top on all but first)
*/