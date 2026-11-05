# Crunchy Postgres backup and restore (Staff Portal)

Runbooks for checking and restoring the Staff Portal database in any environment installed from `helm/crunchy-postgres`. bcparks.ca uses a copy of the same chart, and the same steps work there with its own names.

Each runbook is self-contained: pick the one for your task and copy the commands from top to bottom.

## Which runbook do I need?

| Task                                                                      | repo1 (volume, all envs)                                  | repo2 (S3, test and prod)                         |
| ------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| Check that backups are healthy (read-only)                                | [Check repo1 backups](check-backups-repo1.md)             | [Check repo2 backups](check-backups-repo2.md)     |
| Check that every backup file is intact (optional, slow, not test or prod) | [Verify repo1 backup files](verify-backup-files-repo1.md) | not practical                                     |
| Take a manual full backup, for example before risky work                  | [Manual backup to repo1](manual-backup-repo1.md)          | [Manual backup to repo2](manual-backup-repo2.md)  |
| Roll the database back to a point in time, or rehearse it                 | [Point-in-time restore from repo1](pitr-repo1.md)         | [Point-in-time restore from repo2](pitr-repo2.md) |
| The cluster is gone: rebuild it, or rehearse it                           | not possible (repo1 is lost with the cluster)             | [Rebuild from S3](rebuild-from-s3.md)             |

Linked from other runbooks when needed: [Clear leftover config](clear-leftover-config.md), which removes a leftover `restore` or `manual` section.

## How it works

- The Helm chart creates a `PostgresCluster`. The Crunchy operator creates everything else from it. To make changes, edit the `PostgresCluster`, not the pods.
- **Instance pods** (`<cluster>-ha-*`) run Postgres. Patroni picks the primary and writes each pod's role onto it as the label `postgres-operator.crunchydata.com/role` (`master` or `replica`), so `oc` can find the primary without `patronictl list`.
- **The repo host** (`<cluster>-repo-host-0`) is a pod just for pgBackRest. It runs every backup, pulling data from the primary, and owns the `repo1` volume.
- **Repos (backup devices):** `repo1` is a volume in the namespace. It's fast, but it's lost along with the namespace. `repo2` is an S3 bucket on the NRS object store (main test and prod only). It survives losing the namespace.
- **Backups:** a full backup daily, and an incremental every 4 hours (CronJobs).
- **WAL (write-ahead log):** Postgres's transaction log, a record of every change to the database. It's copied to every repo continuously, separately from the backups: Postgres hands each WAL file to pgBackRest as soon as it's full, or after at most a minute when there have been changes.
- **Point-in-time restore:** to roll back to a time T, pgBackRest restores the last backup that finished before T (the full backup, plus any incrementals after it). Postgres then replays the WAL from the end of that backup up to T. So you can restore to any point in time inside the retention window, as long as the WAL up to T is complete.
- **Starting a restore:** you add a `restore` section to the `PostgresCluster`, then change an annotation. The operator stops Postgres, runs a restore Job, and starts it again. Every database in the cluster rolls back.
- **Connections:** the backend connects straight to the primary, using the `<cluster>-pguser-postgres` secret. The chart also runs pgBouncer, but nothing uses it.

## Environments

| Env        | Namespace   | Cluster                   | Helm release of the app | S3 bucket | Full backups kept |
| ---------- | ----------- | ------------------------- | ----------------------- | --------- | ----------------- |
| alpha-dev  | a7dd13-dev  | crunchy-postgres-alpha    | alpha                   | none      | 2                 |
| alpha-test | a7dd13-test | crunchy-postgres-alpha    | alpha                   | none      | 2                 |
| dev        | a7dd13-dev  | crunchy-postgres          | main                    | none      | 2                 |
| test       | a7dd13-test | crunchy-postgres          | main                    | doottest  | 15                |
| training   | a7dd13-test | crunchy-postgres-training | training                | none      | 2                 |
| prod       | a7dd13-prod | crunchy-postgres          | main                    | dootprod  | 15                |

- All environments are on OpenShift Gold.
- The app database has the same name as the cluster, for example `crunchy-postgres`.
- Schedules (UTC): repo1 full at 08:00 and incrementals every 4h from 00:00; repo2 full at 09:00 and incrementals every 4h from 01:00.
- S3 keys are in Vault at `<env>/s3-pgbackrest`, copied into the `s3-pgbackrest` secret.

Everything runs from a terminal on your workstation, in bash or zsh, with `oc` and `jq`. Commands that run inside a pod use `oc exec`. Rebuild from S3 also needs Helm 4 and its plugins (see [Prerequisite](../../helm/README.md#prerequisite) in the deployment README).

## Rehearsal log

| Date       | Who  | Env       | Procedure             | Repo  | Notes |
| ---------- | ---- | --------- | --------------------- | ----- | ----- |
| 2026-10-27 | Mike | alpha-dev | Point-in-time restore | repo1 |       |
| 2026-11-03 | Mike | test      | Point-in-time restore | repo2 |       |
|            |      | test      | Rebuild from S3       | repo2 |       |

## References

- [pgBackRest](https://pgbackrest.org/)
- [Crunchy PGO disaster recovery](https://access.crunchydata.com/documentation/postgres-operator/latest/tutorials/backups-disaster-recovery/disaster-recovery)
- Chart README: `helm/crunchy-postgres/README.md`
