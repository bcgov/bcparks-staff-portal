# Advisories staff portal development

The Advisories portal is a separate React app located in `frontend/advisories/`. It is developed within the `frontend` Dev Container — open the project in the frontend Dev Container as described in the [root README](../../README.md).

## Prerequisites

1. Make sure Strapi is running. Follow the steps found in the [bcparks.ca main repo's cms folder](https://github.com/bcgov/bcparks.ca/tree/main/src/cms).
2. Copy `.env.example` as `.env`.

- `REACT_APP_CMS_BASE_URL=http://localhost:1337` must be set. Be sure your Strapi server is actually running on port `1337`.

## Development

From within the `frontend` Dev Container:

1.  Navigate to the advisories directory: `cd advisories/`

2.  Copy the .env.example file to .env (`cp .env.example .env`) and update values as needed

3.  Install dependencies: `npm install`

4.  Start the staff portal by running: `npm run start`. When it completes, you should be able to view the site at http://localhost:3000.

5.  The first time you log in, it will create a user account in Keycloak with no access permissions. A realm administrator will need to grant you permission to the staff-portal client on the Keycloak dev environment.
