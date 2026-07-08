import express from "express";

import {
  getSheetHealth,
  getSheetHomeOverview,
  getSheetReports,
} from "../controllers/sheetReportsController.js";

const router = express.Router();

router.get("/health", getSheetHealth);
router.get("/overview", getSheetHomeOverview);
router.get("/reports", getSheetReports);

export default router;