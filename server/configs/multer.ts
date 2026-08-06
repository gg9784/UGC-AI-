// ============================================================
// FILE: server/configs/multer.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Configures and exports Multer — the Node.js middleware for
//   handling multipart/form-data (file uploads from HTML forms).
//
// WHERE IT'S USED:
//   projectRoutes.ts:
//   projectRouter.post('/create', upload.array('images', 2), protect, createProject)
//                                 ↑ Multer middleware runs FIRST.
//                                   It intercepts the multipart request,
//                                   saves uploaded files to disk/memory,
//                                   and populates req.files with file metadata.
//
// INTERVIEW Q: What is Multer?
// A: Multer is an Express middleware that handles multipart/form-data requests.
//    When a browser submits a form with file inputs, it encodes the data as
//    multipart/form-data. Express's built-in body parser (express.json) cannot
//    handle this format. Multer processes it and makes files available via req.files.
// ───────────────────────────────────────────────────────────────

import multer from 'multer';

const storage = multer.diskStorage({})
// diskStorage = a Multer storage engine that saves uploaded files to DISK.
//
// ALTERNATIVE: multer.memoryStorage()
//   Saves files in RAM as Buffer objects.
//   Faster for small files, but risky for large files (can exhaust memory).
//   Better for serverless functions that don't have persistent disk.
//
// multer.diskStorage({})
//   The empty object uses ALL DEFAULTS:
//   - destination: Operating system's temp directory (e.g., /tmp on Linux, C:\Users\...\AppData\Local\Temp on Windows)
//   - filename: Multer generates a random name (no extension)
//
//   If you needed custom logic, you'd provide:
//   multer.diskStorage({
//     destination: (req, file, cb) => cb(null, './uploads/'),
//     filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
//   })
//
// WHY SAVE TO DISK (instead of passing buffer directly to Cloudinary)?
// Our controller reads the file from disk using `fs.readFileSync(item.path)` and
// `cloudinary.uploader.upload(item.path)`. Cloudinary accepts a file PATH.
// Disk storage is the simplest approach for this pattern.
// After Cloudinary upload, the temp files remain on disk but are irrelevant
// (they'll be cleaned up by the OS eventually, or could be explicitly deleted).

const upload = multer({ storage })
// Creates the configured Multer upload handler.
// The `upload` object has methods for different upload scenarios:
//   upload.single('fieldName')    → Expects ONE file under 'fieldName'
//   upload.array('fieldName', N)  → Expects UP TO N files under 'fieldName'
//   upload.fields([...])          → Expects files under multiple field names
//
// In projectRoutes.ts: upload.array('images', 2)
//   → The form must send files under the field name 'images'.
//   → At most 2 files will be accepted (product image + model image).
//   → req.files will be an array of Multer file objects:
//     [
//       { fieldname: 'images', originalname: 'product.jpg', path: '/tmp/abc123', mimetype: 'image/jpeg', ... },
//       { fieldname: 'images', originalname: 'model.png',   path: '/tmp/def456', mimetype: 'image/png', ... },
//     ]
//
// The 'images' field name must MATCH what the frontend sends:
// In Genetator.tsx:
//   formData.append('images', productImage) ← same key 'images'
//   formData.append('images', modelImage)   ← same key 'images'

export default upload;
// Default export. Imported in projectRoutes.ts as:
//   import upload from '../configs/multer.js';

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Multer handles multipart/form-data (file uploads) in Express
  ✔ diskStorage({}) = save to OS temp dir with random filename
  ✔ upload.array('images', 2) = accept max 2 files under 'images' field
  ✔ req.files = array of file metadata objects (path, mimetype, etc.)
  ✔ Field name 'images' must match formData.append('images', file) on frontend
  ✔ Files persist on disk after upload (no explicit cleanup in this code)
*/