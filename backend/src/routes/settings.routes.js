import {
  Router,
} from "express";

import {
  getUiSettings,
  updateUiSettings,
} from "../controllers/settings.controller.js";

import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/ui",
  requireAuth,
  allowRoles(
    "owner",
    "admin",
    "analyst",
    "viewer"
  ),
  getUiSettings
);

router.put(
  "/ui",
  requireAuth,
  allowRoles(
    "owner",
    "admin"
  ),
  updateUiSettings
);

export default router;