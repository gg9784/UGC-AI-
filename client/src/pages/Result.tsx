/*
  ============================================================
  FILE: client/src/pages/Result.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Displays the result of a specific AI generation project.
    Allows the user to view the generated image, download it,
    and trigger a secondary API call to animate the image into a video.

  KEY CONCEPTS TAUGHT:
    • URL Parameters (useParams) to fetch specific data.
    • Polling (setInterval) to check for async job completion.
    • Cleanup Functions in useEffect (clearInterval).
    • Conditional rendering of media (Image vs Video).
    • File downloading via standard HTML anchors.
  ─────────────────────────────────────────────────────────────
*/

import { useEffect, useState } from "react";
import type { Project } from "../types";
import { ImageIcon, Loader2Icon, RefreshCwIcon, SparkleIcon, VideoIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/axios";
import toast from "react-hot-toast";

const Result = () => {
    
    // ── HOOKS ──────────────────────────────────────────────────
    
    const { projectId } = useParams();
    /*
      useParams extracts dynamic segments from the URL.
      In App.tsx, the route is defined as: <Route path='/result/:projectId' ... />
      If the URL is /result/12345, then projectId = "12345".
      We use this ID to fetch the specific project's data from the backend.
    */

    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    // ── STATE ──────────────────────────────────────────────────
    
    const [project, setProjectData] = useState<Project>({} as Project);
    // Stores the fetched project data. Asserted as Project type.
    
    const [loading, setLoading] = useState(true);
    // Controls the initial full-screen loading spinner while fetching data.

    const [isGenerating, setIsGenerating] = useState(false);
    // Tracks if a video is currently being generated. Triggers the polling effect.

    // ── DATA FETCHING ──────────────────────────────────────────
    
    /**
     * fetchProjectData
     * Fetches the current state of the project by ID.
     */
    const fetchProjectData = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/user/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setProjectData(data.project);
            
            // If the backend says a video is currently being generated,
            // we update this state, which will trigger our polling `useEffect` below.
            setIsGenerating(data.project.isGenerating);
            
            setLoading(false);
            
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    // ── ACTIONS ────────────────────────────────────────────────
    
    /**
     * handleGenerateVideo
     * Triggers the backend to start animating the generated static image into a video.
     */
    const handleGenerateVideo = async () => {
        setIsGenerating(true);
        // Immediately show the "Generating Video..." UI and start polling.
        
        try {
            const token = await getToken();
            const { data } = await api.post(
                "/api/project/video",
                { projectId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Once the backend returns success (synchronously or asynchronously),
            // update the local state with the new video URL.
            setProjectData((prev) => ({ ...prev, generatedVideo: data.videoUrl, isGenerating: false }));

            toast.success(data.message);
            setIsGenerating(false);
            
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    // ── SIDE EFFECTS ───────────────────────────────────────────
    
    /**
     * EFFECT 1: Initial Data Fetch & Auth Guard
     * Runs when the `user` state changes.
     */
    useEffect(() => {
        if (user && !project.id) {
            // If user is logged in and we haven't loaded the project yet -> Fetch it.
            fetchProjectData();
        } else if (isLoaded && !user) {
            // Auth Guard: If Clerk has finished loading and there is NO user,
            // kick them back to the home page. This protects the route.
            navigate("/");
        }
    }, [user]);

    /**
     * EFFECT 2: Polling for Video Generation
     * Runs when `user` or `isGenerating` changes.
     * 
     * CONCEPT: POLLING
     * ─────────────────────────────
     * Video generation takes time (often 10-60 seconds via external AI APIs).
     * The initial request might just say "Job Started".
     * We need to keep asking the server "Is it done yet?" every few seconds.
     * That's what `setInterval` does here.
     */
    useEffect(() => {
        if (user && isGenerating) {
            // Start a timer that runs fetchProjectData every 10,000ms (10 seconds)
            const interval = setInterval(() => {
                fetchProjectData();
            }, 10000);
            
            // CLEANUP FUNCTION
            // React runs this when the component unmounts, or before the effect re-runs.
            // If we don't clear the interval, it will run forever in the background,
            // causing memory leaks and unnecessary network requests.
            return () => clearInterval(interval);
        }
    }, [user, isGenerating]);

    // ── RENDER ─────────────────────────────────────────────────
    
    // IF LOADING: Show full screen spinner
    return loading ? (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2Icon className="animate-spin text-indigo-400 size-9" />
        </div>
    ) : (
    // IF LOADED: Show actual UI
        <div className="min-h-screen text-white p-6 md:p-12 mt-20">
            <div className="max-w-6xl mx-auto">
                
                {/* ── HEADER ── */}
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-medium">Generation Result</h1>
                    <Link to="/generate" className="btn-secondary text-sm flex items-center gap-2">
                        <RefreshCwIcon className="w-4 h-4" />
                        <p className="max-sm:hidden">New Generation</p>
                    </Link>
                </header>

                {/* ── MAIN GRID ── */}
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* ── LEFT COLUMN (MEDIA DISPLAY) ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel inline-block p-2 rounded-2xl">
                            {/* Dynamic Aspect Ratio Classes */}
                            <div className={`${project?.aspectRatio === "9:16" ? "aspect-9/16" : "aspect-video"} sm:max-h-[800px] rounded-xl bg-gray-900 overflow-hidden relative`}>
                                
                                {/* 
                                  Conditional Media Rendering:
                                  If the project has a `generatedVideo`, display the HTML5 <video> tag.
                                  Otherwise, fall back to the static `generatedImage` <img> tag.
                                */}
                                {project?.generatedVideo ? (
                                    <video src={project.generatedVideo} controls autoPlay loop className="w-full h-full object-cover" />
                                ) : (
                                    <img src={project.generatedImage} alt="Generated Result" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN (SIDEBAR ACTIONS) ── */}
                    <div className="space-y-6">
                        
                        {/* ── DOWNLOAD BUTTONS ── */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-4">Actions</h3>
                            <div className="flex flex-col gap-3">
                                
                                {/* 
                                  Cloudinary Download Trick:
                                  Cloudinary URLs usually open the image in a new tab.
                                  Replacing `/upload` with `/upload/fl_attachment` forces the browser 
                                  to trigger a "Save As" download prompt instead.
                                */}
                                <a href={project.generatedImage?.replace("/upload", "/upload/fl_attachment")} download>
                                    <GhostButton disabled={!project.generatedImage} className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <ImageIcon className="size-4.5" />
                                        Download Image
                                    </GhostButton>
                                </a>
                                
                                <a href={project.generatedVideo?.replace("/upload", "/upload/fl_attachment")} download>
                                    <GhostButton disabled={!project.generatedVideo} className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <VideoIcon className="size-4.5" />
                                        Download Video
                                    </GhostButton>
                                </a>
                            </div>
                        </div>

                        {/* ── GENERATE VIDEO ACTION ── */}
                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <VideoIcon className="size-24" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Video Magic</h3>
                            <p className="text-gray-400 text-sm mb-6">Turn this static image into a dynamic video for social media.</p>
                            
                            {/* If no video exists yet, show the Generate button. Else show Success message. */}
                            {!project.generatedVideo ? (
                                <PrimaryButton onClick={handleGenerateVideo} disabled={isGenerating} className="w-full">
                                    {isGenerating ? (
                                        <>Generating Video...</>
                                    ) : (
                                        <>
                                            <SparkleIcon className="size-4" /> Generate Video
                                        </>
                                    )}
                                </PrimaryButton>
                            ) : (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">Video Generated Successfully!</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Result;

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: The Cleanup Function in useEffect
  ─────────────────────────────────────────────────────────────
  If your useEffect starts a timer (`setInterval`), subscribes to an event,
  or opens a WebSocket, you MUST clean it up.
  
  useEffect(() => {
    const timer = setInterval(...)
    
    // React calls this function when the component unmounts
    // OR before the effect runs again.
    return () => clearInterval(timer) 
  }, [])
  
  Without the cleanup, the interval keeps running forever in the background
  even if the user navigates to a different page (memory leak!).

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ `useParams()` grabs URL variables (like `/result/:projectId`).
  ✔ Polling is achieved by setting an interval that fetches data every X seconds.
  ✔ `clearInterval` prevents memory leaks when polling.
  ✔ Cloudinary download hack: inject `fl_attachment` into the URL to force download.
  ✔ Conditional UI rendering simplifies complex logic (e.g. video tag vs img tag).

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Users cannot see the result of their generations.
  ✘ Users cannot download their files.
*/
