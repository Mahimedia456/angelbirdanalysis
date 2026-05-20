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
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function TicketReportTable({
  title = "Ticket Analytics Table",
  tickets = [],
}) {
  function exportCsv() {
    const csv = convertToCsv(tickets);

    if (!csv) {
      alert("No tickets to export.");
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "angelbird-ticket-analytics-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="angel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black tracking-[-0.03em] text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Showing {tickets.length} ticket records.
          </p>
        </div>

        <button onClick={exportCsv} className="angel-btn angel-btn-dark gap-2">
          <ArrowDownToLine size={18} />
          Export Ticket CSV
        </button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1500px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-black">Date</th>
              <th className="px-5 py-4 font-black">Ticket #</th>
              <th className="px-5 py-4 font-black">Region</th>
              <th className="px-5 py-4 font-black">TSE</th>
              <th className="px-5 py-4 font-black">Product 1</th>
              <th className="px-5 py-4 font-black">Product 2</th>
              <th className="px-5 py-4 font-black">Support Category</th>
              <th className="px-5 py-4 font-black">Product Category</th>
              <th className="px-5 py-4 font-black">Procedure</th>
              <th className="px-5 py-4 font-black">Subject</th>
            </tr>
          </thead>

          <tbody>
            {tickets.length ? (
              tickets.slice(0, 500).map((ticket, index) => (
                <tr
                  key={`${ticket.ticket_number || ticket.date}-${index}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-5 py-4 font-bold text-slate-700">
                    {ticket.date_display || ticket.date || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.ticket_number || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.region || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.tse || "-"}
                  </td>

                  <td className="px-5 py-4 font-black text-slate-800">
                    {ticket.product_1 || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.product_2 || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-black text-slate-900"
                      style={{ background: "var(--accent-color)" }}
                    >
                      {ticket.support_category || "Unknown"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.product_category || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.procedure || "-"}
                  </td>

                  <td className="max-w-[380px] truncate px-5 py-4 text-slate-600">
                    {ticket.ticket_subject || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                  No ticket records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}