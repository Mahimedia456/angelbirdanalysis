import express from "express";

import {
  getSheetHealth,
  getSheetHomeOverview,
  getSheetReports,
} from "../controllers/sheetReportsController.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
const REPORTING_ROLES = ["owner", "admin", "analyst", "viewer"];

function noStore(_request, response, next) {
  response.set("Cache-Control", "private, no-store, max-age=0");
  response.set("Pragma", "no-cache");
  next();
}

router.get("/health", getSheetHealth);
router.get("/overview", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getSheetHomeOverview);
router.get("/reports", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getSheetReports);

export default router;
