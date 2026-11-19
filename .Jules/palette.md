## 2025-01-08 - Missing ARIA Labels on Icon-only Navigation Buttons
**Learning:** Icon-only navigation controls (like ChevronLeft/Right for rounds or carousels) frequently miss ARIA labels, rendering them completely invisible or confusing to screen reader users who cannot infer the action from the icon alone.
**Action:** Always verify icon-only buttons (`<button><Icon /></button>`) have an explicit `aria-label` detailing their purpose or action, especially for core navigation flows.
