import { Router } from "express";

import {
  analyzeSatisfaction,
} from "../controllers/aiSatisfaction.controller.js";
import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();
const REPORTING_ROLES = ["owner", "admin", "analyst", "viewer"];

function noStore(_request, response, next) {
  response.set("Cache-Control", "private, no-store, max-age=0");
  response.set("Pragma", "no-cache");
  next();
}

router.post(
  "/analyze",
  requireAuth,
  allowRoles(...REPORTING_ROLES),
  noStore,
  analyzeSatisfaction,
);

export default router;
