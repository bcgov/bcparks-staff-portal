import { Router } from "express";

const router = Router();

// http://0.0.0.0:8000/nested-path-example/
router.get("/", (req, res) => {
  res.json({ msg: "hello world!" });
});

export default router;
