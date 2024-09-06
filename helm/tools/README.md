# Tools Installation

## Prerequisite

Install `helm` CLI from https://helm.sh/docs/intro/install/

## Deploying

Run the following commands from the `helm/tools` directory.

### Installing

`helm -n a7dd13-tools install bcparks-tools .`

### Upgrading

`helm -n a7dd13-tools upgrade  bcparks-tools .`

### Teardown

`helm -n a7dd13-tools uninstall bcparks-tools`


## Allow service accounts to pull images from tools.

`oc policy add-role-to-group system:image-puller system:serviceaccounts:a7dd13-dev --namespace=a7dd13-tools`

`oc policy add-role-to-group system:image-puller system:serviceaccounts:a7dd13-prod --namespace=a7dd13-tools`

`oc policy add-role-to-group system:image-puller system:serviceaccounts:a7dd13-test --namespace=a7dd13-tools`


## Allow service account in tools to trigger deployments

`oc policy add-role-to-user edit system:serviceaccount:a7dd13-tools:builder -n a7dd13-dev`

`oc policy add-role-to-user edit system:serviceaccount:a7dd13-tools:builder -n a7dd13-test`

`oc policy add-role-to-user edit system:serviceaccount:a7dd13-tools:builder -n a7dd13-prod`