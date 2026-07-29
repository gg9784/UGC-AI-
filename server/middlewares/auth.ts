
/*
================================================================================
FILE: server/middlewares/auth.ts
================================================================================

SECTION 1 — FILE PURPOSE
─────────────────────────────────────────────────────────────────────────────

  WHY THIS FILE EXISTS:
    This is the authentication guard for the entire backend.
    Every protected API route (create project, get credits, delete project, etc.)
    runs this middleware BEFORE the actual business logic runs.
    Its only job: verify the JWT (JSON Web Token) and confirm the user is real.

  WHEN IT EXECUTES:
    After Clerk's global middleware (clerkMiddleware) but before any controller.
    It sits in the middle of the request → response cycle.

  WHO CALLS IT:
    It is referenced in every protected route:
      projectRouter.post('/create', upload.array(...), protect, createProject)
      userRouter.get('/credits', protect, getUserCredits)
    The word "protect" in the route definition IS this function.

  WHAT IT EXPORTS:
    One named export: `protect` — an async middleware function.

  WHICH FILES DEPEND ON IT:
    server/routes/projectRoutes.ts
    server/routes/userRoutes.ts

  WHERE IT SITS IN EXECUTION FLOW:
    Request → cors → express.json → clerkMiddleware → [protect] → Controller → DB → Response
                                                         ↑
                                                    THIS FILE

================================================================================
SECTION 2 — CODE WITH INLINE NOTES
================================================================================
*/

import { Request, Response, NextFunction } from 'express';

/*
  ─────────────────────────────────────────────────────────────────────────────
  PACKAGE: express (TypeScript types)
  ─────────────────────────────────────────────────────────────────────────────

  We import THREE TypeScript types from Express:

  1. Request
     Describes the shape of every incoming HTTP request object (called `req`).
     It contains:
       req.body      → parsed JSON body (from express.json())
       req.params    → URL parameters  (/project/:projectId → req.params.projectId)
       req.query     → query string    (/search?q=shoes → req.query.q)
       req.headers   → HTTP headers    ({ authorization: "Bearer abc123" })
       req.files     → uploaded files  (from Multer)
       req.auth()    → Clerk auth data (injected by clerkMiddleware)

  2. Response
     Describes the outgoing HTTP response object (called `res`).
     It contains:
       res.status(code)         → set HTTP status code
       res.json({ key: value }) → send JSON response + end the request
       res.send("text")         → send plain text
       res.redirect("/path")    → send redirect

  3. NextFunction
     A callable function (called `next`).
     Calling next() passes control to the NEXT middleware or controller in the chain.
     If you DON'T call next() and DON'T send a response → the request HANGS forever.

  WHY IMPORT TYPES?
    TypeScript needs to know the shape of req, res, next to give you
    autocomplete and catch type errors before runtime.
    Without these type imports, TypeScript treats them as `any` (no safety).

  CONCEPT: Express
    Express is a minimal Node.js web framework.
    It wraps Node's built-in `http` module and adds:
      • Routing (app.get, app.post, router.use)
      • Middleware support (functions that run before/after route handlers)
      • Request/Response helpers (res.json, req.body, etc.)
    Express is "unopinionated" — it doesn't force any project structure.

  INTERVIEW Q: What is Express middleware?
  A: A middleware is a function with signature (req, res, next).
     It receives the request, can read/modify it, perform async operations,
     then either sends a response (ends the chain) or calls next() to
     pass control to the next middleware/handler.
     Example chain: cors → express.json → clerkMiddleware → protect → createProject
*/

import * as Sentry from "@sentry/node"

/*
  ─────────────────────────────────────────────────────────────────────────────
  PACKAGE: @sentry/node
  ─────────────────────────────────────────────────────────────────────────────

  Sentry is an error monitoring and performance tracking service.

  WHAT DOES SENTRY DO?
    When an exception (crash) occurs in production:
    1. Captures the full error with stack trace
    2. Records which user was affected, what they were doing
    3. Sends you real-time alerts (email, Slack, etc.)
    4. Groups repeated errors ("This bug has occurred 47 times today")

  WHY IS IT CRITICAL?
    In production, console.log does not help — you can't watch logs live.
    Without Sentry, a bug could silently break the app for 100 users before
    anyone notices. Sentry makes errors visible instantly.

  `import * as Sentry`
    Imports the entire Sentry module as a namespace object called `Sentry`.
    We access it as: Sentry.captureException(error)

  REAL LIFE ANALOGY:
    Like a smoke detector — you don't check if there's fire every minute.
    But when smoke (error) appears, it instantly alerts you (notification).

  INTERVIEW Q: How do you handle errors in production Node.js apps?
  A: Use an error monitoring service like Sentry. It captures unhandled
     exceptions with stack traces and sends real-time alerts.
     Also use process.on('uncaughtException') and process.on('unhandledRejection')
     as last-resort safety nets.

  COMMON MISTAKE:
    Relying only on try/catch + console.log.
    In production, logs are transient — errors are missed.
    Always use a monitoring tool in production.
*/


/*
  ─────────────────────────────────────────────────────────────────────────────
  THE MIDDLEWARE FUNCTION
  ─────────────────────────────────────────────────────────────────────────────
*/
export const protect = async (req: Request, res: Response, next: NextFunction) => {

/*
  `export const protect`
    Named export so route files can import it by name:
      import { protect } from '../middlewares/auth.js'

  `async`
    The function is asynchronous — it uses `await` internally.
    async functions always return a Promise.
    Express handles async middleware correctly in Express 5 (this project uses v5).
    In Express 4, you'd need a try/catch + next(error) wrapper for async errors.

  Parameters:
    req  → the incoming request (Request type from Express)
    res  → the outgoing response (Response type)
    next → call this to continue to the next middleware/controller

  CONCEPT: Middleware Chain
    Think of a pipeline:
      Request
         ↓
      cors()              ← adds CORS headers
         ↓
      express.json()      ← parses JSON body into req.body
         ↓
      clerkMiddleware()   ← reads Authorization header, verifies JWT, attaches req.auth()
         ↓
      protect             ← THIS FILE: checks if userId exists in req.auth()
         ↓
      createProject()     ← actual business logic (finally)
         ↓
      Response sent

    If ANY step sends a response, the chain STOPS.
    Only next() allows the chain to continue.

  INTERVIEW Q: What is the difference between middleware and a route handler?
  A: A route handler is the final function that sends the response.
     Middleware runs BEFORE the handler, processes the request (validation,
     auth, logging, parsing), and passes control via next().
     They use the same signature (req, res, next) but conceptually serve
     different purposes.
*/

    try {

        const { userId } = req.auth()

        /*
          ─────────────────────────────────────────────────────────────────
          req.auth()
          ─────────────────────────────────────────────────────────────────

          WHAT IS req.auth()?
            This method is injected by `clerkMiddleware()` (from @clerk/express).
            clerkMiddleware runs on EVERY request BEFORE this middleware.
            It reads the `Authorization` header, extracts the JWT, and verifies it.
            After verification, it attaches a function `req.auth()` to the request.

          WHAT DOES clerkMiddleware() DO STEP BY STEP?
            1. Reads the HTTP header: Authorization: Bearer eyJhbGciOi...
            2. Splits the token: "Bearer" + the JWT string
            3. Decodes the JWT header (base64) → gets the algorithm (RS256)
            4. Fetches Clerk's public key (cached) from Clerk's JWKS endpoint
            5. Verifies the JWT's cryptographic signature using the public key
            6. If valid: attaches decoded payload as req.auth()
               If invalid: req.auth() returns {} or throws

          WHAT IS A JWT?
            JSON Web Token — a cryptographically signed string with 3 parts:
              [Header].[Payload].[Signature]

            Header:    base64({ "alg": "RS256", "typ": "JWT" })
            Payload:   base64({ "sub": "user_abc123", "exp": 1720000000 })
            Signature: RSA_SIGN(header + "." + payload, privateKey)

            The server verifies:
              RSA_VERIFY(header + "." + payload, signature, publicKey)
            If the signature is valid → the payload was NOT tampered with.

          WHAT IS RETURNED?
            req.auth() returns an object containing:
              userId    → the Clerk user's unique ID (e.g., "user_2abc123XYZ")
              sessionId → the session identifier
              ... and other Clerk-specific fields

          `const { userId } = req.auth()`
            Object destructuring — extracts the `userId` property from the returned object.
            Equivalent to: const userId = req.auth().userId

          WHAT IF THERE IS NO TOKEN?
            If the Authorization header is missing, req.auth() returns {}.
            Destructuring {} gives userId = undefined.
            Our if(!userId) check below catches this case.

          CONCEPT: Bearer Token Authentication
            A type of HTTP authentication where the client sends a token in the header:
              Authorization: Bearer <token>
            "Bearer" literally means "whoever holds (bears) this token has access."
            The server trusts the token if the signature is valid.

          HOW THE FRONTEND SENDS IT:
            const token = await getToken()  // from useAuth() hook (Clerk)
            api.get('/api/user/credits', {
              headers: { Authorization: `Bearer ${token}` }
            })

          INTERVIEW Q: Why put the token in the header instead of the URL query string?
          A: URLs are logged in server logs, browser history, and proxy logs.
             Headers are NOT logged by default. Putting secrets in URLs
             risks exposing them in logs or through the Referer header.

          INTERVIEW Q: How does Clerk verify the JWT without calling Clerk's servers every time?
          A: Clerk uses asymmetric encryption (RS256).
             Clerk signs the JWT with a PRIVATE key (only Clerk has it).
             Your server verifies with the PUBLIC key (downloadable from Clerk's JWKS endpoint).
             Verification is a LOCAL cryptographic operation — no network call to Clerk.
             This makes auth fast and independent of Clerk's uptime.

          COMMON MISTAKE:
            Calling req.auth() before clerkMiddleware() has run.
            Solution: always register clerkMiddleware() BEFORE protect in the pipeline.
        */

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        /*
          ─────────────────────────────────────────────────────────────────
          AUTHENTICATION CHECK
          ─────────────────────────────────────────────────────────────────

          if(!userId)
            Checks if userId is falsy — undefined, null, empty string, 0.
            If the JWT was missing or invalid, userId = undefined → this triggers.

          res.status(401).json({ message: 'Unauthorized' })
            Sends an HTTP 401 response with a JSON body.
            401 = Unauthorized (HTTP standard status code).

          CONCEPT: HTTP Status Codes
            ┌──────┬───────────────────────────────────────────────────┐
            │ Code │ Meaning                                            │
            ├──────┼───────────────────────────────────────────────────┤
            │ 200  │ OK — success                                       │
            │ 201  │ Created — new resource created                     │
            │ 400  │ Bad Request — client sent invalid data             │
            │ 401  │ Unauthorized — not authenticated (who are you?)    │
            │ 403  │ Forbidden — authenticated but not allowed          │
            │ 404  │ Not Found — resource doesn't exist                 │
            │ 500  │ Internal Server Error — something broke in server  │
            └──────┴───────────────────────────────────────────────────┘

          INTERVIEW Q: What is the difference between 401 and 403?
          A:
            401 Unauthorized → No valid credentials were provided.
                               "I don't know who you are."
                               Example: no token, or invalid/expired token.
            403 Forbidden    → Valid credentials, but you don't have permission.
                               "I know who you are, but you can't do this."
                               Example: valid token but trying to delete someone else's project.

          WHY `return` before res.status(401)?
            Without `return`:
              res.status(401).json(...)  // sends the response
              next()                     // ALSO runs! → Error: cannot set headers after sent
            The `return` statement immediately exits the function after sending the response.
            This prevents next() from being called after the response is already sent.
            In Express 5, this is handled better — but `return` is still best practice.

          WHAT HAPPENS AFTER THIS RESPONSE?
            The request lifecycle ENDS here for unauthenticated users.
            The frontend receives: { message: 'Unauthorized' } with status 401.
            Axios will throw an error for 4xx/5xx responses → caught by frontend try/catch.
        */

        next()

        /*
          ─────────────────────────────────────────────────────────────────
          next() — PASS TO THE NEXT MIDDLEWARE/CONTROLLER
          ─────────────────────────────────────────────────────────────────

          If we reach this line, it means:
            ✓ JWT was present and valid
            ✓ userId was successfully extracted
            ✓ The user is authenticated

          next() passes control to the NEXT function in the middleware chain.
          After protect, the next function is the route controller:
            createProject, getUserCredits, deleteProject, etc.

          Those controllers can now safely call req.auth().userId
          because we've confirmed it exists and is valid.

          INTERVIEW Q: What happens if next() is never called and no response is sent?
          A: The request hangs indefinitely. The client waits until a timeout occurs.
             This is one of the most common bugs in Express middleware.
             Always either call next() or send a response — never both, never neither.
        */

    } catch (error: any) {

        /*
          ─────────────────────────────────────────────────────────────────
          ERROR HANDLING
          ─────────────────────────────────────────────────────────────────

          WHEN DOES THIS CATCH BLOCK RUN?
            req.auth() can THROW (not just return empty) when:
            1. The JWT is malformed (not a valid JWT format)
            2. The JWT signature is invalid (tampered)
            3. The JWT has expired (exp claim is in the past)
            4. Clerk's JWKS endpoint is unreachable (network error)

          error: any
            We type the error as `any` because:
            • JavaScript's try/catch doesn't type errors automatically
            • Errors can be Error objects, strings, or custom Clerk error objects
            • Using `any` lets us access .code and .message without TypeScript errors
            Note: Better practice is `error: unknown` + type narrowing, but `any` is common.
        */

        Sentry.captureException(error)

        /*
          Sentry.captureException(error)
            Sends the full error to the Sentry dashboard.
            Includes: stack trace, request headers, user context (if configured).
            This runs BEFORE sending the response so Sentry is notified even if
            the response fails to send.

          WHAT SENTRY CAPTURES:
            • Error type and message
            • Full stack trace (file, line, function names)
            • Request URL and method
            • User information (if sendDefaultPii: true in instrument.mjs)
            • Browser/environment info
            • Any custom tags/contexts you set

          INTERVIEW Q: Why use Sentry.captureException() instead of console.error()?
          A: console.error logs to stdout — only visible if you're watching logs live.
             In production, logs are transient and often inaccessible.
             Sentry persists errors, groups duplicates, sends alerts, and tracks trends.
        */

        res.status(401).json({ message: error.code || error.message })

        /*
          error.code || error.message
            Clerk's errors have a `.code` property (e.g., "ERR_JWT_EXPIRED", "ERR_JWT_INVALID").
            These are developer-friendly error codes that clearly describe the issue.
            JavaScript's standard Error objects have a `.message` property (e.g., "Network Error").

            || (logical OR): use .code if it exists and is truthy, otherwise fall back to .message.

          WHY NOT EXPOSE THE RAW ERROR TO THE CLIENT?
            We could send `error.stack` (the stack trace), but that would expose:
            • Internal file paths
            • Library versions
            • Server architecture details
            An attacker could use this to find vulnerabilities.
            We only send a safe error message.

          STATUS CODE 401:
            Any error in verifying the JWT is an authentication failure → 401.
        */
    }
}

/*
================================================================================
SECTION 3 — CONCEPT BOXES
================================================================================

CONCEPT: AUTHENTICATION vs AUTHORIZATION
─────────────────────────────────────────
  Authentication = "Who are you?" (verifying identity)
    This file handles authentication — confirming the JWT is valid.
    Example: Checking your passport at the border.

  Authorization = "What are you allowed to do?" (permissions check)
    This happens in controllers — e.g., you can only delete YOUR project.
    Example: Being inside the country but only allowed in certain rooms.

  REAL LIFE ANALOGY:
    Authentication = showing your ID card (proving you are who you claim)
    Authorization  = showing your event badge (proving you can enter this specific area)

  COMMON MISTAKE:
    Using 401 for authorization failures. The correct code is 403.
    401 = "I don't know who you are" (authentication failed)
    403 = "I know who you are, but no" (authorization failed)

──────────────────────────────────────────────────────────────────────────────

CONCEPT: JWT (JSON Web Token)
─────────────────────────────
  FORMAT:  eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.SflKxwRJSMeKKF2QT4fwpMeJf36...
  DECODED: [header base64]  . [payload base64]         . [signature]

  Header:    { "alg": "RS256", "typ": "JWT" }
  Payload:   { "sub": "user_123", "exp": 1720000000, "iat": 1719900000 }
  Signature: Cryptographic proof the above was not tampered with.

  KEY PROPERTIES:
  ✓ STATELESS: Server doesn't store sessions — the token contains all info.
  ✓ SELF-CONTAINED: The payload has userId, expiry, etc. already.
  ✓ VERIFIABLE: Signature proves authenticity without calling Clerk.

  WHAT "VERIFYING" MEANS:
    Server takes: header.payload + signature
    Uses Clerk's PUBLIC key to run: verify(header.payload, signature, publicKey)
    If the signature matches → payload is trusted, not tampered.
    If it doesn't match → someone modified the token → throw error.

  INTERVIEW Q: Can a user modify their JWT to give themselves admin access?
  A: No. The payload is base64-encoded (not encrypted) but the SIGNATURE
     is computed from the payload + the PRIVATE key.
     If you change the payload, the signature no longer matches → verification fails.
     Only Clerk (who holds the private key) can sign a valid token.

──────────────────────────────────────────────────────────────────────────────

CONCEPT: async/await
──────────────────────
  async functions return a Promise.
  await pauses execution until the Promise resolves.

  Without async/await (callback hell):
    req.auth(function(err, auth) {
      if (err) { ... }
      prisma.user.findUnique({ where: { id: auth.userId } }, function(err, user) {
        // deeply nested, hard to read
      })
    })

  With async/await:
    const { userId } = req.auth()        // synchronous in this case
    const user = await prisma.user.findUnique(...)  // pauses, waits for DB
    res.json({ user })                   // runs after DB responds

  CONCEPT: Event Loop
    Node.js is single-threaded. While awaiting the DB response,
    Node.js does NOT freeze. It switches to handle other incoming requests.
    When the DB responds, it resumes this function where it left off.
    This is NON-BLOCKING I/O — the event loop enables it.

  INTERVIEW Q: Why is Node.js good for I/O-heavy applications?
  A: Node.js uses an event-driven, non-blocking I/O model.
     While one request waits for a DB query, Node.js handles other requests.
     This makes it efficient for APIs that do lots of I/O (DB, file, network).
     It's NOT good for CPU-heavy work (image processing, video encoding)
     because that blocks the single thread.

================================================================================
SECTION 4 — EXECUTION FLOW
================================================================================

WHEN A PROTECTED ROUTE IS CALLED:

  Frontend (React):
    const token = await getToken()     // Clerk JWT
    api.get('/api/user/credits', {
      headers: { Authorization: `Bearer ${token}` }
    })
       ↓
  HTTP Request arrives at Express:
    GET /api/user/credits
    Headers: { Authorization: "Bearer eyJhbGci..." }
       ↓
  Middleware Chain:
    cors()              → adds CORS headers (allows cross-origin)
    express.json()      → parses body (no body in GET, but runs anyway)
    clerkMiddleware()   → reads header, verifies JWT, attaches req.auth()
    protect             → extracts userId, checks it exists → next()
    getUserCredits      → controller: queries DB, sends response
       ↓
  Response:
    { credits: 15 }  with status 200

WHEN AN UNAUTHENTICATED REQUEST IS MADE:

  Frontend sends no Authorization header (or expired token)
       ↓
  clerkMiddleware() → req.auth() returns {} (or throws)
       ↓
  protect:
    const { userId } = req.auth()  → userId = undefined
    if(!userId) → return res.status(401).json({ message: 'Unauthorized' })
       ↓
  Request ENDS here. Controller never runs.

================================================================================
SECTION 5 — INTERVIEW QUESTIONS
================================================================================

BEGINNER:
  Q: What is middleware in Express?
  A: A function with (req, res, next) signature that runs between request
     and response. It can modify req/res, run logic, or call next() to continue.

  Q: What does next() do?
  A: Passes control to the next middleware or route handler in the chain.
     If not called (and no response sent), the request hangs forever.

  Q: What is 401 vs 200?
  A: 401 = authentication failed (unauthorized). 200 = success.

INTERMEDIATE:
  Q: How does Clerk verify the JWT?
  A: Using RSA public key verification (RS256). Clerk signs tokens with
     a private key. The server verifies with the public key from Clerk's
     JWKS endpoint. No network call to Clerk needed each time.

  Q: Why do we use `return` before res.status(401).json()?
  A: To exit the function immediately. Without return, next() would also
     run after the response is sent, causing "headers already sent" error.

  Q: What is the difference between authentication and authorization?
  A: Authentication = proving identity (401 if failed).
     Authorization = checking permissions (403 if denied).

ADVANCED:
  Q: What happens if clerkMiddleware() is not registered before protect?
  A: req.auth() would be undefined (the method wouldn't exist on req).
     protect would throw a TypeError → 500 error instead of 401.

  Q: How would you add rate limiting to this middleware?
  A: Use express-rate-limit before protect:
     const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
     router.use(limiter, protect, handler)

  Q: What is the security risk of returning detailed error messages?
  A: Attackers can use error details (stack traces, file paths, library
     versions) to find vulnerabilities. Always return sanitized messages.

SENIOR:
  Q: How would you implement role-based access control (RBAC) here?
  A: After verifying userId, query the DB for the user's role.
     Create separate middleware: requireAdmin, requirePro, etc.
     Or use Clerk's organizations/roles feature which embeds roles in the JWT.

  Q: How would you test this middleware in isolation?
  A: Mock req.auth() to return different values:
     - { userId: 'user_123' } → should call next()
     - {} (empty) → should return 401
     - throw new Error() → should return 401 with Sentry capture
     Use Jest + supertest or just unit test the function directly.

================================================================================
SECTION 6 — COMMON ERRORS
================================================================================

  ERROR 1: "Cannot read properties of undefined (reading 'userId')"
    CAUSE: req.auth() returned undefined because clerkMiddleware() wasn't registered.
    FIX:   Register app.use(clerkMiddleware()) BEFORE your routes in server.ts.

  ERROR 2: "Cannot set headers after they are sent to the client"
    CAUSE: res.json() was called AND next() was called (double response).
    FIX:   Always `return res.status(401).json(...)` — the `return` prevents next().

  ERROR 3: Request hangs / timeout
    CAUSE: Neither res.json() nor next() was called (logic bug in if/else).
    FIX:   Ensure every code path either sends a response or calls next().

  ERROR 4: 401 even with a valid token
    CAUSE: Token expired. Clerk's default token lifetime is 60 seconds.
    FIX:   Always call `await getToken()` fresh — never cache the token.
           Clerk's SDK auto-refreshes behind the scenes.

  INTERVIEW TRAP:
    "If you store the JWT in localStorage, what is the security risk?"
    A: XSS (Cross-Site Scripting). A malicious script injected into the page
       could read localStorage and steal the token.
       HttpOnly cookies prevent this (JS can't read HttpOnly cookies).
       Clerk uses a combination of strategies to mitigate this.

================================================================================
SECTION 7 — MEMORY NOTES
================================================================================

  ✔ protect = authentication guard middleware
  ✔ req.auth() is injected by clerkMiddleware() (from server.ts)
  ✔ req.auth() verifies the JWT using Clerk's public key (no Clerk API call)
  ✔ userId = the verified, trusted user identity
  ✔ 401 = Unauthorized (no/invalid credentials)
  ✔ 403 = Forbidden (valid credentials, no permission)
  ✔ `return res.json()` — ALWAYS return to prevent double-response
  ✔ next() = continue to the controller (only called if auth passes)
  ✔ Sentry.captureException() = logs errors to monitoring dashboard
  ✔ error.code || error.message = use Clerk-specific code if available

================================================================================
SECTION 8 — REAL PROJECT CONNECTIONS
================================================================================

  ← DEPENDS ON (upstream):
      server/configs/instrument.mjs     (Sentry must init first)
      clerkMiddleware() in server.ts    (attaches req.auth() to request)

  → USED BY (downstream):
      server/routes/userRoutes.ts       (protect on all user routes)
      server/routes/projectRoutes.ts    (protect on all protected project routes)

  → ENABLES:
      server/controllers/userController.ts   → safe to call req.auth().userId
      server/controllers/projectController.ts → safe to call req.auth().userId

  ✗ NOT USED ON:
      POST /api/clerk       (webhook — uses its own signature verification)
      GET /api/project/published  (public community feed — no auth needed)

================================================================================
SECTION 9 — IF THIS FILE IS REMOVED
================================================================================

  WHAT BREAKS:
    Every protected route becomes publicly accessible.
    Anyone (without an account) could:
      • Create projects and burn our AI credits/quota
      • Delete any user's projects (no userId check in controllers)
      • Access any user's private data
      • Exhaust our Cloudinary and Gemini API quotas

  COMPILE ERROR?
    No — TypeScript doesn't enforce that you USE the protect middleware.
    The app compiles and starts normally.
    Security breaks silently at runtime.

  ERROR IN ROUTES:
    import { protect } from '../middlewares/auth.js'
    → Module not found error at startup → server crashes immediately.

================================================================================
SECTION 10 — INTERVIEW SUMMARY
================================================================================

  IF AN INTERVIEWER ASKS: "Explain the auth.ts middleware file"

  YOU SAY:
  "auth.ts exports a single middleware function called `protect`. Its job is
  to authenticate every request before the controller runs.

  It calls req.auth(), which is a function injected by Clerk's Express middleware.
  Clerk's middleware reads the Authorization: Bearer <JWT> header on each request,
  verifies the JWT's cryptographic signature against Clerk's public key, and makes
  the decoded user info available via req.auth().

  If userId is present (authentication passed), we call next() to pass control to
  the actual route handler. If userId is missing or the JWT is invalid, we return
  a 401 Unauthorized response and stop the chain.

  Any exceptions — like an expired or malformed token — are caught, logged to
  Sentry for monitoring, and result in a 401 response with a safe error message.

  This middleware is used on every sensitive route: creating projects, fetching
  user data, deleting records. Public routes like the community feed bypass it."
*/