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
    const sections = await Section.findAll({
      attributes: ["id", "sectionNumber", "name"],
    });
    const managementAreas = await ManagementArea.findAll({
      attributes: ["id", "managementAreaNumber", "name"],
    });
    const dateTypes = await DateType.findAll({
      attributes: ["id", "name"],
    });
    const featureTypes = await FeatureType.findAll({
      attributes: ["id", "name"],
    });

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
