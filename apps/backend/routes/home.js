import { Router } from "express";

const router = Router();

// http://0.0.0.0:8100/
router.get("/", (req, res) => {
  res.json({ msg: "Dates of Operation Tool" });
});

// http://0.0.0.0:8100/time
router.get("/time", (req, res) => {
  res.json({ time: new Date() });
});

export default router;
