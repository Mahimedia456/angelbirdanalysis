import {
  importMonthlyDataset,
} from "../services/import.service.js";

const allowedDatasetTypes = [
  "tickets",
  "products",
  "satisfaction",
];

export async function importDataset(
  request,
  response,
  next
) {
  try {
    const datasetType = String(
      request.body.datasetType || ""
    )
      .trim()
      .toLowerCase();

    const periodKey = String(
      request.body.periodKey || ""
    ).trim();

    if (
      !allowedDatasetTypes.includes(
        datasetType
      )
    ) {
      return response.status(400).json({
        success: false,
        message: "Invalid dataset type.",
      });
    }

    if (!periodKey) {
      return response.status(400).json({
        success: false,
        message:
          "Reporting period is required.",
      });
    }

    let rows = [];
    let columnMapping = {};

    try {
      rows = JSON.parse(
        request.body.rows || "[]"
      );
    } catch {
      return response.status(400).json({
        success: false,
        message:
          "Mapped rows contain invalid JSON.",
      });
    }

    try {
      columnMapping = JSON.parse(
        request.body.columnMapping || "{}"
      );
    } catch {
      columnMapping = {};
    }

    const result =
      await importMonthlyDataset({
        datasetType,
        periodKey,
        rows,
        file: request.file,
        userId: request.profile.id,
        columnMapping,
      });

    return response.status(201).json({
      success: true,
      message: `${datasetType} imported successfully for ${result.period.period_name}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}