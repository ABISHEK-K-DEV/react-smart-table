Security Policy

🛡️ Security Overview

React Smart Table is built with security as a top priority. This document outlines our security practices, how to report vulnerabilities, and guidelines for secure usage.

🔒 Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Full support    |
| 0.x.x   | ❌ No longer supported |

🚨 Reporting Security Vulnerabilities

Please DO NOT report security vulnerabilities through public GitHub issues.

Instead, please report security issues via:

Email
Send details to: security@abisheks238.dev

Required Information
When reporting a vulnerability, please include:

- Type of issue (e.g., XSS, injection, authentication bypass)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

Response Timeline
- Initial Response: Within 24 hours
- Triage: Within 72 hours
- Fix Timeline: Critical issues within 7 days, others within 30 days
- Public Disclosure: After fix is released and users have time to update

🛡️ Security Features

Input Sanitization
- All user inputs are sanitized to prevent XSS attacks
- HTML encoding for output display
- Length limits on all text inputs
- Type validation for all data fields

AI Security
- No API keys exposed in browser
- Rate limiting on AI requests
- Input sanitization for AI prompts
- Secure server-side API endpoints required

File Security
- File type validation (whitelist approach)
- File size limits (50MB for imports, 100MB for exports)
- Content sanitization for CSV imports
- Prevention of CSV injection attacks

Data Protection
- No sensitive data stored in browser storage
- Secure data validation with Zod schemas
- CSRF protection headers
- Content Security Policy headers provided

🔧 Secure Configuration

✅ Recommended Setup

tsx

const aiConfig = {
  enabled: true,
  apiEndpoint: '/api/ai-suggestions',
  rateLimitPerMinute: 10,
  maxBulkSize: 50
};


const schema = {
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  content: z.string().max(1000)
};


❌ Insecure Patterns to Avoid

tsx
// NEVER do this - exposes API keys
const badConfig = {
  apiKey: 'sk-...', // Security vulnerability!
  openaiKey: process.env.OPENAI_KEY // Still exposed!
};

// Avoid unsanitized HTML
const badDisplay = <div dangerouslySetInnerHTML={{__html: userInput}} />;


🔍 Security Best Practices

For Developers Using This Package

1. Server-Side Validation: Always validate data server-side
2. API Security: Implement proper authentication on AI endpoints
3. Rate Limiting: Use rate limiting on your API endpoints
4. HTTPS Only: Serve your application over HTTPS
5. CSP Headers: Implement Content Security Policy headers
6. Input Validation: Use the provided validation schemas

For Server-Side AI Integration

javascript
// Example secure server endpoint
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10
}));

// Secure AI endpoint
app.post('/api/ai-suggestions', async (req, res) => {
  // Validate request
  if (!req.body.column || !req.body.context) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  // Sanitize input
  const sanitizedContext = sanitize(req.body.context);
  
  // Your AI logic here...
});


🚀 Security Testing

We regularly perform:
- Automated Security Scans: GitHub CodeQL, npm audit
- Dependency Checks: Dependabot security updates
- Manual Code Reviews: Security-focused peer reviews
- Penetration Testing: Regular security assessments

🔄 Security Updates

- Security patches are released immediately
- All users are notified via GitHub releases
- Breaking changes are avoided in security updates
- Migration guides provided when necessary

📋 Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded secrets or API keys
- [ ] All inputs sanitized and validated
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Dependencies are up-to-date and secure
- [ ] Tests include security scenarios
- [ ] Documentation updated for security implications

🏆 Security Recognition

We follow responsible disclosure and will acknowledge security researchers who help improve our security:

- Public recognition in release notes
- Security hall of fame on our website
- Coordination on CVE assignment if applicable

📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://blog.logrocket.com/react-security-best-practices/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

📞 Contact

For any security-related questions:
- Security Email: security@abisheks238.dev
- General Contact: support@abisheks238.dev
- GitHub Issues: For non-security bugs only

---

Thank you for helping keep React Smart Table and our users safe! 🛡️
