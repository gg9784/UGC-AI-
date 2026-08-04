// ============================================================
// FILE: server/controllers/userController.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Contains the handler functions (controllers) for all user-related
//   routes. Controllers are responsible for:
//   1. Reading data from the request (req.params, req.body, req.auth())
//   2. Querying or mutating the database via Prisma
//   3. Sending a JSON response back to the client
//   4. Catching errors and reporting them (try/catch + Sentry)
//
// PATTERN: Every controller follows the same structure:
//   try {
//     const { userId } = req.auth()  // Who is this person?
//     ...                             // Do the work (DB query, etc.)
//     res.json({...})                 // Return success data
//   } catch (error) {
//     Sentry.captureException(error)  // Log to Sentry
//     res.status(500).json({...})     // Return error to client
//   }
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express'
// Request  = TypeScript type for incoming HTTP request objects.
// Response = TypeScript type for outgoing HTTP response objects.
// These are used to type the function parameters: (req: Request, res: Response)

import * as Sentry from "@sentry/node";
// Sentry = error tracking service. captureException() sends errors to
// the Sentry dashboard with full stack traces for debugging in production.

import { prisma } from '../configs/prisma.js';
// The shared Prisma ORM instance. Used for all database queries.

// ── CONTROLLER: getUserCredits ────────────────────────────
// GET /api/user/credits (via userRoutes.ts)
export const getUserCredits = async (req: Request, res: Response) => {
    try {

        const { userId } = req.auth();
        // req.auth() is injected by Clerk's middleware.
        // Returns { userId, has } for the authenticated user.
        // We destructure userId to identify who is making the request.
        // CRITICAL: userId is a Clerk User ID (e.g., "user_2abc123xyz").
        // This matches the `id` column in our User table (from clerk.ts webhook).

        if (!userId) { return res.status(401).json({ message: 'Unauthorized' }) }
        // Defensive check: if for any reason userId is falsy (shouldn't happen
        // after `protect` middleware), return 401 Unauthorized.
        // This is the "belt AND suspenders" approach to security.

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
        // findUnique → SQL: SELECT * FROM "User" WHERE id = $1 LIMIT 1 
        // Returns the User object or null if not found.
        // We only need the `credits` field, but Prisma returns the full row.
        // Optimization: prisma.user.findUnique({ where: {...}, select: { credits: true } })
        // would return only the credits column (saves bandwidth for large rows).

        res.json({ credits: user?.credits })
        // user?.credits uses optional chaining (?.) in case user is null.
        // If user is null: returns { credits: undefined }
        // Could be improved: if(!user) return res.status(404).json({message: 'User not found'})

    } catch (error: any) {
        Sentry.captureException(error);
        // Reports error to Sentry dashboard with context and stack trace.
        res.status(500).json({ message: error.code || error.message })
        // error.code = Pri sma-specific error codes (e.g., "P2025" = record not found)
        // error.message = the generic JavaScript error message
        // We prefer the Prisma code if available (more descriptive for DB errors).
    }
}

// ── CONTROLLER: getAllProjects ────────────────────────────
// GET /api/user/projects (via userRoutes.ts)
export const getAllProjects = async (req: Request, res: Response) => {
    try {

        const { userId } = req.auth();

        const projects = await prisma.project.findMany({
            where: { userId },
            // findMany with `where` = SELECT * FROM "Project" WHERE userId = $1
            // Only returns projects OWNED by this user (userId = their Clerk ID).
            // Other users' projects are invisible — this is AUTHORIZATION.

            orderBy: { createdAt: 'desc' }
            // Most recent projects appear first (descending = newest to oldest).
            // SQL: ORDER BY createdAt DESC
        })

        res.json({ projects })
        // Sends the array of projects as JSON.
        // Frontend: `const { data } = await api.get('/api/user/projects')`
        //            `data.projects` is this array.

    } catch (error: any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

// ── CONTROLLER: getProjectById ────────────────────────────
// GET /api/user/projects/:projectId (via userRoutes.ts)
export const getProjectById = async (req: Request, res: Response) => {
    try {

        const { userId } = req.auth();
        const { projectId } = req.params;
        // req.params contains URL parameters.
        // Route: /projects/:projectId → req.params.projectId = the actual ID
        // Example: GET /api/user/projects/abc-123 → projectId = "abc-123"

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId }
            // SECURITY: The `where` clause includes BOTH id AND userId.
            // SQL: SELECT * FROM "Project" WHERE id = $1 AND userId = $2
            // This means even if a user knows another project's ID,
            // they cannot fetch it — the userId filter ensures only the owner can access it.
            // Without this: any authenticated user could access ANY project by guessing the ID.
        })

        if (!project) { return res.status(404).json({ message: 'Project not found' }) }
        // 404 = Not Found.
        // This handles two cases:
        // 1. Project ID doesn't exist in the DB (typo or deleted project).
        // 2. Project exists but belongs to a DIFFERENT user (the userId filter returned null).
        // We return the same 404 for both cases intentionally (don't leak info about other users' projects).

        res.json({ project })

    } catch (error: any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

// ── CONTROLLER: toggleProjectPublic ──────────────────────
// GET /api/user/publish/:projectId (via userRoutes.ts)
export const toggleProjectPublic = async (req: Request, res: Response) => {
    try {

        const { userId } = req.auth();
        const { projectId } = req.params;

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId }
        })

        if (!project) { return res.status(404).json({ message: 'Project not found' }) }

        if (!project?.generatedImage && !project?.generatedVideo) {
            return res.status(404).json({ message: 'image or video not generated' })
            // Validation: you can only publish projects with generated content.
            // Prevents publishing a blank/failed project to the community gallery.
            // Without this check, a user could publish a project that's still generating.
        }

        await prisma.project.update({
            where: { id: projectId },
            data: { isPublished: !project.isPublished }
            // TOGGLE LOGIC: flip the boolean.
            // If isPublished = true → set to false (Unpublish)
            // If isPublished = false → set to true (Publish)
            // The `!` (NOT) operator inverts the current value.
            // SQL: UPDATE "Project" SET isPublished = NOT isPublished WHERE id = $1
        })

        res.json({ isPublished: !project.isPublished })
        // Returns the NEW value of isPublished (the toggled state).
        // Frontend (ProjectCard.tsx) uses this to update the button label
        // ("Publish" ↔ "Unpublish") without re-fetching the full project.
        // This is called OPTIMISTIC UI UPDATE — the UI changes instantly based
        // on the server's confirmation, without a full data reload.

    } catch (error: any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: HTTP Status Codes
  ─────────────────────────────────────────────────────────────
  200 OK            → Default for successful responses (res.json sends 200 automatically)
  400 Bad Request   → The client sent invalid data
  401 Unauthorized  → Missing or invalid authentication (not logged in)
  403 Forbidden     → Authenticated but not allowed to access this resource
  404 Not Found     → The requested resource doesn't exist
  500 Server Error  → Something crashed on the server side
  
  This codebase uses:
  200: All successful responses
  401: Auth check failure
  404: Project not found / content not generated
  500: Any unexpected error (DB error, Prisma error)

  CONCEPT: Authorization vs Authentication
  ─────────────────────────────────────────────────────────────
  Authentication: "Who are you?" → verified by JWT → req.auth().userId
  Authorization:  "Are you ALLOWED to do this?"
  
  In getProjectById: where: {id: projectId, userId}
  → Authentication: the protect middleware already verified the JWT.
  → Authorization: this WHERE clause verifies the user OWNS this specific project.
  Both are required. A user is authenticated to the app,
  but not authorized to see OTHER users' projects.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ req.auth().userId = the authenticated user's Clerk ID
  ✔ findUnique with both id AND userId = authorization (ownership check)
  ✔ !project.isPublished → toggle boolean without reading-writing separately
  ✔ res.json({...}) → automatically sends HTTP 200 with JSON Content-Type
  ✔ Sentry.captureException(error) → reports errors to monitoring dashboard
  ✔ error.code → Prisma error code; error.message → JS error message
  ✔ Validation: can't publish a project without generated content
*/