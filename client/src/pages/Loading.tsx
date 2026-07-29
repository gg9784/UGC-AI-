/*
  ============================================================
  FILE: client/src/pages/Loading.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Acts as an interim screen (or fallback UI) while the application
    is routing or performing an initial heavy boot operation.
    In this specific implementation, it simply acts as a 6-second
    holding screen before hard-redirecting the user back to the Home page.

  KEY CONCEPTS TAUGHT:
    • `setTimeout` inside `useEffect`: Delaying a programmatic action.
    • `window.location.href`: Performing a hard browser redirect.
  ─────────────────────────────────────────────────────────────
*/

import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"

const Loading = () => {

  // ── SIDE EFFECTS ───────────────────────────────────────────
  
  /**
   * EFFECT: Hard Redirect Fallback
   * 
   * When this component mounts, it starts a 6-second timer.
   * If the component is still mounted after 6 seconds, it forces a
   * hard browser redirect back to the home page ('/').
   */
  useEffect(()=>{
    setTimeout(()=>{
      // `window.location.href` is NOT client-side routing (unlike React Router's `navigate()`).
      // It completely destroys the current React application state and forces the 
      // browser to download and reload the page from the server.
      // This is often used as an absolute fallback to clear out stuck states.
      window.location.href = '/'
    }, 6000)
    
    /*
      INTERVIEW NOTE:
      In a production app, you almost ALWAYS want to return a cleanup function
      to clear the timeout if the component unmounts before 6 seconds!
      
      const timer = setTimeout(() => { window.location.href = '/' }, 6000);
      return () => clearTimeout(timer);
      
      Without this, if the user navigates away after 2 seconds, the timeout
      will still fire 4 seconds later and randomly kick them back to home!
    */
  },[])

  // ── RENDER ─────────────────────────────────────────────────
  
  return (
    <div className="h-screen flex flex-col">
    {/* flex-col + flex-1 forces the inner div to occupy remaining vertical space. */}
      
      <div className="flex items-center justify-center flex-1">
        {/* Centered spinning loading icon */}
        <Loader2Icon className='size-7 animate-spin text-indigo-200'/>
      </div>
      
    </div>
  )
}

export default Loading

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ `setTimeout` can delay an action, but should ideally be cleaned up.
  ✔ `window.location.href` causes a FULL page refresh, not a soft SPA transition.
*/
