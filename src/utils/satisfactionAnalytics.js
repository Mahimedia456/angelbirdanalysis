function safeText(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  return value === undefined ||
    value === null
    ? ""
    : String(value).trim();
}

function normalizeRating(value) {
  const rating = safeText(
    value
  ).toLowerCase();

  if (
    [
      "good",
      "positive",
      "satisfied",
      "very satisfied",
      "excellent",
      "4",
      "5",
    ].includes(rating)
  ) {
    return "Good";
  }

  if (
    [
      "bad",
      "negative",
      "dissatisfied",
      "unsatisfied",
      "very dissatisfied",
      "poor",
      "1",
      "2",
    ].includes(rating)
  ) {
    return "Bad";
  }

  if (
    rating === "offered"
  ) {
    return "Offered";
  }

  return "Unknown";
}

function getRating(row) {
  return normalizeRating(
    row.rating ||
      row.satisfactionRating ||
      row.satisfaction_rating ||
      row.score
  );
}

function getReason(row) {
  return (
    safeText(
      row.reason,
      row.ratingReason,
      row.rating_reason
    ) || "Unknown"
  );
}

function getComment(row) {
  return safeText(
    row.comment,
    row.comments,
    row.feedback
  );
}

function getSolvedStatus(row) {
  if (
    typeof row.isSolved ===
    "boolean"
  ) {
    return row.isSolved;
  }

  if (
    typeof row.is_solved ===
    "boolean"
  ) {
    return row.is_solved;
  }

  const status = safeText(
    row.solvedStatus,
    row.solved_status,
    row.status
  ).toLowerCase();

  return [
    "true",
    "yes",
    "1",
    "solved",
    "closed",
    "resolved",
    "completed",
  ].includes(status);
}

function getResponseDate(row) {
  return safeText(
    row.updatedDate,
    row.updated_date,
    row.responseDate,
    row.response_date,
    row.date,
    row.createdDate,
    row.created_date
  );
}

function normalizeDate(value) {
  const text =
    safeText(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  return "";
}

function groupCount(
  rows,
  getter
) {
  const map = new Map();

  rows.forEach((row) => {
    const label =
      safeText(
        getter(row)
      ) || "Unknown";

    map.set(
      label,
      (map.get(label) || 0) +
        1
    );
  });

  return Array.from(
    map.entries()
  )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    )
    .sort(
      (a, b) =>
        b.value - a.value
    );
}

function buildDailySummary(
  rows
) {
  const map = new Map();

  rows.forEach((row) => {
    const date =
      normalizeDate(
        getResponseDate(row)
      );

    if (!date) {
      return;
    }

    map.set(
      date,
      (map.get(date) || 0) +
        1
    );
  });

  return Array.from(
    map.entries()
  )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
}

function percent(
  value,
  total
) {
  if (!total) {
    return 0;
  }

  return Number(
    (
      (Number(value || 0) /
        total) *
      100
    ).toFixed(1)
  );
}

export function buildSatisfactionAnalytics(
  rows = []
) {
  const safeRows =
    Array.isArray(rows)
      ? rows
      : [];

  const normalizedRows =
    safeRows.map((row) => ({
      ...row,

      rating:
        getRating(row),

      reason:
        getReason(row),

      comment:
        getComment(row),

      updatedDate:
        getResponseDate(row),

      updated_date:
        getResponseDate(row),

      isSolved:
        getSolvedStatus(row),

      is_solved:
        getSolvedStatus(row),

      solvedStatus:
        getSolvedStatus(row)
          ? "Solved"
          : "Not Solved",
    }));

  const totalResponses =
    normalizedRows.length;

  const goodRows =
    normalizedRows.filter(
      (row) =>
        row.rating === "Good"
    );

  const badRows =
    normalizedRows.filter(
      (row) =>
        row.rating === "Bad"
    );

  const offeredRows =
    normalizedRows.filter(
      (row) =>
        row.rating === "Offered"
    );

  const unknownRows =
    normalizedRows.filter(
      (row) =>
        row.rating === "Unknown"
    );

  const solvedRows =
    normalizedRows.filter(
      (row) =>
        row.isSolved
    );

  const notSolvedRows =
    normalizedRows.filter(
      (row) =>
        !row.isSolved
    );

  const commentsRows =
    normalizedRows.filter(
      (row) =>
        Boolean(
          getComment(row)
        )
    );

  const noCommentsRows =
    normalizedRows.filter(
      (row) =>
        !getComment(row)
    );

  const ratingSummary =
    groupCount(
      normalizedRows,
      (row) => row.rating
    );

  const reasonSummary =
    groupCount(
      normalizedRows,
      (row) => row.reason
    );

  const dailySummary =
    buildDailySummary(
      normalizedRows
    );

  const solvedSummary = [
    {
      name: "Solved",
      value:
        solvedRows.length,
    },
    {
      name: "Not Solved",
      value:
        notSolvedRows.length,
    },
  ];

  const commentSummary = [
    {
      name: "With Comment",
      value:
        commentsRows.length,
    },
    {
      name:
        "Without Comment",
      value:
        noCommentsRows.length,
    },
  ];

  return {
    kpis: {
      totalResponses,

      goodCount:
        goodRows.length,

      badCount:
        badRows.length,

      offeredCount:
        offeredRows.length,

      unknownCount:
        unknownRows.length,

      solvedCount:
        solvedRows.length,

      notSolvedCount:
        notSolvedRows.length,

      commentCount:
        commentsRows.length,

      noCommentCount:
        noCommentsRows.length,

      goodPercent: percent(
        goodRows.length,
        totalResponses
      ),

      badPercent: percent(
        badRows.length,
        totalResponses
      ),

      solvedPercent: percent(
        solvedRows.length,
        totalResponses
      ),

      notSolvedPercent:
        percent(
          notSolvedRows.length,
          totalResponses
        ),

      commentPercent:
        percent(
          commentsRows.length,
          totalResponses
        ),
    },

    ratingSummary,
    reasonSummary,
    solvedSummary,
    commentSummary,

    /*
     * Selected reporting period already
     * represents one month, so only the
     * date-wise response trend is needed.
     */
    dailySummary,

    goodRows,
    badRows,
    offeredRows,
    unknownRows,
    solvedRows,
    notSolvedRows,
    commentsRows,
    noCommentsRows,

    normalizedRows,
  };
}