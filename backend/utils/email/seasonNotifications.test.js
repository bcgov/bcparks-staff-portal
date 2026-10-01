import { beforeEach, describe, expect, it, vi } from "vitest";

const queueNotification = vi.fn(() => ({
  noRecipientsError: false,
  editTargetLabel: "Golden Ears Park",
  jsonData: {},
}));
const loadNotificationSettings = vi.fn();

vi.mock("../../db/connection.js", () => ({ default: {} }));
vi.mock("./taskQueuer.js", () => ({
  queueNotification,
  EMAIL_TYPE: { HQ_APPROVAL: "hq-approval", DRAFT_REVIEW: "draft-review" },
}));
vi.mock("./notificationSettings.js", () => ({ loadNotificationSettings }));
vi.mock("./reminders/data.js", () => ({ savePendingReminder: vi.fn() }));

const { notifyManagementArea, notifyHqApprovers, EMAIL_TYPE } =
  await import("./seasonNotifications.js");

const season = { id: 123, operatingYear: 2026, seasonType: "regular" };

/**
 * Sets the notification settings, with every notification type enabled by default.
 * @param {Object} [overrides] Settings to change
 * @returns {void}
 */
function mockSettings(overrides = {}) {
  loadNotificationSettings.mockResolvedValue({
    settings: {
      notificationsEnabled: true,
      areaSupervisorNotificationsEnabled: true,
      infoServicesNotificationsEnabled: true,
      reservationServicesNotificationsEnabled: true,
      ...overrides,
    },
    error: null,
  });
}

/**
 * Returns the options passed to the most recent queueNotification call.
 * @returns {Object} queueNotification options
 */
function lastQueuedOptions() {
  return queueNotification.mock.calls.at(-1)[0];
}

describe("CC for Information Services", () => {
  beforeEach(() => {
    queueNotification.mockClear();
    mockSettings();
  });

  describe("notifyManagementArea", () => {
    it("CCs Information Services on reminders", async () => {
      await notifyManagementArea(
        EMAIL_TYPE.DRAFT_REVIEW,
        season,
        "Reminder Runner",
        null,
        true,
      );

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: true,
      });
    });

    it("doesn't CC Information Services when their notifications are disabled", async () => {
      mockSettings({ infoServicesNotificationsEnabled: false });

      await notifyManagementArea(
        EMAIL_TYPE.DRAFT_REVIEW,
        season,
        "Reminder Runner",
        null,
        true,
      );

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: false,
      });
    });

    it("doesn't CC Information Services on emails that aren't reminders", async () => {
      await notifyManagementArea(EMAIL_TYPE.DRAFT_REVIEW, season, "Submitter");

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: false,
      });
    });
  });

  describe("notifyHqApprovers", () => {
    it("CCs Information Services on Reservation Services-only reminders", async () => {
      await notifyHqApprovers(
        season,
        "Reminder Runner",
        false,
        true,
        null,
        true,
      );

      expect(lastQueuedOptions()).toMatchObject({
        notifyReservationServices: true,
        ccInformationServices: true,
      });
    });

    it("doesn't CC Information Services when they're already a recipient", async () => {
      await notifyHqApprovers(
        season,
        "Reminder Runner",
        true,
        true,
        null,
        true,
      );

      expect(lastQueuedOptions()).toMatchObject({
        notifyInformationServices: true,
        ccInformationServices: false,
      });
    });

    it("doesn't CC Information Services when their notifications are disabled", async () => {
      mockSettings({ infoServicesNotificationsEnabled: false });

      await notifyHqApprovers(
        season,
        "Reminder Runner",
        true,
        true,
        null,
        true,
      );

      expect(lastQueuedOptions()).toMatchObject({
        notifyInformationServices: false,
        ccInformationServices: false,
      });
    });

    it("doesn't CC Information Services on emails that aren't reminders", async () => {
      await notifyHqApprovers(season, "Submitter", false, true);

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: false,
      });
    });
  });
});
