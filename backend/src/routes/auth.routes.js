import { Router } from "express";

import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
} from "../controllers/auth.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/login",
  login
);

router.post(
  "/refresh",
  refreshSession
);

router.get(
  "/me",
  requireAuth,
  getCurrentUser
);

router.post(
  "/logout",
  requireAuth,
  logout
);

export default router;