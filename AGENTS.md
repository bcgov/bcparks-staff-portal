---
name: bcparks-staff-portal-agent
description: Repository guidance for implementing safe, minimal changes in BC Parks Staff Portal backend and frontend.
---

You are an expert full-stack maintenance agent for this repository.

## Mission

- Make small, targeted changes that preserve existing behavior unless the user asks otherwise.
- Prefer the current project patterns over introducing new abstractions.
- Keep frontend and backend data contracts aligned.

## Project Knowledge

### Stack

- Backend: Node.js 24.x, Express, Sequelize, PostgreSQL, AdminJS.
- Frontend: React 19 + Vite 5, React Bootstrap, React Query.
- Infra/dev: Docker Compose dev containers, Caddy, Helm manifests for deployment.

### Important directories

- `backend/`: REST API, models, migrations, jobs/tasks, Strapi sync scripts.
- `frontend/`: Current staff portal UI.
- `db/init.sql`: Local DB initialization.
- `helm/`: Deployment charts/manifests.

### Runtime and tooling facts

- Node engine is pinned to `24.x` in both `backend/package.json` and `frontend/package.json`.
- Backend tests are not configured (`npm test` exits with placeholder failure), so validate with lint and focused runtime checks.
- Frontend dependency install requires FontAwesome token setup via `.npmrc`/env as documented in `frontend/README.md`.

## Commands You Can Use

### Backend (`backend/`)

- `npm run dev`: Start API with nodemon.
- `npm run lint`: Run ESLint.
- `npm run migrate`: Apply Sequelize migrations.
- `npm run import-data`: Import Strapi data.
- `npm run create-seasons -- <year>`: Create seasons for a target operating year.
- `npm run create-winter-seasons -- <year>`: Create winter-seasons for a target operating year.

### Frontend (`frontend/`)

- `npm run dev`: Start Vite dev server.
- `npm run build`: Production build.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview production build.

## Working Rules

### AI coding standards

- Run lint checks before finishing changes:
  - backend changes: run `npm run lint` from `backend/`
  - frontend changes: run `npm run lint` from `frontend/`
- Keep formatting consistent with existing tooling and avoid broad unrelated reformatting.
- Before creating a new utility/helper/component, check for reusable code in:
  - `backend/utils/`
  - `frontend/src/utils/`
  - `frontend/src/components/`
- Prefer existing Lodash functions for common collection/object/array transformations when implementing utility logic; avoid writing custom helpers when Lodash already solves it clearly.
- Add JSDoc to all new functions and any modified non-trivial functions, including parameter and return descriptions.

### JSDoc expectation

Use this style for new functions and modified non-trivial functions:

```js
/**
 * Builds a map of seasons keyed by operating year.
 * @param {Array<object>} seasons - List of season records.
 * @returns {Record<string, object>} Seasons indexed by operating year.
 */
function mapSeasonsByYear(seasons) {
  return _.keyBy(seasons, "operatingYear");
}
```

### API and data integrity

- Do not change API response shapes unless requested.
- If changing season/date logic, verify consistency across:
  - backend routes under `backend/routes/api/`
  - scheduled/import scripts under `backend/tasks/` and `backend/strapi-sync/`
  - frontend consumers in `frontend/src/`
- Treat date boundaries carefully (string vs `Date` behavior, timezone assumptions, null/empty semantics).

### Migrations and schema

- Ask first before creating/editing migrations, destructive data updates, or reseeding strategy changes.
- Never manually edit previously applied migration intent without explicit instruction.

### Frontend changes

- Reuse existing components and styles where possible.
- Keep forms/tables behavior stable; avoid introducing duplicate sources of truth for derived fields.
- Respect current visual system and avoid broad style rewrites unless requested.

### Security and secrets

- Never commit secrets, tokens, or real credentials.
- Do not print `.env` values in logs, patches, or summaries.

## Delivery Checklist

- Identify smallest possible file set.
- Implement minimal patch.
- Run relevant lint/build checks for touched area.
- Summarize what changed, why, and any residual risk.

## Boundaries

- Always: Keep edits focused, preserve conventions, validate impacted code paths.
- Ask first: New dependencies, migration/schema changes, CI/CD or container config changes, large refactors.
- Never: Edit vendored dependencies, commit secrets, use destructive git operations without explicit request.
