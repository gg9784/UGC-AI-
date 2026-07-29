// ============================================================
// FILE: server/routes/userRoutes.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Declares all routes that belong to the "user" domain.
//   Mounted in server.ts at: app.use('/api/user', userRouter)
//   So every route here is accessible at: /api/user/...
//
// ROUTING ARCHITECTURE:
//   server.ts defines TOP-LEVEL prefixes (/api/user, /api/project)
//   This file defines the SPECIFIC paths under /api/user (e.g., /credits)
//   Controllers define the HANDLER LOGIC for each route
//
//   This 3-layer separation (server → router → controller) keeps code
//   clean and easy to navigate in large codebases.
//
// ALL ROUTES HERE REQUIRE AUTHENTICATION (protected by `protect` middleware).
// ─────────────────────────────────────────────────────────────

import express from 'express';
import { getAllProjects, getProjectById, getUserCredits, toggleProjectPublic } from '../controllers/userController.js';
// Imports exactly the functions needed from the userController.
// Named imports keep the usage explicit — you know which functions are used.

import { protect } from '../middlewares/auth.js';
// `protect` = our custom authentication guard middleware.
// It verifies the JWT and blocks unauthenticated requests (401).

const userRouter = express.Router();
// express.Router() creates a mini Express application with its own routes.
// It is "mounted" in server.ts which gives it the /api/user prefix.
// Routes defined here are RELATIVE to that prefix.
//
// INTERVIEW Q: What is express.Router()?
// A: A modular, mountable route handler. It acts like a mini-Express app
//    scoped to a URL prefix. This allows splitting routes across files by
//    domain (users, projects, auth) rather than putting everything in server.ts.

// ── ROUTES ─────────────────────────────────────────────────
//
// MIDDLEWARE CHAIN NOTATION:
// routerMethod(path, middleware1, middleware2, ..., finalHandler)
// Each middleware calls next() to pass control to the next one.
// The FINAL handler sends the response (no next() call).

userRouter.get('/credits', protect, getUserCredits)
// GET /api/user/credits
// Purpose: Returns the logged-in user's current credit balance.
// Guard: `protect` verifies the JWT first.
// Used by: Navbar.tsx to display "Credits: 15" in the top bar.

userRouter.get('/projects', protect, getAllProjects)
// GET /api/user/projects
// Purpose: Returns ALL projects belonging to the logged-in user.
// Guard: `protect` ensures only the owner can see their projects.
// Used by: MyGenerations.tsx to populate the personal dashboard grid.

userRouter.get('/projects/:projectId', protect, getProjectById)
// GET /api/user/projects/:projectId
// Purpose: Returns a single project by ID (only if it belongs to the user).
// :projectId = URL parameter. Accessible in controller via req.params.projectId.
// Guard: `protect` + the controller checks userId matches the project owner.
// Used by: Result.tsx for the detailed result view.
//
// INTERVIEW Q: What is a URL parameter in Express?
// A: A dynamic segment in the URL path prefixed with ':'.
//    GET /api/user/projects/abc-123 → req.params.projectId = "abc-123"
//    Unlike query strings (?id=abc), URL params are part of the route path.
//    Used for resource identification (RESTful APIs).

userRouter.get('/publish/:projectId', protect, toggleProjectPublic)
// GET /api/user/publish/:projectId
// Purpose: Toggles a project's isPublished status (private ↔ public).
// Note: Using GET for a state-changing action is not strictly RESTful.
//       RESTful convention: PUT /api/project/:id/publish
//       But GET is simpler here and works fine for this app.
// Guard: `protect` + controller verifies user owns the project.
// Used by: ProjectCard.tsx "Publish" / "Unpublish" button.

export default userRouter;
// Exported and mounted in server.ts:
//   app.use('/api/user', userRouter)

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: REST API URL Design
  ─────────────────────────────────────────────────────────────
  REST (Representational State Transfer) guidelines for URL design:
  
  Use nouns (resources), not verbs:
    ✓ GET /api/user/projects   (noun: "projects")
    ✗ GET /api/user/getProjects (verb)
  
  Use HTTP methods to indicate the action:
    GET    → Read (no side effects)
    POST   → Create a new resource
    PUT    → Replace an entire resource
    PATCH  → Partially update a resource
    DELETE → Remove a resource
  
  Use nested paths for sub-resources:
    /api/user/projects        → All projects of the user
    /api/user/projects/:id    → A specific project of the user

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ express.Router() = mini Express app for modular routing
  ✔ Mounted at /api/user in server.ts → routes are relative to that
  ✔ `protect` middleware runs BEFORE the controller on every route here
  ✔ :projectId = URL parameter → req.params.projectId in controller
  ✔ All routes here are authenticated (no public routes in userRouter)
*/