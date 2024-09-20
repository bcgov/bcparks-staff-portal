# Crunchy Postgres Installation

## Prerequesites

1. Install `helm` CLI from https://helm.sh/docs/intro/install/
2. Clone the repo https://github.com/bcgov/crunchy-postgres (the exact version used to set up the BC Parks Staff Portal is forked to https://github.com/molund/crunchy-postgres/).
3. Copy the values-dev.yaml, values-test.yaml and values-prod.yaml files into `charts/crunchy-postgres` in the cloned repo.
4. Open a terminal window and go into the charts/crunchy-postgres folder in the cloned repo.
5. Log in to the Silver cluster with the Openshift console app (oc) from your terminal window.

## Installing

### Dev

```
helm -n a7dd13-dev install crunchy . -f values-dev.yaml
```

### Test

```
helm -n a7dd13-test install crunchy . -f values-test.yaml
```

### Prod

```
helm -n a7dd13-prod install crunchy . -f values-prod.yaml
```

### Create a network policy

The crunchy pods need a network policy that allows them to talk to each other. The policy below works, but something more secure might be possible.

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
spec:
  podSelector: {}
  ingress:
    - from:
        - podSelector: {}
  policyTypes:
    - Ingress
```

### Alpha-dev / Alpha-test

Alpha environments share the crunchy-postgres infrastructure with the main environments.

## Upgrading

### Dev

```
helm -n a7dd13-dev upgrade crunchy . -f values-dev.yaml
```

### Test

```
helm -n a7dd13-test upgrade crunchy . -f values-test.yaml
```

### Prod

```
helm -n a7dd13-prod upgrade crunchy . -f values-prod.yaml
```

## Teardown

Don't run `uninstall crunchy` unless you really want to lose all your data!

### Dev

```
helm -n a7dd13-dev uninstall crunchy
```

### Test

```
helm -n a7dd13-test uninstall crunchy
```

### Prod

intentionally omitted
