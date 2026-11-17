import { beforeEach, describe, expect, it, vi } from "vitest";

const queueNotification = vi.fn(() => ({
  noRecipientsError: false,
  editTargetLabel: "Golden Ears Park",
  jsonData: {},
}));
const loadNotificationSettings = vi.fn();
const commitTransaction = vi.fn();

vi.mock("../../db/connection.js", () => ({
  default: {
    transaction: vi.fn(async () => ({
      finished: false,
      commit: commitTransaction,
      rollback: vi.fn(),
    })),
  },
}));
vi.mock("./taskQueuer.js", () => ({
  queueNotification,
  EMAIL_TYPE: { HQ_APPROVAL: "hq-approval", DRAFT_REVIEW: "draft-review" },
}));
vi.mock("./notificationSettings.js", () => ({ loadNotificationSettings }));
const deletePendingReminder = vi.fn(async () => 1);

vi.mock("./reminders/data.js", () => ({
  savePendingReminder: vi.fn(),
  deletePendingReminder,
}));

const {
  notifyManagementArea,
  notifyHqApprovers,
  sendSeasonNotifications,
  EMAIL_TYPE,
} = await import("./seasonNotifications.js");
const { REQUESTED } = await import("../../constants/seasonStatus.js");

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
      await notifyManagementArea(season, "Reminder Runner", false, null, true);

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: true,
      });
    });

    it("doesn't CC Information Services when their notifications are disabled", async () => {
      mockSettings({ infoServicesNotificationsEnabled: false });

      await notifyManagementArea(season, "Reminder Runner", false, null, true);

      expect(lastQueuedOptions()).toMatchObject({
        ccInformationServices: false,
      });
    });

    it("doesn't CC Information Services on emails that aren't reminders", async () => {
      await notifyManagementArea(season, "Submitter", false);

      expect(lastQueuedOptions()).toMatchObject({
        emailType: EMAIL_TYPE.DRAFT_REVIEW,
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

describe("CC for Reservation Services", () => {
  beforeEach(() => {
    queueNotification.mockClear();
    mockSettings();
  });

  it("CCs Reservation Services on draft review emails when asked", async () => {
    await notifyManagementArea(season, "Contributor", true);

    expect(lastQueuedOptions()).toMatchObject({
      emailType: EMAIL_TYPE.DRAFT_REVIEW,
      ccReservationServices: true,
    });
  });

  it("CCs Reservation Services on draft review reminders when asked", async () => {
    await notifyManagementArea(season, "Reminder Runner", true, null, true);

    expect(lastQueuedOptions()).toMatchObject({
      isReminder: true,
      ccReservationServices: true,
    });
  });

  it("doesn't CC Reservation Services when not asked", async () => {
    await notifyManagementArea(season, "Contributor", false);

    expect(lastQueuedOptions()).toMatchObject({
      ccReservationServices: false,
    });
  });

  it("doesn't CC Reservation Services when their notifications are disabled", async () => {
    mockSettings({ reservationServicesNotificationsEnabled: false });

    await notifyManagementArea(season, "Contributor", true);

    expect(lastQueuedOptions()).toMatchObject({
      ccReservationServices: false,
    });
  });
});

describe("sendSeasonNotifications", () => {
  const draftSeason = { ...season, status: REQUESTED };

  beforeEach(() => {
    queueNotification.mockClear();
    deletePendingReminder.mockClear();
    commitTransaction.mockReset();
    mockSettings();
  });

  it("emails the Management Area when a contributor saves a draft", async () => {
    await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Contributor",
      isOnlyContributor: true,
      isOnlySubmitter: false,
      isApprover: false,
    });

    expect(queueNotification).toHaveBeenCalledTimes(1);
    expect(lastQueuedOptions()).toMatchObject({
      emailType: EMAIL_TYPE.DRAFT_REVIEW,
    });
    expect(deletePendingReminder).not.toHaveBeenCalled();
  });

  it("CCs Reservation Services on a contributor's draft when they'll review it", async () => {
    await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Contributor",
      isOnlyContributor: true,
      isOnlySubmitter: false,
      isApprover: false,
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: true,
    });

    expect(lastQueuedOptions()).toMatchObject({
      emailType: EMAIL_TYPE.DRAFT_REVIEW,
      ccReservationServices: true,
    });
  });

  // HQ moving a season back to draft (rejecting it) intentionally sends no
  // email, and cancels the reminder asking HQ to approve it.
  it("cancels the HQ approval reminder without emailing when an approver saves a draft", async () => {
    await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Approver",
      isOnlyContributor: false,
      isOnlySubmitter: false,
      isApprover: true,
    });

    expect(queueNotification).not.toHaveBeenCalled();
    expect(deletePendingReminder).toHaveBeenCalledWith(
      EMAIL_TYPE.HQ_APPROVAL,
      draftSeason.id,
      expect.anything(),
    );
  });

  it("still reports success when the HQ approval reminder can't be cancelled", async () => {
    deletePendingReminder.mockRejectedValueOnce(new Error("DB error"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const diagnostics = await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Approver",
      isOnlyContributor: false,
      isOnlySubmitter: false,
      isApprover: true,
    });

    expect(diagnostics).toEqual([
      expect.stringContaining("could not be cancelled"),
    ]);
  });

  it("reports the cancelled reminder after the transaction commits", async () => {
    const diagnostics = await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Approver",
      isOnlyContributor: false,
      isOnlySubmitter: false,
      isApprover: true,
    });

    expect(diagnostics).toEqual([
      `Pending HQ approval reminder was cancelled for season ${draftSeason.id}.`,
    ]);
  });

  it("doesn't report the reminder as cancelled when the commit fails", async () => {
    commitTransaction.mockRejectedValueOnce(new Error("Commit failed"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const diagnostics = await sendSeasonNotifications({
      updatedSeason: draftSeason,
      userFullName: "Approver",
      isOnlyContributor: false,
      isOnlySubmitter: false,
      isApprover: true,
    });

    expect(diagnostics).toEqual([
      "Season saved, but email notification failed.",
    ]);
  });
});
