# Queue Email Reminders

Processes pending email reminders whose `followUpDate` is today or earlier.

## What does the script do?

For each pending reminder, the script:

1. Checks whether the season has progressed beyond the status that triggered
   the original notification.
2. Queues a follow-up email when action is still required.
3. Removes the processed reminder.
4. Uses a separate transaction for each reminder, so one failure does not roll back other reminders.

Reminders are checked against both the season change log and current season
status. This captures normal workflow changes as well as manual or scripted
changes that may not create change-log entries.

## Reminder Lifecycle

When an email is sent, the backend upserts a `PendingReminder` record keyed by
`emailType` and season ID (`numericData`). A repeated notification replaces the
existing record, refreshes its comparison date and notification flags, and
restarts the follow-up timer.

A reminder is complete when either:

- A qualifying status appears in `SeasonChangeLogs` after the notification was
  sent.
- The current season status is already beyond the requested state, including
  changes made without a change-log entry.

The action may be completed by any user; it does not need to be the original
email recipient.

## Completion Rules

`DRAFT_REVIEW` and `APPROVAL_REJECTED` reminders are complete when the season
reaches `pending review`, `approved`, or `published`.

`PENDING_REVIEW` reminders are complete when the season reaches `approved` or
`published`. If they are still incomplete, the stored notification flags and
the season's approval fields determine whether Information Services,
Reservation Services, or both receive the follow-up.

## How to run

From the project root, run:

```sh
node tasks/queue-email-reminders/queue-email-reminders.js
```

The task also runs after the main import, season, date-range, and gate-detail
jobs in `cron/index.js`.

## Output

The script reports counts for:

- Queued reminders
- Reminders already complete
- Failed reminders

Failed reminders are rolled back and remain available for a later run. The
process exits with an error when the cron entrypoint receives a non-zero failed
count.
