export function cleanRegion(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeRegionLabel(value = "") {
  const clean = cleanRegion(value);

  if (!clean) return "";

  if (clean.toUpperCase() === "NA") {
    return "UAE";
  }

  return clean;
}

export function normalizeRegionKey(value = "") {
  return normalizeRegionLabel(value).toLowerCase();
}
