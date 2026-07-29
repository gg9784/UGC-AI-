/*
  ============================================================
  FILE: client/src/configs/axios.ts
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Creates a SINGLE pre-configured Axios instance shared across
    the entire frontend. Instead of writing the full backend URL
    in every API call, it is defined once here.
    Changing the backend URL = one line change in one file.

  WHEN IT EXECUTES:
    When any component does `import api from '../configs/axios'`.
    The module runs once, creates the instance, and exports it.
    Every import after that gets the SAME cached instance (module singleton).

  WHO CALLS IT:
    Navbar.tsx, Genetator.tsx, Result.tsx, MyGenerations.tsx,
    Community.tsx, ProjectCard.tsx — anywhere that makes HTTP calls.

  WHAT IT EXPORTS:
    `api` — a pre-configured Axios instance

  CONCEPT — Module Singleton:
    When JavaScript imports a module, it executes the module ONCE
    and caches the result. Every subsequent import gets the same
    cached export — NOT a new execution.
    This means `api` is created exactly once regardless of how many
    components import it.
  ─────────────────────────────────────────────────────────────
*/

import axios from 'axios';
/*
  Axios = a popular HTTP client library for JavaScript.
  Works in both browsers and Node.js.

  WHY AXIOS OVER THE NATIVE fetch() API?
  ┌─────────────────────────────────────────────────────┐
  │ Feature             │ fetch()    │ axios             │
  ├─────────────────────────────────────────────────────┤
  │ JSON auto-parse     │ No (manual)│ Yes (auto)        │
  │ Error on 4xx/5xx    │ No         │ Yes (throws)      │
  │ Request interceptors│ No         │ Yes               │
  │ Response interceptors│ No        │ Yes               │
  │ Request timeout     │ No (manual)│ Yes (.timeout)    │
  │ Node.js support     │ Limited    │ Yes               │
  │ Upload progress     │ No         │ Yes               │
  └─────────────────────────────────────────────────────┘

  KEY DIFFERENCE — Error Handling:
    fetch('/api/user') → resolves even on 401, 404, 500 errors!
    You must check response.ok yourself.
    
    api.get('/api/user') → throws automatically on 4xx and 5xx.
    The catch block in every component catches these automatically.
    This is why we can simply do: `toast.error(error?.response?.data?.message)`

  CONCEPT — HTTP Client:
    A tool that sends HTTP requests to a server and receives responses.
    Browser's built-in: fetch() API.
    Axios wraps fetch (or XMLHttpRequest) with a more developer-friendly API.

  INTERVIEW Q: What does Axios add over fetch?
  A: Automatic JSON serialization/deserialization, automatic error throwing
     on non-2xx status codes, request/response interceptors, and request
     cancellation via AbortController. Axios also works in Node.js natively.
*/

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL || 'http://localhost:5000'
})
/*
  axios.create(config) — creates a NEW Axios instance with default config.
  The returned `api` object has all the same methods as axios (get, post, delete)
  but with the specified defaults pre-applied to every request.

  ── baseURL ────────────────────────────────────────────────────────────────
  Every API call made with `api` will PREPEND this URL to the path.

  Development:   VITE_BASEURL is not set → uses 'http://localhost:5000'
    api.get('/api/user/credits')
    → actual URL: http://localhost:5000/api/user/credits

  Production:    VITE_BASEURL = "https://ugcai-backend.vercel.app"
    api.get('/api/user/credits')
    → actual URL: https://ugcai-backend.vercel.app/api/user/credits

  CHANGING ENVIRONMENTS:
    To switch from local to production backend: just change VITE_BASEURL in .env.
    NO code changes needed anywhere else in the frontend.
    This is environment-based configuration — a core software engineering principle.

  ── import.meta.env.VITE_BASEURL ───────────────────────────────────────────
  import.meta.env = Vite's environment variable access object.
  At build time, Vite reads client/.env and replaces import.meta.env.VITE_BASEURL
  with the actual string value (literal code replacement, not a runtime lookup).

  After `vite build`:
    import.meta.env.VITE_BASEURL → "https://api.ugcai.com"  (baked into the bundle)

  ── || 'http://localhost:5000' ──────────────────────────────────────────────
  Fallback using logical OR.
  If VITE_BASEURL is undefined or empty string (falsy):
    use 'http://localhost:5000' as the default.
  
  WHY A FALLBACK?
    Allows running the frontend without setting up a .env file.
    New developers can clone the repo, run `npm run dev`, and it "just works"
    against the locally running backend.
    Without the fallback: api.create({ baseURL: undefined }) → broken requests.

  INTERVIEW Q: Why create a custom Axios instance instead of using axios directly?
  A: Centralized configuration. Setting baseURL, default headers (like Content-Type),
     timeouts, and interceptors once — rather than in every API call.
     Also enables easy switching between environments (dev/staging/prod)
     via environment variables without code changes.

  INTERVIEW Q: What is an Axios interceptor?
  A: Middleware for HTTP requests/responses.
     Request interceptor: modify every outgoing request (e.g., auto-add Auth header).
     Response interceptor: process every response (e.g., auto-refresh tokens on 401).
     This project doesn't use interceptors — auth headers are added per-call instead.
     Interceptors would be the production improvement for DRY code.
*/

export default api
/*
  Default export of the configured Axios instance.

  USAGE IN COMPONENTS:
    import api from '../configs/axios'

    // GET request
    const { data } = await api.get('/api/user/credits', {
      headers: { Authorization: `Bearer ${token}` }
    })
    // data = { credits: 15 }

    // POST with FormData
    const { data } = await api.post('/api/project/create', formData, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // DELETE
    const { data } = await api.delete(`/api/project/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

  NOTE: `const { data } = await api.get(...)` destructures Axios response.
  Axios wraps the server's response in: { data, status, statusText, headers, config }
  data = the actual JSON body from the server.
*/

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: REST API Conventions
  ──────────────────────────────
    REST (Representational State Transfer) uses HTTP methods to indicate action:

    GET    → Read data        (safe, idempotent, no request body)
    POST   → Create data      (has request body, not idempotent)
    PUT    → Replace data     (full update, idempotent)
    PATCH  → Update data      (partial update)
    DELETE → Delete data      (idempotent)

    In this project:
    GET  /api/user/credits        → read credit balance
    GET  /api/project/published   → read community projects
    POST /api/project/create      → create a new project (with files)
    POST /api/project/video       → trigger video generation
    DELETE /api/project/:id       → delete a project

    IDEMPOTENT = calling the same request multiple times = same result.
    GET twice = same result. DELETE twice = first deletes, second gets 404.
    POST creates a NEW record each time → not idempotent.

  CONCEPT: HTTP Headers
  ──────────────────────
    Headers are key-value metadata sent with every HTTP request/response.
    They control caching, auth, content type, CORS, etc.

    Common request headers used in this project:
      Authorization: Bearer <JWT>   → authentication token
      Content-Type: application/json → body is JSON
      Content-Type: multipart/form-data → body has file uploads

    Axios sets Content-Type automatically:
      api.post('/url', { json: 'object' }) → sets application/json
      api.post('/url', formData) → sets multipart/form-data (with boundary)

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ axios.create() = custom Axios instance with shared defaults
  ✔ baseURL = prefix for ALL api calls (no need to repeat full URL)
  ✔ VITE_BASEURL = production backend URL from .env
  ✔ || 'http://localhost:5000' = dev fallback (no .env needed locally)
  ✔ Axios throws on 4xx/5xx (fetch doesn't — must check .ok manually)
  ✔ const { data } = await api.get() — destructure Axios response wrapper
  ✔ Module runs once → api is a singleton (cached on first import)

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Every component that imports `api` gets an import error
  ✘ ALL API calls break — app can't talk to the backend
  ✘ TypeScript shows errors at compile time (missing module)
*/