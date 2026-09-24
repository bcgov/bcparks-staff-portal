# Frontend testing

We use [Vitest](https://vitest.dev/) for unit testing.

## Commands

- `npm test` — run the full suite once. This is what CI runs on PRs touching `frontend/**`.
- `npm run test:watch` — re-run affected tests on file changes, for local dev.
- `npm run test:coverage` — run once with a v8 coverage report. No threshold is
  enforced yet; this is just visibility into what's covered.
- `npx vitest run path/to/file.test.js` — run a single test file.
- `npx vitest run -t "some test name"` — run only tests whose name matches.

## Where tests live

Colocate a test next to the file it covers: `foo.js` → `foo.test.js`. Vitest finds
these automatically (no registration/config needed to add a new test file).

## Writing a test

Globals are not currently enabled, so import what you need explicitly:

```js
import { describe, it, expect, vi } from "vitest";
```

`vi` is the mocking namespace: `vi.fn()` for stub functions, `vi.mock()` to mock a
module, `vi.spyOn()` to wrap an existing function.

## Current scope

Only pure functions in `src/utils/` and `src/apps/*/utils/` are covered so far — nothing that renders a
component, uses a hook, or touches the DOM. See
[src/apps/dates/utils/isDateTypeOptional.test.js](src/apps/dates/utils/isDateTypeOptional.test.js) for the
reference example.

## What's not set up yet

- Component/hook tests — these will need a jsdom test environment plus
  [React Testing Library](https://testing-library.com/react) (`@testing-library/react`
  and `@testing-library/jest-dom`), neither of which is installed yet
- API/network mocking
- An enforced coverage threshold

Extend the config in [vitest.config.js](vitest.config.js) as these needs come up, and update this TESTING.md file as needed.
