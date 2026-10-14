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

Create a secret with the values you'll use to access AdminJS

```sh
# Generate random passwords and secrets.
# Don't forget to replace the value for ADMINJS_RELATIONS_LICENSE_KEY
oc create secret generic main-adminjs-secret \
  --from-literal=ADMIN_USER=admin \
  --from-literal=ADMIN_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=ADMIN_COOKIE_NAME=adminjs \
  --from-literal=ADMIN_COOKIE_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=ADMIN_SESSION_SECRET=$(openssl rand -base64 32) \
  --from-literal=ADMINJS_RELATIONS_LICENSE_KEY="value-from-password-vault" \
  -n a7dd13-dev # replace with the your namespace
```

### Alpha-Dev

```sh
helm -n a7dd13-dev install alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm -n a7dd13-test install alpha . -f values-alpha-test.yaml
```

### Dev

```sh
helm -n a7dd13-dev install main . -f values-dev.yaml
```

### Test

```sh
helm -n a7dd13-test install main . -f values-test.yaml
```

### Training (for RSOs and POs)

```sh
helm -n a7dd13-test install training . -f values-training.yaml
```

### Prod

```sh
helm -n a7dd13-prod install main . -f values-prod.yaml
```

#### Vanity routes

The chart creates `vanity-*` routes for the `*.bcparks.ca` hostnames below. The hosts come from `frontend.env.externalUrl` and `backend.env.externalUrl` in each values file. DNS updates may also be needed for new hostnames.

|            | frontend                    | backend                         |
| ---------- | --------------------------- | ------------------------------- |
| alpha-dev  | alpha-dev-staff.bcparks.ca  | alpha-dev-staff-api.bcparks.ca  |
| alpha-test | alpha-test-staff.bcparks.ca | alpha-test-staff-api.bcparks.ca |
| dev        | dev-staff.bcparks.ca        | dev-staff-api.bcparks.ca        |
| test       | test-staff.bcparks.ca       | test-staff-api.bcparks.ca       |
| training   | training-staff.bcparks.ca   | training-staff-api.bcparks.ca   |
| prod       | staff.bcparks.ca            | staff-api.bcparks.ca            |

The routes use `externalCertificate` to read the wildcard certificate from the `bcparks-ssl-wildcard` secret, which must be created manually in each namespace. See [docs/SSL.md](../docs/SSL.md).

#### Taking over manually created vanity routes

Helm won't take over an existing route unless it has Helm's ownership metadata. Before the first `helm upgrade` that includes the vanity routes, run these for each existing route (`vanity-staff`, `vanity-staff-api`, `vanity-alpha-staff`, `vanity-alpha-staff-api`), using the matching release name and namespace:

```sh
oc -n a7dd13-dev annotate route vanity-staff meta.helm.sh/release-name=main meta.helm.sh/release-namespace=a7dd13-dev --overwrite
oc -n a7dd13-dev label route vanity-staff app.kubernetes.io/managed-by=Helm --overwrite
```

The old training routes have different names, so delete them before upgrading `training` (the new routes use the same hosts):

```sh
oc -n a7dd13-test delete route vanity-training vanity-training-api
```

## Upgrading

The `upgrade` command can be used when updating existing deployments in a namespace.

Run the following commands from the `helm/deployment` directory.

### Alpha-Dev

```sh
helm -n a7dd13-dev upgrade alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm -n a7dd13-test upgrade alpha . -f values-alpha-test.yaml
```

### Dev

```sh
helm -n a7dd13-dev upgrade main . -f values-dev.yaml
```

### Test

```sh
helm -n a7dd13-test upgrade main . -f values-test.yaml
```

### Training

```sh
helm -n a7dd13-test upgrade training . -f values-training.yaml
```

### Prod

```sh
helm -n a7dd13-prod upgrade main . -f values-prod.yaml
```

## Teardown

The `uninstall` command can be used to remove all resources defined by the Helm chart. Please note that secrets and PVCs created by the Helm chart are not automatically removed.

Run the following commands from the `helm/deployment` directory.

NOTE: This wil not remove the secrets.

### Alpha-Dev

```sh
helm -n a7dd13-dev uninstall alpha
```

### Alpha-Test

```sh
helm -n a7dd13-test uninstall alpha
```

### Dev

```sh
helm -n a7dd13-dev uninstall main
```

### Test

```sh
helm -n a7dd13-test uninstall main
```

### Training

```sh
helm -n a7dd13-test uninstall training
```

### Prod

```sh
helm -n a7dd13-prod uninstall main
```
