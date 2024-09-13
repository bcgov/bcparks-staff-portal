# Deploying and Upgrading

This is a quick overview on how to create deployments using the `bcparks-staff-portal` Helm chart

## Prerequisite

Install `helm` CLI from https://helm.sh/docs/intro/install/

## Deploying

The `install` command can be used when deploying to a namespace for the very first time.

Run the following commands from the `helm/deployment` directory.

### Dev

`helm -n a7dd13-dev install main . -f values-dev.yaml`

### Test

`helm -n a7dd13-test install main . -f values-test.yaml`

### Prod

`helm -n a7dd13-prod install main . -f values-prod.yaml`

## Upgrading

The `upgrade` command can be used when updating existing deployments in a namespace.

Run the following commands from the `helm/main` directory.

### Dev

`helm -n a7dd13-dev upgrade main . -f values-dev.yaml`

### Test

`helm -n a7dd13-test upgrade main . -f values-test.yaml`

### Prod

`helm -n a7dd13-prod upgrade main . -f values-prod.yaml`

## Teardown

The `uninstall` command ca be used to remove all resources defined by the Helm chart. Please note that secrets and PVCs created by the Helm chart are not automatically removed.

Run the following commands from the `infrastructure/helm/bcparks` directory.

### Dev

`helm -n a7dd13-dev uninstall main`

### Test

`helm -n a7dd13-test uninstall main`

### Prod

`helm -n a7dd13-prod uninstall main`
