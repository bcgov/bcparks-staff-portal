# Deploying and Upgrading

This is a quick overview on how to create deployments using the `bcparks-staff-portal` Helm chart. The names `main` and `alpha` used below refer respectively to GitHub branches.

## Prerequisite

Install the tools. The commands are for macOS with Homebrew; see each tool's site for other platforms, including the [helm-secrets installation guide](https://github.com/jkroepke/helm-secrets/wiki/Installation).

```sh
# Helm 4 or later (https://helm.sh/docs/intro/install/). If Helm 3 is installed, use brew upgrade helm.
brew install helm
helm version --short # should print v4.x

# OpenShift CLI
brew install openshift-cli

# GnuPG, to convert the helm-secrets author's public key for signature verification
brew install gnupg
curl -sL https://github.com/jkroepke.gpg | gpg --dearmor > /tmp/helm-secrets.gpg

# helm-secrets plugin (Helm 4 needs all three packages)
helm plugin install oci://ghcr.io/jkroepke/helm-secrets/secrets:4.7.9 --keyring /tmp/helm-secrets.gpg
helm plugin install oci://ghcr.io/jkroepke/helm-secrets/secrets-getter:4.7.9 --keyring /tmp/helm-secrets.gpg
helm plugin install oci://ghcr.io/jkroepke/helm-secrets/secrets-post-renderer:4.7.9 --keyring /tmp/helm-secrets.gpg

# vals resolves the ref+vault:// references (0.22.0 or later)
brew install vals

# Vault CLI
brew tap hashicorp/tap
brew install hashicorp/tap/vault
```

Install [crunchy-postgres](crunchy-postgres/README.md)

## Secrets

### Vault-managed secrets

Some secrets are managed in [BC Government HashiCorp Vault](https://vault.developer.gov.bc.ca). Vault is the source of truth.

Each release has one OpenShift secret, `<release>-vault-managed-secret` (for example `main-vault-managed-secret`), that holds every Vault-managed value. Its template contains `ref+vault://` references instead of values, and [helm-secrets](https://github.com/jkroepke/helm-secrets) replaces the references with values from Vault during `helm install` and `helm upgrade`. Deployments read each key they need with `secretKeyRef` instead of `envFrom`, so the notice doesn't end up in the container environment.

The secret also gets a `00_VAULT_MANAGED_NOTICE` key, from the `bcparks.vaultManagedNotice` helper in `templates/_helpers.tpl`.

> [!WARNING]
> Always use `helm secrets --evaluate-templates` (as shown below) to install or upgrade. Plain `helm upgrade` writes the literal `ref+vault://...` text into the secret. The backend refuses to start if `ADMINJS_RELATIONS_LICENSE_KEY` is an unresolved reference, so a bad upgrade shows up as a backend crash loop.

#### Log in to Vault

Log in with the namespace's `a7dd13-vault` service account, which has read-only access to Vault. Use the `a7dd13-prod` role for the prod namespace and `a7dd13-nonprod` for the others.

First log in to the Silver cluster. In the OpenShift web console, open the menu under your name (top right), choose **Copy login command**, and run the `oc login ...` command it shows.

Then run the commands for the environment you're deploying.

##### Non-prod: dev, test, alpha-dev, alpha-test and training

```sh
export VAULT_ADDR=https://vault.developer.gov.bc.ca
export VAULT_NAMESPACE=platform-services
export HELM_SECRETS_BACKEND=vals
export VAULT_TOKEN=$(vault write -field=token auth/k8s-silver/login \
  role=a7dd13-nonprod jwt="$(oc -n a7dd13-dev create token a7dd13-vault)")
```

##### Prod

```sh
export VAULT_ADDR=https://vault.developer.gov.bc.ca
export VAULT_NAMESPACE=platform-services
export HELM_SECRETS_BACKEND=vals
export VAULT_TOKEN=$(vault write -field=token auth/k8s-silver/login \
  role=a7dd13-prod jwt="$(oc -n a7dd13-prod create token a7dd13-vault)")
```

#### Vault layout

Secrets are stored in two Vault mounts: `a7dd13-prod` for the prod namespace and `a7dd13-nonprod` for all the others. Inside each mount there is a `common` folder for values shared by every release, and a folder per environment, named after `cluster.environment` in the values file. Helm gathers the keys from these paths into the single `<release>-vault-managed-secret` in OpenShift.

```
a7dd13-nonprod/
  common/       shared by every non-prod release (main, alpha, training)
  dev/          main in a7dd13-dev
  alpha-dev/    alpha in a7dd13-dev
  test/         main in a7dd13-test
  alpha-test/   alpha in a7dd13-test
  training/     training in a7dd13-test

a7dd13-prod/
  common/       shared by every prod release
  prod/         main in a7dd13-prod
```

Paths in each mount:

| Vault path                    | Vault keys                                              | Key in `<release>-vault-managed-secret`                 | Used by                                                                                                                |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `common/license-keys`         | `CKEDITOR_LICENSE_KEY`, `ADMINJS_RELATIONS_LICENSE_KEY` | `CKEDITOR_LICENSE_KEY`, `ADMINJS_RELATIONS_LICENSE_KEY` | Frontend (as `VITE_CKEDITOR_LICENSE_KEY`), backend (AdminJS Relations)                                                 |
| `<environment>/s3-pgbackrest` | `S3_ACCESS_KEY_ID`, `S3_ACCESS_SECRET`                  | — (in the separate `s3-pgbackrest` secret)              | Database backups (test and prod only). See the [crunchy-postgres README](crunchy-postgres/README.md#s3-backup-secret). |

Vault paths don't merge or fall back, so a value shared by both mounts is copied into each `common` folder.

Every mount needs every path and key in the table except `s3-pgbackrest`. A missing path or key makes `helm secrets` fail for that environment. Where a value isn't needed, create the key in Vault with an empty value.

#### Change a Vault-managed secret

1. Update the value in Vault. A value in `common/` has a copy in both the `a7dd13-nonprod` and `a7dd13-prod` mounts, so update both.
2. Run a Helm upgrade (below).
3. Restart the deployments that use the value.

### Secrets managed by hand

Helm creates these secrets once with placeholder or generated values and never overwrites them. If one is deleted, the next upgrade recreates it. Edit them in OpenShift.

- `<release>-strapi-token`: `STRAPI_TOKEN`, used by the backend and the cron job. Create an API token in the Strapi admin panel (**Settings > API Tokens**), paste it into this secret in the OpenShift console, then restart the backend. The token isn't stored in Vault, because it can be regenerated in Strapi at any time. After the Strapi database is restored from another environment, regenerate it and update the secret.

- `<release>-adminjs-secret` is generated by Helm and doesn't need any changes. It holds the AdminJS login (`ADMIN_USER` and `ADMIN_PASSWORD`) and cookie and session secrets.

### Moving to the Vault-managed secret (one time per release)

1. [Log in to Vault](#log-in-to-vault) and run the Helm upgrade for the environment (see [Upgrading](#upgrading)).
2. In the OpenShift console, remove `ADMINJS_RELATIONS_LICENSE_KEY` from `<release>-adminjs-secret`. The backend now reads it from `<release>-vault-managed-secret`.
3. Delete `<release>-ckeditor-license-key-secret`. Helm created it as a hook, so it won't delete it.
4. Delete the frontend and backend pods so their deployments recreate them.

## Deploying

The `install` command can be used when deploying to a namespace for the very first time.

Run the following commands from the `helm/deployment` directory.

### Dev

```sh
helm secrets --evaluate-templates -n a7dd13-dev install main . -f values-dev.yaml
```

### Test

```sh
helm secrets --evaluate-templates -n a7dd13-test install main . -f values-test.yaml
```

### Prod

```sh
helm secrets --evaluate-templates -n a7dd13-prod install main . -f values-prod.yaml
```

### Alpha-Dev

```sh
helm secrets --evaluate-templates -n a7dd13-dev install alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm secrets --evaluate-templates -n a7dd13-test install alpha . -f values-alpha-test.yaml
```

### Training (for RSOs and POs)

```sh
helm secrets --evaluate-templates -n a7dd13-test install training . -f values-training.yaml
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
helm secrets --evaluate-templates -n a7dd13-dev upgrade main . -f values-dev.yaml
```

### Test

```sh
helm secrets --evaluate-templates -n a7dd13-test upgrade main . -f values-test.yaml
```

### Prod

```sh
helm secrets --evaluate-templates -n a7dd13-prod upgrade main . -f values-prod.yaml
```

### Alpha-Dev

```sh
helm secrets --evaluate-templates -n a7dd13-dev upgrade alpha . -f values-alpha-dev.yaml
```

### Alpha-Test

```sh
helm secrets --evaluate-templates -n a7dd13-test upgrade alpha . -f values-alpha-test.yaml
```

### Training

```sh
helm secrets --evaluate-templates -n a7dd13-test upgrade training . -f values-training.yaml
```

## Teardown

The `uninstall` command can be used to remove all resources defined by the Helm chart. Please note that secrets and PVCs created by the Helm chart are not automatically removed.

Run the following commands from the `helm/deployment` directory.

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

### Training

```sh
helm -n a7dd13-test uninstall training
```
