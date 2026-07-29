/*
  ============================================================
  FILE: client/src/main.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    This is the JAVASCRIPT ENTRY POINT of the entire React application.
    It is the bridge between the HTML file (index.html) and the React world.
    It takes React and physically mounts it into the browser's DOM.

  WHEN IT EXECUTES:
    Immediately when the browser loads <script src="/src/main.tsx"> from index.html.
    This is the first JavaScript that runs.

  WHO CALLS IT:
    index.html via: <script type="module" src="/src/main.tsx">
    No other file imports from main.tsx — it is a one-way entry point.

  WHAT IT DOES:
    1. Loads global CSS (index.css)
    2. Reads the Clerk publishable key from environment variables
    3. Finds <div id="root"> in the HTML
    4. Wraps the App in ClerkProvider (auth) + BrowserRouter (routing)
    5. Renders the entire application inside <div id="root">

  EXECUTION FLOW:
    index.html → <script src="/src/main.tsx">
                    ↓
               main.tsx runs
                    ↓
         createRoot(document.getElementById('root'))
                    ↓
         render(<ClerkProvider><BrowserRouter><App /></BrowserRouter></ClerkProvider>)
                    ↓
         React fills <div id="root"> with all the UI
  ─────────────────────────────────────────────────────────────
*/

import { createRoot } from 'react-dom/client'
/*
  createRoot — the React 18 API for mounting the application.

  WHY react-dom/client (not react-dom)?
    React is split into two packages:
    1. react          → the core library (state, hooks, component logic)
    2. react-dom      → connects React to the browser DOM (painting pixels)
    3. react-dom/client → React 18's new client-side rendering entry point

    The /client suffix is React 18's Concurrent Mode API.

  WHAT IS CONCURRENT MODE? (React 18)
    React 17 and earlier: updates were synchronous and blocking.
    If React was in the middle of updating 1000 items, nothing else could run.
    React 18 Concurrent Mode: React can PAUSE, INTERRUPT, and PRIORITIZE updates.
    Example: A low-priority background update can be paused to handle
    a high-priority user click immediately.

    createRoot() enables Concurrent Mode. The old ReactDOM.render() does not.

  INTERVIEW Q: What changed in React 18?
  A: React 18 introduced Concurrent Mode via createRoot().
     Key features: Automatic Batching, Transitions (useTransition),
     Suspense improvements, and server-side streaming.
     Automatic batching: multiple setState calls inside a setTimeout or
     fetch callback are now batched into one re-render (was only in event handlers before).
*/

import './index.css'
/*
  Imports the global stylesheet.
  In Vite, CSS files can be imported in JavaScript/TypeScript files.
  Vite's CSS pipeline processes this and injects it as a <style> tag.
  Must be imported early so styles exist before React renders the first component.

  INTERVIEW Q: Can you import CSS in a JS file?
  A: Not natively in the browser — but bundlers (Vite, Webpack) handle this.
     They process CSS imports and inject them into the page.
     It's a build-time feature, not a JavaScript language feature.
*/

import App from './App'
/*
  The root React component. Contains the router and all pages.
  Think of it as the TRUNK of the component tree.
  Everything in the UI descends from App.
*/

import { BrowserRouter } from 'react-router-dom'
/*
  BrowserRouter — enables CLIENT-SIDE ROUTING for the entire application.

  WHAT IS CLIENT-SIDE ROUTING?
    Without routing: navigating to /community makes the browser send a new HTTP request
    to the server and load a completely new HTML page.

    With BrowserRouter: React INTERCEPTS the URL change, updates the address bar,
    and swaps in the matching <Route> component — all WITHOUT a server request.
    This makes navigation feel instant (no page reload, no white flash).

  HOW IT WORKS TECHNICALLY:
    BrowserRouter uses the browser's History API:
      history.pushState(state, title, '/community')
    This changes the URL in the address bar WITHOUT making a network request.
    React Router reads the new URL and renders the matching component.

  INTERVIEW Q: Difference between BrowserRouter and HashRouter?
  A: BrowserRouter → uses real paths: /home, /community, /generate
     HashRouter    → uses hash paths: /#/home, /#/community
     
     BrowserRouter requires the server to return index.html for ALL paths.
     If a user directly visits /community, the server must serve index.html
     (not a 404). Vite handles this automatically in dev.
     
     HashRouter works without server config because /#/ is never sent to the server
     (browsers only send the part before the # in HTTP requests).
     HashRouter is simpler but creates ugly URLs.
*/

import { ClerkProvider } from '@clerk/clerk-react'
/*
  ClerkProvider — sets up the authentication context for the ENTIRE app.

  WHAT IS REACT CONTEXT?
    A mechanism for sharing data across any component in the tree
    WITHOUT manually passing it as props through each level.

    Without Context (Prop Drilling):
      App → Navbar → UserMenu → Avatar    (user prop passed at every level)

    With Context (ClerkProvider):
      Any component can call useUser(), useAuth(), useClerk() directly.
      ClerkProvider makes this data available everywhere in the tree.

  WHAT DOES ClerkProvider DO?
    1. Reads the publishableKey to identify the Clerk application
    2. Checks localStorage/cookies for an existing session on startup
    3. Provides auth state (isSignedIn, user, session) to all child components
    4. Handles session refresh (JWT renewal) transparently in the background

  WHY MUST IT WRAP THE ENTIRE APP?
    Any component that uses Clerk hooks (useUser, useAuth, useClerk) must be
    INSIDE ClerkProvider. If it's outside, the hooks throw an error.
    Wrapping at the root ensures 100% of components can access auth state.

  INTERVIEW Q: What is Prop Drilling and why is Context better for global state?
  A: Prop drilling = passing data through intermediate components that don't need it.
     It creates tight coupling and makes refactoring painful.
     Context provides a "broadcast" mechanism — any descendant can tune in
     without intermediate components needing to know about the data.
     However, Context should only be used for truly global state (auth, theme, language)
     because every consumer re-renders when context changes.
*/

import { dark } from "@clerk/themes"
/*
  Clerk's pre-built dark theme for its UI components (sign-in modal, sign-up modal, UserButton).
  Without this, Clerk's modals would have a white/light background — jarring on dark apps.

  Clerk's appearance system: https://clerk.com/docs/customization/overview
  You can pass variables (colors, font sizes) and elements (individual CSS overrides).
*/

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
/*
  import.meta.env — Vite's API for accessing environment variables.

  WHAT IS AN ENVIRONMENT VARIABLE?
    A configuration value stored OUTSIDE the code, in a .env file.
    Values can differ between environments (dev, staging, production)
    without changing any source code.

  VITE_ PREFIX — THE SECURITY RULE:
    Vite exposes variables to the browser bundle ONLY if they're prefixed with VITE_.
    Variables without VITE_ stay server-side only (process.env on Node.js).
    
    Why this matters:
      VITE_CLERK_PUBLISHABLE_KEY → included in the browser bundle (SAFE — designed to be public)
      DATABASE_URL                → NOT included (would expose your DB credentials!)
      CLERK_SECRET_KEY            → NOT included (would expose backend authentication!)

  WHAT IS THE PUBLISHABLE KEY?
    A public identifier that tells Clerk "this request comes from the UGC AI application".
    It is SAFE to expose in the browser — it's like a store ID, not a password.
    The SECRET KEY (only on the server) is what actually provides admin access.

  NAMING CONVENTION:
    VITE_ + SNAKE_CASE + DESCRIPTIVE_NAME
    Must exactly match what's in client/.env:
      VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

  INTERVIEW Q: Why prefix env vars with VITE_?
  A: Vite only embeds variables with the VITE_ prefix into the browser JavaScript bundle.
     This prevents accidental exposure of secrets (database passwords, API secret keys).
     Any variable without VITE_ stays server-side in Node.js process.env.
*/

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}
/*
  FAIL-FAST VALIDATION.

  WHAT DOES THIS DO?
    Checks if the environment variable was loaded correctly.
    If the .env file is missing or the variable is not set,
    PUBLISHABLE_KEY = undefined (falsy) → throw an Error immediately.

  WHY IS THIS BETTER THAN LETTING IT FAIL LATER?
    Without this check: the app would start, ClerkProvider would receive
    undefined as publishableKey, and somewhere deep inside Clerk's code
    you'd get a confusing error: "Cannot read property 'split' of undefined".
    
    With this check: you get a clear error immediately:
    "Missing Publishable Key" → the developer knows exactly what's wrong.

  CONCEPT — FAIL-FAST PROGRAMMING:
    Detect problems as early as possible and fail loudly.
    Better to crash at startup with a clear message than to fail silently later
    with a cryptic error that's hard to trace.

  INTERVIEW Q: What is the fail-fast principle?
  A: Detect invalid conditions as early as possible and stop execution immediately
     with a clear error. Prevents systems from entering corrupt states and makes
     debugging easier. Examples: input validation, config checks at startup.
*/

createRoot(document.getElementById('root')! as HTMLElement).render(
/*
  BREAKING THIS DOWN:

  document.getElementById('root')
    → Finds the <div id="root"> element in index.html
    → Returns: HTMLElement | null (TypeScript type)

  ! (non-null assertion operator)
    → Tells TypeScript: "I know this won't be null — trust me"
    → Without !: TypeScript error "Argument of type 'HTMLElement | null' is not
      assignable to parameter of type 'Element'"
    → We are confident it won't be null because index.html always has it

  as HTMLElement
    → Type assertion: narrows from Element to HTMLElement
    → createRoot() expects HTMLElement (not just Element)
    → This is a TypeScript-only operation; it disappears at runtime

  createRoot(element)
    → Creates a React root attached to that DOM node
    → Returns a root object with .render() method

  .render(jsx)
    → Renders the provided JSX into the root DOM node
    → React takes over everything inside <div id="root">

  INTERVIEW Q: What is the ! operator in TypeScript?
  A: Non-null assertion operator. It tells TypeScript the value is definitely
     not null or undefined. It's a compile-time-only hint — no runtime effect.
     Use it when you are certain the value exists but TypeScript can't infer it.
     Overusing ! defeats TypeScript's purpose — prefer proper null checks.
*/

    <ClerkProvider
        appearance={{
            theme: dark,
            /*
              Clerk's modals (sign-in, sign-up, user profile) use dark styling.
              Matches the app's dark theme (bg-gray-950) so there's no jarring
              white popup on a dark page.
            */
            variables: {
                colorPrimary: '#4f39f6',
                /*
                  The primary accent color used in Clerk's UI:
                  • Sign-in button background
                  • Active state indicators
                  • Loading spinners
                  Must match the app's brand purple (#4f39f6 = deep violet).
                */
                colorTextOnPrimaryBackground: "#ffffff"
                /*
                  Text color on top of colorPrimary backgrounds.
                  White text on purple button = high contrast = readable.
                */
            }
        }}
        publishableKey={PUBLISHABLE_KEY}
        /*
          Identifies this Clerk application.
          Clerk uses this to: 
          • Know which app's session to create
          • Load the correct Clerk configuration (social providers, password rules)
          • Generate JWTs signed for this specific app
        */
    >
        <BrowserRouter>
        {/*
          ORDER MATTERS:
          ClerkProvider is OUTSIDE BrowserRouter.
          This is the correct nesting order.

          WHY CLERK OUTSIDE ROUTER?
          Clerk's state (session, user) should not depend on routing.
          Auth persists across ALL routes. Router needs to be inside Clerk
          so any component can be both routed AND auth-aware.

          WRONG ORDER (causes bugs):
          <BrowserRouter>
            <ClerkProvider> ← can't use useNavigate in ClerkProvider callbacks
              <App />
            </ClerkProvider>
          </BrowserRouter>

          CORRECT ORDER (this file):
          <ClerkProvider>    ← auth context outermost
            <BrowserRouter>  ← routing inside auth
              <App />
            </BrowserRouter>
          </ClerkProvider>
        */}
            <App />
            {/*
              The root component. Contains:
              • Navbar (visible on all pages)
              • <Routes> (one page at a time based on URL)
              • Footer (visible on all pages)
              • Toaster (notification container)
              • SoftBackdrop (decorative background)
              • LenisScroll (smooth scroll initializer)
            */}
        </BrowserRouter>
    </ClerkProvider>
)

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: React's Component Tree
  ──────────────────────────────────
    The final rendered component tree:

    createRoot
      └── ClerkProvider (auth context)
            └── BrowserRouter (routing context)
                  └── App
                        ├── Toaster (notifications)
                        ├── SoftBackdrop (visual)
                        ├── LenisScroll (side effect only)
                        ├── Navbar (fixed header)
                        ├── Routes
                        │     ├── Route "/" → <Home />
                        │     ├── Route "/generate" → <Generator />
                        │     ├── Route "/result/:projectId" → <Result />
                        │     └── ...
                        └── Footer

    RULE: A component can only use hooks/context from providers that WRAP it.
    useUser() works anywhere because ClerkProvider wraps everything.
    useNavigate() works anywhere because BrowserRouter wraps everything.

  CONCEPT: JSX
  ─────────────
    JSX is a syntax extension that lets you write HTML-like code in JavaScript.
    It is NOT HTML. It is syntactic sugar that Babel/TypeScript transforms:

    JSX:      <ClerkProvider key="pk_..."><App /></ClerkProvider>
    Becomes:  React.createElement(ClerkProvider, { key: "pk_..." }, React.createElement(App))

    JSX rules:
    • Elements must be closed: <input /> not <input>
    • className not class (class is a reserved JS word)
    • htmlFor not for (for is a reserved JS word)
    • JavaScript expressions in {}: <p>{user.name}</p>

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ main.tsx = the JavaScript entry point (loaded by index.html)
  ✔ createRoot() = React 18's mounting API (enables Concurrent Mode)
  ✔ document.getElementById('root') = finds the empty div in index.html
  ✔ ClerkProvider = auth context (wraps entire app)
  ✔ BrowserRouter = routing context (must wrap App)
  ✔ Order: ClerkProvider OUTSIDE BrowserRouter OUTSIDE App
  ✔ VITE_ prefix = safe to expose in browser bundle
  ✔ ! = TypeScript non-null assertion (compile-time only)
  ✔ as HTMLElement = TypeScript type cast (not a runtime check)
  ✔ fail-fast: throw if PUBLISHABLE_KEY is missing

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ React never mounts → blank white page
  ✘ No error in console — just an empty div
  ✘ index.html loads but <div id="root"> stays empty forever
*/