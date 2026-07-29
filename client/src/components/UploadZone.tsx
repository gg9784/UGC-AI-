/*
  ============================================================
  FILE: client/src/components/UploadZone.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    A reusable, styled file upload zone component.
    Handles two states:
    1. EMPTY → shows a drag-and-drop style UI with upload icon
    2. FILE SELECTED → shows image preview with a clear (X) button

  WHERE IT'S USED:
    Genetator.tsx uses two UploadZone instances:
    • One for the product image
    • One for the model (person) image

  KEY CONCEPTS TAUGHT:
    • URL.createObjectURL() — browser-local image preview
    • Hidden file input trick — custom styled upload zone
    • Controlled component pattern with callbacks
    • Conditional rendering based on state
  ─────────────────────────────────────────────────────────────
*/

import { UploadIcon, XIcon } from "lucide-react"
/*
  UploadIcon → cloud upload arrow icon (shown in empty state)
  XIcon → X/close icon (shown on hover in file preview state to clear the file)
*/

import type { UploadZoneProps } from "../types"
/*
  `import type` → type-only import (zero runtime cost).
  UploadZoneProps from types/index.ts:
    {
      label: string,              // "Product Image" or "Model Image"
      file: File | null,          // current file selection
      onClear: () => void,        // callback to clear the file
      onChange: (e) => void       // callback when file is selected
    }
  
  All four are REQUIRED props (no ? = mandatory).
  The parent (Genetator.tsx) controls the file state — this is a "dumb" component.
*/

const UploadZone = ({label, file, onClear, onChange}: UploadZoneProps) => {
/*
  PATTERN: CONTROLLED COMPONENT
  The component doesn't manage its own file state.
  Parent (Genetator.tsx) owns the state: useState<File | null>(null)
  Parent passes file down as a prop.
  Parent passes callbacks (onClear, onChange) for the component to call.
  
  This is the "lift state up" pattern — state lives at the level where it's needed.
  Genetator.tsx needs access to the file (to build FormData for the API call),
  so the state must live there, not inside UploadZone.
  
  INTERVIEW Q: What is a controlled component?
  A: A component whose value is controlled by the parent via props.
     It does not maintain its own internal state for the value.
     User interactions trigger callbacks (onChange, onClear) that
     update the PARENT'S state. The parent then re-renders the component
     with the updated value.
     
     Controlled: value={state} onChange={setState}
     Uncontrolled: uses ref to read DOM value directly (less common)
*/

  return (
    <div className="relative group">
    {/*
      relative → establishes positioning context for absolute children.
      group → enables Tailwind's group-hover modifier on children.
        Any child with group-hover:className activates when THIS div is hovered.
        Used for the clear button: hidden normally, shown on hover.
    */}
        <div className={`relative h-64 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-white/2 p-6 ${file ? 'border-violet-600/50 bg-violet-500/5' : 'border-white/10 hover:border-violet-500/30 hover:bg-white/5'}`}>
        {/*
          Dynamic CSS classes based on file state:
          
          WHEN FILE IS SELECTED (file is truthy):
            border-violet-600/50 → purple dashed border (60% opacity)
            bg-violet-500/5      → very faint purple background
            These classes signal "this zone has content" — visual confirmation.
          
          WHEN EMPTY (file is falsy):
            border-white/10          → subtle gray dashed border
            hover:border-violet-500/30 → border turns purple on hover
            hover:bg-white/5          → slight background on hover
            Interactive feedback — invites the user to interact.
          
          DYNAMIC CLASS PATTERN:
          Template literal + ternary: ${file ? 'classA' : 'classB'}
          This is a core React/Tailwind pattern for conditional styling.
          
          h-64 → 256px fixed height for both states (consistent card size).
          rounded-2xl → 16px border radius.
          border-dashed → dashed border (convention for upload zones).
          transition-all duration-300 → smooth 300ms transition between states.
          flex flex-col items-center justify-center → centers content.
        */}

            {file ? (
            /*
              Conditional rendering: if file exists → show preview.
              Otherwise → show upload prompt.
              
              file is a File object: truthy when selected, null when cleared.
            */
                <>
                {/* React Fragment — return multiple sibling elements without wrapper */}

                <img src={URL.createObjectURL(file)} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60"/>
                {/*
                  URL.createObjectURL(file)
                  ──────────────────────────────────────────────────────────────
                  Creates a TEMPORARY browser-local URL representing the File object.
                  
                  WHAT IS A BLOB URL?
                  Format: blob:http://localhost:5173/3f9dc0e8-abc1-4d8f-b2a3-...
                  
                  It's a reference to the File in browser memory — NOT an HTTP URL.
                  The browser can use it as an image src for instant local preview.
                  NO network request is made — the image loads from RAM.
                  
                  IMPORTANT FACTS:
                  1. Only valid for the lifetime of the current document/tab.
                  2. Should be revoked with URL.revokeObjectURL() when no longer needed
                     to free memory. This project skips that (minor memory leak).
                  3. The file has NOT been uploaded — it's still on the user's disk/memory.
                  
                  INTERVIEW Q: What is URL.createObjectURL?
                  A: Creates a DOMString URL pointing to a File or Blob in memory.
                     Used to display files locally before uploading (instant preview).
                     The URL is browser-local (blob:) — only accessible in this tab.
                     Call URL.revokeObjectURL() when done to release the memory reference.
                  
                  object-cover → scales image to fill the zone while maintaining aspect ratio.
                  absolute inset-0 w-full h-full → image fills the container completely.
                  opacity-60 → 60% opacity so the overlay content (filename bar) is readable.
                  rounded-xl → matches the container's rounded corners.
                */}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl backdrop-blur-sm">
                {/*
                  HOVER OVERLAY for the clear button.
                  
                  opacity-0 → completely invisible by default.
                  group-hover:opacity-100 → becomes visible when the parent div is hovered.
                  
                  HOW group-hover WORKS:
                  The parent div has class "group".
                  group-hover:opacity-100 on this div activates when the GROUP parent is hovered.
                  Result: hover over the upload zone → dark overlay fades in → X button appears.
                  
                  bg-black/40 → dark semi-transparent overlay (40% opacity).
                  backdrop-blur-sm → blurs the image behind the overlay (frosted glass on preview).
                  transition-opacity → smooth fade-in/out of the overlay.
                */}
                    <button type="button" onClick={onClear} className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors">
                    {/*
                      type="button" → CRITICAL: prevents this button from submitting the form!
                      Without type="button" on a button inside a <form>, clicking it submits the form.
                      This button is inside Genetator.tsx's <form> → must be type="button".
                      
                      onClick={onClear} → calls parent's callback to clear the file:
                        Parent: onClear={() => setProductImage(null)}
                        → sets file state to null
                        → React re-renders UploadZone with file=null
                        → back to empty state
                      
                      hover:bg-red-500/20 → red tint on hover = visual warning (destructive action)
                      hover:text-red-400 → red icon on hover (further reinforces "this deletes")
                    */}
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/10">
                {/*
                  Filename display bar at the bottom of the preview.
                  absolute bottom-4 left-4 right-4 → spans full width at the bottom, with 16px margins.
                  bg-black/50 → dark semi-transparent background.
                  backdrop-blur-md → blurs the image behind it for readability.
                */}
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {/*
                      file.name → the original filename from the user's filesystem.
                      e.g., "product-photo-final-v3.jpg"
                      
                      truncate → CSS: text-overflow: ellipsis + overflow: hidden
                      If the filename is very long: "product-photo-final-v3-for-rea..." 
                      Prevents the filename from breaking the layout.
                    */}
                </div>
                </>
            ) : (
                // EMPTY STATE: no file selected yet
                <>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {/*
                  Icon container.
                  group-hover:scale-110 → grows to 110% when parent is hovered.
                  Creates a "spring" feeling — the icon pops on hover, inviting interaction.
                  transition-transform duration-300 → smooth 300ms scale transition.
                  rounded-full → circular icon container.
                  bg-white/5 → barely visible background circle.
                */}
                    <UploadIcon className="w-8 h-8 text-gray-400 group-hover:text-violet-400 transition-colors"/>
                    {/*
                      group-hover:text-violet-400 → icon color changes from gray to purple on hover.
                      Combined with the scale effect: gray → purple + grows = strong hover feedback.
                      transition-colors → smooth color transition.
                    */}
                </div>
                <h3 className="text-lg font-semibold mb-2">{label}</h3>
                {/*
                  {label} = prop from parent: "Product Image" or "Model Image".
                  Dynamic text → one component for both upload zones.
                */}
                <p className="text-sm text-gray-400 text-center max-w-[200px]">Drag & drop or click to upload</p>
                <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                {/*
                  THE HIDDEN FILE INPUT TRICK
                  ──────────────────────────────────────────────────────────────
                  
                  PROBLEM: Native HTML file inputs look ugly:
                  [Choose File] [No file chosen] ← browser default styling
                  You can't style them with CSS (browser restriction).
                  
                  SOLUTION: Make the input invisible but covering the entire zone.
                  
                  opacity-0 → completely invisible (but still in the DOM and clickable)
                  absolute inset-0 → covers the ENTIRE upload zone (full width and height)
                  w-full h-full → fills the container
                  cursor-pointer → shows hand cursor even though the input is invisible
                  
                  RESULT: The user sees the custom-designed upload zone.
                  When they click ANYWHERE inside it, they're actually clicking the
                  invisible file input → the browser's file picker dialog opens.
                  When they select a file, onChange fires → parent updates state.
                  
                  This technique is used by EVERY design-conscious file upload UI:
                  Dropbox, Canva, Figma, Cloudinary uploader, etc.
                  
                  type="file" → renders a file input (shows system file picker on click)
                  accept="image/*" → filters to image files only.
                    The browser file picker shows only image files.
                    * means all image subtypes: image/jpeg, image/png, image/webp, etc.
                    
                  onChange={onChange} → calls the parent callback when a file is selected.
                    Parent callback in Genetator.tsx:
                    const handleFileChange = (e) => {
                      if(e.target.files?.[0]) setProductImage(e.target.files[0])
                    }
                    e.target.files = FileList (the browser's selected files collection)
                    e.target.files[0] = the first (only) selected file
                  
                  NOTE: Why is the input only shown when file is null?
                  After a file is selected, the preview takes over.
                  The input is no longer needed (and would overlap with the preview).
                  
                  INTERVIEW Q: How do you create a custom file upload button?
                  A: Use a visually hidden <input type="file"> positioned over the custom UI.
                     Set opacity: 0 (not display: none — hidden inputs aren't clickable).
                     Size it to match the clickable area (absolute inset-0 w-full h-full).
                     Users see your custom design but click the invisible real input.
                */}
                </>
            )}
        </div>
      
    </div>
  )
}

export default UploadZone

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ UploadZone = controlled component (state lives in parent Genetator.tsx)
  ✔ file ? preview : uploadPrompt — conditional rendering on file state
  ✔ URL.createObjectURL(file) = browser-local preview URL (not uploaded yet)
  ✔ opacity-0 absolute inset-0 = invisible file input covering entire zone
  ✔ accept="image/*" = browser file picker shows images only
  ✔ type="button" on clear X button = prevents form submission
  ✔ group-hover:opacity-100 = overlay appears on hover (to show X button)
  ✔ group-hover:scale-110 = icon grows on hover (invites click)
  ✔ group-hover:text-violet-400 = icon color changes on hover
  ✔ truncate = long filenames get "..." instead of breaking layout

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Genetator.tsx import error
  ✘ No file upload UI — users can't select images
  ✘ Core feature (AI generation) completely breaks
*/
