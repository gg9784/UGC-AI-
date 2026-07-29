/*
  ============================================================
  FILE: client/src/pages/Plans.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    A dedicated page for users to view and purchase subscription plans.
    While Pricing is featured on the Home page, logged-in users need
    a specific route (e.g. /plans) to manage their credits when they
    run low.

  KEY CONCEPTS TAUGHT:
    • Component Reusability: Importing the same Pricing component
      used on the Home page.
    • Margin adjustments based on context (`max-sm:py-10`).
  ─────────────────────────────────────────────────────────────
*/

import Pricing from "../components/Pricing"
/*
  By importing the existing Pricing component, any changes made to the
  plans (like changing Clerk configs or altering the UI of the Pricing block)
  automatically reflect on BOTH the Home page and the Plans page.
*/

const Plans = () => {
  return (
    <div className="max-sm:py-10 sm:pt-20">
    {/*
      max-sm:py-10 → On mobile, 40px padding top/bottom.
      sm:pt-20     → On desktop, 80px padding top.
      This ensures the pricing table doesn't collide with the Navbar,
      which sits fixed at the top of the page.
    */}
    
      <Pricing />
        
      {/* 
        This is an extra tooltip/helper text specific to the Plans page.
        It explains exactly what a "credit" gets you (the conversion rate),
        which helps users justify upgrading to a higher tier.
      */}
      <p className="text-center text-gray-400 max-w-md text-sm my-14 mx-auto px-12">
        Create stunning images for just <span className='text-indigo-400 font-medium'>5 credits</span> 
        and generate immersive videos for <span className='text-indigo-400 font-medium'>10 credits</span>.
      </p>
      
    </div>
  )
}

export default Plans

/*
  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Reuses `<Pricing />` component to avoid duplicating the Clerk `<PricingTable />`.
  ✔ The helper text clarifies the exact "credit cost" of generating assets.
*/
