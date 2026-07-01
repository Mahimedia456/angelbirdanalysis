import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import {
  analyzeSatisfactionResponse,
} from "../../services/aiSatisfactionApi";

function normalizeRating(
  value
) {
  const rating =
    String(
      value || "Unknown"
    )
      .trim()
      .toLowerCase();

  if (
    [
      "good",
      "positive",
      "satisfied",
      "very satisfied",
      "excellent",
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
      "poor",
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

function getTicketId(row) {
  return (
    row.ticketId ||
    row.ticket_id ||
    row.ticketNumber ||
    row.ticket_number ||
    "-"
  );
}

function getComment(row) {
  return (
    row.comment ||
    row.comments ||
    row.feedback ||
    ""
  );
}

function getReason(row) {
  return (
    row.reason ||
    row.ratingReason ||
    row.rating_reason ||
    ""
  );
}

function getUpdatedDate(row) {
  return (
    row.updatedDate ||
    row.updated_date ||
    row.responseDate ||
    row.response_date ||
    row.date_display ||
    row.date_key ||
    row.date ||
    "-"
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

  const status =
    String(
      row.solvedStatus ||
      row.solved_status ||
      row.status ||
      ""
    )
      .trim()
      .toLowerCase();

  return [
    "solved",
    "closed",
    "resolved",
    "true",
    "yes",
    "1",
  ].includes(status);
}

function getTeamBadgeClass(
  team
) {
  if (
    team ===
    "Support Team"
  ) {
    return "bg-sky-100 text-sky-800";
  }

  if (
    team ===
    "Backend Team"
  ) {
    return "bg-violet-100 text-violet-800";
  }

  if (
    team === "RMA Team"
  ) {
    return "bg-orange-100 text-orange-800";
  }

  if (
    team ===
    "Product / Hardware Team"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    team ===
    "Customer Feedback"
  ) {
    return "bg-lime-100 text-lime-800";
  }

  return "bg-slate-100 text-slate-600";
}

function getSentimentClass(
  sentiment
) {
  if (
    sentiment === "Positive"
  ) {
    return "bg-lime-100 text-lime-800";
  }

  if (
    sentiment === "Negative"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    sentiment === "Mixed"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-600";
}

function RatingFilterButton({
  active,
  label,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition",

        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <span>
        {label}
      </span>

      <span
        className={[
          "rounded-full px-2 py-0.5 text-[10px]",

          active
            ? "bg-white/15 text-white"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function AiAnalysisModal({
  row,
  onClose,
}) {
  const [
    analysis,
    setAnalysis,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const ticketId =
    getTicketId(row);

  const rating =
    normalizeRating(
      row.rating
    );

  const comment =
    getComment(row);

  const reason =
    getReason(row);

  const solved =
    getSolvedStatus(row);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const result =
        await analyzeSatisfactionResponse({
          ticketId,
          rating,
          comment,
          reason,
          solved,
        });

      setAnalysis(
        result
      );
    } catch (analysisError) {
      setError(
        analysisError.message ||
          "Unable to analyze this satisfaction response."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runAnalysis();
  }, [row]);

  useEffect(() => {
    function handleEscape(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close AI analysis"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <section className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white/95 p-5 backdrop-blur lg:p-7">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-950"
              style={{
                background:
                  "var(--accent-color)",
              }}
            >
              <BrainCircuit
                size={23}
              />
            </div>

            <div className="min-w-0">
              <p className="angel-mini-label">
                AI Satisfaction Analysis
              </p>

              <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                Ticket {ticketId}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comment and reason are analyzed by the AI backend.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 p-5 lg:p-7">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Rating
              </p>

              <p className="mt-2 font-black text-slate-900">
                {rating}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Solved Status
              </p>

              <p className="mt-2 font-black text-slate-900">
                {solved
                  ? "Solved"
                  : "Not Solved"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Updated Date
              </p>

              <p className="mt-2 font-black text-slate-900">
                {getUpdatedDate(
                  row
                )}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Customer Comment
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {comment ||
                  "No comment provided."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Customer Reason
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {reason ||
                  "No reason provided."}
              </p>
            </div>
          </section>

          {loading ? (
            <section className="flex min-h-[250px] items-center justify-center rounded-[24px] border border-sky-200 bg-sky-50 p-8">
              <div className="text-center text-sky-800">
                <Loader2
                  size={36}
                  className="mx-auto animate-spin"
                />

                <p className="mt-4 font-black">
                  AI is analyzing the response
                </p>

                <p className="mt-2 text-sm">
                  Evaluating team ownership, sentiment and recommended action.
                </p>
              </div>
            </section>
          ) : null}

          {!loading &&
          error ? (
            <section className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-black">
                    AI analysis failed
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  runAnalysis
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white"
              >
                <RefreshCw
                  size={16}
                />

                Try Again
              </button>
            </section>
          ) : null}

          {!loading &&
          analysis ? (
            <section className="space-y-5 rounded-[26px] border border-slate-200 bg-slate-50 p-5 lg:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-2 text-xs font-black",
                    getTeamBadgeClass(
                      analysis.team
                    ),
                  ].join(" ")}
                >
                  {analysis.team}
                </span>

                <span
                  className={[
                    "inline-flex rounded-full px-3 py-2 text-xs font-black",
                    getSentimentClass(
                      analysis.sentiment
                    ),
                  ].join(" ")}
                >
                  {analysis.sentiment}
                </span>

                <span className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600">
                  Confidence:{" "}
                  {Math.round(
                    Number(
                      analysis.confidence ||
                        0
                    ) * 100
                  )}
                  %
                </span>
              </div>

              <div className="rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={17}
                    className="text-violet-600"
                  />

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    AI Summary
                  </p>
                </div>

                <p className="mt-3 text-base font-bold leading-7 text-slate-900">
                  {analysis.summary}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Classification Explanation
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {analysis.explanation}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Recommended Action
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {analysis.recommendedAction}
                  </p>
                </div>
              </div>

              {analysis.evidence
                ?.length ? (
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Evidence Used
                  </p>

                  <div className="mt-3 space-y-2">
                    {analysis.evidence.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-1 shrink-0 text-lime-600"
                          />

                          <span>
                            {item}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function SatisfactionReportTable({
  title =
    "Customer Satisfaction Data",

  rows = [],

  preview = false,
}) {
  const [
    ratingFilter,
    setRatingFilter,
  ] = useState("All");

  const [
    selectedRow,
    setSelectedRow,
  ] = useState(null);

  const normalizedRows =
    useMemo(
      () =>
        (
          Array.isArray(rows)
            ? rows
            : []
        ).map((row) => ({
          ...row,

          normalizedRating:
            normalizeRating(
              row.rating
            ),
        })),
      [rows]
    );

  const counts =
    useMemo(() => {
      return normalizedRows.reduce(
        (
          result,
          row
        ) => {
          result.All += 1;

          result[
            row.normalizedRating
          ] =
            (result[
              row.normalizedRating
            ] || 0) + 1;

          return result;
        },
        {
          All: 0,
          Good: 0,
          Bad: 0,
          Unknown: 0,
          Offered: 0,
        }
      );
    }, [normalizedRows]);

  const visibleRows =
    useMemo(() => {
      if (
        ratingFilter ===
        "All"
      ) {
        return normalizedRows;
      }

      return normalizedRows.filter(
        (row) =>
          row.normalizedRating ===
          ratingFilter
      );
    }, [
      normalizedRows,
      ratingFilter,
    ]);

  return (
    <>
      <section className="angel-card overflow-hidden">
        <div className="border-b border-slate-200 p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="angel-mini-label">
                {preview
                  ? "Mapped Preview"
                  : "Satisfaction Data"}
              </p>

              <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                {title}
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                Showing{" "}
                {visibleRows.length} from{" "}
                {normalizedRows.length}{" "}
                customer satisfaction records.
              </p>
            </div>

            {!preview ? (
              <div className="no-print no-export flex flex-wrap gap-2">
                <RatingFilterButton
                  label="All"
                  count={
                    counts.All
                  }
                  active={
                    ratingFilter ===
                    "All"
                  }
                  onClick={() =>
                    setRatingFilter(
                      "All"
                    )
                  }
                />

                <RatingFilterButton
                  label="Good"
                  count={
                    counts.Good
                  }
                  active={
                    ratingFilter ===
                    "Good"
                  }
                  onClick={() =>
                    setRatingFilter(
                      "Good"
                    )
                  }
                />

                <RatingFilterButton
                  label="Bad"
                  count={
                    counts.Bad
                  }
                  active={
                    ratingFilter ===
                    "Bad"
                  }
                  onClick={() =>
                    setRatingFilter(
                      "Bad"
                    )
                  }
                />

                {counts.Unknown >
                0 ? (
                  <RatingFilterButton
                    label="Unknown"
                    count={
                      counts.Unknown
                    }
                    active={
                      ratingFilter ===
                      "Unknown"
                    }
                    onClick={() =>
                      setRatingFilter(
                        "Unknown"
                      )
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1510px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="min-w-[120px] px-4 py-4 font-black">
                  Ticket ID
                </th>

                <th className="min-w-[120px] px-4 py-4 font-black">
                  Rating
                </th>

                <th className="min-w-[380px] px-4 py-4 font-black">
                  Comment
                </th>

                <th className="min-w-[260px] px-4 py-4 font-black">
                  Reason
                </th>

                <th className="min-w-[160px] px-4 py-4 font-black">
                  Updated Date
                </th>

                <th className="min-w-[150px] px-4 py-4 font-black">
                  Solved Status
                </th>

                {!preview ? (
                  <th className="min-w-[190px] px-4 py-4 font-black">
                    AI Analysis
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length ? (
                visibleRows.map(
                  (
                    row,
                    index
                  ) => {
                    const rating =
                      row.normalizedRating;

                    const isSolved =
                      getSolvedStatus(
                        row
                      );

                    return (
                      <tr
                        key={`${
                          getTicketId(
                            row
                          ) ||
                          "ticket"
                        }-${
                          row.id ||
                          index
                        }`}
                        className="bg-white align-top transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {getTicketId(
                            row
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1.5 text-xs font-black",

                              rating ===
                              "Good"
                                ? "bg-lime-100 text-lime-800"
                                : rating ===
                                  "Bad"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {rating}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <span className="block whitespace-normal break-words leading-6">
                            {getComment(
                              row
                            ) || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <span className="block whitespace-normal break-words leading-6">
                            {getReason(
                              row
                            ) || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {getUpdatedDate(
                            row
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1.5 text-xs font-black",

                              isSolved
                                ? "bg-slate-950 text-white"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {isSolved
                              ? "Solved"
                              : "Not Solved"}
                          </span>
                        </td>

                        {!preview ? (
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRow(
                                  row
                                )
                              }
                              disabled={
                                !getComment(
                                  row
                                ) &&
                                !getReason(
                                  row
                                )
                              }
                              className="no-print no-export inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-2.5 text-xs font-black text-violet-800 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <BrainCircuit
                                size={16}
                              />

                              View AI Summary
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={
                      preview
                        ? 6
                        : 7
                    }
                    className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                  >
                    No matching customer satisfaction data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRow ? (
        <AiAnalysisModal
          row={
            selectedRow
          }
          onClose={() =>
            setSelectedRow(
              null
            )
          }
        />
      ) : null}
    </>
  );
}