import express from "express";

import {
  getCombinedRmaReports,
  getRmaHealth,
  getSheetRmaReports,
  getUploadedRmaReports,
} from "../controllers/rmaReportsController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/health", getRmaHealth);
router.get("/uploaded/reports", requireAuth, getUploadedRmaReports);
router.get("/sheet/reports", requireAuth, getSheetRmaReports);
router.get("/combined/reports", requireAuth, getCombinedRmaReports);

export default router;
