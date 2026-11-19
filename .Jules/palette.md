## 2026-10-15 - Added aria-label to Modal Close Button
**Learning:** Icon-only buttons in heavily reused components like Modals often lack accessible labels by default, degrading the experience across the whole application for screen reader users.
**Action:** Ensure generic base components (like `components/ui/Modal.tsx`) explicitly include `aria-label` attributes on any buttons without textual content.
