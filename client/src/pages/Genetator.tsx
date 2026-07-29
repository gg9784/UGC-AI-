/*
  ============================================================
  FILE: client/src/pages/Genetator.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    This is the core "Create" page where users upload a product photo,
    a model photo, set a name, and submit them to the AI backend.

  KEY CONCEPTS TAUGHT:
    • Controlled Forms: React state manages every input value.
    • FormData API: How to send Files + Text via HTTP POST.
    • Protected Actions: Validating auth state before submission.
    • Form validation: ensuring all required fields are filled.
    • Loading states: disabling buttons during API calls to prevent double-submits.
  ─────────────────────────────────────────────────────────────
*/

import React, { useState } from "react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { Loader2Icon, RectangleHorizontalIcon, RectangleVerticalIcon, Wand2Icon } from "lucide-react"
import { PrimaryButton } from "../components/Buttons"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../configs/axios"

const Genetator = () => {

  // ── HOOKS ──────────────────────────────────────────────────
  const {user} = useUser()
  // `user` is null if the user is not signed in.
  const {getToken} = useAuth()
  // `getToken` retrieves a fresh authentication token to send to the backend.
  const navigate = useNavigate()
  // `navigate` handles client-side redirects (e.g. going to the Result page).

  // ── FORM STATE ─────────────────────────────────────────────
  /*
    CONTROLLED COMPONENT PATTERN:
    Every input field on the page is tied to a piece of React state.
    When the user types, the onChange handler updates the state.
    When React re-renders, the input displays the new state value.
    This gives React total control over the form data.
  */
  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  
  // File state can either be a JavaScript `File` object or `null`
  const [productImage, setProductImage] = useState<File | null>(null)
  const [modelImage, setModelImage] = useState<File | null>(null)
  
  const [userPrompt, setUserPrompt] = useState('')
  
  // Controls the submit button loading spinner and disabled state
  const [isGenerating, setIsGenerating] = useState(false)

  // ── HANDLERS ───────────────────────────────────────────────

  /**
   * handleFileChange
   * Called by the <UploadZone> component when a user selects a file.
   * 
   * @param e - The onChange event from the hidden <input type="file">
   * @param type - 'product' or 'model' to determine which state to update
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'model')=>{
    // e.target.files is a FileList array-like object provided by the browser.
    if(e.target.files && e.target.files[0]){
      // Only extract the first file (index 0) because we only allow single-file uploads.
      if(type === 'product') setProductImage(e.target.files[0]);
      else setModelImage(e.target.files[0])
    }
  }

  /**
   * handleGenerate
   * Fired when the user clicks the "Generate Image" submit button.
   */
  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    /*
      e.preventDefault() STOPS the browser from refreshing the page.
      Native HTML <form> submission triggers a full page reload by default.
      In a Single Page Application (SPA) like React, we must prevent this
      and handle the submission via JavaScript/AJAX instead.
    */

    if(!user) return toast('Please login to generate')
    /*
      PROTECTED ACTION:
      Even if the user navigates here via direct URL while logged out,
      they cannot submit the form. (The backend would block them anyway,
      but front-end checks provide immediate feedback).
    */

    // Basic validation: ensure all required fields are provided
    if(!productImage || !modelImage || !name || !productName || !aspectRatio) return toast('Please fill all the required fields')
    
      try {
        setIsGenerating(true);
        // Lock the UI so the user can't click "Generate" multiple times.

        /*
          THE FORMDATA API
          ────────────────────────────────────────────────────────────
          When you need to upload FILES alongside regular text fields,
          you cannot use a standard JSON body ({ "name": name, ... }).
          JSON cannot natively encode binary file data efficiently.
          
          Instead, you use FormData, which creates a `multipart/form-data` payload.
          This is exactly what standard HTML forms do natively.
        */
        const formData = new FormData();

        // Append text fields
        formData.append('name', name)
        formData.append('productName', productName)
        formData.append('productDescription', productDescription)
        formData.append('userPrompt', userPrompt)
        formData.append('aspectRatio', aspectRatio)
        
        // Append binary File objects
        // The backend `multer` middleware is expecting an array of files under the 'images' field.
        // Calling append() multiple times with the same key ('images') adds them to an array!
        formData.append('images', productImage)
        formData.append('images', modelImage)

        // Get the JWT token
        const token = await getToken()

        // Send POST request with the FormData payload
        const { data } = await api.post('/api/project/create', formData, {
           headers: { 
             Authorization: `Bearer ${token}` 
             // Axios automatically sets the Content-Type to `multipart/form-data` 
             // when it detects a FormData object in the payload!
           }
        })

        toast.success(data.message)
        
        // Redirect the user to the Result page for this specific new project
        navigate('/result/' + data.projectId)

      } catch (error: any) {
        setIsGenerating(false);
        // On error, unlock the form so they can try again.
        toast.error(error?.response?.data?.message || error.message)
      }
  }

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-28">

      {/* 
        onSubmit={handleGenerate}
        This is bound to the <form> element, NOT the submit button.
        This ensures the form submits if the user hits the "Enter" key on their keyboard.
      */}
      <form onSubmit={handleGenerate} className="max-w-4xl mx-auto mb-40"> 

        <Title heading='Create In-Context Image' description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"/>

        <div className="flex gap-20 max-sm:flex-col items-start justify-between">
          
          {/* ── LEFT COLUMN (File Uploads) ── */}
          <div className="flex flex-col w-full sm:max-w-60 gap-8 mt-8 mb-12">
            
            {/* 
              UploadZone receives:
              1. file: the current File object (or null)
              2. onClear: callback to wipe the state
              3. onChange: callback to update the state from the hidden input
            */}
            <UploadZone label="Product Image" file={productImage} onClear={()=>setProductImage(null)} onChange={(e)=>handleFileChange(e, 'product')}/>
            <UploadZone label="Model Image" file={modelImage} onClear={()=>setModelImage(null)} onChange={(e)=>handleFileChange(e, 'model')}/>
          </div>

          {/* ── RIGHT COLUMN (Text Inputs) ── */}
          <div className="w-full">
            <div className="mb-4 text-gray-300">
              <label htmlFor="name" className="block text-sm mb-4">Project Name</label>
              <input type="text" id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name your project" required className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all"/>
              {/* 
                value={name} onChange={(e)=>setName(...)}
                This creates a controlled input. React dictates its value.
              */}
            </div>
            
            <div className="mb-4 text-gray-300">
              <label htmlFor="productName" className="block text-sm mb-4">Product Name</label>
              <input type="text" id="productName" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="Enter the name of the product" required className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all"/>
            </div>
            
            <div className="mb-4 text-gray-300">
              <label htmlFor="productDescription" className="block text-sm mb-4">Product Description <span className="text-xs text-violet-400">(optional)</span></label>
              <textarea id="productDescription" rows={4} value={productDescription} onChange={(e)=>setProductDescription(e.target.value)} placeholder="Enter the description of the product"
                className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none resize-none transition-all"/>
            </div>

            <div className="mb-4 text-gray-300">
              <label className="block text-sm mb-4">Aspect Ratio</label>
              <div className="flex gap-3">
                {/* 
                  Custom Aspect Ratio selector using Icons.
                  Clicking an icon updates the state string.
                  Conditional CSS classes highlight the selected option by comparing state.
                */}
                <RectangleVerticalIcon onClick={()=>setAspectRatio('9:16')} className={`p-2.5 size-13 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer ${aspectRatio === '9:16' ? 'ring-violet-500/50 bg-white/10' : ''}`}/>
                <RectangleHorizontalIcon onClick={()=>setAspectRatio('16:9')} className={`p-2.5 size-13 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer ${aspectRatio === '16:9' ? 'ring-violet-500/50 bg-white/10' : ''}`}/>
              </div>
            </div>

            <div className="mb-4 text-gray-300">
              <label htmlFor="userPrompt" className="block text-sm mb-4">User Prompt <span className="text-xs text-violet-400">(optional)</span></label>
              <textarea id="userPrompt" rows={4} value={userPrompt} onChange={(e)=>setUserPrompt(e.target.value)} placeholder="Describe how you want the narration to be."
                className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none resize-none transition-all"/>
            </div>

          </div>
        </div>
        
        {/* ── SUBMIT BUTTON ── */}
        <div className="flex justify-center mt-10">
          <PrimaryButton disabled={isGenerating} className="px-10 py-3 rounded-md disabled:opacity-70 disabled:cursor-not-allowed">
            {/* Conditional Rendering inside the button based on loading state */}
            {isGenerating ? (
              <>
              {/* Spinner icon indicating work is in progress */}
              <Loader2Icon className="size-5 animate-spin"/> Generating...
              </>
            ) : (
            <>
              <Wand2Icon className="size-5"/> Generate Image
            </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

export default Genetator

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: FormData vs JSON Payloads
  ─────────────────────────────────────────────────────────────
  If your form only has text fields, JSON is great.
  But JSON cannot serialize a raw File object natively.
  
  When you need to send files, you MUST use `new FormData()`.
  The browser compiles this into a `multipart/form-data` HTTP request.
  
  Example:
  const fd = new FormData();
  fd.append('username', 'john_doe'); // Text
  fd.append('avatar', fileObject);   // Binary File
  
  Axios automatically sets the correct boundary headers when it sees FormData!

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ e.preventDefault() stops the page from reloading on form submit.
  ✔ Controlled inputs map their `value` to state and update via `onChange`.
  ✔ File arrays are handled by calling `formData.append('key', file)` multiple times.
  ✔ Button should be disabled (`disabled={isGenerating}`) during API calls to prevent spamming.
  ✔ useAuth().getToken() is used to securely authorise the POST request.

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Users cannot create new AI generations. The core app utility breaks.
*/
