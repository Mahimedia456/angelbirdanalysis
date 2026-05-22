function groupCount(rows, key) {
  const map = {};

  rows.forEach((row) => {
    const label = String(row[key] || "Unknown").trim() || "Unknown";
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function dailyTrend(rows) {
  const map = {};

  rows.forEach((row) => {
    const key = row.date_key || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function monthlyTrend(rows) {
  const map = {};

  rows.forEach((row) => {
    const key = row.month_key || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function percent(value, total) {
  if (!total) return 0;
  return Number(((Number(value || 0) / total) * 100).toFixed(1));
}

export function buildSatisfactionAnalytics(rows = []) {
  const totalResponses = rows.length;

  const goodRows = rows.filter((row) => row.rating === "Good");
  const badRows = rows.filter((row) => row.rating === "Bad");
  const offeredRows = rows.filter((row) => row.rating === "Offered");
  const unknownRows = rows.filter((row) => row.rating === "Unknown");

  const solvedRows = rows.filter((row) => row.is_solved);
  const notSolvedRows = rows.filter((row) => !row.is_solved);

  const commentsRows = rows.filter((row) => row.comment);
  const noCommentsRows = rows.filter((row) => !row.comment);

  const ratingSummary = groupCount(rows, "rating");
  const reasonSummary = groupCount(rows, "reason");
  const dailySummary = dailyTrend(rows);
  const monthlySummary = monthlyTrend(rows);

  const solvedSummary = [
    { name: "Solved", value: solvedRows.length },
    { name: "Not Solved", value: notSolvedRows.length },
  ];

  const commentSummary = [
    { name: "With Comment", value: commentsRows.length },
    { name: "Without Comment", value: noCommentsRows.length },
  ];

  return {
    kpis: {
      totalResponses,
      goodCount: goodRows.length,
      badCount: badRows.length,
      offeredCount: offeredRows.length,
      unknownCount: unknownRows.length,
      solvedCount: solvedRows.length,
      notSolvedCount: notSolvedRows.length,
      commentCount: commentsRows.length,
      noCommentCount: noCommentsRows.length,

      goodPercent: percent(goodRows.length, totalResponses),
      badPercent: percent(badRows.length, totalResponses),
      solvedPercent: percent(solvedRows.length, totalResponses),
      notSolvedPercent: percent(notSolvedRows.length, totalResponses),
      commentPercent: percent(commentsRows.length, totalResponses),
    },

    ratingSummary,
    reasonSummary,
    solvedSummary,
    commentSummary,
    dailySummary,
    monthlySummary,

    goodRows,
    badRows,
    solvedRows,
    notSolvedRows,
    commentsRows,
    noCommentsRows,
  };
}