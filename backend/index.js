import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import RateLimit from "express-rate-limit";

import "./env.js";
import checkJwt from "./middleware/checkJwt.js";
import { admin, adminRouter, sessionMiddleware } from "./middleware/adminJs.js";
import homeRoutes from "./routes/home.js";
import parkRoutes from "./routes/api/parks.js";
import seasonRoutes from "./routes/api/seasons.js";
import winterSeasonRoutes from "./routes/api/winter-seasons.js";
import exportRoutes from "./routes/api/export.js";
import publishRoutes from "./routes/api/publish.js";

if (!process.env.POSTGRES_SERVER || !process.env.ADMIN_PASSWORD) {
  throw new Error("Required environment variables are not set");
}

const app = express();

// enable CORS for all routes
app.use(cors());

// JSON parsing middleware
app.use(express.json());

// Logging middleware
app.use(morgan("dev"));

// Helmet security middleware
app.use(
  helmet({
    // disable CSP for AdminJS
    contentSecurityPolicy: false,
  }),
);

// Compression middleware
app.use(compression());

// Rate limiter (100 requests per minute)
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});

app.use(limiter);

// Session store middleware (for AdminJS)
app.use(sessionMiddleware);

// Public routes
app.use("/", homeRoutes); // Health check route(s)

// API routes
const apiRouter = express.Router();

apiRouter.use("/parks", parkRoutes);
apiRouter.use("/seasons", seasonRoutes);
apiRouter.use("/export", exportRoutes);
apiRouter.use("/winter-fees", winterSeasonRoutes);
apiRouter.use("/publish", publishRoutes);

app.use("/api", checkJwt, apiRouter);

// AdminJS routes
app.use(admin.options.rootPath, adminRouter);

// error handling middleware
// eslint-disable-next-line no-unused-vars -- required signature for Express error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
});

// start the server
try {
  app.listen(8100, "0.0.0.0", () => {
    console.log("Server listening at http://localhost:8100");
  });
} catch (err) {
  console.error("Error starting server", err);
  throw new Error("Server failed to start");
}
