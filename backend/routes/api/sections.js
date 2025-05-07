import { Router } from "express";
import { Section } from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const sections = await Section.findAll({
      attributes: ["id", "sectionNumber", "sectionName"],
    });

    const output = sections.map((section) => ({
      id: section.id,
      sectionNumber: section.sectionNumber,
      sectionName: section.sectionName,
    }));

    res.json(output);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const section = await Section.findOne({
      where: { id },
      attributes: ["id", "sectionNumber", "sectionName"],
    });

    if (!section) {
      const error = new Error(`Section not found: ${id}`);

      error.status = 404;
      throw error;
    }

    res.json(section);
  }),
);

export default router;
