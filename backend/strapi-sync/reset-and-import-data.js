import { exec } from "node:child_process";
import { syncData, oneTimeDataImport } from "./sync.js";
import { createSingleItemsCampgrounds } from "./create-single-item-campgrounds.js";
import { createMultipleItemsCampgrounds } from "./create-multiple-item-campgrounds.js";
import { createMissingDatesAndSeasons } from "./create-missing-dates-and-seasons.js";

function resetDatabase() {
  return new Promise((resolve, reject) => {
    exec(
      `npx sequelize-cli db:drop && npx sequelize-cli db:create && npx sequelize-cli db:migrate`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return reject(stderr);
        }
        console.log(`Stdout: ${stdout}`);
        return resolve(stdout);
      },
    );
  });
}

export async function importData() {
  await syncData();
  await oneTimeDataImport();
  await createSingleItemsCampgrounds();
  await createMultipleItemsCampgrounds();
  await createMissingDatesAndSeasons();
}

export async function resetScript() {
  await resetDatabase();

  await importData();
  console.log("calling resetDatabase");
}
