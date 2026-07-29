/*
  ============================================================
  FILE: client/src/components/Hero.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Renders the Hero section (the very top of the Home page).
    This is the most important marketing real estate of the app.
    It combines strong copywriting, high-quality images, social proof,
    and clear calls-to-action (CTAs) to drive conversions.

  KEY CONCEPTS TAUGHT:
    • Framer Motion: Orchestrating staggered entrance animations.
    • CSS Marquee: Infinite scrolling logo banner.
    • UI Polish: Floating elements, pinging dots, and gradient text.
    • Responsive Grids: Stacking on mobile, side-by-side on desktop.
  ─────────────────────────────────────────────────────────────
*/

import { ArrowRightIcon, PlayIcon, ZapIcon, CheckIcon } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import { motion } from 'framer-motion';

export default function Hero() {

    // ── STATIC DATA ────────────────────────────────────────────
    /*
      Hardcoded marketing assets (images, logos).
      In a massive enterprise app, these might come from a CMS (Contentful/Sanity).
      For most SaaS apps, hardcoding these is perfectly fine and faster.
    */
    const trustedUserImages = [
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=50',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop'
    ];

    const mainImageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop';

    const galleryStripImages = [
        'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=80&auto=format&fit=crop',
    ];

    const trustedLogosText = [
        'Adobe', 'Figma', 'Canva', 'Shopify', 'Webflow'
    ];

    // ── RENDER ─────────────────────────────────────────────────
    return (
        <>
            <section id="home" className="relative z-10">
                <div className="max-w-6xl mx-auto px-4 max-md:w-screen max-md:overflow-hidden pt-32 xl:pt-40 pb-20 flex items-center justify-center">
                    
                    {/* 
                      grid-cols-1 md:grid-cols-2
                      Mobile: Stacks vertically (Text on top, Image on bottom).
                      Desktop: Side-by-side (Left: Text, Right: Image).
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        
                        {/* ── LEFT COLUMN: COPY & CTA ── */}
                        <div className="text-left">
                            
                            {/* SOCIAL PROOF BADGE */}
                            <motion.a href="#" className="inline-flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/10 mb-6 justify-start"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                            >
                                <div className="flex -space-x-2">
                                {/* -space-x-2 creates overlapping avatars by applying negative margins to siblings */}
                                    {trustedUserImages.map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt={`Client ${i + 1}`}
                                            className="size-6 rounded-full border border-black/50"
                                            width={40}
                                            height={40}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-200/90">
                                    Trusted by 10,000+ creators
                                </span>
                            </motion.a>

                            {/* MAIN HEADLINE (H1) */}
                            <motion.h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                                {/* delay: 0.1 creates a staggered entrance sequence! */}
                            >
                                Create viral UGC <br />
                                {/* Gradient text trick: transparent text color + background-clip */}
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 to-indigo-400">
                                     in seconds
                                </span>
                            </motion.h1>

                            {/* SUBTITLE */}
                            <motion.p className="text-gray-300 max-w-lg mb-8"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                            >
                                Upload product images and a model photo — our AI instantly produces professional lifestyle imagery and short-form videos optimized for commercials & Reels.
                            </motion.p>

                            {/* BUTTONS */}
                            <motion.div className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                            >
                                <a href="/generate" className="w-full sm:w-auto">
                                    <PrimaryButton className="max-sm:w-full py-3 px-7">
                                        Start generating — it's free
                                        <ArrowRightIcon className="size-4" />
                                    </PrimaryButton>
                                </a>

                                <GhostButton className="max-sm:w-full max-sm:justify-center py-3 px-5">
                                    <PlayIcon className="size-4" />
                                    Watch demo
                                </GhostButton>
                            </motion.div>

                            {/* FEATURE CALLOUTS */}
                            <motion.div className="flex sm:inline-flex overflow-hidden items-center max-sm:justify-center text-sm text-gray-200 bg-white/10 rounded"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <ZapIcon className="size-4 text-sky-500" />
                                    <div>
                                        <div>Seconds to create</div>
                                        <div className="text-xs text-gray-400">Optimized social formats</div>
                                    </div>
                                </div>

                                <div className="hidden sm:block h-6 w-px bg-white/6" />

                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <CheckIcon className="size-4 text-cyan-500" />
                                    <div>
                                        <div>Commercial rights</div>
                                        <div className="text-xs text-gray-400">Use anywhere, no fuss</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── RIGHT COLUMN: HERO VISUAL ── */}
                        <motion.div className="mx-auto w-full max-w-lg"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.5 }}
                        >
                            {/* Main hero card */}
                            <motion.div className="rounded-3xl overflow-hidden border border-white/6 shadow-2xl bg-linear-to-b from-black/50 to-transparent">
                                <div className="relative aspect-16/10 bg-gray-900">
                                    <img src={mainImageUrl} alt="agency-work-preview" className="w-full h-full object-cover object-center" />

                                    <div className="absolute left-4 top-4 px-3 py-1 rounded-full bg-black/15 backdrop-blur-sm text-xs">
                                        Social-ready • 9:16 & 16:9
                                    </div>

                                    <div className="absolute right-4 bottom-4">
                                        <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/6 backdrop-blur-sm hover:bg-white/10 transition focus:outline-none">
                                            <PlayIcon className="size-4" />
                                            <span className="text-xs">Preview</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Mini gallery strip under main card */}
                            <div className="mt-4 flex gap-3 items-center justify-start">
                                {galleryStripImages.map((src, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        // Staggered delays based on index `i`
                                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                                        className="w-14 h-10 rounded-lg overflow-hidden border border-white/6"
                                    >
                                        <img src={src} alt="project-thumbnail" className="w-full h-full object-cover" />
                                    </motion.div>
                                ))}
                                
                                <motion.div className="text-sm text-gray-400 ml-2 flex items-center gap-2"
                                    initial={{ y: 60, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                                >
                                    {/* LIVE "PING" DOT UI */}
                                    <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                                        {/* Outer pinging ring */}
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping duration-300" />
                                        {/* Solid inner dot */}
                                        <span className="relative inline-flex size-2 rounded-full bg-green-600" />
                                    </div>
                                    +20 more
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── LOGO MARQUEE (Infinite Scroll) ── */}
            <motion.section className="border-y border-white/6 bg-white/1 max-md:mt-10"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="w-full overflow-hidden py-6">
                        {/* 
                          animate-marquee:
                          This class is typically defined in index.css or tailwind.config.
                          It moves the container from X=0 to X=-100% over a set duration.
                          
                          whitespace-nowrap forces the items into a single endless row.
                        */}
                        <div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
                            
                            {/* 
                              Array.concat is used to DUPLICATE the array.
                              Why duplicate? To make the marquee seamless. 
                              When the first array finishes scrolling off screen, the second array 
                              is already filling the gap. When the animation resets to 0, you don't see a jump!
                            */}
                            {trustedLogosText.concat(trustedLogosText).map((logo, i) => (
                                <span
                                    key={i}
                                    className="mx-6 text-sm md:text-base font-semibold text-gray-400 hover:text-gray-300 tracking-wide transition-colors"
                                >
                                    {logo}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>
        </>
    );
};

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Gradient Text (`bg-clip-text`)
  ─────────────────────────────────────────────────────────────
  To give text a beautiful color gradient in CSS:
  1. Add a background gradient (`bg-linear-to-r from-... to-...`)
  2. Clip the background to the text shape (`bg-clip-text`)
  3. Make the actual text fill transparent (`text-transparent`)
  
  The result? The background gradient shows *through* the shape of the letters!

  CONCEPT: Overlapping Avatars (`-space-x-2`)
  ─────────────────────────────────────────────────────────────
  How do you make profile pictures overlap like a deck of cards?
  Flexbox + negative margins.
  Tailwind's `-space-x-2` adds `margin-left: -0.5rem` to all children except the first.
  This pulls each child to the left, stacking it partially over the previous one.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ `delay: 0.1 * index` is the golden rule for staggering lists in Framer Motion.
  ✔ Infinite Marquee trick: duplicate the list so it loops seamlessly.
  ✔ Ping Dot UI uses two spans: one solid relative dot, one absolute `animate-ping` dot.
  ✔ `bg-clip-text` + `text-transparent` = gradient text effect.
*/