import {
  importMonthlyDataset,
} from "../services/import.service.js";

const allowedDatasetTypes = [
  "tickets",
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

    if (
      !allowedDatasetTypes.includes(
        datasetType
      )
    ) {
      return response.status(400).json({
        success: false,
        message:
          "Invalid dataset type. Only tickets and satisfaction are allowed.",
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
          "Rows contain invalid JSON.",
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
        rows,
        file: request.file,
        userId:
          request.profile?.id ||
          null,
        columnMapping,
      });

    return response.status(201).json({
      success: true,
      message: `${datasetType} imported successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}