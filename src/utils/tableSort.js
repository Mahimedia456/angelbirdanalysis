const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function cleanComparable(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseDateValue(value) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = cleanComparable(value);
  if (!raw) return null;

  const native = Date.parse(raw);
  if (Number.isFinite(native)) {
    return native;
  }

  // Handles values such as 1-Apr-26 / 01-Apr-2026.
  const namedMonth = raw.match(
    /^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$/
  );

  if (namedMonth) {
    const [, day, monthName, yearValue] = namedMonth;
    const year =
      yearValue.length === 2
        ? 2000 + Number(yearValue)
        : Number(yearValue);

    const monthLookup = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };

    const month =
      monthLookup[String(monthName).toLowerCase()];

    if (
      Number.isInteger(month) &&
      Number.isFinite(year)
    ) {
      return new Date(
        year,
        month,
        Number(day)
      ).getTime();
    }
  }

  return null;
}

function compareValues(left, right, type = "text") {
  const leftText = cleanComparable(left);
  const rightText = cleanComparable(right);

  const leftEmpty = !leftText;
  const rightEmpty = !rightText;

  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;

  if (type === "date") {
    const leftDate = parseDateValue(left);
    const rightDate = parseDateValue(right);

    if (leftDate !== null && rightDate !== null) {
      return leftDate - rightDate;
    }

    if (leftDate !== null) return -1;
    if (rightDate !== null) return 1;
  }

  if (type === "number") {
    const leftNumber = Number(
      leftText.replace(/,/g, "")
    );
    const rightNumber = Number(
      rightText.replace(/,/g, "")
    );

    if (
      Number.isFinite(leftNumber) &&
      Number.isFinite(rightNumber)
    ) {
      return leftNumber - rightNumber;
    }
  }

  if (type === "boolean") {
    return Number(Boolean(left)) - Number(Boolean(right));
  }

  return collator.compare(leftText, rightText);
}

export function toggleSort(current, key) {
  if (current?.key === key) {
    return {
      key,
      direction:
        current.direction === "asc" ? "desc" : "asc",
    };
  }

  return {
    key,
    direction: "asc",
  };
}

export function sortTableRows(
  rows = [],
  sortConfig = {},
  columns = {}
) {
  const { key, direction = "asc" } = sortConfig || {};

  if (!key || !columns[key]) {
    return Array.isArray(rows) ? rows : [];
  }

  const column = columns[key];
  const accessor =
    typeof column === "function"
      ? column
      : column.getValue;

  const type =
    typeof column === "function"
      ? "text"
      : column.type || "text";

  if (typeof accessor !== "function") {
    return Array.isArray(rows) ? rows : [];
  }

  const multiplier = direction === "desc" ? -1 : 1;

  return (Array.isArray(rows) ? rows : [])
    .map((row, index) => ({
      row,
      index,
    }))
    .sort((left, right) => {
      const leftValue = accessor(left.row);
      const rightValue = accessor(right.row);

      const leftEmpty =
        leftValue === null ||
        leftValue === undefined ||
        String(leftValue).trim() === "";

      const rightEmpty =
        rightValue === null ||
        rightValue === undefined ||
        String(rightValue).trim() === "";

      // Keep empty values at the bottom in both directions.
      if (leftEmpty && rightEmpty) {
        return left.index - right.index;
      }

      if (leftEmpty) return 1;
      if (rightEmpty) return -1;

      const comparison =
        compareValues(leftValue, rightValue, type);

      if (comparison === 0) {
        return left.index - right.index;
      }

      return comparison * multiplier;
    })
    .map((item) => item.row);
}
