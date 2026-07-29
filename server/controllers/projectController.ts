// ============================================================
// FILE: server/controllers/projectController.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   The most complex file in the backend. Contains the AI pipeline:
//   1. createProject  → Upload images → Call Gemini AI → Store result in DB
//   2. createVideo    → Animate image → Call Veo AI → Poll for completion → Store
//   3. getAllPublishedProjects → Fetch public community projects
//   4. deleteProject  → Remove a project (only by its owner)
//
// KEY DESIGN PATTERNS:
//   • Credit Deduction with Rollback (Transactional-style logic without DB transactions)
//   • Long-running Job Polling (while loop with sleep for Veo video generation)
//   • Fail-Safe Error Recovery (restore credits if AI job fails)
//   • Base64 Image Encoding (for passing images to the Gemini API)
// ─────────────────────────────────────────────────────────────

import {Request, Response } from 'express'
import * as Sentry from "@sentry/node";
import { prisma } from '../configs/prisma.js';

import {v2 as cloudinary } from 'cloudinary'
// cloudinary = the v2 (latest) Node.js SDK for Cloudinary CDN.
// Cloudinary = cloud media storage and transformation service.
// All images and videos are uploaded HERE, not stored on our server disk.
// Why? Cloudinary provides:
//   - Globally distributed CDN (fast delivery worldwide)
//   - Automatic image optimization (WebP conversion, compression)
//   - On-the-fly transformations (resize, crop, format conversion)
//   - The fl_attachment flag used for downloads in the frontend
// The credentials (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) are read
// from .env automatically when cloudinary is imported.

import {GenerateContentConfig, HarmBlockThreshold, HarmCategory} from '@google/genai'
// Importing specific TypeScript types/enums from the Google Gen AI SDK.
// GenerateContentConfig = TypeScript type for the config object passed to generateContent().
// HarmCategory = enum of AI safety categories (HATE_SPEECH, DANGEROUS_CONTENT, etc.)
// HarmBlockThreshold = enum for how strictly to block harmful content (OFF, LOW, MEDIUM, HIGH)

import fs from 'fs';
// Node.js built-in module for File System operations.
// Used for:
//   fs.readFileSync(path) → Read an uploaded temp file as Buffer
//   fs.mkdirSync(...)     → Create the `videos/` directory if it doesn't exist
//   fs.unlinkSync(path)   → Delete the temp video file from disk after uploading to Cloudinary

import path from 'path';
// Node.js built-in module for file path manipulation.
// path.join('videos', filename) → creates "videos/userId-timestamp.mp4"
// Handles OS differences (Windows uses \, Linux uses /)

import ai from '../configs/ai.js';
// The shared GoogleGenAI instance from configs/ai.ts

import axios from 'axios';
// axios = HTTP client library.
// Used in createVideo to download the generated image from Cloudinary
// as a binary buffer before passing it to the Veo video API.
// (Veo requires the image bytes, not just a URL)

// ── HELPER FUNCTION: loadImage ────────────────────────────
const loadImage = (path: string, mimeType: string) => {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString('base64'),
            // fs.readFileSync(path) → reads the file from disk as a binary Buffer
            // .toString('base64')   → converts binary Buffer to a Base64-encoded string
            //
            // WHY BASE64?
            // HTTP and JSON are text-based protocols — they can't carry raw binary data natively.
            // Base64 encodes binary data as printable ASCII characters.
            // This lets us embed image bytes directly inside a JSON payload.
            //
            // The Gemini API specifically expects images as base64 strings in the `inlineData` format.
            // inlineData.data = the base64 string
            // inlineData.mimeType = tells Gemini what kind of data it is (e.g., "image/jpeg")
            //
            // INTERVIEW Q: What is Base64 encoding?
            // A: A binary-to-text encoding scheme that represents binary data using 64 printable
            //    ASCII characters (A-Z, a-z, 0-9, +, /). Increases data size by ~33% but
            //    allows binary data to be safely transmitted in text-based protocols (JSON, XML, email).
            mimeType
        }
    }
}

// ── CONTROLLER: createProject ─────────────────────────────
// POST /api/project/create (via projectRoutes.ts)
export const createProject = async (req:Request, res: Response) => {
    let tempProjectId: string;
    // Stores the created project's ID for error recovery.
    // Declared with `let` outside try block so the catch block can access it.

    const { userId } = req.auth();

    let isCreditDeducted = false;
    // Flag to track if credits were already deducted.
    // If the AI call fails AFTER credit deduction, we refund them.
    // This is the "manual rollback" pattern (no DB transactions used here).

    const {name = 'New Project', aspectRatio, userPrompt, productName, productDescription, targetLength = 5} = req.body;
    // Destructure form fields from the request body.
    // req.body is populated by express.json() for JSON bodies OR by Multer for multipart forms.
    // Default values: name defaults to 'New Project', targetLength defaults to 5.

    const images: any = req.files;
    // req.files = array of file objects populated by Multer middleware.
    // Each object has: { path: '/tmp/abc', mimetype: 'image/jpeg', originalname: '...', size: ... }
    // We cast to `any` to avoid verbose Multer type declarations.

    // VALIDATION
    if(images.length < 2 || !productName){
        return res.status(400).json({message: 'Please upload at least 2 images'})
    }
    // Requires exactly 2 images (product + model) and a product name.
    // 400 = Bad Request (client sent invalid data).

    // CREDIT CHECK (outside try block — part of business logic, not error handling)
    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if(!user || user.credits < 5){
        return res.status(401).json({message: 'Insufficient credits'})
        // Image generation costs 5 credits.
        // Return 401 if credits are too low (could also be 402 Payment Required).
    } else {
        await prisma.user.update({
            where: {id: userId},
            data: {credits: {decrement: 5}}
            // {decrement: 5} = Prisma shorthand for: credits = credits - 5
            // Atomic operation — prevents race conditions where two simultaneous
            // requests both read credits=10 and both decrement to 5 instead of 0.
        }).then(() => {isCreditDeducted = true});
        // Set the flag ONLY after successful deduction.
        // If the update fails, isCreditDeducted remains false → no refund needed.
    }

    try {
        // ── STEP 1: UPLOAD SOURCE IMAGES TO CLOUDINARY ──
        let uploadedImages = await Promise.all(
            images.map(async(item: any)=>{
                let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
                return result.secure_url
            })
        )
        // Promise.all([...]) → Runs all Cloudinary uploads IN PARALLEL.
        // Without Promise.all: uploads run sequentially (slower).
        // With Promise.all: both images upload simultaneously (faster).
        //
        // images.map() creates an array of Promises.
        // Promise.all() waits for ALL of them to resolve.
        // Returns an array of secure_url strings: ["https://res.cloudinary.com/...", "https://..."]
        //
        // INTERVIEW Q: What is Promise.all()?
        // A: Takes an array of Promises and returns a single Promise that resolves
        //    when ALL input Promises resolve, or rejects immediately if any one fails.
        //    Used to run multiple async operations IN PARALLEL instead of sequentially.

        // ── STEP 2: CREATE PROJECT RECORD IN DB ──
         const project = await prisma.project.create({
            data: {
                name,
                userId,
                productName,
                productDescription,
                userPrompt,
                aspectRatio,
                targetLength: parseInt(targetLength),
                // parseInt: URL params and form data come as strings. Convert to integer.
                uploadedImages,
                // The Cloudinary URLs from Step 1.
                isGenerating: true
                // Mark as generating — frontend polls every 10s and waits for false.
            }
         })
         tempProjectId = project.id;
         // Save project ID for error recovery in the catch block.

        // ── STEP 3: CONFIGURE GEMINI AI ──
         const model = 'gemini-3-pro-image-preview';
         // The specific Gemini model for image generation.
         // Different models have different capabilities, costs, and quality levels.

         const generationConfig: GenerateContentConfig = {
            maxOutputTokens: 32768,
            // Maximum tokens in the response. Higher = more detail in generated output.
            // For images, this controls the image data size.
            temperature: 1,
            // Controls randomness/creativity. 0 = deterministic, 2 = very random.
            // 1 = balanced. Good for creative image generation.
            topP: 0.95,
            // Nucleus sampling: consider only tokens comprising the top 95% of probability mass.
            // Works with temperature to control output diversity.
            responseModalities: ['IMAGE'],
            // Tell Gemini we want an IMAGE response, not text.
            imageConfig: {
                aspectRatio: aspectRatio || '9:16',
                imageSize: '1K'
                // 1K = 1024px resolution (1024x1024 for square, or proportional for 9:16)
            },
            safetySettings: [
                // Configure content safety thresholds for each harm category.
                // OFF = don't block anything in this category.
                // For UGC/product photos, we need lenient settings to allow
                // realistic skin tones, swimwear, etc. that might trigger conservative filters.
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.OFF,
                },
            ]
         }

        // ── STEP 4: PREPARE IMAGES FOR GEMINI ──
         const img1base64 = loadImage(images[0].path, images[0].mimetype);
         const img2base64 = loadImage(images[1].path, images[1].mimetype);
         // Read files from disk temp location and encode as base64.
         // images[0] = product image (first uploaded)
         // images[1] = model image (second uploaded)

         const prompt = {
            text: `Combine the person and product into a realistic photo.
            Make the person naturally hold or use the product.
            Match lighting, shadows, scale and perspective.
            Make the person stand in professional studio lighting.
            Output ecommerce-quality photo realistic imagery.
            ${userPrompt}`
            // The base prompt always requests realistic composite photography.
            // ${userPrompt} appends the user's custom instructions at the end.
            // This is PROMPT ENGINEERING — crafting text instructions to guide AI output.
         }

        // ── STEP 5: CALL GEMINI AI ──
         const response: any = await ai.models.generateContent({
            model,
            contents: [img1base64, img2base64, prompt],
            // contents = the multimodal input array:
            //   [image1 (base64), image2 (base64), text prompt]
            // Gemini Pro Image processes ALL inputs together to generate the composite.
            config: generationConfig,
         })

         // Validate response structure
         if(!response?.candidates?.[0]?.content?.parts){
            throw new Error('Unexpected response')
         }
         // Optional chaining (?.) safely navigates the nested response object.
         // If any part is undefined, it returns undefined instead of throwing.

         const parts = response.candidates[0].content.parts;
         
         let finalBuffer: Buffer | null = null

         for(const part of parts){
            if(part.inlineData){
                finalBuffer = Buffer.from(part.inlineData.data, 'base64')
                // Convert the base64-encoded response image back to a binary Buffer.
                // Buffer.from(string, 'base64') = base64 string → raw bytes
            }
         }
         // The Gemini response `parts` array can contain multiple items.
         // We look for the part that contains inlineData (the image bytes).
         // Other parts might contain text (captions, etc.) which we ignore.

         if(!finalBuffer){
            throw new Error('Failed to generate image');
         }

         // ── STEP 6: UPLOAD GENERATED IMAGE TO CLOUDINARY ──
         const base64Image = `data:image/png;base64,${finalBuffer.toString('base64')}`
         // Create a Data URI: a string format that encodes a file directly in a URL.
         // Format: data:[mimeType];base64,[base64data]
         // Cloudinary's upload function accepts Data URIs for programmatic uploads.

         const uploadResult = await cloudinary.uploader.upload(base64Image, {resource_type: 'image'});
         // Upload the generated image to Cloudinary.
         // Returns: { secure_url: "https://res.cloudinary.com/...", public_id: "...", ... }

        // ── STEP 7: UPDATE PROJECT WITH RESULTS ──
         await prisma.project.update({
            where: {id: project.id},
            data: {
                generatedImage: uploadResult.secure_url,
                isGenerating: false
                // Mark generation complete. Frontend polling will see isGenerating=false and stop.
            }
         })

         res.json({projectId: project.id})
         // Return the project ID. Frontend navigates to /result/:projectId.
        
    } catch (error:any) {
        // ── ERROR RECOVERY ───────────────────────────────────
        if(tempProjectId!){
            // If a project was created before the error, update its status.
            // The `!` after `tempProjectId` is a TypeScript non-null assertion
            // (tells TypeScript "I know this is set"). But the JS `if(tempProjectId)` 
            // already guards against it being undefined.
            await prisma.project.update({
                where: {id: tempProjectId},
                data: {isGenerating: false, error: error.message}
                // Mark as failed so the frontend doesn't keep polling forever.
                // Save the error message for debugging.
            })
        }

        if(isCreditDeducted){
            // CREDIT ROLLBACK: Refund the 5 credits if the AI call failed.
            // Without this: user loses credits but gets no generated image.
            // This manual rollback simulates a database transaction without
            // actually using one (Prisma supports $transaction() for true transactions).
            await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 5}}
            })
        }

        Sentry.captureException(error);
        res.status(500).json({ message: error.message });
    }
}


// ── CONTROLLER: createVideo ───────────────────────────────
// POST /api/project/video (via projectRoutes.ts)
export const createVideo = async (req:Request, res: Response) => {
    const {userId} = req.auth()
    const { projectId } = req.body;
    let isCreditDeducted = false;

    // ── CREDIT CHECK ─────────────────────────────────────────
    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if(!user || user.credits < 10){
        return res.status(401).json({ message: 'Insufficient credits' });
        // Video generation costs 10 credits (double the image cost).
    }

    await prisma.user.update({
        where: {id: userId},
        data: {credits: {decrement: 10}}
    }).then(() => { isCreditDeducted = true });
    // Deduct 10 credits BEFORE the API call.
    // If we deducted AFTER and the API succeeded but the DB update failed,
    // the user would get a free video. Pre-deduction is safer.

    try {
        const project = await prisma.project.findUnique({
            where: {id: projectId, userId},
            include: {user: true}
            // include: {user: true} → JOIN with the User table.
            // Returns the project WITH the user object embedded.
            // Not strictly needed here (user data isn't used), but shows the pattern.
        })

        if(!project || project.isGenerating){
            return res.status(404).json({ message: 'Generation in progress' });
            // Can't start video generation if image generation is still running.
        }

        if(project.generatedVideo){
            return res.status(404).json({ message: 'Video already generated' });
            // Idempotency check: don't allow re-generation if video exists.
            // Prevents double-spending credits.
        }

        // Mark project as generating (frontend polls this)
        await prisma.project.update({
            where: {id: projectId},
            data: {isGenerating: true}
        })

        // Build the video generation prompt
        const prompt = `make the person showcase the product which is ${project.productName} ${project.productDescription && `and Product Description: ${project.productDescription}`}`
        // Template literal builds a natural-language prompt.
        // project.productDescription && `...` = only include description if it exists.
        // Example: "make the person showcase the product which is Nike Air Max and Product Description: Running shoe"

        const model = 'veo-3.1-generate-preview'
        // Veo = Google's video generation AI model.
        // veo-3.1-generate-preview = a specific version of Veo.
        // Requires image input to animate (image-to-video generation).

        if(!project.generatedImage){
            throw new Error('Generated image not found');
        }

        // ── DOWNLOAD THE GENERATED IMAGE ─────────────────────
        const image = await axios.get(project.generatedImage, {responseType: 'arraybuffer'})
        // Download the image from Cloudinary as a binary arraybuffer.
        // responseType: 'arraybuffer' → axios returns the response body as raw bytes (not JSON/text).
        // WHY? Veo requires the actual image bytes, not just the Cloudinary URL.
        
        const imageBytes: any = Buffer.from(image.data)
        // Convert the arraybuffer to a Node.js Buffer.
        // Buffer = Node.js's representation of binary data.

        // ── CALL VEO VIDEO API ────────────────────────────────
        let operation: any = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBytes.toString('base64'),
                // Pass image as base64 string (same pattern as Gemini image API).
                mimeType: 'image/png',
            },
            config: {
                aspectRatio: project?.aspectRatio || '9:16',
                numberOfVideos: 1,
                resolution: '720p',
            }
        })
        // generateVideos() returns a Long-Running Operation (LRO).
        // Like a "job ticket" — the AI is working in the background.
        // operation.done = false initially. We need to poll until done = true.

        // ── POLL FOR VIDEO COMPLETION ─────────────────────────
        while (!operation.done){
            console.log('Waiting for video generation to complete...');
            await new Promise((resolve) => setTimeout(resolve, 10000));
            // ASYNC SLEEP: Pause for 10,000ms (10 seconds).
            //
            // new Promise((resolve) => setTimeout(resolve, 10000))
            // Creates a Promise that resolves after 10 seconds.
            // `await` pauses the async function until the Promise resolves.
            // This is the idiomatic way to "sleep" in async JavaScript.
            //
            // WHY POLL? Video generation takes 30-120 seconds.
            // We can't hold the HTTP connection open for 2 minutes (timeouts).
            // Instead we "start job → poll until done" asynchronously.
            //
            // INTERVIEW Q: How do you implement async polling in Node.js?
            // A: while(!done) { await sleep(10000); checkStatus() }
            //    This blocks the current async function but doesn't block Node's event loop.
            //    Other requests can be handled while we're sleeping.
            
            operation = await ai.operations.getVideosOperation({
                operation: operation,
                // Pass the operation reference to check its current status.
            })
            // If done: operation.done = true → loop exits
        }

        // ── VIDEO IS READY ────────────────────────────────────
        const filename = `${userId}-${Date.now()}.mp4`;
        // Unique filename: userId + current timestamp in milliseconds.
        // Date.now() = milliseconds since Unix epoch (Jan 1, 1970).
        // Example: "user_2abc-1748516400000.mp4"
        // Collision-resistant: same user can't generate two videos at the exact same millisecond.
        
        const filePath = path.join('videos', filename)
        // path.join creates: "videos/user_2abc-1748516400000.mp4"
        // path.join handles OS-specific separators (\ on Windows, / on Linux).

        fs.mkdirSync('videos', {recursive: true})
        // Create the `videos/` directory if it doesn't already exist.
        // {recursive: true} prevents errors if the directory already exists.
        // Without this: the download would fail because the directory doesn't exist.

        if(!operation.response.generatedVideos){
            throw new Error(operation.response.raiMediaFilteredReasons[0])
            // RAI = Responsible AI. If the video was filtered (blocked by safety),
            // raiMediaFilteredReasons contains the reason why.
        }

        // ── DOWNLOAD THE GENERATED VIDEO ─────────────────────
        await ai.files.download({
            file: operation.response.generatedVideos[0].video,
            downloadPath: filePath,
            // Download from Google's servers directly to our disk.
        })

        // ── UPLOAD VIDEO TO CLOUDINARY ────────────────────────
        const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: 'video' });
        // Upload the video file from disk to Cloudinary.
        // resource_type: 'video' tells Cloudinary to process it as video (not image).
        // Returns { secure_url: "https://res.cloudinary.com/.../video.mp4", ... }

        // ── UPDATE PROJECT IN DB ──────────────────────────────
        await prisma.project.update({
            where: {id: project.id},
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false
            }
        })

        // ── CLEANUP TEMP FILE ─────────────────────────────────
        fs.unlinkSync(filePath);
        // Delete the temporary video file from our server disk.
        // After uploading to Cloudinary, we don't need the local copy.
        // Without this: disk fills up over time with temp video files.
        // PRODUCTION NOTE: In serverless environments (Vercel), the filesystem
        // is read-only or ephemeral, so disk cleanup is even more important.

        res.json({message: 'Video generation completed', videoUrl: uploadResult.secure_url})
        
    } catch (error:any) {
        // ── ERROR RECOVERY ───────────────────────────────────
        await prisma.project.update({
            where: {id: projectId, userId},
            data: {isGenerating: false, error: error.message}
        })

        if(isCreditDeducted){
            // Refund 10 credits on failure.
            await prisma.user.update({
                where: {id: userId},
                data: {credits: {increment: 10}}
            })
        }

        Sentry.captureException(error);
        res.status(500).json({ message: error.message });
    }
}

// ── CONTROLLER: getAllPublishedProjects ───────────────────
// GET /api/project/published (via projectRoutes.ts — NO auth required)
export const getAllPublishedProjects = async (req:Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            where: {isPublished: true}
            // Only returns projects the owner has chosen to make public.
        })
        res.json({projects})

    } catch (error:any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.message });
    }
}

// ── CONTROLLER: deleteProject ─────────────────────────────
// DELETE /api/project/:projectId (via projectRoutes.ts)
export const deleteProject = async (req:Request, res: Response) => {
    try {
        const { userId } = req.auth();
        const { projectId } = req.params;

        const project = await prisma.project.findUnique({
            where: {id: projectId, userId}
            // AUTHORIZATION: find only if user owns it.
        })

         if (!project){
            return res.status(404).json({ message: 'Project not found' });
         }

         await prisma.project.delete({
            where: {id: projectId}
            // Hard delete — permanently removes the row from the DB.
            // Cloudinary assets (uploaded images/videos) are NOT deleted here.
            // Production improvement: also call cloudinary.uploader.destroy() to
            // remove media files and save Cloudinary storage costs.
         })

         res.json({ message: 'Project deleted' });

    } catch (error:any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.message });
    }
}

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Manual Credit Rollback (Poor Man's Transaction)
  ─────────────────────────────────────────────────────────────
  A proper DB transaction: BEGIN → deduct credits → generate → COMMIT (or ROLLBACK on error)
  This code doesn't use transactions, so it manually tracks:
    1. isCreditDeducted flag
    2. On error: if(isCreditDeducted) → add credits back
  
  Prisma supports true transactions:
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 5 } } }),
    prisma.project.create({ data: {...} })
  ])
  
  True transactions are atomic: either BOTH succeed or BOTH fail.
  The manual approach here has a small risk window (crash between deduct and refund).

  CONCEPT: Long-Running Operations (LRO) Polling
  ─────────────────────────────────────────────────────────────
  Pattern for async AI jobs:
  
  1. Start job: operation = await startJob()  → operation.done = false
  2. Poll loop: while(!operation.done) { sleep(10s); operation = await checkStatus() }
  3. Done:       processResult(operation.response)
  
  This is used by many AI APIs (Google, OpenAI DALL-E 3, Replicate, etc.)
  where the result takes 30s-5min. You can't hold an HTTP connection open that long.

  CONCEPT: Multimodal AI (Multiple Input Types)
  ─────────────────────────────────────────────────────────────
  Gemini Pro Image is a MULTIMODAL model — it accepts multiple types of input:
    contents: [image1, image2, textPrompt]
  
  Multimodal = processes images + text simultaneously.
  The model "sees" the product image, "sees" the model image, "reads" the prompt,
  and synthesizes them into a single composite output image.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ loadImage() → fs.readFileSync → Buffer → .toString('base64') → inlineData for Gemini
  ✔ Promise.all(images.map(upload)) = parallel Cloudinary uploads
  ✔ isCreditDeducted flag → enables credit refund on AI failure
  ✔ while(!operation.done) + await sleep(10000) = LRO polling pattern
  ✔ new Promise(resolve => setTimeout(resolve, 10000)) = async sleep
  ✔ fs.mkdirSync('videos', {recursive: true}) = safe directory creation
  ✔ fs.unlinkSync(filePath) = delete temp video after Cloudinary upload
  ✔ responseType: 'arraybuffer' → axios returns binary data
  ✔ data:image/png;base64,... = Data URI format for Cloudinary programmatic upload
  ✔ prisma.project.delete = hard delete (Cloudinary assets NOT cleaned up)

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ All project creation, video generation, and deletion breaks
  ✘ The core product (UGC generation) completely stops working
*/