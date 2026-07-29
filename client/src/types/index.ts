/*
  ============================================================
  FILE: client/src/types/index.ts
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    Defines the TypeScript SHAPES (types/interfaces) for all the data
    objects used across the frontend. Without this file, TypeScript
    would treat API responses and component props as `any` — no safety.

  WHEN IT EXECUTES:
    TypeScript types are COMPILE-TIME ONLY.
    They are completely erased before the JavaScript runs in the browser.
    Zero runtime cost, zero bundle size impact.

  WHO CALLS IT:
    Every component that works with Project data or uses UploadZone:
    • UploadZone.tsx (uses UploadZoneProps)
    • ProjectCard.tsx (uses Project)
    • Genetator.tsx (uses File type indirectly)
    • Result.tsx (uses Project)
    • MyGenerations.tsx (uses Project[])
    • Community.tsx (uses Project[])

  WHAT IT EXPORTS:
    • UploadZoneProps — props for the UploadZone component
    • User — shape of a user object
    • Project — shape of a project/generation object

  KEY INSIGHT:
    These types MIRROR the Prisma schema in the backend.
    If the backend adds a new field, TypeScript shows an error here
    until you update the type → catching backend/frontend mismatches at compile time.
  ─────────────────────────────────────────────────────────────
*/

import type React from "react";
/*
  `import type` — imports ONLY the TypeScript type, nothing else.
  At runtime (in the browser), this import line is completely removed.

  WHY import type INSTEAD OF import?
    `import React from 'react'` — imports the runtime value AND types.
    `import type React from 'react'` — imports ONLY the type, zero runtime cost.
    
    We only need React here for its type: React.ChangeEvent<HTMLInputElement>
    We don't need the React object itself (no JSX in this file).
    
    Best practice: use `import type` whenever you only need TypeScript types.
    It makes your intent clear and helps bundlers treeshake dead code.

  INTERVIEW Q: What is `import type` in TypeScript?
  A: A type-only import that is completely erased from the compiled JavaScript.
     Use it when you only need the type for type annotations, not the runtime value.
     It's a signal to other developers that this import has zero runtime effect.
*/

export interface UploadZoneProps {
    label: string;
    file: File | null;
    onClear: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
/*
  WHAT IS AN INTERFACE?
    A TypeScript construct that defines the SHAPE (contract) of an object.
    It says: "any object of this type MUST have these properties with these types."
    If you violate the contract, TypeScript shows a red error immediately.

  WHY EXPORT?
    Other files can import and use this type:
      import type { UploadZoneProps } from '../types'

  FIELD BY FIELD:
  ──────────────────────────────────────────────────────────────

  label: string;
    The text shown above the upload zone (e.g., "Product Image", "Model Image").
    Required — must always be provided.
    TypeScript enforces: <UploadZone label="Product" ...> ✓
                         <UploadZone ...> ✗ Error: missing 'label'

  file: File | null;
    Union type: can be either a File object OR null.
    File | null = "there may or may not be a file selected right now".
    
    What is a File object?
    A browser API object representing a file from the user's filesystem.
    Properties: .name (filename), .size (bytes), .type (MIME: "image/jpeg"),
                .lastModified (timestamp).
    Created when a user selects a file from the file picker.
    The file is in MEMORY — it hasn't been uploaded yet.

    null = no file selected (initial state, or after clearing).
    
    INTERVIEW Q: What is a union type in TypeScript?
    A: A type that can be one of several types, written with |.
       string | number means the value can be a string OR a number.
       File | null means the value is either a File object or null.
       TypeScript enforces you handle both cases before using the value.

  onClear: () => void;
    A callback function. The parent passes a function that UploadZone calls
    when the user clicks the X (clear) button.
    () => void means: takes no arguments, returns nothing.
    
    CALLBACK PATTERN — INVERTED CONTROL:
    UploadZone doesn't manage the file state — the parent (Genetator) does.
    UploadZone just NOTIFIES the parent: "the user wants to clear the file."
    The parent decides what to do (setProductImage(null)).
    
    This is the "lift state up" pattern in React.
    
    INTERVIEW Q: What does "void" mean as a return type?
    A: The function doesn't return any meaningful value.
       It's not the same as null or undefined — void means "don't use the return value."
       () => void is the standard type for event handlers and callbacks.

  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    A callback for the file input's change event.
    Takes one argument: e — the change event object.
    
    React.ChangeEvent<HTMLInputElement>:
    React.ChangeEvent = React's synthetic event wrapper for change events.
    <HTMLInputElement> = the generic specifies which HTML element fired the event.
    
    Inside the parent (Genetator.tsx):
      const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]  // e.target = the input element
      }
    
    The event object contains:
      e.target         = the input element that changed
      e.target.files   = FileList of selected files (null if no file)
      e.target.files[0] = the first selected file

  CONCEPT — Props Contract:
    By defining UploadZoneProps, TypeScript ensures every usage of UploadZone
    provides all required props with correct types:
    
    <UploadZone
      label="Product Image"        ← string ✓
      file={productImage}          ← File | null ✓
      onClear={() => setProductImage(null)}  ← () => void ✓
      onChange={(e) => handleFileChange(e, 'product')}  ← correct handler ✓
    />
    
    Missing any prop → TypeScript error immediately.
    Wrong type → TypeScript error immediately.
    This prevents runtime errors before the code even runs.
*/

export interface User {
    id?: string;
    name?: string;
    email?: string;
}
/*
  Shape of a user object from the API.

  id?: string
    The ? makes this field OPTIONAL — it may or may not exist.
    
    WHY OPTIONAL?
    Sometimes the API returns a user object that's incomplete.
    Or the user field is embedded in a Project and we only include some fields.
    Making fields optional prevents TypeScript errors when not all fields are present.

  DIFFERENCE: required vs optional in TypeScript
    name: string    → REQUIRED. TypeScript errors if you access without it.
    name?: string   → OPTIONAL. TypeScript tells you it might be undefined.
    
    To safely use optional fields:
      const displayName = user.name ?? 'Anonymous'   // nullish coalescing
      const initials = user.name?.charAt(0)           // optional chaining

  INTERVIEW Q: What is optional chaining (?.) in TypeScript/JavaScript?
  A: user.name?.charAt(0) safely accesses .charAt(0) only if user.name is not null/undefined.
     Without it: user.name.charAt(0) would throw "Cannot read property 'charAt' of undefined".
     Optional chaining returns undefined instead of throwing.
     It's essential for working with API data where fields might be missing.
*/

export interface Project {
    id: string;
    name?: string;
    userId?: string;
    user?: User;
    productName: string;
    productDescription?: string;
    userPrompt?: string;
    aspectRatio: string;
    targetLength?: number;
    generatedImage?: string;
    generatedVideo?: string;
    isGenerating: boolean;
    isPublished: boolean;
    error?: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    uploadedImages: string[];
}
/*
  The main data shape for a project/generation.
  This is the data returned by the backend when fetching projects.

  HOW THIS MIRRORS THE PRISMA SCHEMA:
    Prisma schema (server-side):        This interface (client-side):
    model Project {                     interface Project {
      id        String  @id      ←        id: string
      userId    String           ←        userId?: string (optional here)
      productName String         ←        productName: string
      isGenerating Boolean       ←        isGenerating: boolean
      uploadedImages String[]    ←        uploadedImages: string[]
      createdAt DateTime         ←        createdAt: Date | string
    }

  FIELD EXPLANATIONS:

  id: string
    UUID auto-generated by Prisma (@default(uuid())).
    Always present — required.

  name?: string
    Project display name. Optional in the interface because
    some API responses might not include it.

  user?: User
    Embedded user object. Present when the API uses Prisma's `include: { user: true }`.
    Used in Community page to show creator's name.
    Optional because many API calls don't join the user data.

  productName: string
    Required — always present. The product being showcased.

  generatedImage?: string
    Optional because:
    1. Right after creation: AI hasn't generated it yet (isGenerating = true)
    2. If generation failed: it remains empty
    When present: a Cloudinary HTTPS URL.

  generatedVideo?: string
    Also optional — only present after explicit video generation.
    Image is generated first; video is a separate user-triggered action.

  isGenerating: boolean
    Required. true = AI is currently processing this project.
    Used in Result.tsx to start/stop the polling interval.
    Used in ProjectCard to show the "Generating..." badge.

  isPublished: boolean
    Required. true = appears in the public Community feed.
    false = private (only creator can see it).
    Toggle via the Publish/Unpublish button in ProjectCard.

  createdAt: Date | string
    Union type because APIs often return dates as ISO strings.
    From the backend: "2026-01-08T11:44:09.000Z" (string)
    Converted by JavaScript: new Date("2026-01-08T11:44:09.000Z") (Date object)
    Both representations might appear depending on where in the code we are.
    
    In ProjectCard.tsx: new Date(gen.createdAt).toLocaleString()
    This handles both — new Date() accepts both Date objects and ISO strings.

  uploadedImages: string[]
    Array of Cloudinary URLs for the original uploaded images.
    string[] = an array where every element is a string.
    Always present (at least 2 images required to create a project).
    Used in ProjectCard to show the source image thumbnails.

  INTERVIEW Q: Interface vs Type in TypeScript?
  A: Both define object shapes. Interfaces can be extended:
       interface Animal { name: string }
       interface Dog extends Animal { breed: string }
     Types can define unions/intersections:
       type StringOrNumber = string | number
     For component props and API response shapes, interface is conventional.
     For complex type algebra (unions, intersections), use type.

  INTERVIEW Q: Why define these types separately instead of inline?
  A: Reusability and single source of truth. Defining Project in one place
     means changing the API response shape → update one interface → TypeScript
     finds all usages that need updating. Without centralized types,
     you'd duplicate the shape in every component → inconsistency.
*/

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ interface = TypeScript contract for object shape
  ✔ ? = optional field (may be undefined)
  ✔ string[] = array of strings (same as Array<string>)
  ✔ A | B = union type (can be either A or B)
  ✔ import type = compile-time only, zero runtime cost, zero bundle impact
  ✔ These interfaces mirror the Prisma schema → full-stack type safety
  ✔ File = browser API for user-selected files (not uploaded yet)
  ✔ React.ChangeEvent<HTMLInputElement> = typed change event for file inputs

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ TypeScript errors in every component that imports these types
  ✘ Props become untyped (any) → lose TypeScript safety
  ✘ No runtime error — TypeScript types are compile-time only
*/