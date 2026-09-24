// This task queues follow-up emails for reminders whose deadlines have passed.

import "../../env.js";

import { createTransactionWithRetry } from "../../db/transaction.js";
import {
  processPendingReminder,
  REMINDER_RESULT,
} from "../../utils/email/reminders/reminders.js";

import {
  findDuePendingReminders,
  deletePendingReminder,
} from "../../utils/email/reminders/data.js";
import { getNotificationSettings } from "../../utils/email/notificationSettings.js";

export async function queueEmailReminders() {
  console.log(`\nSTARTING QUEUE-EMAIL-REMINDERS\n`);

  let resolvedCount = 0;
  let queuedCount = 0;
  let failedCount = 0;
  let connectionFailureCount = 0;
  let staleCount = 0;
  let skippedCount = 0;
  let missingCount = 0;

  try {
    const settings = await getNotificationSettings();

    // TODO: Need to check other notification settings as well
    if (!settings.notificationsEnabled) {
      console.log(
        "Notifications are disabled; leaving pending reminders queued for a later run.",
      );
      return {
        queuedCount,
        resolvedCount,
        failedCount,
        connectionFailureCount,
        staleCount,
        skippedCount,
        missingCount,
      };
    }

    // Load reminders that are due for follow-up processing.
    const pendingReminders = await findDuePendingReminders();

    console.log(
      `Found ${pendingReminders.length} pending reminders due for follow-up.`,
    );

    for (const reminder of pendingReminders) {
      let transaction;

      try {
        transaction = await createTransactionWithRetry();
      } catch (error) {
        connectionFailureCount++;
        console.error(
          `Unable to create a transaction for reminder ${reminder.emailType}:${reminder.numericData}. ` +
            "The reminder will remain queued for a later run:",
          error,
        );
        continue;
      }

      try {
        const result = await processPendingReminder(reminder, transaction);

        if (result === REMINDER_RESULT.STALE) {
          staleCount++;
        } else if (result === REMINDER_RESULT.RESOLVED) {
          resolvedCount++;
        } else if (result === REMINDER_RESULT.QUEUED) {
          queuedCount++;
        } else if (result === REMINDER_RESULT.SKIPPED) {
          skippedCount++;
        } else if (result === REMINDER_RESULT.MISSING) {
          missingCount++;
        }

        // Remove the pending reminder after it has been evaluated.
        await deletePendingReminder(
          reminder.emailType,
          reminder.numericData,
          transaction,
        );

        await transaction.commit();
      } catch (error) {
        if (transaction && !transaction.finished) {
          try {
            await transaction.rollback();
          } catch (rollbackError) {
            console.error("Failed to roll back transaction:", rollbackError);
          }
        }
        failedCount++;
        console.error(
          `Error processing reminder ${reminder.emailType}:${reminder.numericData}:`,
          error,
        );
      }
    }

    console.log(`\nReminder processing summary:`);
    if (queuedCount > 0) {
      console.log(
        `- Queued ${queuedCount} email(s) and removed the related reminder(s).`,
      );
    } else {
      console.log("- No follow-up emails were queued.");
    }

    if (skippedCount > 0) {
      console.log(
        `- Skipped and removed ${skippedCount} reminder(s) because team notifications are disabled.`,
      );
    }

    if (resolvedCount > 0) {
      console.log(
        `- Removed ${resolvedCount} reminder(s) because the action was already completed.`,
      );
    }

    if (staleCount > 0) {
      console.log(
        `- Removed ${staleCount} reminder(s) because they were more than 7 days overdue.`,
      );
    }

    if (connectionFailureCount > 0) {
      console.log(
        `- Left ${connectionFailureCount} reminder(s) queued due to a database connection issue.`,
      );
    }

    if (failedCount > 0) {
      console.log(
        `- Left ${failedCount} reminder(s) queued because processing failed.`,
      );
    }

    if (missingCount > 0) {
      console.log(
        `- Removed ${missingCount} reminder(s) because the season record was not found.`,
      );
    }

    console.log("\n");

    return {
      queuedCount,
      resolvedCount,
      failedCount,
      connectionFailureCount,
      staleCount,
      skippedCount,
      missingCount,
    };
  } catch (error) {
    console.error("Error loading email reminders:", error);
    throw error;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    await queueEmailReminders();
  } catch (err) {
    console.error("Error processing email reminders:", err);
    throw err;
  }
}
