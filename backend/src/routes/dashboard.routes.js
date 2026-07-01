import { Router } from "express";

import {
  getDashboardData,
} from "../controllers/dashboard.controller.js";

import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  allowRoles(
    "owner",
    "admin",
    "analyst",
    "viewer"
  ),
  getDashboardData
);

export default router;