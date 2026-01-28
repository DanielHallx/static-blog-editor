# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing the maintainer directly rather than opening a public issue.

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You can expect an initial response within 48 hours.

## Security Best Practices for Deployment

### Environment Variables

Never commit secrets to the repository. Required secrets:

- `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `GITHUB_CLIENT_SECRET`: From your GitHub OAuth App

### Production Checklist

1. Set `ENVIRONMENT=production` to enable production-mode validations
2. Ensure `SECRET_KEY` is a strong, unique value
3. Configure `ALLOWED_ORIGINS` to only include your frontend domain
4. Use HTTPS for all traffic
5. Replace in-memory session storage with Redis for multi-instance deployments

### Cookie Security

Session cookies are configured with:
- `httponly=True` (prevents JavaScript access)
- `secure=True` in production (HTTPS only)
- `samesite=strict` (CSRF protection)

### Rate Limiting

Consider implementing rate limiting for production deployments to prevent brute force attacks.
