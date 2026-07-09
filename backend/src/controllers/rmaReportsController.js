import {
  getUploadedRmaReportData,
} from "../services/rmaReportsService.js";

import {
  getSheetRmaReportData,
} from "../services/rmaSheetService.js";

export async function getRmaHealth(req, res) {
  res.json({
    ok: true,
    module: "rma_reports",
    message: "RMA report module is running.",
    timestamp: new Date().toISOString(),
  });
}

export async function getUploadedRmaReports(req, res, next) {
  try {
    const data = await getUploadedRmaReportData();

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSheetRmaReports(req, res, next) {
  try {
    const data = await getSheetRmaReportData();

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getCombinedRmaReports(req, res, next) {
  try {
    const [uploaded, sheet] = await Promise.all([
      getUploadedRmaReportData(),
      getSheetRmaReportData(),
    ]);

    res.json({
      ok: true,
      source: "combined",
      uploaded,
      sheet,
      summary: {
        uploadedRows: uploaded?.summary?.totalRows || 0,
        sheetRows: sheet?.summary?.totalRows || 0,
        totalRows:
          Number(uploaded?.summary?.totalRows || 0) +
          Number(sheet?.summary?.totalRows || 0),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}