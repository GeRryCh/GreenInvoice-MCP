# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.3.x   | ✓         |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Use [GitHub Private Vulnerability Reporting](https://github.com/GeRryCh/GreenInvoice-MCP/security/advisories/new) to submit a report confidentially.

Alternatively, email **german.velibekov@gmail.com** with subject `[SECURITY] GreenInvoice-MCP`.

Expect acknowledgement within 48 hours and a fix or mitigation within 14 days.

## Scope

This is an unofficial community MCP server that wraps the [Green Invoice API](https://app.greeninvoice.co.il). It is not affiliated with or endorsed by Green Invoice Ltd.

Credentials (API ID and secret) are passed via environment variables and are never stored or logged by this package. Users are responsible for securing their own API credentials.
