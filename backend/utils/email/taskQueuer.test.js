import { beforeEach, describe, expect, it, vi } from "vitest";

const queueStrapiTask = vi.fn();
const getPublishableDetails = vi.fn(() => ({
  seasonFormSlug: "park",
  recipientEmails: ["reviewer@example.com"],
}));

vi.mock("../strapi/strapiTaskQueue.js", () => ({
  queueStrapiTask,
}));

vi.mock("./content.js", () => ({
  EMAIL_TYPE: {
    HQ_APPROVAL: "hq-approval",
  },
  getEditTargetLabel: () => "Golden Ears Park",
  getEmailContentByType: () => ({
    subject: "Subject",
    heading: "Heading",
    message: "Message",
    buttonText: "Review",
  }),
}));

vi.mock("./data.js", () => ({ getPublishableDetails }));

const { queueNotification, EMAIL_TYPE } = await import("./taskQueuer.js");

describe("queueNotification", () => {
  beforeEach(() => {
    queueStrapiTask.mockClear();
    getPublishableDetails.mockReturnValue({
      seasonFormSlug: "park",
      recipientEmails: ["reviewer@example.com"],
    });
  });

  it("sends reminder flag in the Strapi queued task jsonData", async () => {
    await queueNotification({
      emailType: EMAIL_TYPE.HQ_APPROVAL,
      season: {
        id: 123,
        operatingYear: 2026,
        publishableId: 217,
        seasonType: "regular",
      },
      userFullName: "Reminder Runner",
      triggeredBy: "test",
      isReminder: true,
      notifyManagementArea: false,
      notifyInformationServices: true,
      notifyReservationServices: false,
    });

    expect(queueStrapiTask).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({
          isReminder: true,
        }),
      }),
    );
  });

  it("keeps noRecipientsError on reminder emails when Management Area recipients are missing", async () => {
    getPublishableDetails.mockReturnValue({
      seasonFormSlug: "park",
      recipientEmails: [],
    });

    await queueNotification({
      emailType: EMAIL_TYPE.HQ_APPROVAL,
      season: {
        id: 123,
        operatingYear: 2026,
        publishableId: 217,
        seasonType: "regular",
      },
      userFullName: "Reminder Runner",
      triggeredBy: "test",
      isReminder: true,
      notifyManagementArea: true,
      notifyInformationServices: false,
      notifyReservationServices: false,
    });

    expect(queueStrapiTask).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({
          noRecipientsError: true,
          sendToIS: true,
        }),
      }),
    );
  });
});
