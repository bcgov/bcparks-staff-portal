import { Router } from "express";

const router = Router();

// http://0.0.0.0:8000/
router.get("/", (req, res) => {
  res.json({ msg: "this is the home route" });
});

// http://0.0.0.0:8000/time
router.get("/time", (req, res) => {
  res.json({ time: new Date() });
});

export default router;
