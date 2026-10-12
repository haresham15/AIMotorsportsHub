## 2024-10-12 - Icon-only buttons using HTML entities need ARIA labels
**Learning:** Found multiple instances where the `&times;` HTML entity was used as an icon for "clear" or "close" buttons. Screen readers read `&times;` as "times" or "multiplication", making the button's purpose confusing without proper accessible names.
**Action:** Always ensure that icon-only buttons using text symbols or HTML entities (like `&times;` or `&rsaquo;`) have an explicit `aria-label` describing their action (e.g., "Clear search", "Close modal").
