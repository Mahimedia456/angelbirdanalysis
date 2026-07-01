import { Router } from "express";
import multer from "multer";

import {
  importDataset,
} from "../controllers/imports.controller.js";

import {
  allowRoles,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter(request, file, callback) {
    const isCsv =
      file.originalname
        .toLowerCase()
        .endsWith(".csv") ||
      [
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
      ].includes(file.mimetype);

    if (!isCsv) {
      return callback(
        new Error(
          "Only CSV files are allowed."
        )
      );
    }

    callback(null, true);
  },
});

router.post(
  "/monthly",
  requireAuth,
  allowRoles("owner", "admin"),
  upload.single("file"),
  importDataset
);

export default router;