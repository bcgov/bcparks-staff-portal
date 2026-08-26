import dotenvx from "@dotenvx/dotenvx";

// Load local .env files, if they exist.
dotenvx.config({
  path: ["/app/backend/.env", "/app/backend/.env.local"],
  overload: true,
  // Ignore missing file warnings: files are just for dev
  // and any files loaded will print a success message
  ignore: ["MISSING_ENV_FILE"],
});
