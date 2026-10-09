## 2024-10-09 - [Prevent HTML Injection in Nodemailer]
**Vulnerability:** HTML Injection / XSS in `app/api/suggestions/route.ts` because user-supplied input was directly concatenated into the HTML email template.
**Learning:** Sending HTML emails using string interpolation is vulnerable to HTML injection if the data is user-controlled. Even if it's sent internally, attackers could execute scripts on the email client of the administrator reading the feedback.
**Prevention:** Always escape HTML entities before interpolating user input into HTML payloads, including emails.
