# Testing & debugging

## Commands (local)

| Command | What it runs |
|--------|----------------|
| `npm run test` | Vitest unit tests (`tests/unit/**/*.test.ts`) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright against `http://127.0.0.1:3000` (starts `next dev` unless skipped) |
| `npm run test:e2e:ui` | Playwright UI mode |

**First time on a machine (E2E):**

```bash
npx playwright install chromium
```

Installs the browser Playwright uses. CI runs `npx playwright install --with-deps chromium` automatically.

**E2E against an already-running server** (e.g. port 3000):

```bash
set PLAYWRIGHT_SKIP_WEBSERVER=1
set PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
npm run test:e2e
```

(On PowerShell: `$env:PLAYWRIGHT_SKIP_WEBSERVER="1"`.)

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

1. **lint-and-unit** — `npm ci` → `npm run lint` → `npm run test`
2. **e2e** — `npm ci` → Playwright Chromium install → `npx playwright test` (dev server started by Playwright config)

**What you need to do**

1. Push this repo to GitHub; workflows run on `push` / `pull_request` to `main` or `master`.
2. No secrets are required for the current smoke tests (they do not call Shopify checkout or log in).

## Backend logs on Vercel

Server code logs with **`src/lib/logger.ts`**: one **JSON object per line** to `stdout` / `stderr`, which Vercel captures under **Deployments → your deployment → Logs** (or **Runtime Logs**).

- Filter in the dashboard search, e.g. `"scope":"api.cart"` or `"service":"balanced-bites"`.
- Common `scope` values: `api.cart`, `shopify.fetch`, `api.oauth.callback`, `api.oauth.start`.
- **Secrets are not logged in full** — OAuth codes are never logged; access tokens use `redactToken()`; Shopify GIDs use `truncateGid()`.

### Add more logging later

```ts
import { createLogger } from "@/lib/logger";

const log = createLogger("my.feature");
log.info("something_happened", { userId: "opaque-id" });
```

## Extending tests later

- Add unit tests under `tests/unit/` (import from `@/`).
- Add Playwright specs under `e2e/` (use `@playwright/test`).
- For cart/API integration tests, prefer calling route handlers or `fetch` to `/api/cart` in Vitest with `NEXT_RUNTIME` / request mocks, or keep heavy flows in Playwright against a **staging** environment with env vars set in GitHub Secrets.
