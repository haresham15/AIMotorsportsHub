## 2026-10-07 - [Optimize UI render]
**Learning:** The LiveStandings component renders a large table and rerenders on every parent change. Since its props are mostly stable state and primitives, memoizing it reduces unnecessary rerendering.
**Action:** Use React.memo on UI components with stable props and complex DOM trees.
