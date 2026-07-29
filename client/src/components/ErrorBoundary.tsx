/*
  ============================================================
  FILE: client/src/components/ErrorBoundary.tsx
  ============================================================

  SECTION 1 — FILE PURPOSE
  ─────────────────────────────────────────────────────────────
  WHY THIS FILE EXISTS:
    A React Error Boundary — catches JavaScript errors that occur during
    rendering inside its subtree and shows a fallback UI instead of
    crashing the entire application.

  WHERE IT'S USED:
    Pricing.tsx wraps <PricingTable> in <ErrorBoundary> because:
    Clerk's PricingTable component might fail if the Billing API is unreachable,
    the Clerk account isn't configured for billing, or there's a network error.
    Without ErrorBoundary, a Pricing crash would blank out the entire page.
    With ErrorBoundary, only the pricing section shows an error message.

  KEY FACT — WHY A CLASS COMPONENT?
    Error Boundaries MUST be class components.
    There is no Hook equivalent for getDerivedStateFromError or componentDidCatch.
    This is one of the few remaining reasons to use class components in modern React.
    
  INTERVIEW Q: What is a React Error Boundary?
  A: A class component that catches JavaScript errors in its child component tree,
     logs them, and displays a fallback UI instead of crashing the whole app.
     It uses getDerivedStateFromError to update state when an error occurs,
     and componentDidCatch to log the error.
     Error boundaries do NOT catch: async errors, event handler errors, or errors
     in the boundary itself.
  ─────────────────────────────────────────────────────────────
*/

import { Component, type ReactNode } from "react";
/*
  Component = the base React class component. All class components extend this.
  ReactNode = TypeScript type for anything React can render:
    strings, numbers, JSX elements, arrays of elements, null, undefined, etc.
    Used to type the children and fallback props.
  
  `type ReactNode` = type-only import (no runtime cost).
*/

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}
/*
  Props interface for ErrorBoundary.

  children: ReactNode
    The component tree to protect.
    <ErrorBoundary><PricingTable /></ErrorBoundary>
    → children = <PricingTable />

  fallback?: ReactNode
    Optional custom error UI. If provided, shows this instead of the default message.
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
    If not provided, uses the default message inside render().
    
    ?? (nullish coalescing) operator handles this:
    this.props.fallback ?? (default JSX)
    → if fallback is provided → show it
    → if fallback is null/undefined → show default message
*/

interface State {
    hasError: boolean;
    error: Error | null;
}
/*
  State shape for the class component.
  hasError: boolean → true when an error was caught
  error: Error | null → the caught error object (for logging, showing message)
*/

class ErrorBoundary extends Component<Props, State> {
/*
  class ErrorBoundary extends Component<Props, State>
  
  CLASS COMPONENT SYNTAX:
  In React 16+, components can be either:
  1. Function components: const Foo = () => <div />
  2. Class components: class Foo extends Component<Props, State> { ... }
  
  Component<Props, State>
    Generic type parameters:
    Props → the type of this.props
    State → the type of this.state
  
  WHY CLASS FOR ERROR BOUNDARIES?
  Two lifecycle methods only available in class components:
    1. static getDerivedStateFromError(error) → update state when error occurs
    2. componentDidCatch(error, info) → log the error (for Sentry, analytics, etc.)
  React Hooks (useEffect, useState) cannot replicate these methods.
  This is documented as an explicit React design decision — React team may
  eventually add a hook, but hasn't done so yet.
*/

    constructor(props: Props) {
        super(props);
        /*
          super(props) MUST be called first in a React class constructor.
          It calls the parent class (Component) constructor, which sets up:
          • this.props
          • this.state
          • this.context
          Without super(props), this.props would be undefined.
          
          INTERVIEW Q: Why do you call super(props) in class constructors?
          A: It initializes the Component base class with the props.
             Without it, the React Component class doesn't know about props,
             and this.props would be undefined in the constructor.
        */
        this.state = { hasError: false, error: null };
        /*
          Initial state: no error has occurred yet.
          hasError = false → render children normally.
          error = null → no error object.
        */
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
        /*
          getDerivedStateFromError is called by React automatically when
          any descendant component throws an error during rendering.
          
          WHAT IT DOES:
          Returns new state → React updates this.state.
          hasError: true → tells render() to show the fallback UI.
          error → stored for potential display/logging.
          
          WHY STATIC?
          static = belongs to the CLASS, not an instance.
          It receives the error but has NO access to `this` (no instance).
          It can ONLY return new state — no side effects allowed here.
          Side effects go in componentDidCatch.
          
          WHAT ERRORS DOES IT CATCH?
          ✓ Errors during render
          ✓ Errors in lifecycle methods
          ✓ Errors in constructors of child components
          
          ✗ Does NOT catch:
          - Errors in async functions (fetch, setTimeout)
          - Errors in event handlers (onClick)
          - Errors in the ErrorBoundary component itself
          - Server-side rendering errors
          
          For async/event handler errors: use regular try/catch.
        */
    }

    componentDidCatch(error: Error) {
        console.warn("ErrorBoundary caught:", error.message);
        /*
          componentDidCatch is called after getDerivedStateFromError.
          
          PURPOSE: Side effects for error handling.
          In production, you'd call Sentry.captureException(error) here.
          For this project, we just log to console.
          
          In production apps:
          componentDidCatch(error: Error, info: ErrorInfo) {
            Sentry.captureException(error, { extra: info.componentStack })
          }
          info.componentStack = the React component tree stack trace
          (shows exactly which component tree led to the error)
          
          INTERVIEW Q: Difference between getDerivedStateFromError and componentDidCatch?
          A: getDerivedStateFromError → synchronous, called before re-render, returns new state.
             componentDidCatch → can have side effects, called after re-render with error info.
             Use getDerivedStateFromError to update UI, componentDidCatch to log errors.
        */
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <p className="text-gray-400 text-sm">
                        Pricing is not available yet. Please check back later.
                    </p>
                </div>
            );
        }
        /*
          if (this.state.hasError) → an error was caught
          
          this.props.fallback ?? (default message)
          ?? = Nullish Coalescing Operator
          Returns the LEFT side if it's NOT null/undefined.
          Returns the RIGHT side if the LEFT is null/undefined.
          
          If parent provides fallback: show it.
          If fallback is not provided (undefined): show default message.
          
          The default message handles the specific case of Clerk's PricingTable
          failing (e.g., Billing not configured in Clerk Dashboard).
          "Pricing is not available yet" is user-friendly — doesn't show a scary error.
          
          INTERVIEW Q: What is the nullish coalescing operator (??)?
          A: Returns the right operand when the left is null or undefined.
             Different from ||: || returns right when left is ANY falsy value (0, "", false).
             ?? is stricter — only activates on null/undefined, not on 0 or "".
             Example: 0 ?? "default" → 0 (0 is not null/undefined)
                      0 || "default" → "default" (0 is falsy)
        */

        return this.props.children;
        /*
          No error → render children normally.
          this.props.children = <PricingTable /> (the wrapped component).
          React renders it as if ErrorBoundary doesn't exist.
          
          This is the TRANSPARENT WRAPPER pattern:
          When no error: render children unchanged.
          When error: render fallback.
        */
    }
}

export default ErrorBoundary;

/*
  ============================================================
  SECTION 3 — CONCEPT BOXES
  ============================================================

  CONCEPT: React Component Lifecycle (Class Components)
  ──────────────────────────────────────────────────────
    Class component lifecycle:
    
    1. constructor(props)
       → Initialize state, bind methods
    
    2. static getDerivedStateFromError(error)
       → Called when a descendant throws during render
       → Returns new state (no side effects)
    
    3. render()
       → Returns JSX based on state/props
    
    4. componentDidMount()
       → After first render — good for API calls, subscriptions
    
    5. componentDidUpdate(prevProps, prevState)
       → After every re-render when props/state changed
    
    6. componentDidCatch(error, info)
       → After error boundary catches an error — good for logging
    
    7. componentWillUnmount()
       → Before removal from DOM — cleanup subscriptions, timers
    
    Modern equivalent with Hooks:
    componentDidMount     → useEffect(() => {...}, [])
    componentDidUpdate    → useEffect(() => {...}, [dep])
    componentWillUnmount  → useEffect(() => { return cleanup }, [])
    getDerivedStateFromError → ⚠️ No hook equivalent yet
    componentDidCatch     → ⚠️ No hook equivalent yet

  CONCEPT: Defensive Programming
  ────────────────────────────────
    ErrorBoundary is an example of defensive programming:
    Anticipating that third-party code (Clerk's PricingTable) MIGHT fail
    and preparing a graceful degradation response.
    
    Instead of: "It probably won't fail" (optimistic)
    Use: "What if it fails? Let me handle it" (defensive)
    
    Production rule: Any external API call, third-party component,
    or user data should be wrapped in error handling.

  ============================================================
  SECTION 7 — MEMORY NOTES
  ============================================================
  ✔ Error Boundary = catches render errors in children, shows fallback
  ✔ MUST be a class component (no Hook equivalent exists)
  ✔ super(props) = required first call in constructor
  ✔ getDerivedStateFromError = static, returns new state, no side effects
  ✔ componentDidCatch = instance method, good for logging (Sentry)
  ✔ ?? = nullish coalescing (right side only on null/undefined, not all falsy)
  ✔ Does NOT catch: async errors, event handler errors
  ✔ Used in Pricing.tsx to protect against Clerk PricingTable failures

  SECTION 9 — IF THIS FILE IS REMOVED
  ✘ Pricing page crashes and goes blank if Clerk's PricingTable throws
  ✘ The entire page becomes a white screen on any billing-related error
  ✘ TypeScript shows import error in Pricing.tsx
*/
