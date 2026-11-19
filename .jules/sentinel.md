## 2024-10-07 - [Fixed SSRF Vulnerability in Webhook Integration]
**Vulnerability:** The `/api/alerts/discord/route.ts` endpoint allowed Server-Side Request Forgery (SSRF) because the regular expression for validating `webhookUrl` was too permissive (`/^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\//i`). It didn't enforce the end of the string or validate the structure after the webhooks path, which could allow path traversal or reaching other domains if redirected.
**Learning:** Regular expressions for URL validation must be tightly constrained. Using string prefixes or standard URL parsing is often safer, but if using Regex, ensure it anchors to the end or strictly defines allowed characters for the ID and token.
**Prevention:** I fixed the Regex to properly match the Discord webhook structure: `^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$`.

## 2024-10-07 - [Replaced dangerouslySetInnerHTML with React style tags]
**Vulnerability:** `dangerouslySetInnerHTML` was used in `components/HomeClient.tsx` to set styles. Although it was hardcoded CSS, it's a bad practice and could lead to XSS if user input was ever added to that block.
**Learning:** React handles `<style>` tags perfectly well without needing `dangerouslySetInnerHTML`.
**Prevention:** Replaced it with `<style>{...}</style>`.
