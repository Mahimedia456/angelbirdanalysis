import {
  fetchGoogleSheetDataset,
  fetchGoogleSheetOverview,
  getSatisfactionNotesWriterHealth,
  updateSatisfactionNotes,
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

export async function getSatisfactionNotesWriterStatus(req, res, next) {
  try {
    const status = await getSatisfactionNotesWriterHealth();

    res.status(status.ok ? 200 : 503).json(status);
  } catch (error) {
    next(error);
  }
}
export async function patchSatisfactionNotes(req, res, next) {
  try {
    const body = req.body || {};

    const hasInternalNote = Object.prototype.hasOwnProperty.call(
      body,
      "internalNote"
    );

    const hasExternalTeamNote = Object.prototype.hasOwnProperty.call(
      body,
      "externalTeamNote"
    );

    const result = await updateSatisfactionNotes({
      sheetRowNumber: body.sheetRowNumber,
      ticketId: body.ticketId,
      internalNote: body.internalNote,
      externalTeamNote: body.externalTeamNote,
      updateInternalNote: hasInternalNote,
      updateExternalTeamNote: hasExternalTeamNote,
    });

    res.json({
      success: true,
      message: "Satisfaction notes updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
