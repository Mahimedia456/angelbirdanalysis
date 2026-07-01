import {
  apiRequest,
} from "./apiClient";

export async function analyzeSatisfactionResponse({
  ticketId,
  rating,
  comment,
  reason,
  solved,
}) {
  const response =
    await apiRequest(
      "/ai/satisfaction/analyze",
      {
        method: "POST",

        body: {
          ticketId,
          rating,
          comment,
          reason,
          solved,
        },
      }
    );

  return (
    response?.data ||
    response
  );
}