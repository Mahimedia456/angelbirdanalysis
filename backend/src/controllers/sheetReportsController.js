import {
  fetchGoogleSheetDataset,
  fetchGoogleSheetOverview,
} from "../services/googleSheetsService.js";

export async function getSheetHealth(req, res) {
  res.json({
    ok: true,
    source: "google_sheet",
    message: "Google Sheet module is running.",
    timestamp: new Date().toISOString(),
  });
}

export async function getSheetHomeOverview(req, res, next) {
  try {
    const overview = await fetchGoogleSheetOverview();

    res.json(overview);
  } catch (error) {
    next(error);
  }
}

export async function getSheetReports(req, res, next) {
  try {
    const data = await fetchGoogleSheetDataset();

    res.json({
      ok: true,
      source: "google_sheet",
      sheetId: data.sheetId,
      tabs: data.tabs,
      tickets: data.tickets,
      satisfaction: data.satisfaction,
      summary: data.summary,
    });
  } catch (error) {
    next(error);
  }
}