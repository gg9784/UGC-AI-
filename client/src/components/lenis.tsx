/*
  ============================================================
  FILE: client/src/components/lenis.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Initializes Lenis — a smooth scroll library that replaces the
    browser's default abrupt scrolling with a physics-based,
    silky-smooth scrolling experience.

  WHEN IT EXECUTES:
    Rendered by App.tsx. The component itself renders NOTHING (returns null).
    The actual work happens inside useEffect — a side effect that runs
    once after the component mounts.

  WHO CALLS IT:
    App.tsx: <LenisScroll />

  WHAT IT EXPORTS:
    Default export: function LenisScroll()

  WHAT IT OUTPUTS:
    Returns null → zero DOM output.
    This is a "headless component" — exists purely to run side effects.

  CONCEPT — SIDE EFFECTS IN REACT:
    A side effect is anything that interacts with the outside world:
    • DOM manipulation
    • Third-party libraries (Lenis)
    • Timers / intervals
    • Network requests
    • Event listeners
    React's rules: side effects go in useEffect, not in the render body.
    Why? The render function should be PURE (no side effects).
    useEffect is React's designated place for impure operations.
  ─────────────────────────────────────────────────────────────
*/

'use client';
/*
  This directive is from NEXT.JS (not relevant to Vite projects).
  In Next.js App Router, components are Server Components by default.
  'use client' marks a component as a Client Component (runs in the browser).
  
  WHY IS IT HERE?
    This file was likely scaffolded from Next.js documentation.
    In this Vite project, 'use client' is a NO-OP — it does nothing.
    Harmless — TypeScript treats it as a string literal expression statement.
    
  INTERVIEW NOTE:
    "I notice 'use client' is here from Next.js conventions.
     In this Vite app it has no effect, but I know it's important
     in Next.js for marking components that use browser APIs."
    
    This shows awareness of framework differences — interviewers notice this.
*/

import { useEffect } from 'react';
/*
  useEffect — React's hook for running side effects.

  SIGNATURE:
    useEffect(setup, dependencies?)

  setup = the function to run after the component renders.
  dependencies = when to re-run the effect:
    []            → run once after initial mount (componentDidMount equivalent)
    [a, b]        → run whenever a or b changes
    (no array)    → run after EVERY render

  USED HERE with []:
    → Run once after LenisScroll mounts
    → Initialize Lenis, start the animation loop
    → Return cleanup: destroy Lenis when component unmounts

  CONCEPT — React Hook Rules:
    1. Call hooks only at the TOP LEVEL of a component (not inside loops/conditions)
    2. Call hooks only in React FUNCTION COMPONENTS (not in class components or regular functions)
    3. Hooks starting with "use" are React hooks (useEffect, useState, useRef, etc.)
    
    INTERVIEW Q: What is a React Hook?
    A: A function that lets you "hook into" React features from function components.
       useState adds local state. useEffect runs side effects.
       They replaced class component lifecycle methods (componentDidMount,
       componentDidUpdate, componentWillUnmount).
*/

import Lenis from 'lenis';
/*
  lenis = a lightweight JavaScript smooth scroll library.

  WHAT PROBLEM DOES IT SOLVE?
    Default browser scroll: user moves the mouse wheel → page JUMPS instantly.
    Lenis intercepts the scroll event and uses animation (easing) to glide
    the page smoothly to the new scroll position.

  HOW IT WORKS:
    1. Lenis listens for scroll input (mouse wheel, touch, keyboard)
    2. Instead of letting the browser scroll natively, Lenis calculates
       the target scroll position
    3. On every animation frame (60fps), Lenis moves the page a tiny bit
       closer to the target, with easing applied
    4. The result: scrolling that feels like it has physical momentum

  INTERVIEW Q: How does Lenis differ from CSS scroll-behavior: smooth?
  A: CSS scroll-behavior: smooth only applies to ANCHOR LINK navigation (#section).
     Lenis applies smooth easing to ALL scrolling — mouse wheel, touch, keyboard.
     Lenis also has configurable physics (duration, easing function) and integrates
     with scroll-triggered animation libraries like GSAP ScrollTrigger.
*/

export default function LenisScroll() {
    useEffect(() => {
    /*
      Empty dependency array [] → run ONCE after the component mounts.
      This is equivalent to componentDidMount in class components.
      Lenis should only be initialized once — not on every render.
    */

        const lenis = new Lenis({
            duration: 1.2,
            /*
              How long (in seconds) the scroll animation takes to complete.
              1.2 seconds = a premium, unhurried feel.
              
              Too short (< 0.5s) → feels almost like native abrupt scrolling.
              Too long (> 2s)    → feels sluggish and unresponsive.
              1.2s = the sweet spot for most SaaS landing pages.
            */

            smoothWheel: true,
            /*
              Enable smooth scrolling for mouse wheel events.
              Without this, mouse wheel scroll would be native (abrupt).
              Touch scroll on mobile is handled separately (smoothTouch option).
            */

            anchors: {
                offset: -100,
                /*
                  When clicking an anchor link (e.g., <a href="#features">),
                  Lenis scrolls to that section. Without offset, the section
                  header lands exactly at the top of the viewport — BEHIND the fixed Navbar.
                  
                  offset: -100 means: stop scrolling 100px BEFORE the section top.
                  Result: the section header appears 100px below the viewport top,
                  safely below the fixed Navbar (~80px tall).
                  
                  COMMON BUG WITHOUT OFFSET:
                  User clicks "Features" in navbar → browser scrolls to #features
                  → the Features heading is hidden behind the 80px fixed Navbar.
                  → offset: -100 prevents this.
                */
            },
        });
        /*
          Lenis takes over scroll behavior for the entire page.
          It intercepts wheel events on window and manages scrolling itself.
        */

        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };
        /*
          raf = "Request Animation Frame" callback function.

          WHAT IS requestAnimationFrame (rAF)?
            A browser API that schedules a function to run just before the
            browser's next visual repaint (usually 60 times per second = 60fps).
            
            Browser repaint cycle:
            [JavaScript] → [Style] → [Layout] → [Paint] → [Composite]
            requestAnimationFrame runs at the start of each repaint cycle.

          lenis.raf(time)
            Lenis needs to be called every animation frame with the current timestamp.
            `time` = DOMHighResTimeStamp (milliseconds since page load).
            Lenis uses this to calculate how far to scroll on this frame
            based on its easing function and the elapsed time.

          requestAnimationFrame(raf)
            Schedules `raf` to run again on the NEXT animation frame.
            This creates a recursive loop: raf → rAF(raf) → raf → rAF(raf) → ...
            Running at ~60fps (or the monitor's refresh rate: 90fps, 120fps, etc.)
            
            INTERVIEW Q: Why use rAF instead of setInterval for animations?
            A: requestAnimationFrame:
               1. Syncs with the display's refresh rate (60fps, 120fps)
               2. Pauses automatically when the tab is hidden (saves CPU/battery)
               3. Provides a high-precision timestamp
               setInterval doesn't sync with display repaints → causes jank (stuttering).
               setInterval keeps running when the tab is hidden → wastes resources.

          parameter: time: number
            TypeScript type annotation on the rAF callback's timestamp parameter.
            DOMHighResTimeStamp = a floating-point milliseconds value.
            (e.g., 12345.678 = 12.345 seconds since page load)
        */

        requestAnimationFrame(raf);
        /*
          STARTS the animation loop.
          The first rAF call kicks everything off.
          After that, raf calls itself recursively via requestAnimationFrame.
          
          WHY OUTSIDE THE raf FUNCTION?
          The initial requestAnimationFrame call bootstraps the loop.
          Once raf runs, it schedules itself → infinite loop.
        */

        return () => {
            lenis.destroy();
        };
        /*
          CLEANUP FUNCTION — returned from useEffect.
          
          WHEN DOES THIS RUN?
          React calls the cleanup function:
          1. Before the component UNMOUNTS (component removed from DOM)
          2. Before the effect re-runs (when dependencies change)
          
          Since dependencies are [] (run once), cleanup runs only on unmount.
          
          lenis.destroy()
          Destroys the Lenis instance:
          1. Removes all event listeners Lenis attached to the window
          2. Cancels any pending animation frames
          3. Restores native scroll behavior
          
          WHY IS CLEANUP CRITICAL?
          Without lenis.destroy():
          - MEMORY LEAK: Lenis keeps running even after the component is gone
          - During React development (Hot Module Replacement):
            The module reloads → LenisScroll remounts → useEffect runs again
            → SECOND Lenis instance created → TWO Lenis instances fighting
            → scroll behaves erratically (scrolls twice as fast, or not at all)
          - The rAF loop keeps calling requestAnimationFrame indefinitely
            → CPU usage never decreases even with no active scrolling
          
          INTERVIEW Q: Why is useEffect cleanup important?
          A: Any resource initialized in useEffect (timers, subscriptions, libraries,
             event listeners) must be cleaned up to prevent memory leaks.
             Without cleanup, the resource outlives the component and consumes
             memory/CPU forever. React also warns about missing cleanup for certain patterns.
             In dev mode, React runs effects twice (StrictMode) to verify cleanup works.
        */

    }, []); // Empty array → run once on mount, cleanup on unmount

    return null;
    /*
      This component renders NOTHING to the DOM.
      null is a valid return value for React components.
      React simply skips rendering for null.
      
      WHY A COMPONENT INSTEAD OF CALLING LENIS IN App.tsx DIRECTLY?
      React's hook rules: you can't call useEffect at the module level.
      Hooks must be inside function components.
      By wrapping Lenis in a component, we can:
      1. Use useEffect (hooks work here)
      2. Let React manage the lifecycle (mount → effect → cleanup on unmount)
      3. Keep App.tsx clean — Lenis is encapsulated in its own file
    */
}

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: useEffect Lifecycle
  ──────────────────────────────
    useEffect(() => {
      // SETUP: runs after mount (or when deps change)
      const thing = initialize()
      
      return () => {
        // CLEANUP: runs before unmount (or before re-running)
        thing.destroy()
      }
    }, [deps])

    Mapping to class lifecycle methods:
    componentDidMount     = useEffect with [] + setup
    componentWillUnmount  = useEffect with [] + cleanup function
    componentDidUpdate    = useEffect with [dep1, dep2] + setup

  CONCEPT: requestAnimationFrame Loop Pattern
  ─────────────────────────────────────────────
    const animate = (timestamp) => {
      // update animation based on timestamp
      requestAnimationFrame(animate)  // schedule next frame
    }
    requestAnimationFrame(animate)    // start the loop
    
    This is the standard pattern for ALL JavaScript animations.
    Used by: Lenis, GSAP, Three.js, Canvas2D games, WebGL renderers.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ LenisScroll returns null — renders nothing to DOM
  ✔ useEffect([]) = run once on mount, cleanup on unmount
  ✔ requestAnimationFrame = 60fps loop (syncs with display refresh)
  ✔ lenis.raf(time) = called every frame to advance the scroll animation
  ✔ return () => lenis.destroy() = CRITICAL cleanup to prevent memory leaks
  ✔ 'use client' = Next.js directive — no effect in Vite (harmless)
  ✔ duration: 1.2 = scroll animation completes in 1.2 seconds
  ✔ anchors.offset: -100 = scroll stops 100px before target (clears fixed navbar)

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Scrolling becomes abrupt again (native browser scroll behavior)
  ✘ No functional breakage — the app works, just feels cheaper
  ✘ Anchor link navigation may hide section headings behind the navbar
*/