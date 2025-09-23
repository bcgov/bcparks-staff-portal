import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import { owningRelationSettingsFeature } from "@adminjs/relations";
import { ComponentLoader } from "adminjs";
import * as AdminJSSequelize from "@adminjs/sequelize";
import Connect from "connect-pg-simple";
import session from "express-session";
import { Op } from "sequelize";
import * as STATUS from "../constants/seasonStatus.js";
import "../env.js";
import _ from "lodash";

import {
  Dateable,
  Publishable,
  Park,
  User,
  ParkArea,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
  Section,
  ManagementArea,
  DateRangeAnnual,
  GateDetail,
  AccessGroup,
  SeasonChangeLog,
  DateChangeLog,
  UserAccessGroup,
  AccessGroupPark,
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
              operatingYear: {
                [Op.lt]: currentYear,
              },
            },
          },
        );

        // check if today is over May 1st
        const today = new Date();
        const may1 = new Date(today.getFullYear(), 4, 1);

        let winterSeasonsUpdated = 0;

        // After After May 1st, all winter seasons for the current year shouldn't be editable
        // so we update their status to "not provided"
        if (today > may1) {
          const [winterUpdatedCount] = await Season.update(
            {
              status: STATUS.NOT_PROVIDED,
              editable: false,
            },
            {
              where: {
                status: STATUS.REQUESTED,
                seasonType: "winter",
                operatingYear: currentYear,
              },
            },
          );

          winterSeasonsUpdated = winterUpdatedCount;
        }

        const totalUpdatedCount = updatedCount + winterSeasonsUpdated;

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
          season.updatedAt = null;

          // updatedAt can only be set to null if we call save(), not with bulkUpdate
          await season.save({
            fields: ["status", "readyToPublish", "updatedAt"],
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
      gateDetailOldValue: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
      gateDetailNewValue: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
      },
    },
  },
};

function expandDotNotation(flat) {
  const result = {};

  for (const [key, value] of Object.entries(flat)) {
    _.set(result, key, value);
  }
  return result;
}

function expandAndCoerce(flat) {
  const result = {};

  for (const [key, value] of Object.entries(flat)) {
    // convert numeric strings to numbers
    const num = Number(value);
    const coerced = !isNaN(num) && value !== "" ? num : value;

    _.set(result, key, coerced);
  }
  return result;
}

const ParkResource = {
  resource: Park,
  options: {
    properties: {
      managementAreas: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        type: "mixed",
        components: {
          show: jsonShowComponent,
          edit: jsonEditComponent,
        },
        props: {
          label: "Management Areas",
        },
      },
    },
    actions: {
      show: {
        async after(response) {
          if (response.record?.params) {
            const expanded = expandDotNotation(response.record.params);

            if (expanded.managementAreas) {
              response.record.params.managementAreas = expanded.managementAreas;
            }
          }
          return response;
        },
      },
      edit: {
        async before(request) {
          if (request.payload) {
            const expanded = expandAndCoerce(request.payload);

            if (expanded.managementAreas) {
              // replace payload with the proper nested structure
              request.payload.managementAreas = expanded.managementAreas;
            }
          }
          return request;
        },
        async after(response) {
          if (response.record?.params) {
            const expanded = expandDotNotation(response.record.params);

            if (expanded.managementAreas) {
              response.record.params.managementAreas = expanded.managementAreas;
            }
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
      },
    }),
  ],
};

const adminOptions = {
  // We pass Category to `resources`
  componentLoader,
  resources: [
    Dateable,
    Publishable,
    ParkResource,
    UserResource,
    ParkArea,
    FeatureType,
    Feature,
    DateType,
    SeasonResource,
    DateRange,
    Section,
    ManagementArea,
    DateRangeAnnual,
    GateDetailResource,
    AccessGroupResource,
    UserAccessGroup,
    AccessGroupPark,
    SeasonChangeLog,
    DateChangeLog,
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
