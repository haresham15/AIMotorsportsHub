## 2023-10-27 - [Dynamic ARIA labels for accessible toggle buttons]
**Learning:** [When dealing with toggle buttons like Play/Pause and Fullscreen modes, dynamically updating the aria-label based on state significantly improves context for screen readers]
**Action:** [Always use dynamic aria-labels tied to the underlying component state (e.g. `aria-label={isPlaying ? "Pause" : "Play"}`) for toggles, rather than static labels]
