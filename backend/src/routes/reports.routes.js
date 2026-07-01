import { Router } from "express";

import {
  getReportsData,
} from "../controllers/reports.controller.js";

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
  getReportsData
);

export default router;