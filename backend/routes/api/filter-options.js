import { Router } from "express";
import {
  AccessGroup,
  DateType,
  FeatureType,
  ManagementArea,
  Section,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Run all queries concurrently
    const [sections, managementAreas, dateTypes, featureTypes, accessGroups] =
      await Promise.all([
        Section.findAll({
          attributes: ["id", "sectionNumber", "name"],
          order: [["name", "ASC"]],
        }),
        ManagementArea.findAll({
          attributes: ["id", "managementAreaNumber", "name"],
          order: [["name", "ASC"]],
        }),
        DateType.findAll({
          attributes: ["id", "name"],
          order: [["name", "ASC"]],
        }),
        FeatureType.findAll({
          attributes: ["id", "name"],
          order: [["name", "ASC"]],
        }),
        AccessGroup.findAll({
          attributes: ["id", "name"],
          order: [["name", "ASC"]],
        }),
      ]);

    // TODO: CMS-1162 - update name in db
    // "Operating" to "Gate" to display
    const editedDateTypes = dateTypes.map((dateType) =>
      dateType.name === "Operating"
        ? { ...dateType.toJSON(), name: "Gate" }
        : dateType,
    );

    // Combine the results into a single object
    const filterOptions = {
      sections,
      managementAreas,
      dateTypes: editedDateTypes,
      featureTypes,
      accessGroups,
    };

    if (!filterOptions) {
      const error = new Error("No filter options found");

      error.status = 404;
      throw error;
    }

    res.json(filterOptions);
  }),
);

export default router;
