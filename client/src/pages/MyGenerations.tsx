/*
  ============================================================
  FILE: client/src/pages/MyGenerations.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Displays a dashboard of all the projects the currently logged-in
    user has created. It fetches an array of projects from the backend
    and renders them in a responsive Masonry-style grid using the 
    reusable ProjectCard component.

  KEY CONCEPTS TAUGHT:
    • Array Mapping: Transforming data arrays into JSX components.
    • CSS Columns: Creating masonry layouts without external libraries.
    • Empty States: Handling cases where the user has no data yet.
    • Auth Guards: Redirecting unauthenticated users.
  ─────────────────────────────────────────────────────────────
*/

import { useEffect, useState } from "react"
import type { Project } from "../types"
import { Loader2Icon } from "lucide-react"
import ProjectCard from "../components/ProjectCard"
import { PrimaryButton } from "../components/Buttons"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import api from "../configs/axios"
import toast from "react-hot-toast"

const MyGenerations = () => {

  // ── HOOKS ──────────────────────────────────────────────────
  const {user, isLoaded} = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()

  // ── STATE ──────────────────────────────────────────────────
  const [generations, setGenerations] = useState<Project[]>([])
  // Initializes as an empty array so `generations.map` doesn't crash on the first render.
  
  const [loading, setLoading] = useState(true)
  // Controls the full-screen loading spinner while the API request is in flight.

  // ── DATA FETCHING ──────────────────────────────────────────
  
  /**
   * fetchMyGenerations
   * Fetches only the projects belonging to the logged-in user.
   */
  const fetchMyGenerations = async ()=>{
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/projects', {
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      setGenerations(data.projects)
      setLoading(false)
      
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  }

  // ── SIDE EFFECTS ───────────────────────────────────────────
  
  /**
   * EFFECT: Auth Guard & Fetch Trigger
   */
  useEffect(()=>{
    if(user){
       fetchMyGenerations()
    } else if(isLoaded && !user){
      // AUTHENTICATION GUARD
      // If Clerk has finished loading (`isLoaded` is true) but there is NO user,
      // it means the user is logged out. We cannot show them "My Generations",
      // so we redirect them to the home page.
      navigate('/')
    }
  },[user])

  // ── RENDER ─────────────────────────────────────────────────
  
  return loading ? (
    // FULL-SCREEN LOADING STATE
    <div className="flex items-center justify-center min-h-screen">
      <Loader2Icon className='size-7 animate-spin text-indigo-400'/>
    </div>
  ):(
    // LOADED STATE
    <div className="min-h-screen text-white p-6 md:p-12 my-28">
      <div className="max-w-6xl mx-auto">
        
        {/* ── HEADER ── */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">My Generations</h1>
          <p className="text-gray-400">View and manage your AI-generated content</p>
        </header>

        {/* 
          ── CSS COLUMNS (MASONRY LAYOUT) ──
          Using Tailwind's column utility classes to create a Pinterest-style masonry grid.
          columns-1: Mobile (1 column)
          sm:columns-2: Tablet (2 columns)
          lg:columns-3: Desktop (3 columns)
          gap-4: Space between columns.
          
          Note: Child elements MUST have `break-inside-avoid` to prevent
          them from being split across columns. This is handled inside `ProjectCard`.
        */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            
            {/* 
              Map over the generations array and render a ProjectCard for each one.
              Keys are essential for React to track which items change/delete.
            */}
            {generations.map((gen)=>(
              <ProjectCard 
                key={gen.id} 
                gen={gen} 
                
                // We pass the setter function DOWN to the child component.
                // This allows the ProjectCard to remove itself from this list when deleted!
                setGenerations={setGenerations}
              />
            ))}
        </div>

        {/* ── EMPTY STATE ── */}
        {/* If the array is empty (length === 0), show a friendly message and a CTA. */}
        {generations.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-xl font-medium mb-2">No generations yet</h3>
            <p className="text-gray-400 mb-6">Start creating stunning product photos today</p>
            <PrimaryButton onClick={()=>window.location.href = '/generate'}>
              Create New Generation
            </PrimaryButton>
          </div>
        )}
        
      </div>
    </div>
  )
}

export default MyGenerations

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Passing State Setters to Children (Lifting State Up)
  ─────────────────────────────────────────────────────────────
  We have a list of projects here in `MyGenerations`.
  But the "Delete" button lives deep inside `ProjectCard`.
  How does `ProjectCard` tell `MyGenerations` to remove the deleted item?
  
  Solution: We pass the `setGenerations` function as a prop to `ProjectCard`!
  Inside ProjectCard:
    setGenerations((prev) => prev.filter(item => item.id !== idToDelete))
    
  This keeps the state at the highest necessary level (the page), but allows
  child components to update it.

  CONCEPT: CSS Columns vs CSS Grid
  ─────────────────────────────────────────────────────────────
  Grid: Elements fill row by row. If elements are different heights,
        the row expands to fit the tallest element, leaving empty space.
        
  Columns: Elements fill column by column (top to bottom).
           This allows elements of different heights to stack tightly,
           creating a "Masonry" effect automatically!

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ `isLoaded && !user` is a safe way to check if a user is truly logged out.
  ✔ `columns-3` creates a vertical masonry layout instantly via CSS.
  ✔ Always handle Empty States (arrays with length 0) to avoid confusing users.
  ✔ Passing a state setter as a prop lets children manipulate parent state.

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Users cannot see their past projects.
  ✘ Users have no way to access or delete previous generations.
*/
