import {
  analyzeSatisfactionWithAI,
} from "../services/aiSatisfaction.service.js";

export async function analyzeSatisfaction(
  request,
  response,
  next
) {
  try {
    const {
      ticketId,
      rating,
      comment,
      reason,
      solved,
    } = request.body || {};

    const analysis =
      await analyzeSatisfactionWithAI({
        ticketId,
        rating,
        comment,
        reason,
        solved,
      });

    return response.status(200).json({
      success: true,

      message:
        "Satisfaction response analyzed successfully.",

      data:
        analysis,
    });
  } catch (error) {
    next(error);
  }
}