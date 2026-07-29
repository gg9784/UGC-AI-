// ============================================================
// FILE: server/routes/projectRoutes.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Declares all routes for the "project" domain.
//   Mounted in server.ts at: app.use('/api/project', projectRouter)
//   All routes here are accessible at: /api/project/...
//
// KEY DESIGN DECISION:
//   The route GET /api/project/published has NO auth guard.
//   This is intentional — the community gallery is public.
//   All other routes require authentication.
// ─────────────────────────────────────────────────────────────

import express from 'express';
import { createProject, createVideo, deleteProject, getAllPublishedProjects } from '../controllers/projectController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../configs/multer.js';
// upload = the configured Multer middleware instance.
// Handles multipart/form-data (file uploads) from the frontend form.

const projectRouter = express.Router()

// ── ROUTES ─────────────────────────────────────────────────

projectRouter.post('/create', upload.array('images', 2), protect, createProject)
// POST /api/project/create
// Purpose: Creates a new project, uploads images to Cloudinary, calls Gemini AI.
//
// MIDDLEWARE CHAIN: upload → protect → createProject
//
// 1. upload.array('images', 2)   [runs FIRST]
//    Multer middleware intercepts the multipart/form-data request.
//    Saves the uploaded files to the OS temp directory.
//    Populates req.files with an array of file metadata objects:
//    [{ path: '/tmp/abc', mimetype: 'image/jpeg', ... }, {...}]
//    Then calls next() to pass to the next middleware.
//
//    WHY upload runs BEFORE protect:
//    Multer must parse the request body FIRST to make req.body available.
//    If protect ran first, it would call req.auth() on an unparsed multipart body,
//    which could cause issues. Parsing happens before auth here.
//    Note: This is slightly non-standard (usually auth comes first for security),
//    but it works because the protect middleware only reads headers (Authorization),
//    not the body.
//
// 2. protect                      [runs SECOND]
//    Verifies the JWT in the Authorization header.
//    If valid: calls next() to proceed to the controller.
//    If invalid: sends 401 Unauthorized and STOPS the chain.
//
// 3. createProject                [runs THIRD — the actual logic]
//    The main controller function that does the real work.

projectRouter.post('/video', protect, createVideo)
// POST /api/project/video
// Purpose: Takes an existing generated image and animates it into a video using Veo.
// No file upload needed (image URL is already in the DB).
// So NO multer middleware here — just protect → createVideo.
// Body: { projectId: string }

projectRouter.get('/published', getAllPublishedProjects)
// GET /api/project/published
// Purpose: Returns all projects with isPublished=true for the Community page.
//
// ⚠️ NO `protect` middleware here! This route is PUBLIC.
// Anyone (logged in or not) can view the community gallery.
// The Community.tsx page doesn't send an Authorization header.

projectRouter.delete('/:projectId', protect, deleteProject)
// DELETE /api/project/:projectId
// Purpose: Deletes a specific project (only if it belongs to the user).
// :projectId = URL parameter → req.params.projectId in the controller.
// Guard: protect (verifies JWT) + controller checks project.userId === req.auth().userId.
// HTTP DELETE method is semantically correct here (destroying a resource).

export default projectRouter

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Middleware Ordering in a Route
  ─────────────────────────────────────────────────────────────
  app.post('/create', middleware1, middleware2, handler)
  
  This chain runs in ORDER: middleware1 → middleware2 → handler
  If middleware1 sends a response (e.g., res.status(401).json(...))
  the chain STOPS. middleware2 and handler NEVER run.
  
  This is the fail-fast principle: auth is checked EARLY.
  If you're not allowed in, you get rejected before any DB calls.

  CONCEPT: HTTP Verbs for REST
  ─────────────────────────────────────────────────────────────
  This router uses proper REST HTTP verbs:
    POST   /create    → CREATE a new resource
    POST   /video     → TRIGGER a new action (create video)
    GET    /published → READ public resources
    DELETE /:id       → DELETE a specific resource
  
  Note: GET /api/user/publish/:id (in userRoutes) is NOT fully RESTful
  because it's GET performing a state change. A proper REST API would
  use PUT /api/project/:id for updates. But for simplicity, GET works.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ upload.array('images', 2) → accept up to 2 files under the 'images' field
  ✔ Middleware chain: upload → protect → controller (order matters!)
  ✔ /published has NO auth → public community gallery
  ✔ DELETE /:projectId → HTTP DELETE verb for resource destruction
  ✔ /video has no upload middleware (uses existing DB image URL)
*/