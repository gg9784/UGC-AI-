import { Request, Response } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks'
import { prisma } from '../configs/prisma.js';
import * as Sentry from "@sentry/node"

// ── PLAN CREDITS ──────────────────────────────────────────────────────────────

const PLAN_CREDITS = {
    pro:     80,
    premium: 240,
} as const;

type PaidPlanSlug = keyof typeof PLAN_CREDITS;

// ── WEBHOOK HANDLER ───────────────────────────────────────────────────────────

const clerkWebhooks = async (req: Request, res: Response) => {
    try {
        const evt: any = await verifyWebhook(req);
        const { data, type } = evt;

        switch (type) {
            case "user.created": {
                await prisma.user.create({
                    data: {
                        id:    data.id,
                        email: data?.email_addresses[0]?.email_address,
                        name:  data?.first_name + " " + data?.last_name,
                        image: data?.image_url,
                    },
                });
                break;
            }

            case "user.updated": {
                await prisma.user.update({
                    where: { id: data.id },
                    data: {
                        email: data?.email_addresses[0]?.email_address,
                        name:  data?.first_name + " " + data?.last_name,
                        image: data?.image_url,
                    },
                });
                break;
            }

            case "user.deleted": {
                await prisma.user.delete({ where: { id: data.id } });
                break;
            }

            case "paymentAttempt.updated": {
                const isPaidSuccessfully =
                    (data.charge_type === "recurring" || data.charge_type === "checkout") &&
                    data.status === "paid";

                if (isPaidSuccessfully) {
                    const clerkUserId: string = data?.payer?.user_id;
                    const planId: string = data?.subscription_items?.[0]?.plan?.slug;

                    if (planId !== "pro" && planId !== "premium") {
                        console.warn(`[Clerk Webhook] Unknown plan slug received: "${planId}"`);
                        return res.status(400).json({ message: `Invalid plan slug: "${planId}"` });
                    }

                    const creditAmount = PLAN_CREDITS[planId as PaidPlanSlug];
                    console.log(`[Clerk Webhook] Crediting ${creditAmount} credits to user ${clerkUserId} for plan "${planId}"`);

                    await prisma.user.update({
                        where: { id: clerkUserId },
                        data:  { credits: { increment: creditAmount } },
                    });
                }
                break;
            }

            default:
                break;
        }

        res.json({ message: "Webhook received: " + type });

    } catch (error: any) {
        Sentry.captureException(error);
        res.status(500).json({ message: error.message });
    }
};

export default clerkWebhooks;