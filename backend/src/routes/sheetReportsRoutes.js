import express from "express";

import {
  getSheetHealth,
  getSheetHomeOverview,
  getSheetReports,
  getSatisfactionNotesWriterStatus,
  patchSatisfactionNotes,
} from "../controllers/sheetReportsController.js";
import { allowRoles, requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
const REPORTING_ROLES = ["owner", "admin", "analyst", "viewer"];
const NOTE_WRITE_ROLES = ["owner", "admin", "analyst"];

function noStore(_request, response, next) {
  response.set("Cache-Control", "private, no-store, max-age=0");
  response.set("Pragma", "no-cache");
  next();
}

router.get("/health", getSheetHealth);
router.get("/overview", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getSheetHomeOverview);
router.get("/reports", requireAuth, allowRoles(...REPORTING_ROLES), noStore, getSheetReports);


router.get(
  "/satisfaction/notes-writer/health",
  requireAuth,
  allowRoles(...NOTE_WRITE_ROLES),
  noStore,
  getSatisfactionNotesWriterStatus
);

router.patch(
  "/satisfaction/notes",
  requireAuth,
  allowRoles(...NOTE_WRITE_ROLES),
  noStore,
  patchSatisfactionNotes
);

export default router;
