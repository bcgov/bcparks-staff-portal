import { Router } from "express";
import asyncHandler from "express-async-handler";
import { User, AccessGroup } from "../../models/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Respopnd with the user object from the DB
    res.json(req.user);
  }),
);

router.get(
  "/:email",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      where: { email: req.params.email },
      include: [
        {
          model: AccessGroup,
          as: "accessGroups",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const output = {
      id: user.id,
      name: user.name,
      email: user.email,
      accessGroups: user.accessGroups.map((ag) => ({
        id: ag.id,
        name: ag.name,
      })),
    };

    return res.json(output);
  }),
);

export default router;
