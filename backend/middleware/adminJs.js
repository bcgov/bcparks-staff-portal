import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import { ComponentLoader } from "adminjs";
import * as AdminJSSequelize from "@adminjs/sequelize";
import Connect from "connect-pg-simple";
import session from "express-session";
import { Op } from "sequelize";
import { resetScript } from "../strapi-sync/reset-and-import-data.js";
import "../env.js";

import {
  Dateable,
  Park,
  User,
  Campground,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
  SeasonChangeLog,
  DateChangeLog,
} from "../models/index.js";

import { connectionConfig } from "../db/connection.js";

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

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

        // update status to "Not provided" for all seasons with status "requested" and operatingYear < currentYear
        const [updatedCount] = await Season.update(
          {
            status: "Not provided",
            editable: false,
          },
          {
            where: {
              status: "requested",
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
        // so we update their status to "Not provided"
        if (today > may1) {
          const winterFeatureType = await FeatureType.findOne({
            attributes: ["id"],
            where: {
              name: "Winter fee",
            },
          });

          const [winterUpdatedCount] = await Season.update(
            {
              status: "Not provided",
              editable: false,
            },
            {
              where: {
                status: "requested",
                featureTypeId: winterFeatureType.id,
                operatingYear: currentYear,
              },
            },
          );

          winterSeasonsUpdated = winterUpdatedCount;
        }

        const totalUpdatedCount = updatedCount + winterSeasonsUpdated;

        return {
          notice: {
            message: `Updated ${totalUpdatedCount} seasons to "Not provided"`,
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

          season.status = "requested";
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

const SeasonResource = {
  resource: Season,

  options: {
    actions: getSeasonActions(),
  },
};

const ParkResource = {
  resource: Park,
  options: {
    actions: {
      resetDatabase: {
        actionType: "resource",
        icon: "RefreshCw",
        label: "Reset Database",
        guard: "Are you sure you want to reset the database?.",
        component: false,
        // eslint-disable-next-line no-unused-vars -- required by AdminJS
        async handler(request, response, context) {
          try {
            await resetScript();
            console.log("Resetting database...");

            return {
              notice: {
                message: "Database has been successfully reset!",
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
      },
    },
  },
};

function getParkResource() {
  if (process.env.DEV_TEST_MODE === "true") {
    return ParkResource;
  }
  return Park;
}

const componentLoader = new ComponentLoader();

const adminOptions = {
  // We pass Category to `resources`
  componentLoader,
  resources: [
    Dateable,
    getParkResource(),
    User,
    Campground,
    FeatureType,
    Feature,
    DateType,
    SeasonResource,
    DateRange,
    SeasonChangeLog,
    DateChangeLog,
  ],
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
