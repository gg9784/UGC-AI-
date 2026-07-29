// ============================================================
// FILE: client/src/components/Pricing.tsx
// ============================================================
//
// SECTION 1 — FILE PURPOSE
// ─────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//   Renders the pricing/subscription section using Clerk's built-in
//   <PricingTable> component. Clerk fetches the plan data automatically
//   from the Clerk Dashboard → Billing → Plans configuration.
//   Wrapped in <ErrorBoundary> for graceful failure handling.
//
// HOW BILLING WORKS END-TO-END:
//   1. Admin configures plans in Clerk Dashboard (Free, Pro, Premium)
//   2. <PricingTable> fetches and renders those plans automatically
//   3. User clicks "Subscribe" → Clerk handles checkout (Stripe integration)
//   4. After payment: Clerk fires "paymentAttempt.updated" webhook
//   5. Our server (controllers/clerk.ts) receives webhook → increments credits
//   6. User now has more credits to generate images/videos
//
// Plans (from Clerk Dashboard → Billing → Subscription plans):
//   ┌────────────┬────────────┬──────────┬─────────┐
//   │ Plan       │ Plan Key   │ Monthly  │ Credits │
//   ├────────────┼────────────┼──────────┼─────────┤
//   │ Free       │ free_user  │  $0.00   │ default │
//   │ Pro        │ pro        │  $9.00   │   80    │
//   │ Premium    │ premium    │ $60.00   │  240    │
//   └────────────┴────────────┴──────────┴─────────┘
//
// How it works:
//   1. Clerk's <PricingTable> fetches plan data from the
//      Clerk Billing API and renders interactive plan cards.
//   2. On plan selection, Clerk handles the checkout flow.
//   3. After a successful payment, Clerk fires the
//      "paymentAttempt.updated" webhook → our server increments
//      the user's credits (see server/controllers/clerk.ts).
//   4. <ErrorBoundary> prevents any Clerk render errors from
//      crashing the whole page — shows a fallback message instead.
// ============================================================

import Title from './Title';
import { PricingTable } from '@clerk/clerk-react';
/*
  PricingTable = Clerk's pre-built React component for subscription plans.
  
  WHAT IT DOES AUTOMATICALLY:
  1. Calls Clerk's Billing API to get the configured plans
  2. Renders plan cards with pricing, features, and CTA buttons
  3. Handles the subscription checkout flow (Stripe)
  4. Updates Clerk's session after subscription
  
  WHY USE A THIRD-PARTY BILLING COMPONENT?
  Building billing/payment UIs from scratch is complex:
  • Stripe integration, SCA (Strong Customer Authentication for EU)
  • Plan management (upgrades, downgrades, cancellations)
  • Billing cycles, proration logic
  • Invoice generation
  Clerk handles all of this. <PricingTable> is a pre-built solution.
  
  TRADE-OFF:
  Pro: Fast to implement, less code to maintain, Stripe compliance built-in.
  Con: Limited customization (appearance props only), vendor lock-in to Clerk Billing.
  
  INTERVIEW Q: When would you use a third-party billing component vs build your own?
  A: Use third-party (Clerk, Stripe Embedded, Paddle) for speed and compliance.
     Build your own when: highly custom checkout flows, enterprise requirements,
     multi-currency/multi-tax, or when vendor lock-in is unacceptable.
*/

import ErrorBoundary from './ErrorBoundary';
/*
  Custom Error Boundary component.
  Catches any runtime errors PricingTable throws during rendering.
  
  WHY IS PricingTable PRONE TO ERRORS?
  1. Network failure: Can't reach Clerk's Billing API
  2. Configuration: Clerk account not set up for billing
  3. Auth issues: Clerk session expired during checkout
  4. API changes: Clerk updates their Billing API
  
  With ErrorBoundary: any failure shows a friendly message.
  Without ErrorBoundary: entire Plans page goes blank (white screen of death).
*/

export default function Pricing() {

    return (
        // ── Section wrapper ──────────────────────────────────────
        // id="pricing" allows smooth-scroll navigation from the navbar.
        <section id="pricing" className="py-20 bg-white/3 border-t border-white/6">
        {/*
          id="pricing" → anchor link target: <a href="#pricing"> from navbar.
          
          py-20 → 80px top and bottom padding.
          bg-white/3 → very slight white background (3% opacity).
            Differentiates this section from the surrounding sections visually.
            Creates a subtle "card within a page" feel without a heavy border box.
          border-t border-white/6 → thin top border separating from previous section.
        */}

            {/* Centered content container — max width 6xl with horizontal padding */}
            <div className="max-w-6xl mx-auto px-4">

                {/* ── Section Title ──────────────────────────────────────
                    Reusable <Title> component accepts:
                      • title       → small uppercase label above the heading
                      • heading     → main h2 heading text
                      • description → supporting paragraph text
                ────────────────────────────────────────────────────── */}
                <Title
                    title="Pricing"
                    heading="Pricing Plans"
                    description="Simple, transparent pricing. Choose the plan that fits your needs — upgrade or downgrade any time."
                />
                {/*
                  "Simple, transparent pricing" → common SaaS copywriting pattern.
                  Addresses a common user objection: "will they charge me hidden fees?"
                  "upgrade or downgrade any time" → reduces commitment anxiety.
                */}

                {/* ── Pricing Table Wrapper ────────────────────────────────
                    flex + flex-wrap centres the Clerk PricingTable cards
                    and lets them wrap gracefully on smaller screens.
                ────────────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-center max-w-5xl mx-auto">
                {/*
                  flex flex-wrap → Clerk's PricingTable renders child plan cards.
                  This wrapper makes them center and wrap for responsiveness.
                  max-w-5xl mx-auto → constrain to 1024px wide, centered.
                  
                  INTERVIEW Q: Why use flex with justify-center here?
                  A: Clerk's PricingTable renders plan cards internally.
                     We don't control the individual cards, only the container.
                     flex justify-center centers whatever Clerk renders.
                     flex-wrap allows cards to wrap to multiple rows on small screens.
                */}

                    {/* ── ErrorBoundary ────────────────────────────────────
                        Catches any runtime errors thrown by <PricingTable>
                        (e.g., Billing API unreachable, plan fetch failure)
                        and renders a friendly fallback instead of a blank
                        or broken screen.
                    ─────────────────────────────────────────────────── */}
                    <ErrorBoundary>

                        {/* ── Clerk PricingTable ───────────────────────────────
                            Automatically fetches and renders the three plans
                            configured in Clerk Dashboard → Billing → Plans:
                              • Free    (free_user) → $0.00/mo
                              • Pro     (pro)       → $9.00/mo  → 80  credits
                              • Premium (premium)   → $60.00/mo → 240 credits

                            appearance.variables:
                              • colorBackground: 'none' → transparent card bg
                                so the site's gradient shows through.

                            appearance.elements (Clerk element class overrides):
                              • pricingTableCardBody   → glass-tinted card body
                              • pricingTableCardHeader → brighter glass header
                              • switchThumb            → white billing-cycle toggle

                            NOTE: All keys below are Clerk theme tokens, not
                                  Tailwind/CSS classes — they map to Clerk's
                                  internal element selectors.
                        ─────────────────────────────────────────────── */}
                        <PricingTable appearance={{
                            variables: {
                                colorBackground: 'none'
                                /*
                                  'none' for background = transparent.
                                  
                                  WHY NOT A COLOR?
                                  The plan cards have their own solid background by default (white/light).
                                  Setting 'none' makes them transparent, allowing the page's dark gradient
                                  background to show through the cards.
                                  This creates design unity — cards feel part of the page, not widgets pasted in.
                                  
                                  Clerk's appearance.variables map to CSS custom properties:
                                  colorBackground → --clerk-color-background
                                  colorPrimary    → --clerk-color-primary
                                  colorText       → --clerk-color-text
                                */
                            },
                            elements: {
                                pricingTableCardBody:   'bg-white/6',
                                /*
                                  Overrides the CSS class for the plan card's main content area.
                                  bg-white/6 = white at 6% opacity = subtle dark card tint.
                                  Matches the project's glassmorphism aesthetic.
                                */
                                pricingTableCardHeader: 'bg-white/10',
                                /*
                                  The header section of each plan card (shows plan name, price).
                                  bg-white/10 = slightly more visible than the body.
                                  Creates a subtle two-tone card (darker body, lighter header).
                                */
                                switchThumb:            'bg-white'
                                /*
                                  The billing cycle toggle thumb (monthly/annual switch).
                                  bg-white = white thumb on the toggle → visible against the dark card.
                                  Without this, the toggle thumb might be invisible on dark backgrounds.
                                  
                                  CONCEPT — Clerk's appearance.elements:
                                  Clerk uses internal CSS class names for its components.
                                  elements: { elementName: 'tailwind-classes' }
                                  → Clerk applies these Tailwind classes to that internal element.
                                  This lets you style Clerk's pre-built UI without overriding CSS specificity.
                                  
                                  INTERVIEW Q: How do you customize Clerk's pre-built components?
                                  A: Via the appearance prop with two systems:
                                     variables: → CSS custom properties (colors, fonts, radii, spacing)
                                     elements: → CSS class names for specific Clerk UI elements
                                     Both accept Tailwind classes or standard CSS class names.
                                */
                            }
                        }}/>

                    </ErrorBoundary>
                </div>
            </div>
        </section>
    );
};

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ <PricingTable> = Clerk's built-in billing component (auto-fetches plans)
  ✔ Plans configured in Clerk Dashboard, NOT in code
  ✔ Billing flow: PricingTable → Clerk Checkout → Stripe → Webhook → Credits
  ✔ <ErrorBoundary> wraps PricingTable for graceful failure handling
  ✔ appearance.variables → CSS custom properties (colorBackground, colorPrimary)
  ✔ appearance.elements → Tailwind classes applied to specific Clerk UI parts
  ✔ colorBackground: 'none' → transparent cards (page bg shows through)
  ✔ pricingTableCardBody/Header → glass-tinted card sections
  ✔ switchThumb: 'bg-white' → makes billing cycle toggle visible on dark bg

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Plans.tsx breaks (imports Pricing)
  ✘ Users can't see pricing or subscribe
  ✘ No billing = no revenue for the app
*/