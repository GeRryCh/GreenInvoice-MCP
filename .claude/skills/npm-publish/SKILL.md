---
name: npm-publish
description: Publish this package to npm. Handles auth token setup, 2FA with hardware security keys, and the deprecated --_authToken flag pitfall. Use when the user says "publish to npm", "npm publish", or "release to registry".
---

# npm Publish Skill

## Package info

- Package: `@gerrych/greeninvoice-mcp`
- Registry: `https://registry.npmjs.org/`
- Version source: `package.json`

## Steps

### 1. Bump version in package.json

Use semver: patch for fixes/chores, minor for new features, major for breaking changes.

### 2. Build

```bash
npm run build
```

### 3. Set auth token via .npmrc (not --_authToken flag)

**Critical:** `npm publish --_authToken=<token>` is deprecated and unreliable — npm ignores it in some versions. Always use:

```bash
npm config set //registry.npmjs.org/:_authToken=<token>
```

This writes to `~/.npmrc` and is picked up automatically by `npm publish`.

### 4. Publish

```bash
npm publish
```

### 5. Verify

```bash
npm view @gerrych/greeninvoice-mcp version
```

---

## Auth & 2FA

### Getting a token

The account uses a hardware security key (FIDO2) for 2FA. This means:

- **TOTP OTP prompts cannot be satisfied** by the security key directly from CLI.
- **Solution:** Use a **Granular Access Token** with "Bypass two-factor authentication" enabled.

To create one:
1. npmjs.com → Avatar → Access Tokens → Generate New Token → Granular Access Token
2. Scope to package `@gerrych/greeninvoice-mcp`, permission: `Read and write`
3. Enable **"Bypass two-factor authentication"**
4. Copy token, set via `npm config set` above

### If `EOTP` error appears

Token is either:
- A classic token (no 2FA bypass) — create a granular token instead
- Not set in `.npmrc` — use `npm config set`, not `--_authToken`

### Check current auth

```bash
npm whoami
```

---

## Commit & tag before publish

```bash
git add package.json
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```
