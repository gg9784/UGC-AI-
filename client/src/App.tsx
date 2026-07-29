/*
  ============================================================
  FILE: client/src/App.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    App.tsx is the ROOT COMPONENT of the entire React application.
    It serves two critical roles:
    1. LAYOUT SHELL — places components that appear on every page
       (Navbar, Footer, SoftBackdrop, LenisScroll, Toaster).
    2. ROUTING SWITCHBOARD — maps URLs to the correct page components.

  WHEN IT EXECUTES:
    Rendered once by main.tsx. Stays mounted for the entire session.
    Child components (pages) mount/unmount as the user navigates,
    but App itself never unmounts.

  WHO CALLS IT:
    main.tsx: <App />

  WHAT IT EXPORTS:
    Default export: function App()

  WHICH FILES DEPEND ON IT:
    main.tsx renders it. App imports every page and layout component.
  ─────────────────────────────────────────────────────────────
*/

import Navbar from './components/Navbar';
/*
  Navbar = fixed top navigation bar. Appears on every page.
  It is placed OUTSIDE <Routes> so it never unmounts when navigating.
  Contains: logo, nav links, credit balance, auth buttons/user avatar.
*/

import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
/*
  SoftBackdrop = fixed decorative background gradient blobs.
  Renders behind all content (z-index: -1).
  Placed before Navbar in the tree so it renders first.
*/

import Footer from './components/Footer';
import LenisScroll from './components/lenis';
/*
  LenisScroll = renders null (no visible DOM output).
  It only initializes the Lenis smooth scroll library via useEffect.
  Must be inside the React tree so React manages its lifecycle (cleanup on unmount).
*/

import { Route, Routes } from 'react-router-dom';
/*
  Routes — container for all route definitions.
  Looks at the current URL and renders ONLY the matching Route's element.
  Only ONE route renders at a time.

  Route — defines one URL-to-component mapping:
    path="/generate" → renders <Genetator /> when URL is /generate

  REACT ROUTER v6 CHANGES FROM v5:
    v5: <Switch><Route path="/generate" component={Generator} /></Switch>
    v6: <Routes><Route path="/generate" element={<Generator />} /></Routes>
    
    Key difference: `element` prop receives JSX (not a component reference).
    This allows passing props directly: element={<Result theme="dark" />}
*/

import Genetator from './pages/Genetator';
/*
  Note: "Genetator" is a typo in the original codebase (should be "Generator").
  In interviews, you can mention this as a real-world observation:
  "The file has a typo in the name — in production I would rename it
  and update all imports. TypeScript would catch any missed references."
*/

import Result from './pages/Result';
import MyGenerations from './pages/MyGenerations';
import Community from './pages/Community';
import Plans from './pages/Plans';
import Loading from './pages/Loading';

import { Toaster } from 'react-hot-toast'
/*
  react-hot-toast = a notification library for toast messages.

  HOW IT WORKS:
    1. <Toaster /> renders a container div (fixed-positioned, top-right by default).
    2. When any component calls toast.success("Done!") or toast.error("Failed!"),
       react-hot-toast's internal store queues the notification.
    3. <Toaster /> subscribes to that store and renders the notifications.

  WHY IN APP.TSX?
    <Toaster /> must exist somewhere in the React tree.
    Placing it in App.tsx ensures it's always present on every page.
    toast() calls work from ANY component — Controller, Navbar, Generator, etc.

  WHAT IS A GLOBAL STORE (not React Context)?
    react-hot-toast uses its own module-level store (not Context).
    The store is a singleton JavaScript object imported by both toast() and <Toaster />.
    toast() writes to the store → <Toaster /> reads from it and re-renders.

  INTERVIEW Q: How does react-hot-toast work without React Context?
  A: It uses a module-level singleton store — a plain JavaScript object
     defined at module scope. toast() pushes to this object.
     <Toaster /> imports the same object and subscribes to it with useReducer.
     This is a lightweight alternative to Context for truly global one-way events.
*/

function App() {
    return (
        <>
        {/*
          React Fragment: <> ... </>
          Long form: <React.Fragment> ... </React.Fragment>

          WHY FRAGMENTS?
            React components must return a SINGLE root element.
            Without Fragment, you'd need: <div>...</div>
            But a wrapping <div> adds an unnecessary DOM node.
            Extra DOM nodes can break:
              • CSS Grid/Flexbox layouts (unexpected child element)
              • Screen reader hierarchy
              • CSS selectors that target direct children

            Fragment returns multiple elements without any DOM output.

          INTERVIEW Q: What is a React Fragment?
          A: A component that lets you return multiple adjacent elements
             without adding an extra DOM wrapper node.
             <> </> is shorthand. Use <React.Fragment key={id}> when you need a key prop.
        */}

            <Toaster toastOptions={{style: {background: '#333', color: "#fff"}}}/>
            {/*
              toastOptions.style — global CSS for all toast notifications.
              background: '#333' → dark gray background (matches dark theme)
              color: "#fff"      → white text (readable on dark bg)

              Without this: toasts would have white background → looks wrong on dark app.

              Position defaults to 'top-right'. Override with: position="bottom-center"
              Duration defaults to 4000ms (4 seconds). Override with: duration: 2000
            */}

            <SoftBackdrop />
            {/*
              Decorative background. Placed before Navbar so it renders behind everything.
              Fixed position + z-index: -1 ensures it never overlaps content.
              pointer-events-none means user interactions (clicks, hovers) pass through it.
            */}

            <LenisScroll />
            {/*
              Returns null → adds nothing to the DOM.
              Its useEffect initializes Lenis smooth scroll.
              Placed in App so it initializes once and runs for the entire session.
              Cleanup (lenis.destroy()) runs when the app unmounts.
            */}

            <Navbar />
            {/*
              Outside <Routes> → renders on EVERY page.
              If Navbar was inside Routes, it would unmount/remount on every navigation,
              causing animations to replay and credits to re-fetch each time.
              Keeping it outside makes it persistent.
            */}

            <Routes>
            {/*
              Routes is the modern equivalent of Switch (React Router v5).
              Renders the FIRST child Route whose path matches the current URL.
              If no route matches, renders nothing (no 404 unless you add one).

              HOW MATCHING WORKS:
                URL: /generate     → matches path="/generate"    → renders <Genetator />
                URL: /result/abc   → matches path="/result/:projectId" → renders <Result />
                URL: /community    → matches path="/community"   → renders <Community />
                URL: /anything     → no match → renders nothing

              ADD A 404 PAGE:
                <Route path="*" element={<NotFound />} />
                The * catches all unmatched paths.
                This project doesn't have one — an opportunity to mention it in interviews.
            */}

                <Route path='/' element={<Home />}/>
                {/*
                  Exact path '/': matches ONLY the root URL.
                  In React Router v6, paths are exact by default.
                  (In v5, path="/" would match /generate too unless exact was added.)
                */}

                <Route path='/generate' element={<Genetator />}/>
                {/* The image + video generation form */}

                <Route path='/result/:projectId' element={<Result />}/>
                {/*
                  :projectId is a URL PARAMETER (dynamic segment).
                  The : prefix means "this part can be anything".
                  
                  Examples:
                    /result/abc-def-123  → projectId = "abc-def-123"
                    /result/xyz-789      → projectId = "xyz-789"
                  
                  Inside Result.tsx, access it with:
                    const { projectId } = useParams()
                  
                  WHY URL PARAMETERS?
                    Each project has a unique ID. Instead of building 1000 separate routes,
                    one parameterized route handles all of them dynamically.
                    The component fetches data based on the ID in the URL.
                  
                  INTERVIEW Q: What are URL parameters in React Router?
                  A: Dynamic segments in a route path, prefixed with :.
                     They match any string at that position in the URL.
                     useParams() hook returns an object with their values.
                     Example: path="/user/:id" + URL /user/42 → { id: "42" }
                */}

                <Route path='/my-generations' element={<MyGenerations />}/>
                {/* Private page — shows logged-in user's own projects */}

                <Route path='/community' element={<Community />}/>
                {/* Public page — shows all published projects */}

                <Route path='/plans' element={<Plans />}/>
                {/* Pricing page with Clerk's PricingTable component */}

                <Route path='/loading' element={<Loading />}/>
                {/*
                  Temporary loading screen used during auth redirects.
                  Clerk sometimes redirects through /loading after OAuth login.
                  After a timeout (6s), it redirects to home.
                */}
            </Routes>

            <Footer />
            {/*
              Like Navbar, outside <Routes> so it persists on all pages.
              Contains: logo, footer links, copyright notice.
            */}
        </>
    );
}

export default App;
/*
  Default export — imported in main.tsx as:
    import App from './App'
  Only one default export per file.
  Named exports: import { specific } from './file'
  Default exports: import anything from './file' (any name works)
*/

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Component Tree Structure
  ───────────────────────────────────
    App.tsx represents this structure:

    App
    ├── Toaster          [always rendered, portals outside the tree]
    ├── SoftBackdrop     [always rendered, fixed, z-index: -1]
    ├── LenisScroll      [always rendered, null output, side effect only]
    ├── Navbar           [always rendered, fixed top bar]
    ├── Routes
    │    ├── Home        [rendered at /]
    │    ├── Genetator   [rendered at /generate]
    │    ├── Result      [rendered at /result/:projectId]
    │    ├── MyGenerations [rendered at /my-generations]
    │    ├── Community   [rendered at /community]
    │    ├── Plans       [rendered at /plans]
    │    └── Loading     [rendered at /loading]
    └── Footer           [always rendered]

    Components OUTSIDE Routes → always mounted (persistent)
    Components INSIDE Routes  → mount/unmount based on URL (ephemeral)

  CONCEPT: React Router Navigation
  ──────────────────────────────────
    Ways to navigate in React Router v6:
    
    1. <Link to="/community">Community</Link>
       → Client-side navigation (no page reload)
    
    2. const navigate = useNavigate()
       navigate('/result/' + projectId)
       → Programmatic navigation (after form submit, etc.)
    
    3. <Navigate to="/home" replace />
       → Immediate redirect (replaces history entry)
    
    4. window.location.href = '/'
       → FULL PAGE RELOAD (avoid! defeats SPA purpose)
       → Only used in Loading.tsx where a hard reset is intentional.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ App.tsx = root component — layout + routing in one place
  ✔ Components outside <Routes> render on ALL pages (Navbar, Footer)
  ✔ <Routes> renders ONE matching route at a time
  ✔ :projectId = dynamic URL parameter, read via useParams()
  ✔ React Fragment <> = multiple children without a DOM wrapper
  ✔ <Toaster> must be here for toast() to work everywhere
  ✔ LenisScroll returns null — it's only here for its useEffect side effect
  ✔ React Router v6: element={<JSX />} (not component={Component})

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Immediate build error — main.tsx can't import App
  ✘ No routing → browser doesn't know which page to show
  ✘ Navbar and Footer disappear from all pages
*/