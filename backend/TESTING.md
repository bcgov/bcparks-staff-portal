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

Tests cover utility functions, including gate snapshots with mocked Sequelize
models. See [utils/saveSeasonData.test.js](utils/saveSeasonData.test.js) for
pre-write and post-write snapshot checks.

[routes/api/publish.test.js](routes/api/publish.test.js) captures the publish
handler with a mocked Express router and calls it directly. Models, permissions,
and the Strapi queue are mocked, so no server or database is needed. These tests
cover audit snapshots, not HTTP middleware or authentication.

When a unit test needs to call code that queries a Sequelize model, mock the
models module so the test doesn't hit a database:

```js
vi.mock("../models/index.js", () => ({
  Season: { findOne: vi.fn() },
}));
```

## What's not set up yet

- HTTP-level route tests (would need an HTTP-mocking layer, e.g. `supertest`)
- Integration tests against a database, mock database, or fixtures — approach TBD
- An enforced coverage threshold

Extend the config in [vitest.config.js](vitest.config.js) as these needs come up, and update this TESTING.md file as needed.
