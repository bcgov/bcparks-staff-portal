# Legacy staff portal development

## Prerequisites

1. Make sure Strapi is running. Follow the steps found in the [bcparks.ca main repo's cms folder](https://github.com/bcgov/bcparks.ca/tree/main/src/cms).
2. Copy `.env.example` as `.env`.

- `REACT_APP_CMS_BASE_URL=http://localhost:1337` must be set. Be sure your Strapi server is actually running on port `1337`.

## Dev steps to run locally

1.  Copy the .env.example file to .env (`cp .env.example .env`)

2.  From the `fontend-legacy/` folder run: `npm install`

3.  Start the staff portal by running: `npm run start`. When it completes, you should be able to view the site at http://localhost:3000.

4.  The first time you log in, it will create a user account in Keycloak with no access permissions. A realm adminstrator will need to grant you permission to the staff-portal client on the Keycloak dev environment.
