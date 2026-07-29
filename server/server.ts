// ============================================================
// FILE: server/server.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   The ENTRY POINT of the entire backend application.
//   This is the very first file Node.js executes when you run `npm start`.
//   It creates the Express app, registers all middleware in the
//   correct order, mounts routers, and starts the HTTP server.
//
// REAL-WORLD EXECUTION ORDER:
//   1. Sentry instruments the app (MUST be first)
//   2. CORS is enabled
//   3. The Clerk webhook route is registered with raw body parsing
//   4. JSON body parsing is enabled for all other routes
//   5. Clerk middleware attaches auth data to every request
//   6. Routers are mounted at their URL prefixes
//   7. Sentry's error handler is registered (MUST be last middleware)
//   8. The HTTP server starts listening on a port
// ─────────────────────────────────────────────────────────────

import "./configs/instrument.mjs"
// ↑ SENTRY MUST BE IMPORTED FIRST — before Express, before anything else.
// Sentry instruments (patches) Node.js core modules to track errors.
// If anything else runs before Sentry, it can't intercept those module calls.

import express, { Request, Response } from 'express';
// express      = the main web framework. Creates our HTTP server.
// Request      = TypeScript type for incoming HTTP requests.
// Response     = TypeScript type for outgoing HTTP responses.

import cors from 'cors'
// cors = Cross-Origin Resource Sharing middleware.
//
// WHAT PROBLEM DOES IT SOLVE?
// Browsers block JavaScript from making fetch/axios requests to a DIFFERENT
// domain than the page was loaded from. This is the "Same-Origin Policy".
//
// Example Without CORS:
//   Page at: http://localhost:5173 (Vite frontend)
//   API at:  http://localhost:5000 (Express backend)
//   → Browser BLOCKS the request! These are different ports = different origins.
//
// app.use(cors()) tells the Express server to add these HTTP response headers:
//   Access-Control-Allow-Origin: *
//   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
//   Access-Control-Allow-Headers: Content-Type, Authorization
// Now the browser trusts the response and lets the JS code access it.
//
// INTERVIEW Q: What is CORS and why do we need it?
// A: The browser's Same-Origin Policy prevents JavaScript from requesting
//    resources from a different origin (domain/protocol/port) for security.
//    CORS is a mechanism where the SERVER declares which origins it trusts,
//    allowing the browser to relax its restriction for those trusted origins.

import 'dotenv/config'
// Reads the `.env` file and loads all KEY=VALUE pairs into `process.env`.
// After this line: process.env.DATABASE_URL, process.env.CLERK_SECRET_KEY etc. are available.
//
// IMPORTANT: This MUST run before any code that reads process.env!
// If process.env.CLOUDINARY_API_KEY is read before this line, it will be undefined.
//
// WHY .env FILES?
// Secrets (API keys, DB passwords) should NEVER be in source code.
// .env is listed in .gitignore so it's never committed to GitHub.
// Different environments (dev, staging, production) can have different .env values.
// Production secrets are set as environment variables in the hosting platform
// (Vercel, Railway, Heroku) — NOT in a .env file.

import { clerkMiddleware } from '@clerk/express'
// Clerk's Express middleware.
// When applied with app.use(clerkMiddleware()), it runs on EVERY request.
// It reads the `Authorization: Bearer <JWT>` header, verifies the JWT with
// Clerk's public keys, and attaches auth data to req.auth().
// This is what allows our controllers to call req.auth().userId to
// identify the logged-in user.

import clerkWebhooks from './controllers/clerk.js';
// The function that handles Clerk webhook events (user.created, payment.updated, etc.)
// Imported with .js extension — this is REQUIRED for Node.js ESM (ES Modules).
// TypeScript files MUST be imported with the .js extension at runtime.
// TypeScript understands this and resolves to the .ts source file at build time.

import * as Sentry from "@sentry/node"
// Sentry = error monitoring and tracking service.
// Captures exceptions, provides stack traces, alerts the team on Slack/email.
// `* as Sentry` imports the entire module as a namespace object.

import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
// Sub-routers that handle specific URL prefixes.
// Separating routes into files keeps server.ts clean.
// Each router contains all routes for that domain area.

// ── APP INITIALIZATION ─────────────────────────────────────
const app = express();
// Creates the Express application instance.
// `app` is an object with methods like app.use(), app.get(), app.listen().
// Think of it as the "server factory" — all configuration hangs off this.

const PORT = process.env.PORT || 5000;
// PORT comes from environment variable (set by the hosting platform like Vercel/Railway).
// Fallback: 5000 for local development.
// Using a variable means we can deploy anywhere without changing code.

// ── MIDDLEWARE REGISTRATION ────────────────────────────────
// ORDER MATTERS. Middleware executes top-to-bottom for every request.

// 1. CORS (must be early, before route handlers)
app.use(cors())

// 2. CLERK WEBHOOK ROUTE — REGISTERED BEFORE express.json() ← CRITICAL!
app.post('/api/clerk', express.raw({ type: 'application/json' }), clerkWebhooks)
// WHY express.raw() instead of express.json()?
// Clerk signs its webhooks with an HMAC-SHA256 signature.
// verifyWebhook() (inside clerkWebhooks) re-computes the HMAC using the RAW request body.
// express.json() PARSES the body from Buffer → JavaScript object.
// Once parsed, the original raw bytes are gone → signature verification FAILS.
// express.raw() gives us the body as a raw Buffer → signature verification SUCCEEDS.
//
// INTERVIEW Q: Why must the webhook route be registered BEFORE express.json()?
// A: Webhook signature verification needs the raw request body bytes.
//    express.json() transforms those bytes into a JS object and discards the raw buffer.
//    By registering the raw route first, this specific path uses raw parsing,
//    while all other routes (mounted after express.json()) use JSON parsing.

// 3. JSON BODY PARSING (for all other routes)
app.use(express.json())
// Parses incoming request bodies with Content-Type: application/json.
// Makes req.body available as a JavaScript object.
// Without this: req.body is undefined for POST/PUT requests with JSON payloads.

// 4. CLERK AUTHENTICATION MIDDLEWARE (runs on every request)
app.use(clerkMiddleware())
// Attaches Clerk auth context to every request.
// Makes req.auth() available in all subsequent route handlers.
// Note: it doesn't BLOCK unauthenticated users — it just attaches auth info.
// Our custom `protect` middleware (middlewares/auth.ts) does the actual blocking.

// ── ROUTES ─────────────────────────────────────────────────

// Health check route
app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

// Sentry test route — deliberately throws an error to verify Sentry is working
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Mount routers at their URL prefixes
app.use('/api/user', userRouter)
// All routes in userRouter are now accessible under /api/user/...
// Example: userRouter.get('/credits') → accessible at GET /api/user/credits

app.use('/api/project', projectRouter)
// All routes in projectRouter are accessible under /api/project/...
// Example: projectRouter.post('/create') → accessible at POST /api/project/create

// 5. SENTRY ERROR HANDLER (MUST be LAST middleware, after all routes)
Sentry.setupExpressErrorHandler(app);
// Catches any error thrown inside route handlers and reports it to Sentry.
// Must come AFTER all routes so it can catch errors from all of them.
// Must come BEFORE any other custom error-handling middleware.

// ── START SERVER ───────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
// Binds the Express app to the PORT and starts listening for TCP connections.
// The callback runs once the server is ready.

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Express Middleware Pipeline
  ─────────────────────────────────────────────────────────────
  Middleware = a function that runs between Request → Response.
  Signature: (req, res, next) => void
  
  When you call app.use(middleware), it runs for EVERY request.
  When you call app.get('/path', middleware, handler), it only runs for that route.
  
  Middleware must either:
  1. Call next() to pass control to the next middleware, OR
  2. Send a response (res.json, res.send, res.status().json()) to end the cycle.
  
  Pipeline for a request to POST /api/project/create:
  CORS → express.raw (no match) → express.json → clerkMiddleware
  → upload (multer) → protect (auth) → createProject handler → Sentry error handler

  CONCEPT: Environment Variables
  ─────────────────────────────────────────────────────────────
  Never hardcode credentials. Use process.env.SECRET_KEY.
  The 12-Factor App methodology (industry standard) mandates this.
  
  Local dev: .env file (in .gitignore)
  Production: Set as platform environment variables (Vercel dashboard, etc.)

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Sentry instrument.mjs must be FIRST import
  ✔ cors() prevents browser Same-Origin Policy errors
  ✔ Clerk webhook route uses express.raw() — BEFORE express.json()
  ✔ clerkMiddleware() attaches req.auth() but doesn't block
  ✔ Sentry.setupExpressErrorHandler() must be LAST middleware
  ✔ PORT from env variable for hosting platform compatibility
  ✔ .js extension required for ESM imports in Node.js TypeScript projects

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ The entire backend stops working — this IS the backend entry point
*/