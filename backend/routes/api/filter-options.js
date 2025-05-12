import { Router } from "express";
import {
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
    const [sections, managementAreas, dateTypes, featureTypes] =
      await Promise.all([
        Section.findAll({
          attributes: ["id", "sectionNumber", "name"],
        }),
        ManagementArea.findAll({
          attributes: ["id", "managementAreaNumber", "name"],
        }),
        DateType.findAll({
          attributes: ["id", "name"],
        }),
        FeatureType.findAll({
          attributes: ["id", "name"],
        }),
      ]);

    // Combine the results into a single object
    const filterOptions = {
      sections,
      managementAreas,
      dateTypes,
      featureTypes,
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
