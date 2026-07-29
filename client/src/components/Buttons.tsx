/*
  ============================================================
  FILE: client/src/components/Buttons.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Provides two REUSABLE, styled button components used throughout the app.
    Centralizing button styles ensures design consistency — one change here
    updates every button across all pages.

  WHEN IT EXECUTES:
    When any component imports PrimaryButton or GhostButton.

  WHO CALLS IT:
    Navbar.tsx, Hero.tsx, Genetator.tsx, Result.tsx, CTA.tsx, ProjectCard.tsx

  WHAT IT EXPORTS:
    Named exports: PrimaryButton, GhostButton

  DESIGN SYSTEM PHILOSOPHY:
    Design systems define a set of pre-built components so developers
    don't make inconsistent style decisions (different font sizes, random border radii).
    PrimaryButton = high-emphasis actions (Generate, Get Started, Publish)
    GhostButton   = low-emphasis actions (Credits count, View Details, Sign In)
  ─────────────────────────────────────────────────────────────
*/

import React from 'react'
/*
  In React 17+, the JSX transform no longer requires React to be in scope.
  But we import React here to use its TypeScript types:
    React.FC<...>                    → typed function component
    React.ButtonHTMLAttributes<...>  → all HTML button attributes as types

  INTERVIEW Q: Why did you need to import React in older versions?
  A: JSX (like <button>) compiles to React.createElement('button', ...).
     Before React 17, React had to be in scope for this to work.
     React 17+ introduced the "new JSX transform" which auto-imports what's needed.
     Now you only import React when you explicitly use its APIs.
*/

/**
 * PrimaryButton
 *
 * A fully styled, reusable primary call-to-action button.
 *
 * Design Details:
 * - `inline-flex` + `items-center` + `justify-center` + `gap-2`:
 *     Lays out children (text, icons, etc.) in a horizontal flex row,
 *     centered both horizontally and vertically with a small gap between items.
 * - `rounded-full`: Makes the button pill-shaped (fully rounded corners).
 * - `px-5 py-2`: Horizontal padding of 1.25rem and vertical padding of 0.5rem.
 * - `text-sm font-medium`: Small text size with medium font weight.
 * - `bg-linear-to-br from-indigo-500 to-indigo-600`:
 *     Applies a diagonal (bottom-right) linear gradient from indigo-500 to indigo-600,
 *     giving the button a rich indigo gradient background.
 * - `hover:opacity-90`: Slightly fades the button on hover for a subtle interactive feel.
 * - `active:scale-95`: Scales the button down to 95% on click, simulating a press effect.
 * - `transition-all`: Smoothly animates all CSS property changes (opacity, scale, etc.).
 *
 * Props:
 * - Accepts all standard HTML <button> attributes via `React.ButtonHTMLAttributes<HTMLButtonElement>`.
 * - `children`: Content rendered inside the button (text, icons, etc.).
 * - `className`: Optional extra Tailwind/CSS classes to extend or override default styles.
 * - `...props`: All other native button props (onClick, disabled, type, aria-*, etc.) are forwarded.
 */
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
/*
  React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>
  ─────────────────────────────────────────────────────────
  Let's break this down piece by piece:

  React.FC
    FC = FunctionComponent. A TypeScript generic type for React function components.
    It provides: correct return type (ReactNode), children prop, and component metadata.
    
    Using React.FC<Props> is optional — you can also write:
    const PrimaryButton = ({ children, className, ...props }: Props) => (...)
    Both approaches are valid.

  React.ButtonHTMLAttributes<HTMLButtonElement>
    This is the MAGIC that makes the button component behave like a real <button>.
    
    React.ButtonHTMLAttributes = ALL the attributes a <button> can accept in React:
      onClick, onMouseEnter, onFocus, onBlur,
      disabled, form, formAction, name, value, type,
      aria-label, aria-expanded, data-*, tabIndex,
      and ALL other HTML/WAI-ARIA button attributes.
    
    <HTMLButtonElement> = the generic parameter — specifies WHICH HTML element's
    attributes to include. Different elements have different valid attributes
    (HTMLInputElement has `value`, HTMLSelectElement has `multiple`, etc.).
    
    WHY IS THIS POWERFUL?
    Without this: you'd need to manually declare each prop:
      interface Props {
        onClick?: () => void
        disabled?: boolean
        type?: 'button' | 'submit' | 'reset'
        // ...50 more props
      }
    
    With ButtonHTMLAttributes: ALL of those are automatically included.
    TypeScript validates them: type="invalid" → error.
    And you get autocomplete for ALL button attributes.

  ({ children, className, ...props })
    Destructuring the props object:
    
    children → the content between opening and closing tags:
      <PrimaryButton>Generate Image</PrimaryButton>
      children = "Generate Image"
      
      <PrimaryButton><SpinnerIcon /> Loading</PrimaryButton>
      children = [<SpinnerIcon />, " Loading"]
    
    className → extra CSS classes from the parent:
      <PrimaryButton className="w-full py-4">Submit</PrimaryButton>
      className = "w-full py-4" (will be merged into the button's classes)
    
    ...props → THE REST SPREAD OPERATOR:
      Collects ALL remaining properties into a new object called `props`.
      If parent passes: onClick={handler} disabled={isLoading} type="submit"
      ...props = { onClick: handler, disabled: isLoading, type: "submit" }
      
      These are spread onto the button: {...props}
      This forwards them to the native <button> element.
      
      INTERVIEW Q: What does ...props (rest/spread) do?
      A: The rest operator (...props) in destructuring collects remaining properties.
         The spread operator ({...props}) in JSX spreads an object as individual props.
         Together: they transparently forward any extra props to the underlying element.
         This is a common React pattern for wrapper components.
*/
    <button
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-linear-to-br from-indigo-500 to-indigo-600 hover:opacity-90 active:scale-95 transition-all ${className}`}
        /*
          Template literal merging:
          `fixedClasses ${className}` = the button always has the base classes,
          PLUS whatever extra classes the parent passes.

          Example usage:
          <PrimaryButton className="w-full">Submit</PrimaryButton>
          → className = "inline-flex ... transition-all w-full"
          → The button is full-width (extra class merged in)

          WHAT EACH CLASS DOES:
          inline-flex      → flex container but inline (doesn't take full line width)
          items-center     → vertically center children (icon + text aligned)
          justify-center   → horizontally center children within the button
          gap-2            → 8px gap between children (icon and text)
          rounded-full     → border-radius: 9999px → perfect pill shape
          px-5 py-2        → horizontal: 20px, vertical: 8px
          text-sm          → font-size: 0.875rem (14px)
          font-medium      → font-weight: 500
          bg-linear-to-br  → gradient direction: top-left → bottom-right
          from-indigo-500  → gradient start: #6366f1
          to-indigo-600    → gradient end: #4f46e5 (slightly darker)
          hover:opacity-90 → 90% opacity on hover = subtle dimming effect
          active:scale-95  → scale to 95% when clicked = physical press feel
          transition-all   → animate ALL changing CSS properties smoothly
        */
        {...props}
        /*
          Spread all remaining props onto the <button>.
          This makes these work:
          <PrimaryButton onClick={handler}>     → button gets the click handler
          <PrimaryButton disabled={true}>       → button becomes disabled
          <PrimaryButton type="submit">         → button submits forms
          <PrimaryButton aria-label="...">      → accessibility attribute
          All forwarded automatically without explicit prop declarations.
        */
    >
        {children}
        {/*
          children = whatever is inside the opening and closing tags.
          React renders it where {children} appears.

          Examples:
          <PrimaryButton>Generate</PrimaryButton>
          → children = "Generate"

          <PrimaryButton>
            <Wand2Icon className="size-5" /> Generate Image
          </PrimaryButton>
          → children = [<Wand2Icon>, " Generate Image"]
          → Both render inside the button, separated by the gap-2 spacing
        */}
    </button>
);

/**
 * GhostButton
 *
 * A subtle, transparent "ghost" variant button — ideal for secondary actions
 * or UI elements that shouldn't compete visually with the primary CTA.
 *
 * Design Details:
 * - `inline-flex` + `items-center` + `gap-2`:
 *     Lays out children in a horizontal flex row, vertically centered with a gap.
 *     Note: Unlike PrimaryButton, this does NOT use `justify-center`, so content
 *     aligns to the start (left) by default.
 * - `rounded-full`: Pill-shaped button to match the PrimaryButton style.
 * - `px-4 py-2`: Slightly less horizontal padding than PrimaryButton (1rem vs 1.25rem).
 * - `text-sm font-medium`: Consistent typography with PrimaryButton.
 * - `border border-white/10`:
 *     A very subtle white border at 10% opacity, giving the button a defined edge
 *     without being visually heavy — great for dark/glassmorphism UIs.
 * - `bg-white/3`:
 *     An extremely faint white background (3% opacity), making the button almost
 *     transparent while still being distinguishable from the page background.
 * - `hover:bg-white/6`:
 *     On hover, the background brightens slightly (6% white opacity) to give
 *     clear visual feedback without being jarring.
 * - `backdrop-blur-sm`:
 *     Applies a small blur to whatever is behind the button, reinforcing the
 *     glassmorphism / frosted-glass aesthetic.
 * - `active:scale-95`: Same press-down scale effect as PrimaryButton for consistency.
 * - `transition`: Smoothly animates background-color, opacity, and transform changes.
 *
 * Props:
 * - Accepts all standard HTML <button> attributes via `React.ButtonHTMLAttributes<HTMLButtonElement>`.
 * - `children`: Content rendered inside the button (text, icons, etc.).
 * - `className`: Optional extra Tailwind/CSS classes to extend or override default styles.
 * - `...props`: All other native button props (onClick, disabled, type, aria-*, etc.) are forwarded.
 */
export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
    <button
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/10 bg-white/3 hover:bg-white/6 backdrop-blur-sm active:scale-95 transition ${className}`}
        /*
          DIFFERENCES FROM PrimaryButton:
          ✗ No justify-center → content aligns LEFT (for icon + text combos)
          ✗ No gradient background → almost transparent
          ✗ No hover:opacity change → hover changes background color instead
          
          border-white/10    → border color: rgba(255,255,255,0.10) = barely visible
          bg-white/3         → background: rgba(255,255,255,0.03) = nearly transparent
          hover:bg-white/6   → hover: rgba(255,255,255,0.06) = doubles the visibility
          backdrop-blur-sm   → CSS: backdrop-filter: blur(4px) = slight glass effect

          GLASSMORPHISM:
          bg-white/3 (transparent) + backdrop-blur-sm (blurs background) +
          border-white/10 (subtle edge) = the frosted glass look.
          This style is used for less important UI elements that shouldn't
          compete with the primary gradient button for attention.

          USAGE IN THIS PROJECT:
          - Navbar: Credits display (GhostButton → navigate to /plans)
          - ProjectCard: "View Details" button
          - Result.tsx: "New Generation" link

          VISUAL HIERARCHY:
          PrimaryButton (solid gradient)  → highest importance (Generate, Submit)
          GhostButton (transparent glass) → secondary importance (View, Credits)
        */
        {...props}
    >
        {children}
    </button>
);

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Reusable Components
  ──────────────────────────────
    A reusable component is one that can be used in multiple contexts
    with different content/behavior via props.

    PrimaryButton is used with different content:
      <PrimaryButton>Generate Image</PrimaryButton>
      <PrimaryButton>Get Started</PrimaryButton>
      <PrimaryButton>Publish</PrimaryButton>
      <PrimaryButton disabled={true}><Spinner /> Loading</PrimaryButton>

    The SAME component renders consistently everywhere.
    One design change = one file change = all buttons update.

    INTERVIEW Q: What makes a component "reusable"?
    A: 1. Receives configuration via props (not hardcoded values)
       2. Forwards native attributes (...props spread)
       3. Allows content customization via children
       4. Doesn't have hard dependencies on global state

  CONCEPT: HTML Button Types
  ───────────────────────────
    type="button"  → default. Does nothing by itself on click.
    type="submit"  → submits the closest parent <form>
    type="reset"   → resets all form inputs to their default values
    
    IMPORTANT: If you put a <PrimaryButton> inside a <form> without type="button",
    the browser defaults to type="submit" and submits the form on click!
    In Genetator.tsx, the form already handles this, but in other forms,
    always specify type="button" on buttons that shouldn't submit the form.

  CONCEPT: Visual Hierarchy in UI Design
  ────────────────────────────────────────
    Every UI should have clear visual hierarchy telling users what to do first:
    
    Primary action:   Solid, bright, high-contrast (PrimaryButton — gradient)
    Secondary action: Subtle, transparent, lower contrast (GhostButton — glass)
    Tertiary action:  Text links, very low emphasis
    
    Example from this app:
    Result page: "Generate Video" (Primary) + "Download" (Ghost)
    ProjectCard: "Publish" (Primary) + "View Details" (Ghost)

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ React.FC<Props> = typed function component
  ✔ ButtonHTMLAttributes<HTMLButtonElement> = ALL native button props (auto)
  ✔ children = content between opening and closing tags
  ✔ className = additional classes from parent (merged with template literal)
  ✔ ...props = rest operator collecting remaining props
  ✔ {...props} = spread operator forwarding them to native <button>
  ✔ PrimaryButton = gradient, for high-emphasis primary actions
  ✔ GhostButton = glass/transparent, for secondary actions
  ✔ active:scale-95 = 95% scale on click = physical press feedback
  ✔ Both exported as named exports (not default)

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Import errors in all components that use PrimaryButton or GhostButton
  ✘ Every button across the app would need to be restyled individually
  ✘ No runtime error if you replace with native <button> elements
*/