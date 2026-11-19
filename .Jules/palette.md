## 2026-10-07 - Add ARIA label to general component
**Learning:** Found an icon-only button inside the generic `components/ui/Modal.tsx` that didn't have an `aria-label`. Since this component is meant to be reused across the application, a missing label could negatively impact screen reader accessibility across many modal instances.
**Action:** Next time, always check generic, foundational UI components for icon-only buttons as fixing it there applies the accessibility fix across all usages globally.
