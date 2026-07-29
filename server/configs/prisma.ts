// ============================================================
// FILE: server/configs/prisma.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Creates and exports a SINGLE shared PrismaClient instance for the
//   entire application. Every controller file imports `prisma` from here.
//
// THE MODULE SINGLETON PATTERN:
//   Node.js caches module exports after the first `require`/`import`.
//   This means `prisma` is created ONCE when this file is first imported,
//   and every subsequent import gets the SAME instance from cache.
//   This prevents creating hundreds of DB connections (one per request).
//
// WHY IT MATTERS:
//   PostgreSQL has a connection limit (typically 100 connections).
//   If you create `new PrismaClient()` inside every controller function,
//   each API call opens a new DB connection → you hit the limit quickly.
//   One shared PrismaClient uses a connection pool (default: 5-10 connections)
//   and efficiently reuses them across all requests.
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
// Ensures process.env.DATABASE_URL is available before PrismaClient reads it.

import { PrismaPg } from '@prisma/adapter-pg'
// PrismaPg = Prisma's PostgreSQL adapter.
// Prisma 5+ introduced "driver adapters" — pluggable database drivers.
// This replaces the old built-in pg driver with a more flexible interface.
//
// WHY AN ADAPTER instead of built-in?
// Allows using edge-compatible database drivers (like @neondatabase/serverless)
// for serverless/edge deployments. Also gives finer control over connection pooling.

import { PrismaClient } from '../generated/prisma/client.js'
// The auto-generated PrismaClient from running `npx prisma generate`.
// Located in ../generated/prisma/ (as specified in schema.prisma's `output` field).
// This client is fully typed based on your schema.prisma models.
// It knows about User, Project, and all their fields and relations.

const connectionString = `${process.env.DATABASE_URL}`
// Reads the PostgreSQL connection URL from environment variables.
// Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
// Example: postgresql://postgres:secret@db.supabase.co:5432/postgres
//
// NEVER hardcode this value — it contains the database password!
// In local dev: stored in server/.env
// In production: set in Vercel/Railway dashboard as an environment variable.

const adapter = new PrismaPg({ connectionString })
// Creates the PostgreSQL adapter using the connection string.
// The adapter manages the underlying `pg` (node-postgres) connection pool.
// Default pool size: 5 connections (configurable).

const prisma = new PrismaClient({ adapter })
// Creates the PrismaClient with the custom adapter.
// This `prisma` object is the interface to the database.
//
// ALL database operations flow through this:
//   prisma.user.create({...})    → INSERT INTO "User" (...)
//   prisma.user.findUnique({...}) → SELECT * FROM "User" WHERE id = ...
//   prisma.user.update({...})    → UPDATE "User" SET ... WHERE ...
//   prisma.user.delete({...})    → DELETE FROM "User" WHERE ...
//   prisma.project.findMany({...}) → SELECT * FROM "Project" WHERE ...
//
// INTERVIEW Q: What is an ORM and why use it?
// A: ORM = Object-Relational Mapper. Maps database rows to JavaScript/TypeScript objects.
//    Benefits:
//    1. Type safety: TypeScript knows the shape of each model at compile time.
//    2. No raw SQL: Less risk of SQL injection; queries are parameterized automatically.
//    3. Migrations: Schema-driven, versioned DB changes.
//    4. Relations: Easily include related data (prisma.user.findMany({ include: { projects: true } })).

export { prisma }
// Named export. Imported in controllers as:
// import { prisma } from '../configs/prisma.js';

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Module Singleton = one PrismaClient instance shared across entire app
  ✔ PrismaPg = PostgreSQL driver adapter (Prisma 5+ pattern)
  ✔ DATABASE_URL comes from process.env → never hardcoded
  ✔ prisma = the ORM object. All DB queries go through it.
  ✔ import from ../generated/prisma (auto-generated after `prisma generate`)
*/