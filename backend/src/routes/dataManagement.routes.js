import { Router } from "express";

import {
  deletePeriodData,
} from "../controllers/dataManagement.controller.js";

import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.delete(
  "/period/:periodKey",
  requireAuth,
  allowRoles("owner", "admin"),
  deletePeriodData
);

export default router;