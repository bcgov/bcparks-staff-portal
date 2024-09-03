import express from "express";
import cors from "cors";
import homeRoutes from "./routes/home.js";
import helloRoute from "./routes/nested-path-example/hello.js";
import ormTestRoutes from "./routes/nested-path-example/orm.js";

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("Required environment variables are not set");
}

const app = express();

// enable CORS
app.use(cors());

// add routes
app.use("/", homeRoutes); // example stuff for testing
app.use("/nested-path-example/", helloRoute); // example stuff for testing
app.use("/nested-path-example/", ormTestRoutes); // example stuff for testing

// start the server
try {
  app.listen(8000, "0.0.0.0", () => {
    console.log("Server listening at http://localhost:8000");
  });
} catch (err) {
  app.log.error(err);
  throw new Error("Server failed to start");
}
