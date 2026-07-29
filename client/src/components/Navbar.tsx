/*
  ============================================================
  FILE: client/src/components/Navbar.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    The main navigation bar. It is persistent (renders on every page)
    because it sits outside the <Routes> block in App.tsx.
    It handles:
    1. Navigation (desktop links + mobile hamburger menu)
    2. Authentication state (Sign In/Up vs. UserAvatar)
    3. Live Credit Balance (fetches and displays credits)

  KEY CONCEPTS TAUGHT:
    • Clerk Auth Hooks (useUser, useClerk, useAuth)
    • Programmatic vs. Declarative Navigation (useNavigate vs Link)
    • Data Fetching in useEffect (with IIFE pattern)
    • Responsive Design (hidden md:flex vs flex md:hidden)
  ─────────────────────────────────────────────────────────────
*/

import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEnd, MenuIcon, SparkleIcon, XIcon } from 'lucide-react';
import { GhostButton, PrimaryButton } from './Buttons';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

import { useClerk, useUser, UserButton, useAuth } from '@clerk/clerk-react';
/*
  CLERK AUTHENTICATION HOOKS
  ──────────────────────────────────────────────────────────────
  useUser()  → Returns { user, isLoaded, isSignedIn }. `user` is the current logged-in user object (or null).
  useClerk() → Returns the core Clerk object. Has methods like openSignIn(), openSignUp(), signOut().
  useAuth()  → Returns auth state and methods like getToken() for backend requests.
  UserButton → Pre-built React component that renders the user's avatar with a dropdown menu.
*/

import api from '../configs/axios';
import toast from 'react-hot-toast';

export default function Navbar() {

    // ── HOOKS ─────────────────────────────────────────────────
    const navigate = useNavigate()
    /*
      useNavigate(): returns a function to navigate programmatically.
      e.g., navigate('/generate')
      Used in button onClick handlers where <Link> isn't appropriate.
    */

    const { user } = useUser()
    /*
      user = null if logged out.
      user = Object if logged in (contains id, emailAddresses, imageUrl, etc.)
      This single variable drives the conditional UI (Sign In vs Avatar).
    */

    const { openSignIn, openSignUp } = useClerk()
    /*
      Instead of routing to a separate /sign-in page, this opens Clerk's
      built-in modal overlay right on the current page. Better UX!
    */

    // ── LOCAL STATE ───────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false);
    // Controls the mobile hamburger menu overlay (true = open).

    const [credits, setCredits] = useState(0);
    // Stores the user's credit balance. 0 by default, updated from backend.

    const { pathname } = useLocation()
    // Returns the current URL path (e.g., "/generate").
    // Used as a dependency in useEffect to refresh credits when the URL changes.

    const { getToken } = useAuth()
    // Used to securely request a fresh JWT for the backend.

    // ── NAV LINKS ─────────────────────────────────────────────
    const navLinks = [
        { name: 'Home',      href: '/#' },
        { name: 'Create',    href: '/generate' },
        { name: 'Community', href: '/community' },
        { name: 'Plans',     href: '/plans' },
    ];
    // Defining links as an array keeps the JSX clean (mapped below).

    // ── FUNCTION: getUserCredits ───────────────────────────────
    const getUserCredits = async () => {
        try {
            const token = await getToken()
            // getToken() asks Clerk for a fresh JWT.
            // Clerk handles caching and refreshing automatically behind the scenes.

            const { data } = await api.get('/api/user/credits', {
                headers: { Authorization: `Bearer ${token}` }
            })
            // Pass the token to our Express backend.
            // Backend auth middleware (auth.ts) verifies it before running the controller.

            setCredits(data.credits)
            // Update the React state → triggers a re-render → UI shows new balance.

        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message)
            console.log(error);
        }
    }

    // ── SIDE EFFECT: Fetch credits ────────────────────────────
    useEffect(() => {
        if (user) {
            (async () => await getUserCredits())();
            /*
              IIFE = Immediately Invoked Function Expression.
              Syntax: (function)()
              
              WHY?
              useEffect callbacks CANNOT be async functions:
              useEffect(async () => { ... }) ❌ React throws an error.
              React expects useEffect to return nothing or a cleanup function.
              Async functions return a Promise.
              
              To run async code inside useEffect, you either:
              1. Define an inner async function and call it.
              2. Use an async IIFE (like this code does).
            */
        }
    }, [user, pathname])
    /*
      DEPENDENCY ARRAY: [user, pathname]
      React re-runs this effect IF user OR pathname changes.
      
      If user changes (login/logout): Fetches credits.
      If pathname changes (navigation): Fetches credits.
      
      WHY PATHNAME?
      When the user navigates from /generate to /home, the page doesn't reload (SPA).
      We want to ensure the credit balance is always up to date.
      Listening to `pathname` acts as a cheap way to poll for updates on navigation.
      
      INTERVIEW Q: What happens if you forget the dependency array?
      A: useEffect(() => {...}) without [] runs on EVERY re-render.
         If that effect updates state (setCredits), state updates trigger a re-render.
         Result = infinite loop → crashes the browser. Always use dependency arrays.
    */

    return (
        <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
        /*
          fixed top-5 left-0 right-0 → sticks to the top of the viewport with 20px margin.
          z-50 → highest z-index to stay above all other content.
        */
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-3'>
            {/*
              bg-black/50 + backdrop-blur-md = Glassmorphism navbar.
              This allows page content (and SoftBackdrop blobs) to blur beautifully behind the navbar as you scroll.
            */}

                <Link to='/' onClick={() => scrollTo(0, 0)}>
                    <img src={assets.logo} alt="logo" className="h-8" />
                </Link>
                {/* 
                  scrollTo(0,0) ensures that clicking the logo scrolls to the absolute top,
                  even if we're already on the Home page but scrolled down.
                */}

                {/* ── DESKTOP LINKS ── */}
                <div className='hidden md:flex items-center gap-8 text-sm font-medium text-gray-300'>
                {/*
                  hidden md:flex → Responsive design pattern!
                  Mobile: display: none (hidden)
                  Desktop (md = 768px+): display: flex
                  We hide the inline links on mobile to make room for the hamburger menu.
                */}
                    {navLinks.map((link) => (
                        <Link
                            onClick={() => scrollTo(0, 0)}
                            to={link.href}
                            key={link.name}
                            className="hover:text-white transition"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* ── AUTH / ACTION AREA ── */}
                {!user ? (
                    // IF NOT LOGGED IN
                    <div className='hidden md:flex items-center gap-3'>
                        <button
                            onClick={() => openSignIn()}
                            className='text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden'
                        >
                            Sign in
                        </button>
                        <PrimaryButton
                            onClick={() => openSignUp()}
                            className='max-sm:text-xs hidden sm:inline-block'
                        >
                            Get Started
                        </PrimaryButton>
                    </div>
                ) : (
                    // IF LOGGED IN
                    <div className='flex gap-2'>
                        <GhostButton
                            onClick={() => navigate('/plans')}
                            className='border-none text-gray-300 sm:py-1.5'
                        >
                            Credits: {credits}
                        </GhostButton>

                        <UserButton>
                        {/*
                          UserButton = Clerk component. Renders the user's profile picture.
                          Clicking it opens an account management dropdown.
                        */}
                            <UserButton.MenuItems>
                            {/*
                              Customizing the Clerk Dropdown:
                              We add our own app-specific links into the Clerk menu.
                              This keeps the UI compact (all actions under the avatar).
                            */}
                                <UserButton.Action label='Generate'       labelIcon={<SparkleIcon size={14}/>}           onClick={() => navigate('/generate')}/>
                                <UserButton.Action label='My Generations' labelIcon={<FolderEditIcon size={14}/>}        onClick={() => navigate('/my-generations')}/>
                                <UserButton.Action label='Community'      labelIcon={<GalleryHorizontalEnd size={14}/>}  onClick={() => navigate('/community')}/>
                                <UserButton.Action label='Plans'          labelIcon={<DollarSignIcon size={14}/>}        onClick={() => navigate('/plans')}/>
                            </UserButton.MenuItems>
                        </UserButton>
                    </div>
                )}

                {/* ── HAMBURGER ICON (MOBILE GUEST) ── */}
                {!user && (
                    <button onClick={() => setIsOpen(!isOpen)} className='md:hidden'>
                        <MenuIcon className='size-6' />
                    </button>
                    /*
                      md:hidden → Hides on desktop. Only shows on mobile.
                      Toggle `isOpen` state to show/hide the fullscreen mobile menu.
                    */
                )}
            </div>

            {/* ── MOBILE FULLSCREEN MENU ── */}
            <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
            {/*
              fixed inset-0 → covers the entire screen.
              isOpen ? "translate-x-0" : "translate-x-full"
              → If true: at X=0 (on screen).
              → If false: pushed 100% to the right (off screen).
              transition-all duration-300 makes this a smooth slide-in/out animation.
            */}

                {navLinks.map((link) => (
                    <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
                        {link.name}
                    </a>
                    // onClick={() => setIsOpen(false)} ensures the menu closes when a link is clicked.
                ))}

                <button
                    onClick={() => { setIsOpen(false); openSignIn() }}
                    className='font-medium text-gray-300 hover:text-white transition'
                >
                    Sign in
                </button>

                <PrimaryButton onClick={() => { setIsOpen(false); openSignUp() }}>
                    Get Started
                </PrimaryButton>

                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
                >
                    <XIcon />
                </button>
            </div>
        </motion.nav>
    );
};

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Programmatic vs Declarative Navigation
  ───────────────────────────────────────────────
  Declarative: <Link to="/generate">Create</Link>
    Use when the user intentionally clicks a navigation element (like a menu item).
    It renders as a standard <a> tag (good for SEO and accessibility).

  Programmatic: navigate('/generate')
    Use when navigation happens as a RESULT of an action or in a callback.
    Example: After a form submits successfully, or inside a custom button's onClick.

  CONCEPT: Responsive Design (Mobile First)
  ─────────────────────────────────────────
  Tailwind uses mobile-first media queries.
  `hidden md:flex` means:
    1. Base (mobile): hidden (display: none)
    2. md (768px+): flex (display: flex)
  This hides desktop nav on mobile.

  `flex md:hidden` means:
    1. Base (mobile): flex
    2. md (768px+): hidden
  This hides the hamburger menu on desktop.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Navbar is persistent (outside <Routes> in App.tsx)
  ✔ useAuth().getToken() gets a fresh JWT for backend requests
  ✔ useEffect with `pathname` dependency re-fetches credits on route changes
  ✔ IIFE `(async () => {...})()` used to run async code inside useEffect
  ✔ `user` from useUser() controls conditional render (Sign In vs Avatar)
  ✔ Clerk's `UserButton.MenuItems` injects custom links into the avatar dropdown
  ✔ Mobile menu slides in using `translate-x-0` vs `translate-x-full`

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Users cannot navigate between pages
  ✘ Users cannot see their credit balance
  ✘ Users cannot log in or log out (auth controls disappear)
*/