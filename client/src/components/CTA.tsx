/*
  ============================================================
  FILE: client/src/components/CTA.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    CTA = Call To Action. This section appears near the bottom of the Home page
    and gives users one final, focused prompt to sign up and start using the product.
    A strong CTA reduces churn (people who leave without converting).

  MARKETING CONTEXT:
    CTAs are conversion-focused:
    • "Start Creating Now" = action-oriented (verb + now = urgency)
    • "No credit card required" = objection removal (reduces friction)
    • "Join thousands of brands" = social proof (others are doing it)
    These copywriting patterns directly increase signup rates.

  TECHNICAL CONCEPTS:
    • Layered backgrounds (gradient + noise texture + z-index)
    • Framer Motion whileInView with staggered delays
    • overflow-hidden on the container clips child elements to rounded corners
  ─────────────────────────────────────────────────────────────
*/

import { ArrowRightIcon } from 'lucide-react';
import { GhostButton } from './Buttons';
import { motion } from 'framer-motion';

export default function CTA() {
    return (
        <section className="py-20 2xl:pb-32 px-4">
            <div className="container mx-auto max-w-3xl">

                <div className="rounded-3xl bg-linear-to-b from-violet-900/20 to-violet-900/5 border border-violet-500/20 p-12 md:p-16 text-center relative overflow-hidden">
                {/*
                  rounded-3xl → 24px border radius — very rounded card.
                  
                  bg-linear-to-b from-violet-900/20 to-violet-900/5
                    Vertical gradient (top → bottom):
                    Top: violet-900 at 20% opacity (slightly visible purple)
                    Bottom: violet-900 at 5% opacity (nearly transparent)
                    Creates a top-lit effect → the top of the card has more purple glow.
                  
                  border border-violet-500/20
                    Purple border at 20% opacity — subtly frames the card.
                    Matches the purple gradient inside for color harmony.
                  
                  relative → establishes positioning context for absolute children.
                  overflow-hidden → clips the noise texture overlay to the card's rounded corners.
                    Without overflow-hidden: the noise div would bleed outside the rounded corners.
                  
                  INTERVIEW Q: What does overflow-hidden do on a rounded container?
                  A: It clips all child elements to the boundary of the container,
                     including respecting border-radius. Without it, absolutely positioned
                     children would overflow the rounded corners and look broken.
                     Common pattern: parent has rounded-xl + overflow-hidden,
                     children can be positioned absolutely without visual overflow.
                */}

                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                    {/*
                      NOISE TEXTURE OVERLAY.
                      
                      absolute inset-0 → covers the entire card surface.
                      bg-[url('/noise.svg')] → loads a noise SVG from /public/noise.svg.
                        Noise = random pixel pattern that adds organic texture to flat surfaces.
                        Prevents the gradient from looking too clean/digital.
                      opacity-20 → the noise is very subtle (20% opacity = barely visible).
                      
                      WHY ADD NOISE TO A GRADIENT?
                      Flat digital gradients can look cheap and static.
                      A subtle noise texture adds "film grain" depth, making gradients
                      look more like physical materials (frosted glass, paper, fabric).
                      This technique is widely used by Stripe, Linear, Vercel, Raycast.
                      
                      LAYERING ORDER (top to bottom):
                      1. gradient background (bg-linear-to-b) → the purple color
                      2. noise texture (absolute, inset-0) → on top of gradient
                      3. relative z-10 content (h2, p, button) → on top of everything
                      
                      INTERVIEW Q: How do you layer multiple backgrounds in CSS?
                      A: Use absolute positioning with inset-0 for additional layers.
                         Or use CSS multiple backgrounds: background: url(noise.svg), linear-gradient(...)
                         The z-index/DOM order controls which layer appears on top.
                    */}

                    <div className="relative z-10">
                    {/*
                      z-10 ensures the text and button appear ABOVE the noise texture layer.
                      Without this: the noise div (absolute, inset-0) would cover the text.
                      
                      Stacking order:
                      Parent (rounded card):
                        Layer 1: bg-linear-to-b gradient
                        Layer 2: absolute noise div (inset-0, opacity-20)
                        Layer 3: relative z-10 content ← buttons and text here
                    */}

                        <motion.h2 className="text-2xl sm:text-4xl font-semibold mb-6"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                        >
                            Ready to Transform Your Content?
                        </motion.h2>
                        {/*
                          text-2xl sm:text-4xl → responsive heading:
                          Mobile (<640px): 24px. Small screens (640px+): 36px.
                          
                          whileInView animation: slides up from y:60 when this card scrolls into view.
                          No delay on h2 → it animates first.
                        */}

                        <motion.p className="max-sm:text-sm text-slate-400 mb-10 max-w-xl mx-auto"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                        >
                            Join thousands of brands creating viral UGC with AI. No credit card required. Start creating now.
                        </motion.p>
                        {/*
                          max-sm:text-sm → BELOW 640px: small text. Above 640px: normal (base) size.
                          max-sm: is the INVERSE of sm: — it applies BELOW the breakpoint.
                          
                          Social proof: "Join thousands of brands" → makes the user feel they'd
                          miss out by not joining (FOMO — Fear Of Missing Out).
                          
                          delay: 0.2 → paragraph animates 200ms after the heading starts.
                        */}

                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                        >
                            <GhostButton className="px-8 py-3 gap-2">
                                Start Creating Now <ArrowRightIcon size={20} />
                            </GhostButton>
                            {/*
                              GhostButton with px-8 py-3 → larger than the default button.
                              className extends the base GhostButton styles.
                              
                              ArrowRightIcon → directional cue — arrows signal action/movement.
                              Placed AFTER the text so the eye reads "Start Creating Now" → then sees →
                              
                              WHY GhostButton AND NOT PrimaryButton?
                              The card background is already purple/violet (the primary color).
                              A solid purple PrimaryButton would clash with the purple card.
                              A transparent GhostButton allows the card's purple to show through,
                              creating unity rather than color competition.
                              
                              delay: 0.3 → button animates 300ms after heading starts (last element).
                            */}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ CTA = Call To Action — marketing section to drive conversions
  ✔ relative + overflow-hidden → clips children to rounded corners
  ✔ absolute inset-0 → layers additional elements over the background
  ✔ relative z-10 → puts text/buttons ABOVE the noise texture
  ✔ noise texture → adds organic depth to flat digital gradients
  ✔ Staggered delays (0, 0.2, 0.3) → heading → paragraph → button
  ✔ max-sm: variant → applies BELOW the sm breakpoint (inverse of sm:)
  ✔ GhostButton used (not Primary) because card background is already purple
*/