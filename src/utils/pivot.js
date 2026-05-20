function toNumber(value) {
  const clean = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

export function buildPivot(rows = [], rowField, valueField, aggregation = "count") {
  if (!rowField) return [];

  const map = {};

  rows.forEach((row) => {
    const label = String(row[rowField] || "Unknown").trim() || "Unknown";
    const value = valueField ? toNumber(row[valueField]) : 1;

    if (!map[label]) {
      map[label] = {
        name: label,
        count: 0,
        sum: 0,
        min: null,
        max: null,
      };
    }

    map[label].count += 1;
    map[label].sum += value;
    map[label].min = map[label].min === null ? value : Math.min(map[label].min, value);
    map[label].max = map[label].max === null ? value : Math.max(map[label].max, value);
  });

  return Object.values(map)
    .map((item) => {
      let result = item.count;

      if (aggregation === "sum") result = item.sum;
      if (aggregation === "avg") result = item.count ? item.sum / item.count : 0;
      if (aggregation === "min") result = item.min || 0;
      if (aggregation === "max") result = item.max || 0;

      return {
        name: item.name,
        value: Number(result.toFixed(2)),
        count: item.count,
      };
    })
    .sort((a, b) => b.value - a.value);
}