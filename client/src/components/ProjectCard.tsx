/*
  ============================================================
  FILE: client/src/components/ProjectCard.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Renders a single project card. It is highly reusable and appears
    in two places: "My Generations" (private dashboard) and
    "Community" (public gallery).

  KEY CONCEPTS TAUGHT:
    • Conditional UI rendering based on props (`forCommunity`).
    • Event Bubbling & Capture (`onMouseDownCapture`, `onMouseLeave`).
    • Video Autoplay on Hover (`onMouseEnter={() => play()}`).
    • The Web Share API (`navigator.share`).
    • CSS absolute positioning and animation delays (floating avatar images).
  ─────────────────────────────────────────────────────────────
*/

import type React from "react";
import type { Project } from "../types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { EllipsisIcon, ImageIcon, Loader2Icon, PlaySquareIcon, Share2Icon, Trash2Icon } from "lucide-react";
import { GhostButton, PrimaryButton } from "./Buttons";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/axios";
import toast from "react-hot-toast";

// ── COMPONENT DEFINITION & PROPS ───────────────────────────
const ProjectCard = ({ 
    gen, 
    setGenerations, 
    forCommunity = false 
}: { 
    gen: Project; 
    setGenerations: React.Dispatch<React.SetStateAction<Project[]>>; 
    forCommunity?: boolean 
}) => {
    /*
      PROPS EXPLAINED:
      - gen: The specific Project object to render (contains images, title, etc.).
      - setGenerations: The state setter function from the parent (MyGenerations/Community)
        used to remove this item if deleted, or update its published status.
      - forCommunity: A boolean flag. Defaults to false. If true, HIDES all private actions.
    */

    const { getToken } = useAuth();
    const navigate = useNavigate();
    
    // Controls the visibility of the "..." dropdown menu
    const [menuOpen, setMenuOpen] = useState(false);

    // ── ACTIONS ────────────────────────────────────────────────

    /**
     * handleDelete
     * Confirms and deletes the project from the backend.
     */
    const handleDelete = async (id: string) => {
        // Native browser confirm dialog. Simple and effective.
        const confirm = window.confirm("Are you sure you want to delete this project?");
        if (!confirm) return;

        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/project/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // LIFTING STATE UP IN ACTION:
            // This component doesn't own the list of projects. The parent does.
            // By calling the parent's setter, we filter out THIS specific ID from the parent's array.
            // This causes the parent to re-render, and this ProjectCard disappears from the screen!
            setGenerations((generations) => generations.filter((gen) => gen.id !== id));
            
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    /**
     * togglePublish
     * Flips the project's visibility between private and public.
     */
    const togglePublish = async (projectId: string) => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/user/publish/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // LIFTING STATE UP:
            // We map over the parent's array. When we find THIS project's ID,
            // we create a new object and update its `isPublished` boolean.
            // This triggers a re-render so the UI (Publish/Unpublish button) updates instantly.
            setGenerations((generations) => generations.map((gen) => (gen.id === projectId ? { ...gen, isPublished: data.isPublished } : gen)));

            toast.success(data.isPublished ? "Project published" : "Project unpublished");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    // ── RENDER ─────────────────────────────────────────────────
    return (
        <div key={gen.id} className="mb-4 break-inside-avoid">
        {/*
          break-inside-avoid
          CRITICAL for CSS Columns masonry layout (used in MyGenerations/Community).
          This prevents the browser from splitting a single card across two columns
          (e.g., top half of card at bottom of Col 1, bottom half at top of Col 2).
        */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition group">
                
                {/* ── MEDIA PREVIEW AREA ── */}
                <div className={`${gen?.aspectRatio === "9:16" ? "aspect-9/16" : "aspect-video"} relative overflow-hidden`}>
                {/*
                  Dynamic Aspect Ratio:
                  The container literally changes its physical proportions based on the DB value.
                  aspect-9/16 = Portrait (TikTok/Reels). aspect-video = 16:9 Landscape (YouTube).
                */}

                    {/* 1. STATIC IMAGE (Always visible initially) */}
                    {gen.generatedImage && (
                        <img 
                            src={gen.generatedImage} 
                            alt={gen.productName} 
                            className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${gen.generatedVideo ? "group-hover:opacity-0" : "group-hover:scale-105"}`} 
                            /*
                              HOVER EFFECTS:
                              If a video exists: fade this image OUT on hover (so the video underneath shows).
                              If no video exists: zoom this image IN slightly on hover (scale-105).
                            */
                        />
                    )}

                    {/* 2. VIDEO (Plays on hover) */}
                    {gen.generatedVideo && (
                        <video 
                            src={gen.generatedVideo} 
                            muted loop playsInline 
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500" 
                            
                            // PLAY ON HOVER TRICK:
                            onMouseEnter={(e) => e.currentTarget.play()} 
                            onMouseLeave={(e) => e.currentTarget.pause()} 
                            /*
                              When mouse enters the video element, trigger play().
                              When it leaves, pause().
                              Combined with group-hover:opacity-100, the video fades in AND starts playing simultaneously!
                            */
                        />
                    )}

                    {/* 3. LOADING STATE (If neither exist yet) */}
                    {!gen?.generatedImage && !gen?.generatedVideo && (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/20">
                            <Loader2Icon className="size-7 animate-spin" />
                        </div>
                    )}

                    {/* ── STATUS BADGES ── */}
                    <div className="absolute left-3 top-3 flex gap-2 items-center">
                        {gen.isGenerating && <span className="text-xs px-2 py-1 bg-yellow-600/30 rounded-full">Generating</span>}
                        {gen.isPublished && <span className="text-xs px-2 py-1 bg-green-600/30 rounded-full">Published</span>}
                    </div>

                    {/* ── ACTION DROPDOWN MENU ── */}
                    {/* Only show this if we are NOT in community mode */}
                    {!forCommunity && (
                        <div
                            // onMouseDownCapture triggers BEFORE normal click events (bypassing some event bubbling logic)
                            onMouseDownCapture={() => { setMenuOpen(true); }}
                            onMouseLeave={() => { setMenuOpen(false); }}
                            className="absolute right-3 top-3 sm:opacity-0 group-hover:opacity-100 transition flex items-center gap-2"
                        >
                            <div className="absolute top-3 right-3">
                                <EllipsisIcon className="ml-auto bg-black/10 rounded-full p-1 size-7" />
                            </div>
                            
                            {/* The Dropdown Panel */}
                            <div className="flex flex-col items-end w-32 text-sm">
                                <ul className={`text-xs ${menuOpen ? "block" : "hidden"} overflow-hidden right-0 peer-focus:block hover:block w-40 bg-black/50 backdrop-blur text-white border border-gray-500/50 rounded-lg shadow-md mt-2 py-1 z-10`}>
                                    
                                    {/* DOWNLOAD IMAGE */}
                                    {gen.generatedImage && (
                                        <a href={gen.generatedImage?.replace("/upload", "/upload/fl_attachment")} download className="flex gap-2 items-center px-4 py-2 hover:bg-black/10 cursor-pointer">
                                            <ImageIcon size={14} /> Download Image
                                        </a>
                                    )}

                                    {/* DOWNLOAD VIDEO */}
                                    {gen.generatedVideo && (
                                        <a href={gen.generatedVideo?.replace("/upload", "/upload/fl_attachment")} download className="flex gap-2 items-center px-4 py-2 hover:bg-black/10 cursor-pointer">
                                            <PlaySquareIcon size={14} /> Download Video
                                        </a>
                                    )}

                                    {/* NATIVE WEB SHARE API */}
                                    {(gen.generatedVideo || gen.generatedImage) && (
                                        <button 
                                            onClick={() => navigator.share({ url: gen.generatedVideo || gen.generatedImage, title: gen.productName, text: gen.productDescription })} 
                                            className="w-full flex gap-2 items-center px-4 py-2 hover:bg-black/10 cursor-pointer"
                                        >
                                            <Share2Icon size={14} /> Share
                                        </button>
                                        /*
                                          navigator.share()
                                          Invokes the native sharing mechanism of the operating system (e.g., iOS share sheet, Android share menu, macOS share dialogue).
                                          Only works on secure contexts (HTTPS) and as a result of user interaction (onClick).
                                        */
                                    )}

                                    {/* DELETE */}
                                    <button onClick={() => handleDelete(gen.id)} className="w-full flex gap-2 items-center px-4 py-2 hover:bg-red-950/10 text-red-400 cursor-pointer">
                                        <Trash2Icon size={14} /> Delete
                                    </button>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* ── SOURCE IMAGES (Avatars) ── */}
                    <div className="absolute right-3 bottom-3">
                        <img src={gen.uploadedImages[0]} alt="product" className="w-16 h-16 object-cover rounded-full animate-float " />
                        <img src={gen.uploadedImages[1]} alt="model" className="w-16 h-16 object-cover rounded-full animate-float -ml-8" style={{ animationDelay: "3s" }} />
                        {/* 
                          -ml-8 (negative margin left) forces the second image to overlap the first one!
                          style={{ animationDelay: "3s" }} ensures the two images float up and down out of sync.
                        */}
                    </div>
                </div>

                {/* ── DETAILS AREA ── */}
                <div className="p-4">
                    
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-medium text-lg mb-1">{gen.productName}</h3>
                            <p className="text-sm text-gray-400">Created: {new Date(gen.createdAt).toLocaleString()}</p>
                            {gen.updatedAt && <p className="text-xs text-gray-500 mt-1">Updated: {new Date(gen.updatedAt).toLocaleString()}</p>}
                        </div>
                        <div className="text-right">
                            <div className="mt-2 flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-1 bg-white/5 rounded-full">Aspect: {gen.aspectRatio}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    {gen.productDescription && (
                        <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">Description</p>
                            {/* wrap-break-word ensures long continuous strings don't break the layout */}
                            <div className="text-sm text-gray-300 bg-white/3 p-2 rounded-md wrap-break-word">{gen.productDescription}</div>
                        </div>
                    )}

                    {/* Prompt */}
                    {gen.userPrompt && (
                        <div className="mt-3">
                            <div className="text-xs text-gray-300 ">{gen.userPrompt}</div>
                        </div>
                    )}

                    {/* ── BOTTOM BUTTONS (Private Only) ── */}
                    {!forCommunity && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <GhostButton
                                className="text-xs justify-center"
                                onClick={() => {
                                    navigate(`/result/${gen.id}`);
                                    scrollTo(0, 0);
                                }}
                            >
                                View Details
                            </GhostButton>
                            
                            <PrimaryButton onClick={() => togglePublish(gen.id)} className="rounded-md">
                                {gen.isPublished ? "Unpublish" : "Publish"}
                            </PrimaryButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Video Play on Hover
  ─────────────────────────────────────────────────────────────
  To create a "Netflix-style" video preview that only plays when hovered:
  1. Hide the <video> with `opacity-0`
  2. Overlay it perfectly on top of a static `<img>`
  3. Add `onMouseEnter={(e) => e.currentTarget.play()}` to start the video.
  4. Add `onMouseLeave={(e) => e.currentTarget.pause()}` to stop it.
  5. Use `group-hover:opacity-100` to fade it in over the image.

  CONCEPT: The Web Share API (`navigator.share`)
  ─────────────────────────────────────────────────────────────
  Instead of building custom popups for Facebook, Twitter, WhatsApp sharing,
  modern browsers support `navigator.share()`.
  This opens the exact same native sharing sheet that users see when sharing
  photos from their iPhone/Android camera roll!
  Must be triggered by a user click (security requirement).

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ `break-inside-avoid` stops the card from being sliced in half by CSS Columns.
  ✔ Negative margins (`-ml-8`) are perfect for overlapping avatar groups.
  ✔ Passing a state updater down to a child component allows the child to "delete itself".
  ✔ Dynamic classes like `aspect-9/16` vs `aspect-video` change the physical box layout.
  ✔ `forCommunity` hides the delete and publish buttons to prevent unauthorized actions.
*/
