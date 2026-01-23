# Security Documentation

This document outlines the security measures implemented for the Hugo Chemistry Education website to protect against common web vulnerabilities.

## Overview

The application implements multiple layers of security including:

- Automated vulnerability scanning
- Dependency management
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Rate limiting

## Security Features

### 1. Vulnerability Scanning

**CI/CD Integration:**

- Automated `npm audit` runs on every push
- Blocks deployment if moderate+ vulnerabilities found
- Separate production dependency audit (high+ severity)
- Security reports retained for 30 days

**Manual Scanning:**

```bash
# Run security audit
npm run audit

# Audit development dependencies only
npm run audit:dev

# Fix vulnerabilities automatically
npm run audit:fix

# Full security check
npm run security:check
```

### 2. Dependency Management

**Dependabot Configuration:**

- Automatic dependency updates every Monday
- Separate groups for production, development, test, and linter dependencies
- Pull requests automatically labeled and assigned
- Major version updates for specific packages ignored (eslint, playwright)

**Update Groups:**

- `production-dependencies` - Production packages
- `development-dependencies` - Development tools
- `test-dependencies` - Jest, @types, eslint, prettier
- `linter-dependencies` - Code quality tools

**Manual Updates:**

```bash
# Check for outdated packages
npm run check:updates

# Update dependencies
npm run update:dependencies
```

### 3. Input Validation

**Security Utilities Module:**
Located at `/static/js/calculators/security-utils.js`

**Available Validators:**

#### validateNumber(value, options)

Validates numeric input with constraints:

```javascript
SecurityUtils.validateNumber(amount, {
  min: 0,
  max: 1000,
  allowZero: false,
  required: true,
});
// Returns: { isValid: true, value: 100 }
```

#### validateChemicalFormula(formula)

Validates chemical formula syntax:

```javascript
SecurityUtils.validateChemicalFormula('H2O');
// Returns: { isValid: true, value: 'H2O' }
```

#### validateEquation(equation)

Validates chemical equations and blocks injection attempts:

```javascript
SecurityUtils.validateEquation('2H2 + O2 -> 2H2O');
// Returns: { isValid: true, value: '2H2 + O2 -> 2H2O' }
```

#### validatePercentage(value)

Validates percentage values (0-100):

```javascript
SecurityUtils.validatePercentage(85.5);
// Returns: { isValid: true, value: 85.5 }
```

#### validateText(text, options)

General text validation with length limits:

```javascript
SecurityUtils.validateText(userInput, {
  maxLength: 1000,
  minLength: 10,
  required: true,
  allowHTML: false,
});
```

### 4. XSS Prevention

**HTML Sanitization:**

```javascript
SecurityUtils.sanitizeHTML('<script>alert("XSS")</script>');
// Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
```

**Sanitization Strategy:**

- All user input sanitized before display
- HTML content escaped by default
- Template literals use text content, not HTML
- `textContent` used instead of `innerHTML` where possible

**Protected Patterns:**

- `<script>` tags blocked
- `javascript:` protocol blocked
- Event handlers (onclick, onerror, onload) blocked
- `eval()` calls blocked
- Direct `document.` and `window.` access blocked

### 5. CSRF Protection

**Token Generation:**

```javascript
const token = SecurityUtils.generateCSRFToken();
// Stores in sessionStorage
```

**Token Validation:**

```javascript
const isValid = SecurityUtils.validateCSRFToken(token);
```

**Implementation:**

- Tokens generated using crypto.getRandomValues()
- Stored in sessionStorage
- Validated on form submissions
- 256-bit token size

### 6. Rate Limiting

**Client-Side Rate Limiting:**

```javascript
// Limit to 10 requests per minute
if (!SecurityUtils.rateLimit('calculator_submit', 10, 60000)) {
  alert('Too many requests. Please wait.');
  return;
}
```

**Features:**

- Per-action rate limits
- Configurable time windows
- Automatic cleanup of old requests
- Graceful fallback if sessionStorage unavailable

**Recommended Limits:**

- Calculator calculations: 60/minute
- Form submissions: 10/minute
- API calls: 30/minute

### 7. Security Headers

**Recommended Headers:**

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Security Best Practices

### For Developers

1. **Always validate input:**

   ```javascript
   const result = SecurityUtils.validateNumber(value);
   if (!result.isValid) {
     showError(result.error);
     return;
   }
   ```

2. **Sanitize before displaying:**

   ```javascript
   element.textContent = SecurityUtils.sanitizeHTML(userInput);
   ```

3. **Use textContent instead of innerHTML:**

   ```javascript
   // Good
   element.textContent = userInput;

   // Bad
   element.innerHTML = userInput;
   ```

4. **Implement rate limiting:**

   ```javascript
   if (!SecurityUtils.rateLimit('action', 10, 60000)) {
     return;
   }
   ```

5. **Use template literals safely:**

   ```javascript
   // Good
   const message = `Result: ${result}`;

   // Bad
   element.innerHTML = `<div>${userInput}</div>`;
   ```

### For Users

1. **Keep dependencies updated:**

   ```bash
   npm run check:updates
   npm run update:dependencies
   ```

2. **Run security audits:**

   ```bash
   npm run security:check
   ```

3. **Review Dependabot PRs:**
   - Check changelogs
   - Review breaking changes
   - Test before merging

4. **Monitor CI/CD security jobs:**
   - Check security reports
   - Address audit failures immediately
   - Review dependency updates

## Security Checklist

### Pre-Deployment

- [ ] Run `npm run security:check`
- [ ] Review CI/CD security report
- [ ] Check for outdated dependencies
- [ ] Validate all input forms
- [ ] Test XSS prevention
- [ ] Verify rate limiting
- [ ] Review security headers
- [ ] Check CSP compliance

### Post-Deployment

- [ ] Monitor security logs
- [ ] Review Dependabot alerts
- [ ] Check for new vulnerabilities
- [ ] Audit user input handling
- [ ] Test CSRF protection
- [ ] Verify rate limiting effectiveness

## Vulnerability Response

### If Vulnerability Found

1. **Assess severity:**
   - Critical: Immediate action required
   - High: Fix within 7 days
   - Medium: Fix within 30 days
   - Low: Update in next release

2. **Remediation steps:**

   ```bash
   # Check vulnerable package
   npm audit

   # Update vulnerable package
   npm update package-name

   # Verify fix
   npm audit
   ```

3. **Security advisory:**
   - Document vulnerability
   - Create issue tracker
   - Communicate with users
   - Release security update

### Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email: security@chemie-lernen.org
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix

**Response Time:**

- Initial response: 48 hours
- Fix timeline: Depends on severity
- Public disclosure: After fix deployed

## Compliance

### Data Protection

- No personal data stored
- No cookies for tracking
- Session storage only
- No third-party analytics

### Privacy

- No user tracking
- No data collection
- No fingerprinting
- Minimal logging

## Security Testing

### Automated Testing

```bash
# Run security audit
npm run audit

# Check dependencies
npm run check:updates

# Full security check
npm run security:check
```

### Manual Testing

1. **XSS Testing:**
   - Input: `<script>alert(1)</script>`
   - Expected: Sanitized output
   - No alert should appear

2. **SQL Injection:** (Not applicable - no database)
   - Input: `' OR '1'='1`
   - Expected: Treated as literal string

3. **CSRF Testing:**
   - Submit form without token
   - Expected: Request rejected

4. **Rate Limit Testing:**
   - Submit 11 requests in 1 minute (limit: 10)
   - Expected: 11th request blocked

## Resources

### Security Tools

- [npm audit](https://docs.npmjs.com/cli/audit) - Dependency vulnerability scanner
- [Dependabot](https://docs.github.com/en/code-security/dependabot) - Automated dependency updates
- [Snyk](https://snyk.io/) - Additional vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing tool

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS Prevention](https://owasp.org/www-community/attacks/xss/)

### Learning

- [Web Security Academy](https://portswigger.net/web-security)
- [JavaScript Security](https://nodejs.org/en/docs/guides/security/)
- [Hugo Security](https://gohugo.io/about/security/)

## Security History

### 2025-12-27: Initial Security Implementation

- Implemented npm audit in CI/CD
- Created security utilities module
- Added input validation
- Implemented XSS prevention
- Added CSRF protection
- Implemented rate limiting
- Created Dependabot configuration
- Added security documentation

### Next Milestones

- [ ] Implement Content Security Policy headers
- [ ] Add security headers to server configuration
- [ ] Implement subresource integrity (SRI)
- [ ] Add security monitoring dashboard
- [ ] Implement automated security testing

---

For security concerns or questions, please open an issue or contact security@chemie-lernen.org.
