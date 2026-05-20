import Papa from "papaparse";

function isEmptyValue(value) {
  return String(value ?? "").trim() === "";
}

function isBadColumnName(column = "") {
  const clean = String(column || "").trim();

  if (!clean) return true;
  if (/^unnamed/i.test(clean)) return true;

  // Your preview showed fake columns: 1,2,3,4,5,6,7,8,9
  // These are usually empty exported spreadsheet helper columns.
  if (/^\d+$/.test(clean)) return true;

  return false;
}

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No CSV file selected."));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) =>
        String(header || "")
          .replace(/\uFEFF/g, "")
          .trim(),
      complete: (result) => {
        const originalRows = result.data || [];
        const originalFields = result.meta?.fields || [];

        const usefulFields = originalFields.filter((field) => {
          if (!field) return false;

          const hasAnyValue = originalRows.some(
            (row) => !isEmptyValue(row[field])
          );

          if (!hasAnyValue) return false;
          if (isBadColumnName(field)) return false;

          return true;
        });

        const rows = originalRows
          .map((row) => {
            const clean = {};

            usefulFields.forEach((field) => {
              clean[field] = row[field];
            });

            return clean;
          })
          .filter((row) =>
            Object.values(row).some(
              (value) => String(value || "").trim() !== ""
            )
          );

        resolve({
          rows,
          fields: usefulFields,
          errors: result.errors || [],
        });
      },
      error: (error) => reject(error),
    });
  });
}

export function normalizeKey(key = "") {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function normalizeRows(rows = []) {
  return rows.map((row) => {
    const clean = {};

    Object.entries(row).forEach(([key, value]) => {
      clean[normalizeKey(key)] = value;
    });

    return clean;
  });
}