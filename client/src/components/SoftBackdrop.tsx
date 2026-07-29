/*
  ============================================================
  FILE: client/src/components/SoftBackdrop.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Creates a decorative visual background — two large, blurred gradient
    blobs that give the dark UI a sense of depth and atmosphere.
    This is purely cosmetic (no logic, no state, no props).
    It creates the "ambient glow" look common in premium dark-themed UIs.

  WHEN IT EXECUTES:
    Rendered once by App.tsx and stays mounted forever.
    No re-renders — it has no state or props.

  WHO CALLS IT:
    App.tsx: <SoftBackdrop />

  WHAT IT EXPORTS:
    Default export: function SoftBackdrop()

  REAL LIFE ANALOGY:
    Like the blurred neon lights you see behind a frosted glass window.
    The content (Navbar, cards) is the glass. SoftBackdrop is what's glowing behind it.
  ─────────────────────────────────────────────────────────────
*/

export default function SoftBackdrop() {
    return (
        <div className="fixed inset-0 -z-1 pointer-events-none">
        {/*
          CONTAINER: covers the entire viewport, stays fixed during scroll.

          fixed
            CSS: position: fixed
            The element is positioned relative to the VIEWPORT (the browser window),
            not to any parent element.
            It stays in place even when the user scrolls — it's always in the background.
            Compare with:
              position: absolute → positioned relative to nearest positioned ancestor
              position: sticky → sticks to a position during scroll within its parent

          inset-0
            Shorthand for: top: 0; right: 0; bottom: 0; left: 0;
            Combined with `fixed`, this makes the element cover the ENTIRE screen.
            Equivalent to: width: 100vw; height: 100vh; top: 0; left: 0;

          -z-1 (z-index: -1)
            Z-index controls stacking order (which element is in front).
            Positive z-index → in front of normal content.
            Negative z-index → BEHIND normal content.
            -z-1 ensures both blobs render behind everything else on the page.
            
            Z-INDEX STACKING CONTEXT:
            Any element with position + z-index creates a stacking context.
            Its children's z-indices are scoped within that context.
            The Navbar (z-50) is far above this (-z-1).

          pointer-events-none
            CSS: pointer-events: none
            Makes the element completely transparent to mouse events.
            Clicks, hovers, and drags pass THROUGH this element to whatever is behind it.
            
            WHY IS THIS CRITICAL?
            Without pointer-events-none, the fixed div would intercept ALL user clicks
            (because it covers the entire screen). Buttons, links, and inputs would stop working.
            With pointer-events-none, users click through the backdrop as if it doesn't exist.

          INTERVIEW Q: What is z-index and how does it work?
          A: z-index sets the stacking order of positioned elements (position not static).
             Higher values appear on top. Negative values appear behind.
             z-index ONLY works on positioned elements (relative, absolute, fixed, sticky).
             CSS Stacking Context: certain properties (transform, opacity, will-change)
             create a new stacking context, limiting how z-index interacts with parent/siblings.
        */}

            <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[980px] h-[460px] bg-linear-to-tr from-violet-800/40 to-transparent rounded-full blur-3xl" />
            {/*
              BLOB 1: Large violet glow at the top center.

              absolute
                Positioned relative to the nearest positioned ancestor.
                The parent is `fixed` → this div is positioned relative to the fixed container.
                Combined with left-1/2 + -translate-x-1/2 → horizontally centered.

              left-1/2 + -translate-x-1/2 → CENTERING TRICK:
                left: 50% → moves the LEFT EDGE of the element to the center.
                But we want the CENTER of the element at center.
                -translate-x-1/2 → move left by 50% of the element's OWN width.
                Result: the element's center aligns with the viewport's center.
                This technique works for any element size without knowing its exact width.

                INTERVIEW Q: How do you center an element horizontally with CSS transforms?
                A: left: 50% + translateX(-50%). left moves the start edge to 50%.
                   translateX(-50%) pulls it back by half its own width.
                   Combined: center of element = center of parent. Works for any width.

              top-20
                80px from the top of the fixed container (= 80px from the top of the screen).
                Positioned below where the navbar sits.

              w-[980px] h-[460px]
                Arbitrary values in Tailwind (not from the spacing scale).
                [980px] and [460px] use Tailwind's JIT (just-in-time) arbitrary value syntax.
                Brackets [] allow any valid CSS value: w-[100px], w-[50%], w-[calc(100%-2rem)]

              bg-linear-to-tr
                CSS: background: linear-gradient(to top right, ...)
                Direction: bottom-left → top-right (diagonal gradient).

              from-violet-800/40
                Start color: Tailwind's violet-800 (#5b21b6) at 40% opacity.
                The /40 is Tailwind's opacity modifier for background colors.
                Equivalent to: rgba(91, 33, 182, 0.4)

              to-transparent
                End color: completely transparent.
                The gradient fades from violet to nothing.
                This creates a soft, natural glow that doesn't have a hard edge.

              rounded-full
                border-radius: 9999px → makes the element a perfect circle/oval.
                Without this, the gradient would have sharp rectangular corners.

              blur-3xl
                CSS: filter: blur(64px)
                The most extreme Tailwind blur (blur-3xl = 64px radius).
                Spreads the color across a large area, creating a soft glow.
                The combination of: large blob + rounded-full + blur-3xl
                = the glassmorphism "ambient light" effect.

              INTERVIEW Q: How is the glow effect achieved?
              A: A large colored div (rounded oval) with a gradient from the brand color
                 to transparent, then heavily blurred (64px). The blur spreads the color
                 far beyond the element's boundaries. Combined with the transparent
                 background, it looks like light glowing in the darkness.
            */}

            <div className="absolute right-12 bottom-10 w-[420px] h-[220px] bg-linear-to-bl from-fuchsia-700/40 to-transparent rounded-full blur-2xl" />
            {/*
              BLOB 2: Smaller fuchsia/pink glow at the bottom right.

              right-12 bottom-10
                Positioned 48px from the right edge and 40px from the bottom.
                Placed at the opposite corner from blob 1 → creates visual balance.

              w-[420px] h-[220px]
                Smaller than blob 1 (980px vs 420px).
                Creates hierarchy: dominant violet at top, accent fuchsia at bottom.

              bg-linear-to-bl
                Gradient direction: top-right → bottom-left.

              from-fuchsia-700/40
                Fuchsia = a pink-purple between pink and violet.
                40% opacity — same transparency as blob 1 for consistency.

              blur-2xl
                CSS: filter: blur(40px) — slightly less than blob 1's blur-3xl (64px).
                Smaller blob, less blur = more concentrated glow.

              TWO BLOBS DESIGN DECISION:
                One blob = flat, centered, boring.
                Two blobs at opposite corners = depth, tension, visual interest.
                Different colors (violet + fuchsia) = color harmony (analogous palette).
                Different sizes = hierarchy.
                This technique is used by Stripe, Linear, Vercel, and other premium SaaS UIs.
            */}
        </div>
    )
}

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ SoftBackdrop = decorative background only — no logic, no state, no props
  ✔ fixed inset-0 = covers full screen, doesn't scroll with content
  ✔ -z-1 = renders BEHIND all content
  ✔ pointer-events-none = clicks pass through (CRITICAL for usability)
  ✔ left-1/2 + -translate-x-1/2 = centering trick for any element size
  ✔ rounded-full + blur-3xl = glassmorphism glow effect
  ✔ from-violet-800/40 to-transparent = gradient from color to nothing
  ✔ Two blobs: balance between top-center and bottom-right

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ App looks flat and boring (purely visual — no functional impact)
  ✘ No errors — this component has zero dependencies
*/