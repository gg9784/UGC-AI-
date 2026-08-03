// ============================================================
// FILE: server/types/express.d.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Extends Express's built-in TypeScript types to add CUSTOM PROPERTIES
//   that this project attaches to the `req` object.
//   
// THE PROBLEM:
//   In our auth middleware (auth.ts): req.auth() is attached by Clerk.
//   In TypeScript, the base Express `Request` type doesn't know about req.auth().
//   If you try to write req.auth() anywhere, TypeScript shows an error:
//     "Property 'auth' does not exist on type 'Request'"
//   
// THE SOLUTION: Module Augmentation (Declaration Merging)
//   TypeScript allows you to ADD properties to existing types from libraries
//   without modifying the library's source code.
//   By using `declare global { namespace Express { interface Request {...} } }`,
//   we MERGE our custom properties into Express's existing Request interface.
//   
// INTERVIEW Q: What is TypeScript Declaration Merging?
// A: A TypeScript feature where multiple declarations with the same name
//    are merged into a single definition. When you use `interface` (not `type`),
//    you can re-declare it across files and TypeScript merges them.
//    This is how library type definitions (*.d.ts files) work — they extend
//    global types without modifying the original source.


import { Request } from 'express';
// We import Request just to ensure the .d.ts file is treated as a module
// (TypeScript files with no imports/exports are treated as scripts, not modules).

declare global {
  // `declare global` opens the global TypeScript namespace.
  // Everything inside this block merges with TypeScript's global type environment.
  // This is necessary to augment types from external modules like 'express'.

  namespace Express {
    // `namespace Express` targets the Express namespace.
    // Express exports its types within this namespace.
    // TypeScript's declaration merging will combine this with Express's built-in namespace.

    interface Request {
      // We're EXTENDING Express's Request interface — not replacing it.
      // All original Request properties (body, params, query, headers, etc.)
      // are still available. We're ADDING new ones.

      auth: () => { userId: string; has: (permission: any) => boolean };
      // auth() is attached by Clerk's middleware (@clerk/express).
      // After `app.use(clerkMiddleware())` runs, every Request has this method.
      //
      // WHAT IT RETURNS:
      //   { userId: string }    → The Clerk user's unique ID (e.g., "user_2abc123xyz")
      //   { has: (permission) } → A method to check if the user has a specific permission
      //
      // USAGE IN CONTROLLERS:
      //   const { userId } = req.auth();
      //   → Extracts the logged-in user's ID from the verified JWT.
      //
      // WHY A FUNCTION () instead of a plain property?
      // Clerk designed it as a function call for consistency with their other SDKs.
      // req.auth() internally reads from the verified JWT payload.
      //
      // TypeScript impact: Without this declaration,
      // const { userId } = req.auth() in any controller would give:
      //   Error TS2339: Property 'auth' does not exist on type 'Request'

      plan?: string;
      // Optional: the user's current subscription plan (e.g., "pro", "premium").
      // The ? means it may or may not be present on a given request.
      // This could be populated by a middleware that reads Clerk's session claims.
      // Not currently used by a middleware but reserved for future authorization logic.

      file: any;
      // Multer attaches the uploaded file to req.file for single-file uploads.
      // (For multi-file uploads: req.files — Multer adds that automatically.)
      // By declaring req.file: any, TypeScript won't complain when controllers
      // access req.file properties.
      //
      // WHY `any` instead of Multer's file type?
      // Avoids importing Multer's types here. A more strict version would be:
      // file: Express.Multer.File;
      // But `any` is simpler and acceptable for a small project.
    }
  }
}

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Declaration Files (*.d.ts)
  ─────────────────────────────────────────────────────────────
  Files ending in .d.ts are "declaration files" — they contain ONLY TypeScript
  type definitions, no executable JavaScript code.
  
  They serve two purposes:
  1. Providing types for JavaScript libraries that don't have TypeScript.
     (The @types/* packages on npm are .d.ts files.)
  2. Augmenting/extending existing types (like we do here for Express).
  
  This file is included by TypeScript via tsconfig.json's `include` or `files` array.
  TypeScript reads it during compilation to know about req.auth().

  CONCEPT: Namespace vs Module
  ─────────────────────────────────────────────────────────────
  Namespace (older style): `namespace Express { interface Request {...} }`
    Groups types under a named object. Was the TypeScript way before ES Modules.
    Express's type system uses namespaces internally.
  
  Module (modern style): `export interface Request {...}`
    ES Module-style type export.
    Cannot be used to augment global types from libraries.
  
  We need the namespace approach specifically to merge with Express's internal types.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ .d.ts = TypeScript declaration file (only types, no executable code)
  ✔ declare global + namespace Express + interface Request = Declaration Merging
  ✔ req.auth() = attached by Clerk middleware → returns { userId, has }
  ✔ req.auth().userId = the logged-in user's Clerk ID (used in every controller)
  ✔ plan? = optional, for future subscription-tier authorization
  ✔ file: any = Multer's single-file upload attachment

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ TypeScript errors: "Property 'auth' does not exist on type 'Request'"
  ✘ All controllers using req.auth() will fail TypeScript compilation
  ✘ The app still RUNS (JavaScript ignores types), but TypeScript build fails
*/