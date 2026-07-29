// ============================================================
// FILE: server/controllers/clerk.ts
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Handles all incoming Clerk webhook events (HTTP POST from Clerk's servers).
//   When something happens in Clerk (new user, payment), Clerk fires an HTTP
//   request to our server's /api/clerk endpoint. This function handles it.
//
// WHY WEBHOOKS INSTEAD OF POLLING?
//   BAD approach (Polling): Our server asks Clerk every 60s: "Any new users?"
//   GOOD approach (Webhooks): Clerk PUSHES data to us the instant something happens.
//   Webhooks are event-driven, real-time, and don't waste API calls.
//
// WEBHOOK SECURITY:
//   Anyone can POST to /api/clerk if they know the URL.
//   Clerk signs every webhook payload with HMAC-SHA256 using a shared secret.
//   verifyWebhook() checks this signature → only real Clerk events pass.
//   Fake/tampered requests are rejected automatically.
//
// SUPPORTED EVENTS:
//   user.created           → Create a new user record in DB
//   user.updated           → Sync updated profile info to DB
//   user.deleted           → Remove user record from DB
//   paymentAttempt.updated → Credit the user's account on successful payment
//
// Plans (matching Clerk Dashboard → Billing → Plans):
//   ┌────────────┬────────────┬──────────┬─────────┐
//   │ Plan       │ Plan Key   │ Monthly  │ Credits │
//   ├────────────┼────────────┼──────────┼─────────┤
//   │ Free       │ free_user  │  $0.00   │   —     │
//   │ Pro        │ pro        │  $9.00   │   80    │
//   │ Premium    │ premium    │ $60.00   │  240    │
//   └────────────┴────────────┴──────────┴─────────┘
//
// Note: The "free_user" plan has no monetary transaction so
//       paymentAttempt.updated will NOT fire for it. Free
//       credits are granted at user.created time via DB default.
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks'
// verifyWebhook() — verifies the HMAC-SHA256 signature of the incoming webhook.
// Needs the raw request body (Buffer) → that's why the route uses express.raw().
// If signature is invalid: throws an error → our catch block returns 500.
// The WEBHOOK_SECRET is read from process.env automatically by Clerk's SDK.

import { prisma } from '../configs/prisma.js';
import * as Sentry from "@sentry/node"

// ── CREDIT AMOUNTS PER PLAN ────────────────────────────────
const PLAN_CREDITS = {
    pro:     80,
    premium: 240,
} as const;
// `as const` = TypeScript const assertion.
// Makes the object "deeply readonly" and infers literal types:
// Without `as const`: { pro: number, premium: number }
// With `as const`:    { readonly pro: 80, readonly premium: 240 }
//
// WHY THIS MATTERS:
// It allows `keyof typeof PLAN_CREDITS` to infer the literal union type "pro" | "premium"
// instead of just `string`. This gives us type-safe plan slug validation below.

type PaidPlanSlug = keyof typeof PLAN_CREDITS;
// PaidPlanSlug = "pro" | "premium" (the literal union of valid plan keys)
// Used to cast `planId` when looking up PLAN_CREDITS[planId].
// TypeScript wouldn't allow PLAN_CREDITS[planId] if planId is just `string`
// because string is too broad (could be "pro", "invalid_plan", etc.)

// ── WEBHOOK HANDLER ────────────────────────────────────────
const clerkWebhooks = async (req: Request, res: Response) => {
    try {
        const evt: any = await verifyWebhook(req)
        // SIGNATURE VERIFICATION — the security checkpoint.
        // If the request is a fake (not from Clerk), this throws.
        // If the request is genuine, returns the parsed webhook event payload.
        //
        // INTERVIEW Q: What is HMAC-SHA256?
        // A: HMAC = Hash-based Message Authentication Code.
        //    SHA256 = a one-way hash function.
        //    Clerk computes: HMAC-SHA256(rawBody, webhookSecret) → a signature string.
        //    Sends it in the `Svix-Signature` HTTP header.
        //    Our server recomputes it with the same secret.
        //    If they match: the body wasn't tampered with and comes from Clerk.
        //    If they don't match: reject the request.

        const { data, type } = evt;
        // data = the event payload (user info, payment info, etc.)
        // type = the event type string (e.g., "user.created", "paymentAttempt.updated")

        // ── EVENT ROUTER (SWITCH STATEMENT) ───────────────────
        switch (type) {
        // switch(type) routes execution to the matching case.
        // INTERVIEW Q: When to use switch vs if-else?
        // A: switch is cleaner when checking one variable against many possible values.
        //    if-else is better for range checks or complex conditions.
        // Note: Each `case` must end with `break` to prevent "fall-through"
        // (executing the next case's code without checking its condition).

            case "user.created": {
                // Event: A new user signed up to Clerk (via email/Google OAuth/etc.)
                // Action: Create a matching record in OUR database.
                //
                // WHY DO WE NEED OUR OWN DB?
                // Clerk is an external service — it stores auth data (email, password hash).
                // We need our OWN db to store app-specific data: credits, projects, etc.
                // The Clerk user ID is the bridge between both systems.
                await prisma.user.create({
                    data: {
                        id:    data.id,
                        // Use CLERK'S user ID as our own primary key.
                        // This eliminates the need for a separate ID mapping.
                        email: data?.email_addresses[0]?.email_address,
                        // Clerk supports multiple email addresses per user.
                        // [0] = the primary/first email.
                        name:  data?.first_name + " " + data?.last_name,
                        // Concatenate first and last name into a full name string.
                        image: data?.image_url,
                        // Profile picture URL from Clerk (could be Google Avatar, Gravatar, etc.)
                        // credits uses the DB default (20) — not set here explicitly.
                    }
                })
                break;
            }

            case "user.updated": {
                // Event: User changed their name, email, or profile picture in Clerk.
                // Action: Sync the changes to our database so they stay consistent.
                //
                // WHY SYNC? Our DB might show the user's name in the UI.
                // If the user updates it in Clerk but we don't sync → our app shows old name.
                await prisma.user.update({
                    where: { id: data.id },
                    data: {
                        email: data?.email_addresses[0]?.email_address,
                        name:  data?.first_name + " " + data?.last_name,
                        image: data?.image_url,
                    }
                })
                break;
            }

            case "user.deleted": {
                // Event: User deleted their Clerk account.
                // Action: Delete their record from our DB.
                //
                // CASCADING DELETES:
                // schema.prisma has: user User @relation(onDelete: Cascade)
                // So deleting the User automatically deletes all their Projects too.
                // This prevents orphaned project data with no owner.
                await prisma.user.delete({ where: { id: data.id } })
                break;
            }

            case "paymentAttempt.updated": {
                // Event: A payment attempt status changed (could be paid, failed, pending, etc.)
                // Action: If payment was SUCCESSFUL, add credits to the user's account.
                //
                // WHY NOT USE `payment.completed`?
                // Clerk uses `paymentAttempt.updated` for all payment state changes.
                // We filter for the specific states we care about (checkout + paid, recurring + paid).
                
                const isPaidSuccessfully =
                    (data.charge_type === "recurring" || data.charge_type === "checkout") &&
                    data.status === "paid";
                // charge_type breakdown:
                //   "checkout"  = user is subscribing for the FIRST TIME
                //   "recurring" = auto-renewal of an existing subscription
                // status === "paid" = the payment was successful (not failed/pending/refunded)
                //
                // We only credit the user on successful paid transactions.
                // We explicitly ignore: failures, free plan changes, refunds.

                if (isPaidSuccessfully) {
                    const clerkUserId: string = data?.payer?.user_id;
                    // The Clerk ID of the user who paid.
                    // data.payer.user_id is the field name from Clerk's webhook payload.

                    const planId: string = data?.subscription_items?.[0]?.plan?.slug;
                    // subscription_items is an array (user could have multiple plans, though typically just 1).
                    // [0] = the first subscription item.
                    // .plan.slug = the "Plan Key" set in Clerk Dashboard:
                    //              "pro" or "premium" (matching our PLAN_CREDITS object keys)

                    // Validate the plan slug before using it
                    if (planId !== "pro" && planId !== "premium") {
                        console.warn(`[Clerk Webhook] Unknown plan slug received: "${planId}"`);
                        return res.status(400).json({ message: `Invalid plan slug: "${planId}"` });
                        // Reject unknown plans (typos, test plans, free plan renewals, etc.)
                        // This prevents adding random credit amounts for unknown plan types.
                    }

                    const creditAmount = PLAN_CREDITS[planId as PaidPlanSlug];
                    // Look up how many credits this plan grants.
                    // `planId as PaidPlanSlug` = TypeScript type assertion (we verified above it's valid).
                    // pro → 80 credits, premium → 240 credits.
                    
                    console.log(`[Clerk Webhook] Crediting ${creditAmount} credits to user ${clerkUserId} for plan "${planId}"`);

                    await prisma.user.update({
                        where: { id: clerkUserId },
                        data:  { credits: { increment: creditAmount } }
                        // {increment: 80} = credits = credits + 80
                        // WHY INCREMENT instead of SET?
                        // If a user has 15 remaining credits and subscribes to Pro,
                        // they should have 15 + 80 = 95 credits.
                        // Setting to exactly 80 would destroy their existing balance.
                        // Also correct for monthly renewals: add more credits each billing cycle.
                    });
                }
                break;
            }

            // ── CATCH-ALL ─────────────────────────────────────────
            default:
                break;
            // Any other Clerk event types (session.created, email.created, etc.)
            // are silently ignored. We only care about the 4 events above.
        }

        res.json({ message: "Webhook received: " + type })
        // Always respond with 200 OK to Clerk after processing.
        // If we respond with 4xx/5xx, Clerk will RETRY the webhook multiple times.
        // Responding with 200 signals: "I got it, don't resend."

    } catch (error: any) {
        Sentry.captureException(error)
        res.status(500).json({ message: error.message });
        // If we fail to process the webhook, Clerk will retry.
        // This is actually desirable behavior for errors (e.g., DB temporarily unavailable).
    }
}

export default clerkWebhooks

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: Webhooks vs Polling vs Long Polling
  ─────────────────────────────────────────────────────────────
  POLLING: Client asks server every N seconds: "Is there new data?"
    - Simple to implement
    - Wastes resources (most polls find no new data)
    - Inherent latency (up to N seconds delay)

  WEBHOOKS (Push): Server receives HTTP POST when event happens
    - Instant notification
    - Resource-efficient (only fires on actual events)
    - Requires a public URL to receive requests
    - Used by: Clerk, Stripe, GitHub, Twilio, Shopify

  LONG POLLING: Client asks server, server holds response open until data arrives
    - Near-instant notification
    - More complex than polling
    - Used by: some chat applications

  CONCEPT: Idempotency in Webhooks
  ─────────────────────────────────────────────────────────────
  What if Clerk sends the same `paymentAttempt.updated` event twice?
  (Network glitch → Clerk retries → we get duplicate)
  
  Current code: We'd add credits TWICE! The user gets 160 credits instead of 80.
  
  Production fix: Track processed event IDs in the DB.
  If we've already processed event ID "evt_abc123", skip it.
  This is called "idempotent webhook handling" — processing the same event
  multiple times produces the same result as processing it once.
  Clerk sends a unique ID with each webhook (the `id` field in the event).

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ verifyWebhook() = HMAC-SHA256 signature verification (security)
  ✔ express.raw() required for verifyWebhook (raw body needed)
  ✔ switch(type) routes to the correct event handler
  ✔ `as const` on PLAN_CREDITS → keyof yields literal union "pro" | "premium"
  ✔ credits: {increment: creditAmount} → adds to existing balance (not replace)
  ✔ user.deleted triggers cascade delete of all user's projects (schema.prisma)
  ✔ charge_type "checkout" = first subscription, "recurring" = monthly renewal
  ✔ Respond 200 to Clerk always → prevents retry storms
*/