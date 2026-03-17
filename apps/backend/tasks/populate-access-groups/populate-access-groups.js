import "../../env.js";

import fs from "node:fs";
import path from "node:path";
import { Op } from "sequelize";
import {
  AccessGroup,
  AccessGroupPark,
  Park,
  User,
  UserAccessGroup,
} from "../../models/index.js";

const jsonPath = path.join(
  import.meta.dirname,
  "agreements-with-usernames.json",
);
const agreements = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

export async function cleanupAccessGroupData(transaction) {
  await AccessGroup.destroy({
    where: {},
    truncate: true,
    cascade: true,
    transaction,
  });
  await AccessGroupPark.destroy({
    where: {},
    truncate: true,
    cascade: true,
    transaction,
  });
  await UserAccessGroup.destroy({
    where: {},
    truncate: true,
    cascade: true,
    transaction,
  });
}

export async function populateAccessGroups() {
  const transaction = await AccessGroup.sequelize.transaction();

  try {
    await cleanupAccessGroupData(transaction);

    for (const agreement of agreements) {
      const accessGroupId = agreement.id;

      // 1 - create AccessGroup based on id and name
      await AccessGroup.upsert(
        {
          id: accessGroupId,
          name: agreement.name,
        },
        { transaction },
      );

      // 2 - find Parks by orcs
      const parks = await Park.findAll({
        where: { orcs: { [Op.in]: agreement.parks.map((park) => park.orcs) } },
        transaction,
      });

      // 3 - create AccessGroupPark relations
      for (const park of parks) {
        await AccessGroupPark.findOrCreate({
          where: {
            accessGroupId,
            parkId: park.id,
          },
          defaults: {
            accessGroupId,
            parkId: park.id,
          },
          transaction,
        });
      }

      // 4 - create User records and relations for users with required details
      const completeUsers = agreement.users.filter((user) => !!user.username);

      for (const user of completeUsers) {
        await User.findOrCreate({
          where: { username: user.username },
          defaults: { name: user.name, email: user.email },
          transaction,
        });

        // 5 - create UserAccessGroup relations for the user
        await UserAccessGroup.findOrCreate({
          where: {
            userId: user.id,
            accessGroupId,
          },
          defaults: {
            userId: user.id,
            accessGroupId,
          },
          transaction,
        });
      }
    }

    await transaction.commit();
    console.log("AccessGroup population complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error populating AccessGroups:", err);
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populateAccessGroups().catch((err) => {
    console.error("Unhandled error in populateAccessGroups:", err);
    throw err;
  });
}
