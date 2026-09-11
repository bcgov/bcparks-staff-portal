// node:test describe is supported by the Node.js version used by this project.
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- describe is supported by the project's Node.js runtime.
import test, { describe } from "node:test";
import assert from "node:assert/strict";

import strapiApi from "./strapiApi.js";
import {
  getParkManagementAreas,
  getPublishableDetails,
  queueDraftReviewEmail,
} from "./emailNotifications.js";
import { ManagementArea, Park, Publishable } from "../models/index.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import { Op } from "sequelize";

describe("emailNotifications.js", () => {
  test("returns ManagementAreas referenced by Park JSONB", async (t) => {
    t.mock.method(Park, "findByPk", async () => ({
      managementAreas: [
        { mgmtArea: { number: 10 } },
        { mgmtArea: { number: 20 } },
        { mgmtArea: {} },
      ],
    }));
    t.mock.method(ManagementArea, "findAll", async () => [
      { email: "area-10@example.com" },
      { email: "area-20@example.com" },
    ]);

    const managementAreas = await getParkManagementAreas(7);

    assert.deepStrictEqual(managementAreas, [
      { email: "area-10@example.com" },
      { email: "area-20@example.com" },
    ]);
    assert.deepStrictEqual(ManagementArea.findAll.mock.calls[0].arguments[0], {
      attributes: ["email"],
      where: {
        managementAreaNumber: {
          [Op.in]: [10, 20],
        },
      },
    });
  });

  test("returns names and ManagementArea emails for a publishable", async (t) => {
    t.mock.method(Publishable, "findByPk", async () => ({
      parkArea: {
        name: "North Area",
        park: { id: 7, name: "Example Park" },
      },
    }));
    t.mock.method(Park, "findByPk", async () => ({
      managementAreas: [{ mgmtArea: { number: 10 } }],
    }));
    t.mock.method(ManagementArea, "findAll", async () => [
      { email: "area-10@example.com" },
      { email: null },
    ]);

    const details = await getPublishableDetails(42);

    assert.deepStrictEqual(details, {
      parkName: "Example Park",
      parkAreaName: "North Area",
      featureName: null,
      recipientEmails: ["area-10@example.com"],
    });
  });

  test("throws when a publishable has no named park", async (t) => {
    for (const publishable of [
      null,
      { park: null },
      { park: { id: 7, name: null } },
      { park: { id: 7, name: undefined } },
    ]) {
      t.mock.method(Publishable, "findByPk", async () => publishable);

      await assert.rejects(
        getPublishableDetails(42),
        new Error("Publishable must be associated with a named park"),
      );
    }
  });

  test("queues normalized season details for draft review", async (t) => {
    t.mock.method(Publishable, "findByPk", async () => ({
      feature: {
        name: "Example Feature",
        park: { id: 7, name: "Example Park" },
      },
    }));
    t.mock.method(Park, "findByPk", async () => ({
      managementAreas: [{ mgmtArea: { number: 10 } }],
    }));
    t.mock.method(ManagementArea, "findAll", async () => [
      { email: "area-10@example.com" },
    ]);
    t.mock.method(strapiApi, "post", async () => ({ data: { id: 1 } }));

    const emailQueued = await queueDraftReviewEmail(
      {
        id: 42,
        publishableId: 99,
        seasonType: SEASON_TYPE.REGULAR,
        operatingYear: 2027,
        updatedAt: new Date(),
      },
      { name: "Example Contributor" },
      "routes::api::seasons::season-save",
    );

    assert.strictEqual(emailQueued, true);

    assert.deepStrictEqual(strapiApi.post.mock.calls[0].arguments, [
      "/queued-tasks",
      {
        data: {
          action: "email doot notification",
          numericData: 42,
          jsonData: {
            emailType: "draft-review",
            parkOperatorName: "Example Contributor",
            parkName: "Example Park",
            parkAreaName: null,
            featureName: "Example Feature",
            recipientEmails: ["area-10@example.com"],
            seasonType: "regular",
            operatingYear: 2027,
            triggeredBy:
              "bcparks-staff-portal::backend::routes::api::seasons::season-save",
          },
        },
      },
    ]);
  });

  test("throws without queuing when required season details are missing", async (t) => {
    t.mock.method(strapiApi, "post", async () => ({ data: { id: 1 } }));

    for (const season of [
      null,
      { seasonType: null, operatingYear: 2027 },
      { seasonType: "regular", operatingYear: null },
      { operatingYear: 2027 },
      { seasonType: "regular" },
      { seasonType: "", operatingYear: 2027 },
      { seasonType: "regular", operatingYear: 0 },
    ]) {
      await assert.rejects(
        queueDraftReviewEmail(season, { name: "Example Contributor" }, "test"),
        new Error("Season must have a season type and operating year"),
      );
    }

    assert.strictEqual(strapiApi.post.mock.calls.length, 0);
  });

  test("returns false without queuing when no recipient email is found", async (t) => {
    t.mock.method(Publishable, "findByPk", async () => ({
      park: { id: 7, name: "Example Park" },
    }));
    t.mock.method(Park, "findByPk", async () => ({
      managementAreas: [{ mgmtArea: { number: 10 } }],
    }));
    t.mock.method(ManagementArea, "findAll", async () => []);
    t.mock.method(strapiApi, "post", async () => ({ data: { id: 1 } }));

    const emailQueued = await queueDraftReviewEmail(
      {
        id: 42,
        publishableId: 99,
        seasonType: SEASON_TYPE.REGULAR,
        operatingYear: 2027,
      },
      { name: "Example Contributor" },
      "routes::api::seasons::season-save",
    );

    assert.strictEqual(emailQueued, false);
    assert.strictEqual(strapiApi.post.mock.calls.length, 0);
  });
});
