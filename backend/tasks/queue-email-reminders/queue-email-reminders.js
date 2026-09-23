// This task queues follow-up emails for reminders whose deadlines have passed.

import "../../env.js";

import { PendingReminder } from "../../models/index.js";
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
      const transaction = await PendingReminder.sequelize.transaction();

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
        await transaction.rollback();
        failedCount++;
        console.error(
          `Error processing reminder ${reminder.emailType}:${reminder.numericData}:`,
          error,
        );
      }
    }

    console.log(`\nReminder processing complete:`);

    const summaryRows = [
      [
        "Queued",
        queuedCount,
        queuedCount > 0 ? "email(s) will be sent" : "no emails to send",
      ],
      [
        "Skipped",
        skippedCount,
        "team notifications disabled; won't retry, record deleted",
      ],
      ["Resolved", resolvedCount, "action no longer required"],
      ["Stale", staleCount, "follow-up date is over 7 days ago"],
      ["Failed", failedCount, "errors occurred during processing"],
      ["Missing", missingCount, "season record not found"],
    ].filter(([label, count]) => count > 0 || label === "Queued");

    for (const [label, count, description] of summaryRows) {
      console.log(
        `- ${`${label}:`.padEnd(8)} ${String(count).padStart(3)} — ${description}`,
      );
    }
    console.log("\n");

    return {
      queuedCount,
      resolvedCount,
      failedCount,
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
