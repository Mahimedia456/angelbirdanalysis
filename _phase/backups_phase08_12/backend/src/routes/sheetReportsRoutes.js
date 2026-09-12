import express from "express";

import {
  getSheetHealth,
  getSheetHomeOverview,
  getSheetReports,
} from "../controllers/sheetReportsController.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/health", getSheetHealth);
router.get("/overview", requireAuth, getSheetHomeOverview);
router.get("/reports", requireAuth, getSheetReports);

export default router;
