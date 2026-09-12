import express from "express";

import {
  getCombinedRmaReports,
  getRmaHealth,
  getSheetRmaReports,
  getUploadedRmaReports,
} from "../controllers/rmaReportsController.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
const REPORTING_ROLES = ["owner", "admin", "analyst", "viewer"];

function noStore(_request, response, next) {
  response.set("Cache-Control", "private, no-store, max-age=0");
  response.set("Pragma", "no-cache");
  next();
}

router.get("/health", getRmaHealth);
router.get("/uploaded/reports", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getUploadedRmaReports);
router.get("/sheet/reports", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getSheetRmaReports);
router.get("/combined/reports", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getCombinedRmaReports);

export default router;
