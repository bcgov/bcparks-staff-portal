# Crunchy Postgres backup and restore (Staff Portal)

How to check and restore the Staff Portal database in any environment installed from `helm/crunchy-postgres`. bcparks.ca uses a copy of the same chart, and the same steps work there with its own names.

## 1. TL;DR: how it works

- The Helm chart creates a `PostgresCluster`. The Crunchy operator creates everything else from it. To make changes, edit the `PostgresCluster`, not the pods.
- **Instance pods** (`<cluster>-ha-*`) run Postgres. Patroni picks the primary and writes each pod's role onto it as the label `postgres-operator.crunchydata.com/role` (`master` or `replica`), so `oc` can find the primary without `patronictl list`.
- **The repo host** (`<cluster>-repo-host-0`) is a pod just for pgBackRest. It runs every backup, pulling data from the primary, and owns the `repo1` volume.
- **Repos:** `repo1` is a volume in the namespace. It's fast, but it's lost along with the namespace. `repo2` is an S3 bucket on the NRS object store (main test and prod only). It survives losing the namespace.
- **Backups:** a full backup daily, and an incremental every 4 hours (CronJobs). WAL is archived continuously, so you can restore to any point in time inside the retention window.
- **Restore:** you add a `restore` section to the `PostgresCluster`, then change an annotation. The operator stops Postgres, runs a restore Job, and starts it again. Every database in the cluster rolls back.
- **Connections:** the backend connects straight to the primary, using the `<cluster>-pguser-postgres` secret. The chart also runs pgBouncer, but nothing uses it.

## 2. Environments

| Env        | Namespace   | Cluster                   | S3 bucket | Full backups kept |
| ---------- | ----------- | ------------------------- | --------- | ----------------- |
| alpha-dev  | a7dd13-dev  | crunchy-postgres-alpha    | none      | 2                 |
| alpha-test | a7dd13-test | crunchy-postgres-alpha    | none      | 2                 |
| dev        | a7dd13-dev  | crunchy-postgres          | none      | 2                 |
| test       | a7dd13-test | crunchy-postgres          | doottest  | 15                |
| training   | a7dd13-test | crunchy-postgres-training | none      | 2                 |
| prod       | a7dd13-prod | crunchy-postgres          | dootprod  | 15                |

All are on OpenShift Gold. The app database has the same name as the cluster, for example `crunchy-postgres`. Schedules (UTC): repo1 full at 08:00 and incrementals every 4h from 00:00; repo2 full at 09:00 and incrementals every 4h from 01:00. S3 keys are in Vault at `<env>/s3-pgbackrest`, copied into the `s3-pgbackrest` secret.

## 3. Where you run things

Everything runs from a terminal on your workstation, with `oc`. Section 7 (Rebuild from S3) also needs Helm 4 and its plugins (see [Prerequisite](../helm/README.md#prerequisite) in the deployment README). Log in with `oc` (in the OpenShift web console, your name in the top right → **Copy login command**), then set the variables below.

Commands that run inside a pod use `oc exec` from your workstation, so you never leave your own terminal.

### 3.1 Set the variables once per shell session. Run the line for your environment:

`REL` is the Helm release of the app, used to restart it in 6.8.

#### alpha-dev

```sh
NS=a7dd13-dev; C=crunchy-postgres-alpha; REL=alpha
```

#### alpha-test

```sh
NS=a7dd13-test; C=crunchy-postgres-alpha; REL=alpha
```

#### dev

```sh
NS=a7dd13-dev; C=crunchy-postgres; REL=main
```

#### test

```sh
NS=a7dd13-test; C=crunchy-postgres; REL=main
```

#### training

```sh
NS=a7dd13-test; C=crunchy-postgres-training; REL=training
```

#### prod

```sh
NS=a7dd13-prod; C=crunchy-postgres; REL=main
```

### 3.2 Then, for every environment:

```sh
SEL=postgres-operator.crunchydata.com/cluster=$C
PRIMARY=$(oc -n $NS get pod -l $SEL,postgres-operator.crunchydata.com/role=master -o name)
REPOHOST=$(oc -n $NS get pod -l $SEL,postgres-operator.crunchydata.com/data=pgbackrest -o name)
echo "PRIMARY=$PRIMARY REPOHOST=$REPOHOST"
```

Both must be set.

The primary can change after a restore or failover, so set `PRIMARY` again before using it.

## 4. Check backups [read operations only / no changes]

### 4.1 Check that recent scheduled backups succeeded:

```sh
oc -n $NS get postgrescluster $C -o jsonpath='{range .status.pgbackrest.scheduledBackups[*]}{.type}{"\t"}{.repo}{"\t"}{.completionTime}{"\t"}succeeded={.succeeded}{"\n"}{end}'
```

Every backup shows `succeeded=1`. In test and prod, this includes repo2.

### 4.2 Check the backups on the repo host:

#### 4.2.1 List the backups:

```sh
oc exec -n $NS $REPOHOST -- pgbackrest info
```

Status is `ok`, there's a full backup from the last day, and the `wal archive` max is near now. The `wal archive` min is the earliest time you can restore to.

In test and prod, run it again with `--repo=2` for S3.

#### 4.2.2 Check that every backup file is intact:

Takes about 10 seconds for repo1.

```sh
oc exec -n $NS $REPOHOST -- pgbackrest verify --stanza=db --repo=1 --output=text --verbose
```

Each backup shows `status: valid` and `checksum invalid: 0`.

In test and prod, run it again with `--repo=2` for S3. Verifying S3 downloads every backup, so it's slower.

#### 4.2.3 Check that the disk isn't filling up:

```sh
oc exec -n $NS $REPOHOST -- df -h /pgbackrest/repo1
```

This only works for repo1, which is a volume in the pod. repo2 is an S3 bucket, so there's nothing to run `df` against. For repo2, the closest equivalent is the `repo2: backup set size` lines from:

```sh
oc exec -n $NS $REPOHOST -- pgbackrest info --repo=2
```

### 4.3 Check that no `restore` or `manual` section is left over:

```sh
oc -n $NS get postgrescluster $C -o jsonpath='{.spec.backups.pgbackrest}' | jq 'del(.repos, .global, .repoHost, .sidecars, .configuration)'
```

This should print `{}`.

## 5. Take a manual full backup

Before risky work, and after every restore.

### 5.1 Check that WAL archiving reaches every repo:

This forces a WAL switch.

```sh
oc exec -n $NS $REPOHOST -- pgbackrest check --stanza=db
```

### 5.2 Take the backup:

This is the same command the scheduled backup Jobs run, but the operator doesn't list manual backups in the `PostgresCluster` status.

```sh
oc exec -n $NS $REPOHOST -- pgbackrest backup --stanza=db --repo=1 --type=full --log-level-console=info
```

The output should end with `expire command end: completed successfully`.

In test and prod, run it again with `--repo=2` for S3. If a scheduled backup is running, it fails with a lock error: wait and run it again.

### 5.3 Check that the new full backup is listed:

```sh
oc exec -n $NS $REPOHOST -- pgbackrest info
```

## 6. Point-in-time restore (in place)

Rolls the whole cluster back to a time T. Everything after T is lost, and the database is down during the restore. The apps keep running and show errors until it's back. A restore can't be started from the repo host. It goes through the operator.

T is in UTC, just before the problem, for example `2026-10-23 22:40:00+00`.

### 6.1 Check the restore window:

```sh
oc exec -n $NS $REPOHOST -- pgbackrest info
```

T must be inside the `wal archive` range. Note the `wal archive` max: 6.3.3 compares against it.

### 6.2 Check the database on the primary:

#### 6.2.1 Check the current database time:

```sh
oc exec -n $NS $PRIMARY -- psql -Atc "select now()"
```

#### 6.2.2 Check the current timeline:

```sh
oc exec -n $NS $PRIMARY -- patronictl list
```

Write down the TL.

### 6.3 Rehearsal only: set T and make sure there's a commit after it:

Recovery stops at the first commit after T. If there isn't one in the repo, the restore fails because it can't reach T, and a quiet non-prod database can go days without a write.

#### 6.3.1 Set T and force a commit after it:

This saves the current database time as T in a variable on your workstation, so you don't have to copy it, then forces a commit after T. They're in one block so they always run together: if you set T again, you also get a new commit after it. 6.4 uses T.

```sh
T=$(oc exec -n $NS $PRIMARY -- psql -Atc "select to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') || '+00'")
echo "T=$T"
oc exec -n $NS $PRIMARY -- psql -Atc "select txid_current()"
```

If you run this again, run 6.3.2 and 6.3.3 again too.

#### 6.3.2 Send the WAL to the repo:

This sends the WAL that contains the commit now, rather than within the next minute (`archive_timeout`).

```sh
oc exec -n $NS $PRIMARY -- psql -Atc "select pg_switch_wal()"
```

#### 6.3.3 Check that the WAL reached the repo:

```sh
oc exec -n $NS $REPOHOST -- pgbackrest info | grep "wal archive"
```

The max (the second WAL file name) must be later than in 6.1. If it isn't, wait a few seconds and run it again. **Don't go on to 6.4 until it is**: without it, the restore can't reach T and fails, and the database stays down until you restart it with an earlier T.

### 6.4 Start the restore:

The restore starts when the annotation changes in 6.4.4. Adding the `restore` section in 6.4.2 does nothing on its own.

#### 6.4.1 Set T and the repo:

Enter T in the form `YYYY-MM-DD HH:MM:SS+00`. In a rehearsal, the prompt already shows the T from 6.3.1: press Enter to keep it. Then enter `repo1`, or `repo2` to restore from S3. Each prompt repeats until the value is valid.

```sh
while true; do vared -p "Target time (UTC): " T; date -j -u -f "%Y-%m-%d %H:%M:%S+00" "$T" >/dev/null 2>&1 && break; done
REPO=; until [[ $REPO == repo[12] ]]; do read "REPO?Repo (repo1 or repo2): "; done
echo "T=$T REPO=$REPO"
```

Check both values before going on.

#### 6.4.2 Add the `restore` section:

This adds a `restore` section to the `PostgresCluster`, using the T and REPO you just set. It only tells the operator how to restore. Nothing happens to the database yet.

```sh
oc -n $NS patch postgrescluster $C --type=merge -p "{\"spec\":{\"backups\":{\"pgbackrest\":{\"restore\":{\"enabled\":true,\"repoName\":\"$REPO\",\"options\":[\"--type=time\",\"--target=\\\"$T\\\"\"]}}}}}"
```

The output should be `postgrescluster.postgres-operator.crunchydata.com/<cluster> patched`.

#### 6.4.3 Check the `restore` section:

```sh
oc -n $NS get postgrescluster $C -o jsonpath='{.spec.backups.pgbackrest.restore}'; echo
```

It should show something like `{"enabled":true,"options":["--type=time","--target=\"2026-10-24 02:23:41+00\""],"repoName":"repo1"}`. In the YAML, that's:

```yaml
spec:
  backups:
    pgbackrest:
      restore:
        enabled: true # allows the operator to run a restore
        repoName: repo1 # which repo to restore from
        options: # passed to pgbackrest restore
          - --type=time # stop replaying WAL at a point in time...
          - --target="2026-10-24 02:23:41+00" # ...this one (T)
```

The quotes around T are part of the value, because T contains a space. The Helm chart doesn't know about this section, so it stays until you remove it in 6.9.

#### 6.4.4 Trigger the restore (point of no return):

**This starts the restore. The database goes down straight away, and everything after T is lost.** Check the `echo` output from 6.4.1 and the section from 6.4.3 before you run it.

The operator starts a restore when the value of the `postgres-operator.crunchydata.com/pgbackrest-restore` annotation changes. The value itself doesn't matter, only that it's different from last time. The command uses the current Unix time, so it's always new. `--overwrite` replaces the value from any earlier restore.

```sh
oc -n $NS annotate postgrescluster $C --overwrite postgres-operator.crunchydata.com/pgbackrest-restore="$(date +%s)"
```

The output should be `postgrescluster.postgres-operator.crunchydata.com/<cluster> annotated`. The operator then shuts down every instance and starts the restore Job. Follow it in 6.5.

### 6.5 Watch the restore:

#### 6.5.1 Watch the pods:

```sh
oc -n $NS get pods -l $SEL -w
```

The instance pods stop, a `<cluster>-pgbackrest-restore-*` pod runs, then the instances start again. Press Ctrl+C to stop watching.

#### 6.5.2 Follow the restore log:

```sh
oc -n $NS logs -f -l $SEL,postgres-operator.crunchydata.com/pgbackrest-restore
```

This only works while the restore pod exists. Once the restore Job finishes, its pod is removed and you get `No resources found`. Go on to 6.5.3.

#### 6.5.3 Check that the restore finished:

```sh
oc -n $NS get postgrescluster $C -o jsonpath='{.status.pgbackrest.restore}'; echo
```

It's done when the status shows `"finished":true` and `"succeeded":1`.

### 6.6 Find the primary again:

The primary may now be a different pod.

```sh
PRIMARY=$(oc -n $NS get pod -l $SEL,postgres-operator.crunchydata.com/role=master -o name)
echo "PRIMARY=$PRIMARY"
```

Patroni labels the primary a minute or so after the instance starts. If `PRIMARY` is empty, wait and run it again.

### 6.7 Check the restore on the primary:

#### 6.7.1 Check the timeline:

```sh
oc exec -n $NS $PRIMARY -- patronictl list
```

The leader is `running` and its TL is one higher than before. In test and prod, the replicas are `streaming` with lag 0.

#### 6.7.2 Check where the restore stopped:

```sh
oc exec -n $NS $PRIMARY -- psql -Atc "select pg_read_file('pg_wal/' || lpad(upper(to_hex(timeline_id)), 8, '0') || '.history') from pg_control_checkpoint()"
```

The last line of the new timeline's history file should say `before` with a time just after T, for example `9  64/0E0000A0  before 2026-10-23 22:40:07.512+00`.

For a real restore, also check the data that was damaged, for example in the Staff Portal, or in its table in the app database (`oc exec -n $NS $PRIMARY -- psql -d $C`). The table names are in the migrations in `backend/migrations`.

### 6.8 Restart the apps:

So they reconnect cleanly. The frontend doesn't connect to the database, and the `staff-portal-jobs` CronJob starts new pods on every run, so only the backend needs a restart.

```sh
oc -n $NS rollout restart deploy/$REL-backend
```

### 6.9 Remove the `restore` section:

If it's left there, the cluster restores again the next time anyone changes the annotation.

```sh
oc -n $NS patch postgrescluster $C --type=merge -p '{"spec":{"backups":{"pgbackrest":{"restore":null}}}}'
```

The output is `patched`, or `patched (no change)` if there was no `restore` section.

### 6.10 Take a manual full backup:

Follow section 5 (Take a manual full backup), to each repo in test and prod.

### 6.11 Check backups:

Follow section 4 (Check backups).

## 7. Rebuild from S3 (test and prod only)

> **Not rehearsed yet.**

Use this only when the `PostgresCluster` is gone (deleted, or the namespace was lost), so there's nothing to restore into. If the cluster still exists, use section 6 (Point-in-time restore) with `REPO=repo2` instead. The S3 secret and the repo2 configuration are already in place, so no Helm is needed.

The steps below need Helm 4 and the helm-secrets plugins. Set them up first: see [Prerequisite](../helm/README.md#prerequisite) in the deployment README.

Run every step in this section from `helm/crunchy-postgres` in your bcparks-staff-portal checkout. 7.4 uses the chart and values files there.

### 7.1 Rehearsal only: delete the cluster:

Only in test, to simulate losing the cluster. Never do this in prod. Skip it in a real disaster: the cluster is already gone.

```sh
helm -n a7dd13-test uninstall crunchy
```

- This only deletes the main test cluster. The alpha-test and training clusters in the same namespace are separate releases (`crunchy-alpha` and `crunchy-training`), so they aren't affected.
- The `s3-pgbackrest` secret survives the uninstall, because Helm doesn't manage it (`createS3Secret: false`).
- repo1 is deleted with the cluster, so S3 is the only copy left, as in a real disaster.
- The operator recreates the database user secrets (such as `crunchy-postgres-pguser-postgres`) with new passwords, so the backend restart in 7.7 is required.

### 7.2 Set the environment:

Use `test` or `prod`.

```sh
ENV=test
```

### 7.3 Check that the S3 secret exists:

```sh
oc -n a7dd13-$ENV get secret s3-pgbackrest
```

If it doesn't, recreate it from Vault (see "S3 backup secret" in the chart README).

### 7.4 Install the chart with `dataSource` enabled:

```sh
helm -n a7dd13-$ENV install crunchy . -f values-$ENV.yaml \
  --set dataSource.enabled=true \
  --set dataSource.repo.s3.bucket=doot$ENV \
  --set dataSource.repo.s3.endpoint=nrs.objectstore.gov.bc.ca
```

### 7.5 Watch the restore:

Follow 6.5.

### 7.6 Check backups:

Follow section 4 (Check backups).

### 7.7 Restart the apps:

```sh
oc -n a7dd13-$ENV rollout restart deploy/main-backend
```

## 8. Rehearsal log

| Date | Who | Env       | Procedure             | Repo  | Notes |
| ---- | --- | --------- | --------------------- | ----- | ----- |
|      |     | alpha-dev | Point-in-time restore | repo1 |       |
|      |     | test      | Point-in-time restore | repo2 |       |
|      |     | test      | Rebuild from S3       | repo2 |       |

## 9. References

- [pgBackRest](https://pgbackrest.org/)
- [Crunchy PGO disaster recovery](https://access.crunchydata.com/documentation/postgres-operator/latest/tutorials/backups-disaster-recovery/disaster-recovery)
- Chart README: `helm/crunchy-postgres/README.md`
