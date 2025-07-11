# This is based on these instructions

https://access.crunchydata.com/documentation/postgres-operator/5.7/guides/major-postgres-version-upgrade

# Create PGUpgrade.yml file

```
apiVersion: postgres-operator.crunchydata.com/v1beta1
kind: PGUpgrade
metadata:
  name: crunchy-postgres-upgrade
spec:
  postgresClusterName: crunchy-postgres
  fromPostgresVersion: 15
  toPostgresVersion: 17
```

# Create the resource on OpenShit

```
oc create -n a7dd13-prod -f PGUpgrade.yml
```

# Annotate the postgrescluster to allow upgrade and patch it to shutdown

```
kubectl -n a7dd13-prod annotate postgrescluster crunchy-postgres postgres-operator.crunchydata.com/allow-upgrade="crunchy-postgres-upgrade"
kubectl -n a7dd13-prod patch postgrescluster crunchy-postgres --type=merge -p '{"spec":{"shutdown":true}}'
```

# After about 1-3 minutes the pods will shut down

# Check the status of the PGUpgrade and WAIT FOR IT TO FINISH

```
oc describe -n a7dd13-prod PGUpgrade crunchy-postgres-upgrade
```

# Remove the annotations and set the version number to 17

```
kubectl -n a7dd13-prod annotate postgrescluster crunchy-postgres postgres-operator.crunchydata.com/allow-upgrade-
kubectl -n a7dd13-prod patch postgrescluster crunchy-postgres --type=merge -p '{"spec":{"shutdown":false,"postgresVersion":17}}'
```

# Wait for the pod to start by checking the Stateful set with "-ha" in its name.

Go to the terminal and enter `psql -version` to confirm the version. Also check the logs for errors

# Delete the PGUpgrade resource

```
oc delete -n a7dd13-prod PGUpgrade crunchy-postgres-upgrade
```
