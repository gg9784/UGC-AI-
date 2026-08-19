import "./configs/instrument.mjs"

import express, { Request, Response } from 'express';
import cors from 'cors'
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from './controllers/clerk.js';
import * as Sentry from "@sentry/node"
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

// ── APP INITIALIZATION ────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────

app.use(cors())
app.post('/api/clerk', express.raw({ type: 'application/json' }), clerkWebhooks)
app.use(express.json())
app.use(clerkMiddleware())

// ── ROUTES ────────────────────────────────────────────────────────────────────

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter)
app.use('/api/project', projectRouter)

Sentry.setupExpressErrorHandler(app);

// ── START SERVER ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});