import express from "express";

import {
  getCombinedRmaReports,
  getRmaHealth,
  getSheetRmaReports,
  getUploadedRmaReports,
} from "../controllers/rmaReportsController.js";

const router = express.Router();

router.get("/health", getRmaHealth);

router.get("/uploaded/reports", getUploadedRmaReports);

router.get("/sheet/reports", getSheetRmaReports);

router.get("/combined/reports", getCombinedRmaReports);

export default router;