/*
  ============================================================
  FILE: client/src/pages/Home.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Acts as the main landing page of the application.
    It is a "compositional component", meaning it contains very little
    logic itself, and simply orchestrates other large section components
    to build the final page.

  KEY CONCEPTS TAUGHT:
    • Component Composition: Stacking modular UI pieces like Lego blocks.
    • Clean Architecture: Keeping the top-level page files clean by pushing
      complex logic down into specialized section components.
  ─────────────────────────────────────────────────────────────
*/

import Hero from "../components/Hero";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import Faq from "../components/Faq";
import CTA from "../components/CTA";
/*
  By importing these components, we maintain strict Separation of Concerns.
  If there is a bug in the FAQ accordion, we know exactly which file to open
  (Faq.tsx) without scrolling through a 2000-line Home.tsx file.
*/

export default function Home() {
    return (
        <>
            {/* React Fragment (<>...</>) allows returning multiple sibling components
                without adding an unnecessary wrapping <div> to the DOM. */}
                
            <Hero />
            {/* Hero section: Main title, CTA buttons, and mockup image. */}
            
            <Features />
            {/* Features section: Grid of 3 value propositions (AI Image, Video, CDN). */}
            
            <Pricing />
            {/* Pricing section: Embeds the Clerk PricingTable. */}
            
            <Faq />
            {/* FAQ section: Native HTML accordion for common questions. */}
            
            <CTA />
            {/* Call To Action section: Final marketing push before the footer. */}
            
        </>
    )
}

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ "Compositional Components" just stack other components together.
  ✔ React Fragments (`<>...</>`) group elements without cluttering the DOM.
  ✔ Separating sections into distinct files keeps code maintainable and readable.
*/