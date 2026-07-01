import { Router } from "express";

import {
  getHomeOverview,
} from "../controllers/home.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/overview",
  getHomeOverview
);

export default router;