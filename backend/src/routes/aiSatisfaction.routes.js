import {
  Router,
} from "express";

import {
  analyzeSatisfaction,
} from "../controllers/aiSatisfaction.controller.js";

/*
 * Apne project ka existing auth middleware
 * available ho to yahan import karo:
 *
 * import { requireAuth } from "../middleware/auth.middleware.js";
 */

const router =
  Router();

/*
 * Auth middleware ho to:
 *
 * router.post(
 *   "/analyze",
 *   requireAuth,
 *   analyzeSatisfaction
 * );
 */

router.post(
  "/analyze",
  analyzeSatisfaction
);

export default router;