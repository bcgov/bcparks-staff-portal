import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import { ComponentLoader } from "adminjs";
import * as AdminJSSequelize from "@adminjs/sequelize";
import Connect from "connect-pg-simple";
import session from "express-session";
import { Op } from "sequelize";
import { resetScript } from "../strapi-sync/reset-and-import-data.js";

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

const SeasonResource = {
  resource: Season,

  options: {
    actions: {
      resetData: {
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
      },
    },
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
          // const { currentAdmin } = context;

          try {
            // Call your backend function to reset the DB
            await resetScript(); // Replace with your actual function
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

function getSeasonResource() {
  if (process.env.DEV_TEST_MODE === "true") {
    return SeasonResource;
  }
  return Season;
}

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
    getSeasonResource(),
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
    ssl: process.env.NODE_ENV === "production",
  },
  tableName: "session",
  createTableIfMissing: true,
});

export const sessionMiddleware = session({
  secret: process.env.ADMIN_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
});

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
    resave: true,
    saveUninitialized: true,
    secret: "sessionsecret",
    cookie: {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
    },
    name: "adminjs",
  },
);

// https://docs.adminjs.co/installation/getting-started#frontend-bundling
// only affects production environment
admin.watch();
