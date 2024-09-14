import { Router } from "express";

const router = Router();

// http://0.0.0.0:8100/nested-path-example/
router.get("/", (req, res) => {
  console.log("auth:", JSON.stringify(req.auth, null, 2));

  res.json({ msg: "hello world!", authTest: `hello, ${req.auth?.name}!` });
});

export default router;
