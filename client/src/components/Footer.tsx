/*
  ============================================================
  FILE: client/src/components/Footer.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    The site footer — appears at the bottom of every page.
    Contains: logo, tagline, navigation link groups, copyright notice.
    Also uses a Framer Motion fade-in animation when scrolled into view.

  WHERE IT'S USED:
    App.tsx: <Footer /> — outside <Routes> so it appears on all pages.
  ─────────────────────────────────────────────────────────────
*/

import { assets } from '../assets/assets';
/*
  assets = an object containing imported image paths.
  assets.logo = the path to the logo image file.
  
  WHY IMPORT IMAGES THIS WAY?
  When you import an image in Vite:
    import logo from './logo.svg'
  Vite processes it, adds a content hash to the filename (logo.a3b4c5.svg),
  and returns the hashed URL. This enables long-term browser caching:
  the URL only changes if the file changes.
  
  If you use a raw path like src="/logo.svg", there's no cache-busting.
  The assets object centralizes all these imports in one file.
*/

import { footerLinks } from '../assets/dummy-data';
/*
  footerLinks = static data for footer navigation columns.
  Shape:
  [
    { title: "Product", links: [{ name: "Generate", url: "/generate" }, ...] },
    { title: "Company", links: [{ name: "About", url: "#" }, ...] },
    { title: "Support", links: [{ name: "Contact", url: "#" }, ...] },
  ]
  
  Keeping link data in dummy-data.ts keeps this component clean.
  Adding/removing footer links = edit one data file, not this component.
*/

import { motion } from 'framer-motion';

export default function Footer() {

    return (
        <motion.footer className="bg-white/6 border-t border-white/6 pt-10 text-gray-300"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">

                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-white/10">
                {/*
                  Responsive layout:
                  flex-col → mobile: logo + tagline stacked above the links
                  md:flex-row → desktop: logo on left, link columns on right
                  items-start → align items to the top (not stretched to full height)
                  gap-10 → 40px gap between logo section and link columns
                  border-b border-white/10 → horizontal rule below the main footer content
                */}

                    <div>
                        <img src={assets.logo} alt="logo" className="h-8" />
                        {/*
                          Logo in the footer — standard pattern.
                          h-8 = 32px height. Width scales automatically.
                          alt="logo" → accessibility (screen readers read this).
                        */}

                        <p className="max-w-[410px] mt-6 text-sm leading-relaxed">
                            Create viral UGC in seconds. Upload product images and a model photo — our AI instantly produces professional lifestyle imagery and short-form videos.
                        </p>
                        {/*
                          max-w-[410px] → constrain the tagline width (arbitrary Tailwind value).
                          Prevents the paragraph from stretching across the full width.
                          mt-6 → 24px gap below the logo.
                          leading-relaxed → comfortable line spacing for short copy.
                        */}
                    </div>

                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                    {/*
                      The link columns section.
                      w-full on mobile → takes full width (stacks below logo).
                      md:w-[45%] → takes 45% of the footer on desktop (logo takes ~55%).
                      flex-wrap → columns wrap if they don't fit in one row.
                      justify-between → columns spread evenly across the width.
                      gap-5 → 20px gap between columns.
                    */}

                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-base text-white md:mb-5 mb-2">
                                    {section.title}
                                </h3>
                                {/*
                                  Section title (e.g., "Product", "Company", "Support")
                                  text-white → full white (more visible than text-gray-300 default)
                                  md:mb-5 → 20px below on desktop. mb-2 → 8px on mobile.
                                */}

                                <ul className="text-sm space-y-1">
                                {/*
                                  <ul> = unordered list — semantically correct for navigation links.
                                  Screen readers treat <ul> lists as navigation menus when in <nav>.
                                  space-y-1 = 4px gap between list items.
                                */}

                                    {section.links.map(
                                        (link: { name: string; url: string }, i) => (
                                        /*
                                          Inline TypeScript annotation on the map callback parameter.
                                          TypeScript infers this from footerLinks type, but explicit
                                          annotation makes the shape clear to readers.
                                        */
                                            <li key={i}>
                                                <a
                                                    href={link.url}
                                                    className="hover:text-white transition"
                                                    /*
                                                      <a href> = regular anchor link.
                                                      Using <a> (not <Link>) because these are either:
                                                      - External links (social media URLs)
                                                      - Hash links (#section) for smooth scroll
                                                      - Placeholder links (#) for not-yet-built pages
                                                      
                                                      React Router's <Link> is for CLIENT-SIDE navigation only.
                                                      Use <a> for external URLs, downloads, mailto:, tel:, hash links.
                                                      
                                                      hover:text-white → brightens from gray-300 to white on hover.
                                                      transition → 150ms smooth color transition.
                                                    */
                                                >
                                                    {link.name}
                                                </a>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="py-4 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} {' '} GreatStack . All rights reserved.
                </p>
                {/*
                  Copyright notice.
                  
                  new Date().getFullYear()
                    Gets the current year dynamically: 2026, 2027, etc.
                    NEVER hardcode the copyright year → it becomes stale.
                    Dynamic year is always correct without code changes.
                    
                  {' '} → explicit whitespace between "©" and "GreatStack".
                  JSX collapses whitespace between expressions, so {' '} forces a space.
                  
                  text-gray-400 → lighter than text-gray-300 = least important text on page.
                  py-4 → 16px top and bottom padding inside the footer bar.
                */}
            </div>
        </motion.footer>
    );
};

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ <footer> = semantic HTML — screen readers + SEO understand it
  ✔ motion.footer = animated semantic element (Framer Motion wraps any HTML tag)
  ✔ assets.logo = Vite-processed image with cache-busting hash
  ✔ footerLinks from dummy-data.ts = data separated from UI
  ✔ <a href> not <Link> for external/hash/placeholder links
  ✔ new Date().getFullYear() = dynamic copyright year (never stale)
  ✔ {' '} = explicit whitespace in JSX
  ✔ flex-col md:flex-row = stacked on mobile, side-by-side on desktop
  ✔ border-t = visual separator between page content and footer
*/