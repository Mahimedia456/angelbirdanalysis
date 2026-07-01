import {
  fetchMonthlyReportData,
} from "../services/reportData.service.js";

export async function getReportsData(
  request,
  response,
  next
) {
  try {
    const periodKey = String(
      request.query.period || ""
    ).trim();

    const data =
      await fetchMonthlyReportData(
        periodKey
      );

    return response.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}