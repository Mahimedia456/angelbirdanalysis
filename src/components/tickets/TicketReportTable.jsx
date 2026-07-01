import { ArrowDownToLine } from "lucide-react";

function convertToCsv(rows) {
  if (!rows.length) return "";

  const headers = [
    "TSE",
    "Ticket Number",
    "Region",
    "Submitted",
    "Date",
    "Product 1",
    "Product 2",
    "Ticket Subject",
    "Support Category",
    "Product Category",
    "Procedure",
  ];

  const body = rows.map((row) =>
    [
      row.tse,
      row.ticket_number,
      row.region,
      row.submitted,
      row.date_display || row.date,
      row.product_1,
      row.product_2,
      row.ticket_subject,
      row.support_category,
      row.product_category,
      row.procedure,
    ]
      .map(
        (value) =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
      )
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function TicketReportTable({
  title = "Ticket Analytics Table",
  tickets = [],
  preview = false,
}) {
  function exportCsv() {
    const csv = convertToCsv(tickets);

    if (!csv) {
      alert("No tickets to export.");
      return;
    }

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "angelbird-ticket-analytics-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="angel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="angel-mini-label">
            {preview ? "Mapped Preview" : "Ticket Data"}
          </p>

          <h3 className="mt-2 break-words text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            Showing {tickets.length} ticket records.
          </p>
        </div>

        {!preview ? (
          <button
            type="button"
            onClick={exportCsv}
            className="angel-btn angel-btn-dark w-full shrink-0 gap-2 sm:w-auto"
          >
            <ArrowDownToLine size={18} />
            Export Ticket CSV
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1600px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="min-w-[160px] px-5 py-4 font-black">
                Date
              </th>
              <th className="min-w-[130px] px-5 py-4 font-black">
                Ticket #
              </th>
              <th className="min-w-[110px] px-5 py-4 font-black">
                Region
              </th>
              <th className="min-w-[170px] px-5 py-4 font-black">
                TSE
              </th>
              <th className="min-w-[240px] px-5 py-4 font-black">
                Product 1
              </th>
              <th className="min-w-[220px] px-5 py-4 font-black">
                Product 2
              </th>
              <th className="min-w-[220px] px-5 py-4 font-black">
                Support Category
              </th>
              <th className="min-w-[210px] px-5 py-4 font-black">
                Product Category
              </th>
              <th className="min-w-[190px] px-5 py-4 font-black">
                Procedure
              </th>
              <th className="min-w-[360px] px-5 py-4 font-black">
                Subject
              </th>
            </tr>
          </thead>

          <tbody>
            {tickets.length ? (
              tickets.slice(0, 500).map((ticket, index) => (
                <tr
                  key={`${ticket.ticket_number || ticket.date}-${index}`}
                  className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4 font-bold text-slate-700">
                    <span className="block whitespace-normal break-words">
                      {ticket.date_display || ticket.date || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.ticket_number || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.region || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block whitespace-normal break-words">
                      {ticket.tse || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-black text-slate-800">
                    <span className="block whitespace-normal break-words">
                      {ticket.product_1 || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block whitespace-normal break-words">
                      {ticket.product_2 || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className="inline-flex max-w-[260px] whitespace-normal break-words rounded-full px-3 py-1.5 text-xs font-black text-slate-950"
                      style={{ background: "var(--accent-color)" }}
                    >
                      {ticket.support_category || "Unknown"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block whitespace-normal break-words">
                      {ticket.product_category || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block whitespace-normal break-words">
                      {ticket.procedure || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block whitespace-normal break-words leading-6">
                      {ticket.ticket_subject || "-"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="px-5 py-12 text-center text-sm font-bold text-slate-400"
                >
                  No ticket records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}