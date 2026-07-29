/*
  ============================================================
  FILE: client/src/pages/Community.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Displays a masonry-style public gallery of projects that users
    have chosen to publish. It fetches all published projects and
    renders them using the ProjectCard component in "community mode".

  KEY CONCEPTS TAUGHT:
    • Public Data Fetching (no auth token required).
    • Reusing Components with Props: Passing `forCommunity={true}`
      to alter the UI of ProjectCard (hiding delete/edit buttons).
    • CSS Masonry Layout (columns).
  ─────────────────────────────────────────────────────────────
*/

import { useEffect, useState } from "react"
import type { Project } from "../types"
import { Loader2Icon } from "lucide-react"
import ProjectCard from "../components/ProjectCard"
import api from "../configs/axios"
import toast from "react-hot-toast"

const Community = () => {

  // ── STATE ──────────────────────────────────────────────────
  
  const [projects, setProjects] = useState<Project[]>([])
  // Holds the array of published Project objects.

  const [loading, setLoading] = useState(true)
  // Controls the full-screen loading spinner.

  // ── DATA FETCHING ──────────────────────────────────────────
  
  /**
   * fetchProjects
   * Fetches all publicly published projects from the backend.
   * Note: This does NOT require a JWT token because the route is public.
   */
  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/api/project/published')
      // No headers needed here. The backend allows anonymous access to this route.

      setProjects(data.projects)
      setLoading(false)
      
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
      // We purposefully DO NOT set loading(false) here if we want the spinner
      // to remain visible on a critical failure, but typically you'd add a `finally` block.
    }
  }

  // ── SIDE EFFECTS ───────────────────────────────────────────
  
  /**
   * useEffect — Initial Data Fetch
   * Empty dependency array `[]` means this runs exactly once on mount.
   */
  useEffect(() => {
    fetchProjects()
  }, []) 

  // ── RENDER ─────────────────────────────────────────────────
  
  return loading ? (
    // LOADING STATE
    <div className="flex items-center justify-center min-h-screen">
      <Loader2Icon className='size-7 animate-spin text-indigo-400'/>
    </div>
  ) : (
    // LOADED STATE
    <div className="min-h-screen text-white p-6 md:p-12 my-28">
      <div className="max-w-6xl mx-auto">
        
        {/* ── HEADER ── */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">Community</h1>
          <p className="text-gray-400">See what others are creating with UGC.ai</p>
        </header>

        {/* ── GRID ── */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              gen={project}
              setGenerations={setProjects}
              
              // THE FLAG THAT CHANGES EVERYTHING:
              forCommunity={true}
              /* 
                By passing forCommunity=true, the ProjectCard knows it is being
                rendered in the public feed. It will internally HIDE the:
                - Action Menu (Delete / Share)
                - Publish/Unpublish toggle
                - View Details button
              */
            />
          ))}

        </div>
      </div>
    </div>
  )
}

export default Community

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Reusable Components via Flags
  ─────────────────────────────────────────────────────────────
  Instead of building `<MyGenerationCard>` and `<CommunityCard>`,
  we build ONE `<ProjectCard>` and pass a boolean flag: `forCommunity={true}`.
  
  Inside ProjectCard:
  `{!forCommunity && ( <DeleteButton /> )}`
  
  This keeps styling unified. If you update the card's border color,
  it updates in both My Generations and Community instantly.
  This is the essence of Component-Driven Development in React.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Public routes don't require JWT tokens in the Axios headers.
  ✔ `forCommunity={true}` modifies the behaviour of the child component.
  ✔ CSS Columns (`columns-3`) is used again for the Masonry layout.

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Users cannot see the public gallery of generated content.
*/
