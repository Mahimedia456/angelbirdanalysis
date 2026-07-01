import {
  deleteReportingPeriodData,
} from "../services/dataManagement.service.js";

export async function deletePeriodData(
  request,
  response,
  next
) {
  try {
    const periodKey = String(
      request.params.periodKey || ""
    ).trim();

    const confirmation = String(
      request.body?.confirmation || ""
    ).trim();

    const expectedConfirmation =
      `DELETE ${periodKey}`;

    if (
      confirmation !==
      expectedConfirmation
    ) {
      return response.status(400).json({
        success: false,

        message:
          `Confirmation must exactly match: ${expectedConfirmation}`,
      });
    }

    const result =
      await deleteReportingPeriodData({
        periodKey,
        userId:
          request.profile.id,
      });

    return response.json({
      success: true,

      message:
        `${result.period.period_name} data deleted successfully.`,

      data: result,
    });
  } catch (error) {
    next(error);
  }
}