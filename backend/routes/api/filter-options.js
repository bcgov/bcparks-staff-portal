import { Router } from "express";
import {
  AccessGroup,
  DateType,
  FeatureType,
  ManagementArea,
  Section,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import * as DATE_TYPE from "../../constants/dateType.js";

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
          attributes: ["id", "strapiDateTypeId", "name"],
          order: [["strapiDateTypeId", "ASC"]],
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

    const groupedDateTypes = [
      {
        label: "Park",
        options: dateTypes.filter((dt) =>
          [
            DATE_TYPE.PARK_GATE_OPEN,
            DATE_TYPE.TIER_1,
            DATE_TYPE.TIER_2,
            DATE_TYPE.WINTER_FEE,
          ].includes(dt.strapiDateTypeId),
        ),
      },
      {
        label: "Facility",
        options: dateTypes.filter((dt) =>
          [
            DATE_TYPE.OPERATION,
            DATE_TYPE.RESERVATION,
            DATE_TYPE.BACKCOUNTRY_REGISTRATION,
          ].includes(dt.strapiDateTypeId),
        ),
      },
    ];

    // Combine the results into a single object
    const filterOptions = {
      sections,
      managementAreas,
      dateTypes: groupedDateTypes,
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
