import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sequelize } from "sequelize";
import AdminJS from "adminjs";
import { Database, Resource } from "@adminjs/sequelize";
import defineFeature from "./feature.js";
import migration from "../migrations/20261013215136-require-feature-type-id.js";

AdminJS.registerAdapter({ Database, Resource });

describe("Feature feature type validation", () => {
  let sequelize;
  let Feature;
  let resource;

  beforeEach(() => {
    sequelize = new Sequelize("test", "test", "test", {
      dialect: "postgres",
      logging: false,
    });
    Feature = defineFeature(sequelize);
    const admin = new AdminJS({ resources: [Feature] });

    resource = admin.findResource("Features");
    vi.spyOn(sequelize, "query").mockRejectedValue(
      new Error("Unexpected database query"),
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await sequelize.close();
  });

  it.each([{}, { featureTypeId: null }])(
    "rejects missing type in %j",
    async (params) => {
      await expect(Feature.build(params).validate()).rejects.toMatchObject({
        errors: [
          {
            path: "featureTypeId",
            message: "Please select a feature type.",
          },
        ],
      });
      expect(sequelize.query).not.toHaveBeenCalled();
    },
  );

  it("accepts a selected feature type", async () => {
    const feature = Feature.build({ featureTypeId: 1 });

    await expect(feature.validate()).resolves.toBe(feature);
  });

  it("marks the field as required in AdminJS", () => {
    expect(resource.property("featureTypeId").isRequired()).toBe(true);
  });

  it.each([{}, { featureTypeId: null }])(
    "returns a field error and native notice when creating with %j",
    async (payload) => {
      const result = await AdminJS.ACTIONS.new.handler(
        { method: "post", payload: { name: "Test feature", ...payload } },
        {},
        { resource, currentAdmin: null },
      );

      expect(result.notice).toEqual({
        message: "thereWereValidationErrors",
        type: "error",
      });
      expect(result.record.errors.featureTypeId.message).toBe(
        "Please select a feature type.",
      );
      expect(result.record.params.name).toBe("Test feature");
      expect(result.redirectUrl).toBeUndefined();
      expect(sequelize.query).not.toHaveBeenCalled();
    },
  );

  it("returns a field error and native notice when clearing the type on edit", async () => {
    const record = resource.build({
      id: 1,
      name: "Test feature",
      featureTypeId: 1,
    });
    const result = await AdminJS.ACTIONS.edit.handler(
      {
        method: "post",
        payload: { name: "Changed feature", featureTypeId: null },
      },
      {},
      { resource, record, currentAdmin: null },
    );

    expect(result.notice).toEqual({
      message: "thereWereValidationErrors",
      type: "error",
    });
    expect(result.record.errors.featureTypeId.message).toBe(
      "Please select a feature type.",
    );
    expect(result.record.params.name).toBe("Changed feature");
    expect(result.redirectUrl).toBeUndefined();
    expect(sequelize.query).not.toHaveBeenCalled();
  });
});

describe("Feature type NOT NULL migration", () => {
  let queryInterface;
  let transaction;

  beforeEach(() => {
    transaction = {};
    queryInterface = {
      sequelize: {
        query: vi.fn(),
        transaction: vi.fn((callback) => callback(transaction)),
      },
    };
  });

  it("refuses to enforce NOT NULL when existing features have no type", async () => {
    queryInterface.sequelize.query.mockResolvedValueOnce([{ count: "2" }]);

    await expect(migration.up(queryInterface, Sequelize)).rejects.toThrow(
      "Cannot require featureTypeId: 2 Features have no feature type. " +
        "Assign a valid feature type to each Feature before running this migration.",
    );
    expect(queryInterface.sequelize.query).toHaveBeenCalledExactlyOnceWith(
      'SELECT COUNT(*) AS count FROM "Features" WHERE "featureTypeId" IS NULL',
      { type: Sequelize.QueryTypes.SELECT, transaction },
    );
  });

  it("changes only nullability in the same transaction as the preflight", async () => {
    queryInterface.sequelize.query.mockResolvedValueOnce([{ count: "0" }]);

    await migration.up(queryInterface, Sequelize);

    expect(queryInterface.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(queryInterface.sequelize.query).toHaveBeenCalledTimes(2);
    expect(queryInterface.sequelize.query).toHaveBeenNthCalledWith(
      2,
      'ALTER TABLE "Features" ALTER COLUMN "featureTypeId" SET NOT NULL',
      { transaction },
    );
  });

  it("restores nullability without changing the foreign key", async () => {
    await migration.down(queryInterface);

    expect(queryInterface.sequelize.query).toHaveBeenCalledExactlyOnceWith(
      'ALTER TABLE "Features" ALTER COLUMN "featureTypeId" DROP NOT NULL',
    );
  });
});
