import { Router } from "express";
import parkRoutes from "./parks.js";

const router = Router();

// Reuse parks response for the Edit published page API.
router.use("/", parkRoutes);

export default router;
