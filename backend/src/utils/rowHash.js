import crypto from "node:crypto";

function normalizeValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

export function createRowHash(datasetType, row) {
  const ignoredKeys = new Set([
    "id",
    "period_id",
    "import_batch_id",
    "created_by",
    "created_at",
    "updated_at",
    "source_row_number",
    "row_hash",
  ]);

  const normalized = Object.entries(row || {})
    .filter(([key]) => !ignoredKeys.has(key))
    .sort(([left], [right]) =>
      left.localeCompare(right)
    )
    .map(([key, value]) => [
      key,
      normalizeValue(value),
    ]);

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        datasetType,
        normalized,
      })
    )
    .digest("hex");
}

export function createFileChecksum(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}