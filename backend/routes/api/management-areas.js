import { Router } from "express";
import { ManagementArea, Section } from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const managementAreas = await ManagementArea.findAll({
      attributes: ["id", "managementAreaNumber", "managementAreaName"],
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["id", "sectionNumber", "sectionName"],
        },
      ],
    });

    const output = managementAreas.map((m) => ({
      id: m.id,
      managementAreaNumber: m.managementAreaNumber,
      managementAreaName: m.managementAreaName,
      section: m.section
        ? {
            id: m.section.id,
            sectionNumber: m.section.sectionNumber,
            sectionName: m.section.sectionName,
          }
        : null,
    }));

    res.json(output);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const managementArea = await ManagementArea.findOne({
      where: { id },
      attributes: ["id", "managementAreaNumber", "managementAreaName"],
      include: [
        {
          model: Section,
          as: "section",
          attributes: ["id", "sectionNumber", "sectionName"],
        },
      ],
    });

    if (!managementArea) {
      const error = new Error(`Management Area not found: ${id}`);

      error.status = 404;
      throw error;
    }

    res.json(managementArea);
  }),
);

export default router;
