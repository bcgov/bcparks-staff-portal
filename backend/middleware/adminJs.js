import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import { owningRelationSettingsFeature } from "@adminjs/relations";
import { ComponentLoader } from "adminjs";
import * as AdminJSSequelize from "@adminjs/sequelize";
import Connect from "connect-pg-simple";
import session from "express-session";
import { Op } from "sequelize";
import flat from "flat";
import * as STATUS from "../constants/seasonStatus.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import "../env.js";

import {
  AccessGroup,
  AccessGroupPark,
  AppSetting,
  DateChangeLog,
  DateRange,
  DateRangeAnnual,
  DateType,
  Dateable,
  Feature,
  FeatureType,
  GateDetail,
  ManagementArea,
  Park,
  ParkArea,
  ParkAreaType,
  PendingReminder,
  Publishable,
  Season,
  SeasonChangeLog,
  Section,
  User,
  UserAccessGroup,
} from "../models/index.js";

import { connectionConfig } from "../db/connection.js";

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

const componentLoader = new ComponentLoader();

// authenticate hardcoded credentials from environment variables
const DEFAULT_ADMIN = {
  email: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASSWORD,
};

async function authenticate(email, password) {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
}

function getSeasonActions() {
  // if DEV_TEST_MODE is true, return updatedOldStatus action and resetData action
  // else: return only updatedOldStatus action
  const actions = {
    updateOldStatus: {
      actionType: "resource",
      icon: "Calendar",
      label: "Update old statuses",
      component: false,
      // eslint-disable-next-line no-unused-vars -- required by AdminJS
      async handler(request, response, context) {
        const currentYear = new Date().getFullYear();

        // update status to "not provided" for all seasons with status "requested" and operatingYear < currentYear
        const [updatedCount] = await Season.update(
          {
            status: STATUS.NOT_PROVIDED,
            editable: false,
          },
          {
            where: {
              status: STATUS.REQUESTED,
              seasonType: SEASON_TYPE.REGULAR,
              operatingYear: {
                [Op.lt]: currentYear,
              },
            },
          },
        );

        // Winter operatingYears are based on the Fall/December year; We don't mark
        // winter seasons as 'not provided' until May 1st of the following spring
        const today = new Date();
        const may1 = new Date(`${today.getFullYear()}-05-01`);

        // check if today is over May 1st
        const winterCutoffYear = today >= may1 ? currentYear : currentYear - 1;

        const [winterUpdatedCount] = await Season.update(
          {
            status: STATUS.NOT_PROVIDED,
            editable: false,
          },
          {
            where: {
              status: STATUS.REQUESTED,
              seasonType: SEASON_TYPE.WINTER,
              operatingYear: {
                [Op.lt]: winterCutoffYear,
              },
            },
          },
        );

        const totalUpdatedCount = updatedCount + winterUpdatedCount;

        return {
          notice: {
            message: `Updated ${totalUpdatedCount} seasons to "${STATUS.NOT_PROVIDED}"`,
            type: "success",
          },
        };
      },
    },
  };

  if (process.env.DEV_TEST_MODE === "true") {
    actions.resetData = {
      actionType: "bulk",
      icon: "RefreshCw",
      label: "Reset dates data",
      component: false,
      async handler(request, response, context) {
        const { records } = context;

        for (const record of records) {
          const seasonId = record.params.id;

          // set status to requested for this season
          const season = await Season.findByPk(seasonId);

          season.status = STATUS.REQUESTED;
          season.readyToPublish = true;
          season.informationSvcApproved = false;
          season.reservationSvcApproved = false;
          season.updatedAt = null;

          // updatedAt can only be set to null if we call save(), not with bulkUpdate
          await season.save({
            fields: [
              "status",
              "readyToPublish",
              "informationSvcApproved",
              "reservationSvcApproved",
              "updatedAt",
            ],
          });

          // set startDate and endDate to null for every daterange in this season
          await DateRange.update(
            {
              startDate: null,
              endDate: null,
            },
            {
              where: {
                seasonId,
              },
            },
          );

          // get all seasonChangeLogs in this season
          const seasonChangeLogs = await SeasonChangeLog.findAll({
            where: {
              seasonId,
            },
            attributes: ["id"],
          });

          const seasonChangeLogIds = seasonChangeLogs.map((log) => log.id);

          // delete every dateChangeLog in this season
          await DateChangeLog.destroy({
            where: {
              seasonChangeLogId: {
                [Op.in]: seasonChangeLogIds,
              },
            },
          });

          // delete every seasonChangeLog in this season
          await SeasonChangeLog.destroy({
            where: {
              seasonId,
            },
          });
        }

        try {
          return {
            records: records.map((record) => record.toJSON()),
            notice: {
              message: "Successfully reset dates data",
              type: "success",
            },
          };
        } catch (error) {
          return {
            notice: {
              message: error.toString(),
              type: "error",
            },
          };
        }
      },
    };
  }

  return actions;
}

const LICENSE_KEY = process.env.ADMINJS_RELATIONS_LICENSE_KEY;

const AccessGroupResource = {
  resource: AccessGroup,
  options: {
    properties: {
      id: { isId: true },
      name: { isTitle: true },
    },
  },
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        users: {
          type: "many-to-many",
          junction: {
            joinKey: "accessGroupId",
            inverseJoinKey: "userId",
            throughResourceId: "UserAccessGroups",
          },
          target: {
            resourceId: "Users",
            joinKey: "id",
            targetPropertyKey: "id",
          },
        },
        parks: {
          type: "many-to-many",
          junction: {
            joinKey: "accessGroupId",
            inverseJoinKey: "parkId",
            throughResourceId: "AccessGroupParks",
          },
          target: {
            resourceId: "Parks",
            joinKey: "id",
            targetPropertyKey: "id",
          },
        },
      },
    }),
  ],
};

const UserResource = {
  resource: User,
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        accessGroups: {
          type: "many-to-many",
          junction: {
            joinKey: "userId",
            inverseJoinKey: "accessGroupId",
            throughResourceId: "UserAccessGroups",
          },
          target: {
            resourceId: "AccessGroups",
            joinKey: "id",
            targetPropertyKey: "id",
          },
        },
      },
    }),
  ],
};

const SeasonResource = {
  resource: Season,

  options: {
    actions: getSeasonActions(),
    listProperties: [
      "id",
      "publishableId",
      "operatingYear",
      "status",
      "readyToPublish",
      "editable",
      "createdAt",
      "updatedAt",
    ],
  },
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        dateRanges: {
          type: "one-to-many",
          target: {
            resourceId: "DateRanges",
            joinKey: "seasonId",
          },
        },
        changeLogs: {
          type: "one-to-many",
          target: {
            resourceId: "SeasonChangeLogs",
            joinKey: "seasonId",
          },
        },
      },
    }),
  ],
};

// Allow nullable booleans to be displayed as "Yes", "No", and "null"
const nullableBooleanComponent = componentLoader.add(
  "NullableBooleanList",
  "../components/NullableBooleanList",
);

const jsonShowComponent = componentLoader.add(
  "JsonShow",
  "../components/JsonShow",
);

const jsonEditComponent = componentLoader.add(
  "JsonEdit",
  "../components/JsonEdit",
);

const jsonListComponent = componentLoader.add(
  "JsonList",
  "../components/JsonList",
);

const keyEditComponent = componentLoader.add(
  "KeyEdit",
  "../components/KeyEdit",
);

/**
 * Adds nested JSONB values to AdminJS's flattened record params for custom components.
 * The original flattened params are preserved for AdminJS's normal record handling.
 *
 * IMPORTANT: JSON object keys must never contain a "." character; e.g. the key "a.b" would be
 * unflattened into an unintended nested structure instead of a literal "a.b" key.
 * @param {Object} params AdminJS record params
 * @param {string[]} properties JSONB property names to restore as nested values
 * @returns {void} Modifies the `params` object in place, adding nested values for the specified properties.
 */
function normalizeJsonProperties(params, properties) {
  const unflattened = flat.unflatten(params);

  for (const property of properties) {
    if (Object.hasOwn(unflattened, property)) {
      params[property] = unflattened[property];
    }
  }
}

/**
 * Parses JSON values marked by the custom editor before AdminJS persists a payload.
 * @param {Object} payload AdminJS edit payload
 * @param {string[]} properties Payload keys to process
 * @param {BaseRecord} [record] Existing record used to recover untouched scalars
 * @returns {Object} A copy of the payload with marked JSON values parsed
 */
function parseMarkedJsonValues(payload, properties, record) {
  const processedPayload = { ...payload };

  for (const property of properties) {
    const value = processedPayload[property];

    // Already-typed values (e.g. reconstructed objects) need no parsing
    if (typeof value !== "string") continue;

    // Check if the value is marked as a JSON string by the custom editor
    if (value.startsWith("__JSON_STRING__")) {
      try {
        processedPayload[property] = JSON.parse(
          value.replace("__JSON_STRING__", ""),
        );
      } catch (err) {
        console.error("Failed to parse JSON string:", err);
      }
      continue;
    }

    const existingValue = record?.get(property);

    // Recover an unmarked scalar only when it exactly matches the stored
    // value, preserving strings such as "1234" that resemble JSON numbers.
    if (
      typeof existingValue !== "string" &&
      value === JSON.stringify(existingValue)
    ) {
      processedPayload[property] = existingValue;
    }
  }

  return processedPayload;
}

/**
 * Removes AdminJS's flattened dot-notation keys (e.g. "value.hasGate")
 * for the given JSONB properties, so they can't overwrite the parsed
 * object/array we've already reconstructed from the marked JSON string.
 * @param {Object} payload AdminJS edit payload
 * @param {string[]} properties JSONB property names to strip flattened keys for
 * @returns {void} Modifies the `payload` object in place
 */
function stripFlattenedKeys(payload, properties) {
  for (const key of Object.keys(payload)) {
    if (properties.some((property) => key.startsWith(`${property}.`))) {
      delete payload[key];
    }
  }
}

const GateDetailResource = {
  resource: GateDetail,
  options: {
    listProperties: [
      "id",
      "publishableId",
      "hasGate",
      "gateOpenTime",
      "gateCloseTime",
      "gateOpensAtDawn",
      "gateClosesAtDusk",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      hasGate: {
        components: {
          list: nullableBooleanComponent,
          show: nullableBooleanComponent,
        },
      },
    },
  },
};

const SeasonChangeLogResource = {
  resource: SeasonChangeLog,
  options: {
    properties: {
      gateDetailOldValue: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          list: jsonListComponent,
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
      gateDetailNewValue: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          list: jsonListComponent,
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
    },
    actions: {
      list: {
        async after(response) {
          response.records?.forEach((record) => {
            if (record.params) {
              normalizeJsonProperties(record.params, [
                "gateDetailOldValue",
                "gateDetailNewValue",
              ]);
            }
          });
          return response;
        },
      },
      show: {
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);
          }
          return response;
        },
      },
      new: {
        async before(request) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(request.payload, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);

            stripFlattenedKeys(request.payload, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);
          }
          return response;
        },
      },
      edit: {
        async before(request, context) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(
              request.payload,
              ["gateDetailOldValue", "gateDetailNewValue"],
              context.record,
            );

            stripFlattenedKeys(request.payload, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "gateDetailOldValue",
              "gateDetailNewValue",
            ]);
          }
          return response;
        },
      },
    },
  },
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        dateChangeLogs: {
          type: "one-to-many",
          target: {
            resourceId: "DateChangeLogs",
            joinKey: "seasonChangeLogId",
          },
        },
      },
    }),
  ],
};

const AppSettingResource = {
  resource: AppSetting,
  options: {
    properties: {
      // AdminJS treats primary keys as non-editable by default, but ours is
      // a user-supplied string (not auto-generated), so allow editing it.
      // KeyEdit renders an input on create and a read-only display on edit,
      // since renaming an existing row's primary key breaks the update lookup.
      key: {
        isId: true,
        isTitle: true,
        isVisible: { list: true, filter: true, show: true, edit: true },
        components: {
          edit: keyEditComponent,
        },
      },
      value: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          list: jsonListComponent,
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
    },
    actions: {
      list: {
        async after(response) {
          response.records?.forEach((record) => {
            if (record.params) {
              normalizeJsonProperties(record.params, ["value"]);
            }
          });
          return response;
        },
      },
      show: {
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, ["value"]);
          }
          return response;
        },
      },
      new: {
        async before(request) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(request.payload, ["value"]);

            stripFlattenedKeys(request.payload, ["value"]);
          }
          return request;
        },
        async after(response, request) {
          // Unlike edit, the row does not exist until after create; restore an
          // intentional empty JSONB string after @adminjs/sequelize omits it.
          if (request.payload?.value === "") {
            await AppSetting.update(
              { value: "" },
              { where: { key: request.payload.key } },
            );

            if (response.record?.params) {
              response.record.params.value = "";
            }
          }

          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, ["value"]);
          }
          return response;
        },
      },
      edit: {
        async before(request, context) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(
              request.payload,
              ["value"],
              context.record,
            );

            stripFlattenedKeys(request.payload, ["value"]);

            // @adminjs/sequelize drops non-string-typed columns (JSONB
            // included) from the update entirely when the value is "", so
            // persist an intentional empty string ourselves instead.
            if (request.payload.value === "") {
              await AppSetting.update(
                { value: "" },
                { where: { key: request.params.recordId } },
              );
              delete request.payload.value;
            }
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, ["value"]);
          }
          return response;
        },
      },
    },
  },
};

/**
 * Populates hasOne associations (where the foreign key is on the related model)
 * so AdminJS's built-in reference component renders them as links.
 * @param {Array<Object>} records RecordJSON objects from the action response
 * @param {Object} context AdminJS action context
 * @param {string} foreignKey Foreign key column on the related models
 * @param {Array<Object>} links List of { path, model, resourceId } to populate
 * @param {string} [sourceKey="id"] Column on the owner record that the foreign key references
 * @returns {Promise<void>}
 */
async function populateHasOneLinks(
  records,
  context,
  foreignKey,
  links,
  sourceKey = "id",
) {
  const ownerKeys = records
    .map((record) => record.params[sourceKey])
    .filter((key) => key !== null && typeof key !== "undefined");

  if (!ownerKeys.length) return;

  for (const { path, model, resourceId } of links) {
    const rows = await model.findAll({
      where: { [foreignKey]: ownerKeys },
      attributes: ["id", foreignKey],
    });

    if (!rows.length) continue;

    // eslint-disable-next-line no-underscore-dangle -- AdminJS exposes the instance as _admin
    const resource = context._admin.findResource(resourceId);
    const targets = await resource.findMany(rows.map((row) => row.id));
    const targetsById = new Map(
      targets.map((target) => [String(target.id()), target]),
    );
    const targetsByOwnerKey = new Map(
      rows.map((row) => [
        String(row[foreignKey]),
        targetsById.get(String(row.id)),
      ]),
    );

    records.forEach((record) => {
      const target = targetsByOwnerKey.get(String(record.params[sourceKey]));

      if (target) {
        record.params[path] = target.id();
        record.populated[path] = target.toJSON(context.currentAdmin);
      }
    });
  }
}

/**
 * Returns read-only virtual reference properties for hasOne links.
 * @param {Array<Object>} links List of { path, resourceId } to display
 * @returns {Object} AdminJS property options keyed by path
 */
function hasOneLinkProperties(links) {
  return Object.fromEntries(
    links.map(({ path, resourceId }) => [
      path,
      {
        type: "reference",
        reference: resourceId,
        isVisible: { list: true, filter: false, show: true, edit: false },
      },
    ]),
  );
}

/**
 * Returns AdminJS resource options that display hasOne associations as links.
 * Adds a read-only virtual reference property for each link, and list/show
 * hooks to populate them.
 * @param {string} foreignKey Foreign key column on the related models
 * @param {Array<Object>} links List of { path, model, resourceId } to display
 * @returns {Object} AdminJS resource options with properties and actions
 */
function hasOneLinkOptions(foreignKey, links) {
  return {
    properties: hasOneLinkProperties(links),
    actions: {
      list: {
        async after(response, request, context) {
          await populateHasOneLinks(
            response.records ?? [],
            context,
            foreignKey,
            links,
          );
          return response;
        },
      },
      show: {
        async after(response, request, context) {
          if (response.record) {
            await populateHasOneLinks(
              [response.record],
              context,
              foreignKey,
              links,
            );
          }
          return response;
        },
      },
    },
  };
}

// hasOne associations of Park, joined on the Park's publishableId
const PARK_LINKS = [
  { path: "gateDetail", model: GateDetail, resourceId: "GateDetails" },
];

const ParkResource = {
  resource: Park,
  options: {
    properties: {
      managementAreas: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          list: jsonListComponent,
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
        props: {
          label: "Management Areas",
        },
      },
      ...hasOneLinkProperties(PARK_LINKS),
    },
    actions: {
      list: {
        async after(response, request, context) {
          response.records?.forEach((record) => {
            if (record.params) {
              normalizeJsonProperties(record.params, ["managementAreas"]);
            }
          });
          await populateHasOneLinks(
            response.records ?? [],
            context,
            "publishableId",
            PARK_LINKS,
            "publishableId",
          );
          return response;
        },
      },
      show: {
        async after(response, request, context) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "managementAreas",
            ]);
            await populateHasOneLinks(
              [response.record],
              context,
              "publishableId",
              PARK_LINKS,
              "publishableId",
            );
          }
          return response;
        },
      },
      new: {
        async before(request) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(request.payload, [
              "managementAreas",
            ]);

            stripFlattenedKeys(request.payload, ["managementAreas"]);
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "managementAreas",
            ]);
          }
          return response;
        },
      },
      edit: {
        async before(request, context) {
          if (request.payload) {
            // Handle JSON string markers to preserve types
            request.payload = parseMarkedJsonValues(
              request.payload,
              ["managementAreas"],
              context.record,
            );

            stripFlattenedKeys(request.payload, ["managementAreas"]);
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, [
              "managementAreas",
            ]);
          }
          return response;
        },
      },
    },
  },
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        accessGroups: {
          type: "many-to-many",
          junction: {
            joinKey: "parkId",
            inverseJoinKey: "accessGroupId",
            throughResourceId: "AccessGroupParks",
          },
          target: {
            resourceId: "AccessGroups",
            joinKey: "id",
            targetPropertyKey: "id",
          },
        },
        features: {
          type: "one-to-many",
          target: {
            resourceId: "Features",
            joinKey: "parkId",
          },
        },
        parkAreas: {
          type: "one-to-many",
          target: {
            resourceId: "ParkAreas",
            joinKey: "parkId",
          },
        },
      },
    }),
  ],
};

const PendingReminderResource = {
  resource: PendingReminder,
  options: {
    properties: {
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        isDisabled: true,
      },
      jsonData: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          list: jsonListComponent,
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
    },
    editProperties: [
      "emailType",
      "numericData",
      "comparisonDate",
      "notifyManagementArea",
      "notifyInformationServices",
      "notifyReservationServices",
      "followUpDate",
      "jsonData",
      "createdAt",
    ],
    listProperties: [
      "emailType",
      "numericData",
      "comparisonDate",
      "followUpDate",
      "createdAt",
    ],
    actions: {
      new: {
        isVisible: false,
      },
      list: {
        async after(response) {
          response.records?.forEach((record) => {
            if (record.params) {
              normalizeJsonProperties(record.params, ["jsonData"]);
            }
          });
          return response;
        },
      },
      show: {
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, ["jsonData"]);
          }
          return response;
        },
      },
      edit: {
        async before(request, context) {
          if (request.payload) {
            request.payload = parseMarkedJsonValues(
              request.payload,
              ["jsonData"],
              context.record,
            );
            stripFlattenedKeys(request.payload, ["jsonData"]);
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            normalizeJsonProperties(response.record.params, ["jsonData"]);
          }
          return response;
        },
      },
    },
  },
};

const PublishableResource = {
  resource: Publishable,
  options: hasOneLinkOptions("publishableId", [
    { path: "park", model: Park, resourceId: "Parks" },
    { path: "parkArea", model: ParkArea, resourceId: "ParkAreas" },
    { path: "feature", model: Feature, resourceId: "Features" },
    { path: "gateDetail", model: GateDetail, resourceId: "GateDetails" },
  ]),
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        seasons: {
          type: "one-to-many",
          target: {
            resourceId: "Seasons",
            joinKey: "publishableId",
          },
        },
        dateRangeAnnuals: {
          type: "one-to-many",
          target: {
            resourceId: "DateRangeAnnuals",
            joinKey: "publishableId",
          },
        },
      },
    }),
  ],
};

const DateableResource = {
  resource: Dateable,
  options: hasOneLinkOptions("dateableId", [
    { path: "park", model: Park, resourceId: "Parks" },
    { path: "parkArea", model: ParkArea, resourceId: "ParkAreas" },
    { path: "feature", model: Feature, resourceId: "Features" },
  ]),
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        dateRanges: {
          type: "one-to-many",
          target: {
            resourceId: "DateRanges",
            joinKey: "dateableId",
          },
        },
      },
    }),
  ],
};

const ParkAreaResource = {
  resource: ParkArea,
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        features: {
          type: "one-to-many",
          target: {
            resourceId: "Features",
            joinKey: "parkAreaId",
          },
        },
      },
    }),
  ],
};

const SectionResource = {
  resource: Section,
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        managementAreas: {
          type: "one-to-many",
          target: {
            resourceId: "ManagementAreas",
            joinKey: "sectionId",
          },
        },
      },
    }),
  ],
};

const DateRangeResource = {
  resource: DateRange,
  features: [
    owningRelationSettingsFeature({
      componentLoader,
      licenseKey: LICENSE_KEY,
      relations: {
        dateChangeLogs: {
          type: "one-to-many",
          target: {
            resourceId: "DateChangeLogs",
            joinKey: "dateRangeId",
          },
        },
      },
    }),
  ],
};

const adminOptions = {
  // We pass Category to `resources`
  componentLoader,
  resources: [
    AccessGroupPark,
    AccessGroupResource,
    AppSettingResource,
    DateChangeLog,
    DateRangeAnnual,
    DateRangeResource,
    DateType,
    DateableResource,
    Feature,
    FeatureType,
    GateDetailResource,
    ManagementArea,
    ParkAreaResource,
    ParkAreaType,
    ParkResource,
    PendingReminderResource,
    PublishableResource,
    SeasonChangeLogResource,
    SeasonResource,
    SectionResource,
    UserAccessGroup,
    UserResource,
  ],
  branding: {
    companyName: "BC Parks Staff Portal Admin",
    logo: false,
  },
};

// AdminJS plugin
export const admin = new AdminJS(adminOptions);

const ConnectSession = Connect(session);
const sessionStore = new ConnectSession({
  conObject: {
    ...connectionConfig,
    // this package uses "user" instead of "username"
    user: connectionConfig.username,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            // Allow CrunchyDB's self-signed certificate
            rejectUnauthorized: false,
          }
        : false,
  },
  tableName: "AdminSessions",
  createTableIfMissing: true,
});

const cookieOptions = { maxAge: 10 * 60 * 60 * 1000 };

if (process.env.NODE_ENV === "production") {
  cookieOptions.httpOnly = true;
  cookieOptions.secure = true;
}

export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate,
    cookieName: process.env.ADMIN_COOKIE_NAME,
    cookiePassword: process.env.ADMIN_COOKIE_PASSWORD,
  },
  null,
  {
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    secret: process.env.ADMIN_SESSION_SECRET,
    cookie: cookieOptions,
    name: process.env.ADMIN_COOKIE_NAME,
  },
);

// https://docs.adminjs.co/installation/getting-started#frontend-bundling
// only affects production environment
admin.watch();
