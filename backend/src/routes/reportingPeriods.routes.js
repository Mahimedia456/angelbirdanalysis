import { Router } from "express";

import {
  createReportingPeriod,
  listReportingPeriods,
  updateReportingPeriodStatus,
} from "../controllers/reportingPeriods.controller.js";

import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  listReportingPeriods
);

router.post(
  "/",
  allowRoles(
    "owner",
    "admin",
    "analyst"
  ),
  createReportingPeriod
);

router.patch(
  "/:id/status",
  allowRoles(
    "owner",
    "admin"
  ),
  updateReportingPeriodStatus
);

export default router;