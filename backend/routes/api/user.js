import { Router } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Respopnd with the user object from the DB
    res.json(req.user);
  }),
);

export default router;
