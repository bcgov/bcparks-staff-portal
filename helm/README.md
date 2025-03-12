# Deploying and Upgrading

This is a quick overview on how to create deployments using the `bcparks-staff-portal` Helm chart. The names `main` and `alpha` used below refer respective to GitHub branches.

## Prerequisite

Install `helm` CLI from https://helm.sh/docs/intro/install/

Install [crunchy-postgres](crunchy-postgres/README.md)

## Deploying

The `install` command can be used when deploying to a namespace for the very first time.

Run the following commands from the `helm/deployment` directory.

### Create secrets

#### Strapi access

The backend deployments rely on a few secrets that must be created manually in each namespace:

- main-strapi-token
- alpha-strapi-token (not needed in the production namespace)

Create the access tokens in Strapi as needed, and use the values to create secrets for each backend deployment.

```sh
oc -n a7dd13-dev create secret generic main-strapi-token  --from-literal STRAPI_TOKEN='abc-your-token-123';
```

#### AdminJS access

Create a secret with the password you'll use to access AdminJS

```sh
oc create secret generic main-adminjs-secret \
  --from-literal=ADMIN_USER=admin \
  --from-literal=ADMIN_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=ADMIN_COOKIE_NAME=adminjs \
  --from-literal=ADMIN_COOKIE_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=ADMIN_SESSION_SECRET=$(openssl rand -base64 32) \
  -n a7dd13-dev # replace with the your namespace
```

### Dev

```sh
helm -n a7dd13-dev install main . -f values-dev.yaml
```

### Test

```sh
helm -n a7dd13-test install main . -f values-test.yaml
```

### Prod

```sh
helm -n a7dd13-prod install main . -f values-prod.yaml
```

### Alpha-Dev

```sh
helm -n a7dd13-dev install alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm -n a7dd13-test install alpha . -f values-alpha-test.yaml
```

### Create the Postgres user and db

If this is the first time deploying the app then you will also need to create a Postgres user and an empty database.

1. Go into the terminal on one of the `crunchy-postgres-ha-*` pods. _(choose the one using the most memory)_
2. Run `patronictl list` at the command prompt to make sure you are in the leader. Switch to the leader pod if you aren't on the leader.
3. Get the password from `main-postgres-secret` or `alpha-postgres-secret`
4. Run the `psql` command and enter the following commands in the sql console. Replace `<password>` with the password from step 3, and replace `main` with `alpha` for alpha deployments.
   ```sql
   CREATE USER "bcparks-main" WITH PASSWORD '<password>';
   CREATE DATABASE "staff-portal-main" OWNER "bcparks-main";
   ```

#### Create additional Routes

Some additional Openshift routes must also be manually created. Use the bcparks.ca wildcard certificate for these routes. DNS updates may also be needed.

|            | frontend                    | backend                         |
| ---------- | --------------------------- | ------------------------------- |
| dev        | dev-staff.bcparks.ca        | dev-staff-api.bcparks.ca        |
| test       | test-staff.bcparks.ca       | test-staff-api.bcparks.ca       |
| prod       | staff.bcparks.ca            | staff-api.bcparks.ca            |
| alpha-dev  | alpha-dev-staff.bcparks.ca  | alpha-dev-staff-api.bcparks.ca  |
| alpha-test | alpha-test-staff.bcparks.ca | alpha-test-staff-api.bcparks.ca |

## Upgrading

The `upgrade` command can be used when updating existing deployments in a namespace.

Run the following commands from the `helm/deployment` directory.

### Dev

```sh
helm -n a7dd13-dev upgrade main . -f values-dev.yaml
```

### Test

```sh
helm -n a7dd13-test upgrade main . -f values-test.yaml
```

### Prod

```sh
helm -n a7dd13-prod upgrade main . -f values-prod.yaml
```

### Alpha-Dev

```sh
helm -n a7dd13-dev upgrade alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm -n a7dd13-test upgrade alpha . -f values-alpha-test.yaml
```

## Teardown

The `uninstall` command ca be used to remove all resources defined by the Helm chart. Please note that secrets and PVCs created by the Helm chart are not automatically removed.

Run the following commands from the `infrastructure/helm/bcparks` directory.

NOTE: This wil not remove the secrets.

### Dev

```sh
helm -n a7dd13-dev uninstall main
```

### Test

```sh
helm -n a7dd13-test uninstall main
```

### Prod

```sh
helm -n a7dd13-prod uninstall main
```

### Alpha-Dev

```sh
helm -n a7dd13-dev uninstall alpha
```

### Alpha-Test

```sh
helm -n a7dd13-test uninstall alpha
```
