# Backend testing

We use [Vitest](https://vitest.dev/) for unit testing.

## Commands

- `npm test` — run the full suite once. This is what CI runs on PRs touching `backend/**`.
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

Only pure functions in `utils/*.js` are covered so far — nothing that touches
Sequelize models, routes/controllers, or a real database. See
[utils/seasonApprovalHelpers.test.js](utils/seasonApprovalHelpers.test.js) for the
reference example, including a note on which exports were skipped because they
query the database.

When a unit test needs to call code that queries a Sequelize model, mock the
models module so the test doesn't hit a database:

```js
vi.mock("../models/index.js", () => ({
  Season: { findOne: vi.fn() },
}));
```

## What's not set up yet

- Route/controller tests (would need an HTTP-mocking layer, e.g. `supertest`)
- Integration tests against a database, mock database, or fixtures — approach TBD
- An enforced coverage threshold

Extend the config in [vitest.config.js](vitest.config.js) as these needs come up, and update this TESTING.md file as needed.
