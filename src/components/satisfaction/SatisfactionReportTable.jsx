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
  MessageSquareText,
  PencilLine,
  RefreshCw,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { analyzeSatisfactionResponse } from "../../services/aiSatisfactionApi";
import { updateSatisfactionNotes } from "../../services/sheetReportsApi";
import ZendeskTicketLink from "../common/ZendeskTicketLink";

function normalizeRating(value) {
  const rating = String(value || "Unknown")
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

  if (rating === "offered") return "Offered";

  return "Unknown";
}

function getTicketId(row) {
  return (
    row?.ticketId ||
    row?.ticket_id ||
    row?.ticketNumber ||
    row?.ticket_number ||
    "-"
  );
}

function getComment(row) {
  return (
    row?.comment ||
    row?.comments ||
    row?.feedback ||
    row?.satisfactionComment ||
    row?.satisfaction_comment ||
    ""
  );
}

function getReason(row) {
  return (
    row?.reason ||
    row?.ratingReason ||
    row?.rating_reason ||
    ""
  );
}

function getInternalNote(row) {
  return (
    row?.internalNote ||
    row?.internal_note ||
    row?.internalTeamNote ||
    row?.internal_team_note ||
    ""
  );
}

function getExternalTeamNote(row) {
  return (
    row?.externalTeamNote ||
    row?.external_team_note ||
    row?.externalNote ||
    row?.external_note ||
    ""
  );
}

function getSheetRowNumber(row) {
  return (
    row?.sheet_row_number ||
    row?.sheetRowNumber ||
    row?.row_number ||
    null
  );
}

function getUpdatedDate(row) {
  return (
    row?.updatedDate ||
    row?.updated_date ||
    row?.responseDate ||
    row?.response_date ||
    row?.date_display ||
    row?.date_key ||
    row?.date ||
    "-"
  );
}

function getSolvedStatus(row) {
  if (typeof row?.isSolved === "boolean") return row.isSolved;
  if (typeof row?.is_solved === "boolean") return row.is_solved;

  const status = String(
    row?.solvedStatus ||
      row?.solved_status ||
      row?.status ||
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

function rowKey(row) {
  return `${getSheetRowNumber(row) || "row"}:${getTicketId(row)}`;
}

function getTeamBadgeClass(team) {
  if (team === "Support Team") return "bg-sky-100 text-sky-800";
  if (team === "Backend Team") return "bg-violet-100 text-violet-800";
  if (team === "RMA Team") return "bg-orange-100 text-orange-800";
  if (team === "Product / Hardware Team") return "bg-amber-100 text-amber-800";
  if (team === "Customer Feedback") return "bg-lime-100 text-lime-800";
  return "bg-slate-100 text-slate-600";
}

function getSentimentClass(sentiment) {
  if (sentiment === "Positive") return "bg-lime-100 text-lime-800";
  if (sentiment === "Negative") return "bg-red-100 text-red-700";
  if (sentiment === "Mixed") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function ContextBlock({ label, value, emptyLabel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
        {value || emptyLabel}
      </p>
    </div>
  );
}

function AiAnalysisModal({ row, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ticketId = getTicketId(row);
  const rating = normalizeRating(row?.rating);
  const comment = getComment(row);
  const reason = getReason(row);
  const internalNote = getInternalNote(row);
  const externalTeamNote = getExternalTeamNote(row);
  const solved = getSolvedStatus(row);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const result = await analyzeSatisfactionResponse({
        ticketId,
        rating,
        comment,
        reason,
        solved,
        internalNote,
        externalTeamNote,
      });

      setAnalysis(result);
    } catch (analysisError) {
      setError(
        analysisError?.message ||
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
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
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

      <section className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/20 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white/95 p-5 backdrop-blur lg:p-7">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-950"
              style={{ background: "var(--accent-color)" }}
            >
              <BrainCircuit size={23} />
            </div>

            <div className="min-w-0">
              <p className="angel-mini-label">AI Satisfaction Analysis</p>

              <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                Ticket <ZendeskTicketLink value={ticketId} />
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                AI combines available customer feedback, internal context and external team notes.
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
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Rating
              </p>
              <p className="mt-2 font-black text-slate-900">{rating}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Updated Date
              </p>
              <p className="mt-2 font-black text-slate-900">{getUpdatedDate(row)}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <ContextBlock
              label="Customer Feedback"
              value={comment || reason}
              emptyLabel="No customer feedback provided."
            />
            <ContextBlock
              label="Internal Team Note"
              value={internalNote}
              emptyLabel="No internal note provided."
            />
            <ContextBlock
              label="External Team Note"
              value={externalTeamNote}
              emptyLabel="No external team note provided."
            />
          </section>

          {reason && reason !== comment ? (
            <ContextBlock
              label="Customer Reason"
              value={reason}
              emptyLabel="No reason provided."
            />
          ) : null}

          {loading ? (
            <section className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-sky-200 bg-sky-50 p-8">
              <div className="text-center text-sky-800">
                <Loader2 size={36} className="mx-auto animate-spin" />
                <p className="mt-4 font-black">Mahimedia System analyzing the response</p>
                <p className="mt-2 text-sm">
                  Synthesizing customer feedback and available team context.
                </p>
              </div>
            </section>
          ) : null}

          {!loading && error ? (
            <section className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-black">AI analysis failed</p>
                  <p className="mt-1 text-sm leading-6">{error}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={runAnalysis}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </section>
          ) : null}

          {!loading && analysis ? (
            <section className="space-y-5 rounded-[26px] border border-slate-200 bg-slate-50 p-5 lg:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-2 text-xs font-black",
                    getTeamBadgeClass(analysis.team),
                  ].join(" ")}
                >
                  {analysis.team}
                </span>

                <span
                  className={[
                    "inline-flex rounded-full px-3 py-2 text-xs font-black",
                    getSentimentClass(analysis.sentiment),
                  ].join(" ")}
                >
                  {analysis.sentiment}
                </span>

                <span className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600">
                  Confidence: {Math.round(Number(analysis.confidence || 0) * 100)}%
                </span>
              </div>

              <div className="rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} className="text-violet-600" />
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

              {analysis.evidence?.length ? (
                <div className="rounded-2xl bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Evidence Used
                  </p>
                  <div className="mt-4 space-y-3">
                    {analysis.evidence.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-1 shrink-0 text-lime-600"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
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

function NoteEditorModal({
  row,
  field,
  initialValue,
  onClose,
  onSaved,
}) {
  const [value, setValue] = useState(initialValue || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isInternal = field === "internalNote";
  const label = isInternal ? "Internal Note" : "External Team Note";

  async function saveNote() {
    setSaving(true);
    setError("");

    try {
      const payload = {
        ticketId: getTicketId(row),
        sheetRowNumber: getSheetRowNumber(row),
        [field]: value,
      };

      await updateSatisfactionNotes(payload);
      await onSaved(value);
      onClose();
    } catch (saveError) {
      setError(
        saveError?.message ||
          `Unable to save ${label.toLowerCase()}.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={`Close ${label} editor`}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <section className="relative z-10 w-full max-w-2xl rounded-[28px] border border-white/20 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="angel-mini-label">Satisfaction Notes</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
              {label}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ticket <ZendeskTicketLink value={getTicketId(row)} /> · saved to reporting data.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`Write ${label.toLowerCase()}...`}
          className="mt-6 min-h-[180px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
        />

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="angel-btn border border-slate-200 bg-white text-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveNote}
            disabled={saving}
            className="angel-btn angel-btn-dark gap-2"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </section>
    </div>
  );
}

function NoteCell({ value, label, canWrite, onEdit }) {
  if (!value) {
    return canWrite ? (
      <button
        type="button"
        onClick={onEdit}
        className="no-print no-export inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-[11px] font-black leading-4 text-slate-700 transition hover:border-slate-300 hover:bg-white"
      >
        <MessageSquareText size={15} />
        Write {label}
      </button>
    ) : (
      <span className="text-slate-400">-</span>
    );
  }

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
        {value}
      </p>

      {canWrite ? (
        <button
          type="button"
          onClick={onEdit}
          className="no-print no-export inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-slate-950"
        >
          <PencilLine size={13} />
          Edit
        </button>
      ) : null}
    </div>
  );
}

export default function SatisfactionReportTable({
  title = "Customer Satisfaction Data",
  rows = [],
  preview = false,
  onRowUpdated,
}) {
  const { hasRole } = useAuth();
  const canWriteNotes = !preview && hasRole("owner", "admin", "analyst");

  const [selectedRow, setSelectedRow] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [ratingView, setRatingView] = useState("Good");
  const [rowOverrides, setRowOverrides] = useState({});

  const normalizedRows = useMemo(
    () =>
      (Array.isArray(rows) ? rows : []).map((row) => {
        const merged = {
          ...row,
          ...(rowOverrides[rowKey(row)] || {}),
        };

        return {
          ...merged,
          normalizedRating: normalizeRating(merged.rating),
        };
      }),
    [rows, rowOverrides]
  );

  const visibleRows = useMemo(() => {
    if (ratingView === "All") return normalizedRows;

    return normalizedRows.filter(
      (row) => row.normalizedRating === ratingView
    );
  }, [normalizedRows, ratingView]);

  async function handleSavedNote(row, field, value) {
    const patch =
      field === "internalNote"
        ? {
            internalNote: value,
            internal_note: value,
          }
        : {
            externalTeamNote: value,
            external_team_note: value,
          };

    const key = rowKey(row);

    setRowOverrides((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...patch,
      },
    }));

    setSelectedRow((current) =>
      current && rowKey(current) === key
        ? { ...current, ...patch }
        : current
    );

    onRowUpdated?.(row, patch);
  }

  return (
    <>
      <section className="angel-card overflow-hidden">
        <div className="border-b border-slate-200 p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="angel-mini-label">
                {preview ? "Mapped Preview" : "Satisfaction Data"}
              </p>

              <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                {title}
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                Showing {visibleRows.length} customer satisfaction records.
              </p>
            </div>

            {!preview ? (
              <div className="no-print no-export flex flex-wrap gap-2">
                {["Good", "Bad", "All"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRatingView(option)}
                    className={[
                      "rounded-full px-4 py-2.5 text-xs font-black transition",
                      ratingView === option
                        ? "text-slate-950 shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                    ].join(" ")}
                    style={
                      ratingView === option
                        ? { background: "var(--accent-color)" }
                        : undefined
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left text-[13px] xl:text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="w-[7%] px-2.5 py-4 font-black xl:px-3">Ticket ID</th>
                <th className="w-[8%] px-2.5 py-4 font-black xl:px-3">Date</th>
                <th className="w-[27%] px-3 py-4 font-black">Comment</th>
                <th className="w-[7%] px-2.5 py-4 font-black xl:px-3">Rating</th>
                <th className="w-[19%] px-3 py-4 font-black">Internal Note</th>
                <th className="w-[19%] px-3 py-4 font-black">External Team Note</th>
                {!preview ? (
                  <th className="w-[13%] px-3 py-4 font-black">AI Summary</th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length ? (
                visibleRows.map((row, index) => {
                  const rating = row.normalizedRating;
                  const internalNote = getInternalNote(row);
                  const externalTeamNote = getExternalTeamNote(row);
                  const hasAiContext = Boolean(
                    getComment(row) ||
                      getReason(row) ||
                      internalNote ||
                      externalTeamNote
                  );

                  return (
                    <tr
                      key={`${rowKey(row)}-${row.id || index}`}
                      className="bg-white align-top transition hover:bg-slate-50/70"
                    >
                      <td className="px-2.5 py-4 font-bold text-slate-900 xl:px-3">
                        <ZendeskTicketLink value={getTicketId(row)} />
                      </td>

                      <td className="px-2.5 py-4 text-slate-600 xl:px-3">
                        {getUpdatedDate(row)}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        <span className="block whitespace-normal break-words leading-6">
                          {getComment(row) || "-"}
                        </span>
                      </td>

                      <td className="px-2.5 py-4 xl:px-3">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1.5 text-xs font-black",
                            rating === "Good"
                              ? "bg-lime-100 text-lime-800"
                              : rating === "Bad"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {rating}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <NoteCell
                          value={internalNote}
                          label="Internal Note"
                          canWrite={canWriteNotes}
                          onEdit={() =>
                            setEditingNote({
                              row,
                              field: "internalNote",
                              value: internalNote,
                            })
                          }
                        />
                      </td>

                      <td className="px-3 py-4">
                        <NoteCell
                          value={externalTeamNote}
                          label="External Team Note"
                          canWrite={canWriteNotes}
                          onEdit={() =>
                            setEditingNote({
                              row,
                              field: "externalTeamNote",
                              value: externalTeamNote,
                            })
                          }
                        />
                      </td>

                      {!preview ? (
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            disabled={!hasAiContext}
                            className="no-print no-export inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-xl bg-black px-2.5 py-2.5 text-left text-[11px] font-black leading-4 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            <BrainCircuit size={16} />
                            View AI Summary
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={preview ? 6 : 7}
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
          row={{
            ...selectedRow,
            ...(rowOverrides[rowKey(selectedRow)] || {}),
          }}
          onClose={() => setSelectedRow(null)}
        />
      ) : null}

      {editingNote ? (
        <NoteEditorModal
          row={editingNote.row}
          field={editingNote.field}
          initialValue={editingNote.value}
          onClose={() => setEditingNote(null)}
          onSaved={(value) =>
            handleSavedNote(
              editingNote.row,
              editingNote.field,
              value
            )
          }
        />
      ) : null}
    </>
  );
}
