const ZENDESK_TICKET_BASE_URL =
  "https://angelbirds.zendesk.com/agent/tickets";

function cleanText(value) {
  return String(value ?? "").trim();
}

export function extractZendeskTicketId(value) {
  const raw = cleanText(value);

  if (!raw) return "";

  const urlMatch = raw.match(/\/agent\/tickets\/(\d+)/i);

  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  const numericMatch = raw.match(/\b(\d{2,})\b/);

  return numericMatch?.[1] || "";
}

export function buildZendeskTicketUrl(value) {
  const ticketId = extractZendeskTicketId(value);

  if (!ticketId) return "";

  return `${ZENDESK_TICKET_BASE_URL}/${ticketId}`;
}

export function getZendeskTicketDisplay(value) {
  return extractZendeskTicketId(value) || cleanText(value) || "-";
}
