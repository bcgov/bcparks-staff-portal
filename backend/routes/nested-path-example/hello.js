import { Router } from "express";

const router = Router();

// http://0.0.0.0:8100/nested-path-example/
router.get("/", (req, res) => {
  res.json({ msg: "hello world!" });
});

export default router;
