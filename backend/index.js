import http from "http";
import pgp from "pg-promise";

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("Required environment variables are not set");
}

const db = pgp()(process.env.PG_CONNECTION_STRING);

const server = http.createServer(async (req, res) => {
  const dbRecords = await db.any("SELECT * FROM example_table");

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ hello: "world", time: new Date(), dbRecords }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
