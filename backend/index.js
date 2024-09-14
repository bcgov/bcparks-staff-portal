import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import RateLimit from "express-rate-limit";
import checkJwt from "./middleware/checkJwt.js";

import homeRoutes from "./routes/home.js";
import helloRoute from "./routes/nested-path-example/hello.js";
import ormTestRoutes from "./routes/nested-path-example/orm.js";

if (!process.env.PG_CONNECTION_STRING) {
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
app.use(helmet());

// Compression middleware
app.use(compression());

// Rate limiter (100 requests per minute)
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});

app.use(limiter);

// Public routes
app.use("/", homeRoutes); // example stuff for testing

// Routes with JWT check middleware
app.use("/nested-path-example/", checkJwt, ormTestRoutes); // example stuff for testing
app.use("/nested-path-example/", checkJwt, helloRoute); // example stuff for testing

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
