## 2024-05-15 - [Initial Setup]
**Learning:** Initial setup of palette journal.
**Action:** Ready to document UX/a11y learnings.

## 2024-05-15 - [A11y: Icon-Only Buttons in Custom Components]
**Learning:** Found multiple icon-only interactive toggle buttons in `components/dashboard/ReplayControls.tsx` missing `aria-label`s, preventing screen-reader context. Furthermore, they lacked explicitly visible focus states for keyboard-only navigation.
**Action:** Always add `aria-label` to buttons containing only icons (like Lucide React components) and include robust `focus-visible` classes to ensure full cross-device keyboard navigation compliance within Next.js custom dashboard layouts.
