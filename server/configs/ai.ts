// ============================================================
// FILE: server/configs/ai.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Creates and exports a SINGLE Google Gemini AI client instance.
//   Follows the same Module Singleton pattern as configs/prisma.ts.
//   Every controller that needs to call the AI imports `ai` from here.
//
// WHERE IT'S USED:
//   projectController.ts:
//   - ai.models.generateContent({...}) → Calls Gemini Pro Image model
//   - ai.models.generateVideos({...})  → Calls Veo video model
//   - ai.operations.getVideosOperation({...}) → Polls video job status
//   - ai.files.download({...})         → Downloads the generated video file
// ─────────────────────────────────────────────────────────────

import { GoogleGenAI } from '@google/genai';
// @google/genai = Google's official Node.js SDK for Gemini AI.
// GoogleGenAI = the main class. Instantiated with an API key.
// Once instantiated, it exposes:
//   ai.models       → Access model generation methods (text, image, video)
//   ai.operations   → Manage long-running async operations (video generation)
//   ai.files        → File management (upload, download, delete)
//
// INTERVIEW Q: What is the Google Gen AI SDK?
// A: It's Google's official JavaScript/TypeScript SDK for accessing Gemini models
//    (text generation, image generation, video generation) and Veo (video AI).
//    It handles authentication, request formatting, response parsing, and
//    long-running operation polling for async tasks like video generation.

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
    // The API key authenticates our server to Google's AI APIs.
    // Stored in .env as GOOGLE_CLOUD_API_KEY.
    // NEVER hardcode this — it has billing attached and rate limits.
    // If leaked, someone else can run expensive AI generations on your account.
    //
    // WHERE TO GET IT:
    // Google AI Studio → https://aistudio.google.com/app/apikey
    // Create a project → Create API Key → copy to .env
})
// This single `ai` instance is shared by all requests.
// The SDK manages connection pooling and retry logic internally.

export default ai;
// Default export. Imported in projectController.ts as:
//   import ai from '../configs/ai.js';

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ GoogleGenAI = official Google SDK for Gemini and Veo models
  ✔ Module Singleton: one ai instance shared across all controllers
  ✔ apiKey from process.env — never hardcoded
  ✔ ai.models.generateContent → image generation (Gemini)
  ✔ ai.models.generateVideos  → video generation (Veo)
  ✔ ai.operations.getVideosOperation → poll async video job
  ✔ ai.files.download → download completed video to disk
*/