# Crunch Postgres Installation

## Prerequesites

1. Install `helm` CLI from https://helm.sh/docs/intro/install/
2. Clone the repo https://github.com/bcgov/crunchy-postgres (the version used to set up Openshift is forked to https://github.com/molund/crunchy-postgres/).
3. Copy the values-dev.yaml, values-test.yaml and values-prod.yaml files into `charts/crunchy-postgres` in the cloned repo.
4. Open a terminal window and go into the charts/crunchy-postgres folder in the cloned repo.
5. Log in to the Silver cluster with the Openshift console app (oc) from your terminal window.

## Installing

### dev
```
helm -n a7dd13-dev install crunchy . -f values-dev.yaml
```

### test
```
helm -n a7dd13-test install crunchy . -f values-test.yaml
```

### prod
```
helm -n a7dd13-prod install crunchy . -f values-prod.yaml
```


## Upgrading

### dev
```
helm -n a7dd13-dev upgrade crunchy . -f values-dev.yaml
```

### test
```
helm -n a7dd13-test upgrade crunchy . -f values-test.yaml
```

### prod
```
helm -n a7dd13-prod upgrade crunchy . -f values-prod.yaml
```


## Teardown

### dev
```
helm -n a7dd13-dev uninstall crunchy
```

### test
```
helm -n a7dd13-test uninstall crunchy
```

### prod
```
helm -n a7dd13-prod uninstall crunchy
```
