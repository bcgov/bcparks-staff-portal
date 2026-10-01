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
          copyToIS: false,
        }),
      }),
    );
  });

  describe("CC for Information Services", () => {
    /**
     * Queues a notification with the given recipient flags and returns its jsonData.
     * @param {Object} options Options to override on queueNotification
     * @returns {Promise<Object>} jsonData passed to the Strapi task
     */
    async function queueWith(options) {
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
        notifyManagementArea: true,
        ...options,
      });

      return queueStrapiTask.mock.calls.at(-1)[0].jsonData;
    }

    it("CCs Information Services when asked", async () => {
      const jsonData = await queueWith({ ccInformationServices: true });

      expect(jsonData).toMatchObject({ sendToIS: false, copyToIS: true });
    });

    it("doesn't CC Information Services by default", async () => {
      const jsonData = await queueWith({ isReminder: true });

      expect(jsonData).toMatchObject({ copyToIS: false });
    });

    it("doesn't CC Information Services when they're already a recipient", async () => {
      const jsonData = await queueWith({
        ccInformationServices: true,
        notifyInformationServices: true,
      });

      expect(jsonData).toMatchObject({ sendToIS: true, copyToIS: false });
    });

    it("doesn't CC Information Services when the fallback makes them a recipient", async () => {
      getPublishableDetails.mockReturnValue({
        seasonFormSlug: "park",
        recipientEmails: [],
      });

      const jsonData = await queueWith({ ccInformationServices: true });

      expect(jsonData).toMatchObject({
        noRecipientsError: true,
        sendToIS: true,
        copyToIS: false,
      });
    });
  });
});
