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

const jsonPath = path.join(import.meta.dirname, "agreement.json");
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
    // turn it on if you want to clean up existing data before populating
    await cleanupAccessGroupData(transaction);

    for (const agreement of agreements) {
      // 1 - create AccessGroup based on id and name
      const [accessGroup] = await AccessGroup.findOrCreate({
        where: { id: agreement.id },
        defaults: { name: agreement.agreement },
        transaction,
      });

      // 2 - find Parks by orcs
      const parks = await Park.findAll({
        where: { orcs: { [Op.in]: agreement.orcs } },
        transaction,
      });

      // 3 - create AccessGroupPark relations
      for (const park of parks) {
        await AccessGroupPark.findOrCreate({
          where: {
            // id: park.id,
            accessGroupId: accessGroup.id,
            parkOrcs: park.orcs,
          },
          defaults: {
            // id: park.id,
            accessGroupId: accessGroup.id,
            parkOrcs: park.orcs,
          },
          transaction,
        });
      }

      // 4 - create User based on contactEmails and contactNames
      // 5 - create UserAccessGroup relations
      const emails = Array.isArray(agreement.contactEmails)
        ? agreement.contactEmails
        : [];
      const names = Array.isArray(agreement.contactNames)
        ? agreement.contactNames
        : [];

      // if no email, skip User creation
      if (emails.length === 0) continue;
      // only emails exist
      else if (emails.length > 0 && names.length === 0) {
        for (const email of emails) {
          const [user] = await User.findOrCreate({
            where: { email },
            defaults: { name: null, email },
            transaction,
          });

          await UserAccessGroup.findOrCreate({
            where: {
              // id: user.id,
              userEmail: user.email,
              accessGroupId: accessGroup.id,
            },
            defaults: {
              // id: user.id,
              userEmail: user.email,
              accessGroupId: accessGroup.id,
            },
            transaction,
          });
        }
      }

      // both emails and names exist, use matching logic
      else {
        const userNameMap = {};

        // if only one email and one name, map them directly
        // e.g. "contactEmails": ["jane@email.com"], "contactNames": ["Jane Doe"]
        // User {email: "jane@email.com", name: "Jane Doe"}
        if (emails.length === 1 && names.length === 1) {
          userNameMap[emails[0]] = names[0];

          // if multiple emails and one name, map all emails to that name
          // e.g. "contactEmails": ["jane@email.com", "john@email.com"], "contactNames": ["Jane Doe"]
          // User {email: "jane@email.com", name: "Jane Doe"}
          // User {email: "john@email.com", name: "Jane Doe"}
        } else if (emails.length > 1 && names.length === 1) {
          for (const email of emails) {
            userNameMap[email] = names[0];
          }

          // if multiple emails and names, set names to empty
          // e.g. "contactEmails": ["jane@email.com", "john@email.com"], "contactNames": ["Jane Doe", "Alice", "John Smith"]
          // User {email: "jane@email.com", name: ""}
          // User {email: "john@email.com", name: ""}
        } else {
          for (const email of emails) {
            userNameMap[email] = "";
          }
        }

        for (const email of emails) {
          const [user] = await User.findOrCreate({
            where: { email },
            defaults: { name: userNameMap[email] || null, email },
            transaction,
          });

          await UserAccessGroup.findOrCreate({
            where: {
              // id: user.id,
              userEmail: user.email,
              accessGroupId: accessGroup.id,
            },
            defaults: {
              // id: user.id,
              userEmail: user.email,
              accessGroupId: accessGroup.id,
            },
            transaction,
          });
        }
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
