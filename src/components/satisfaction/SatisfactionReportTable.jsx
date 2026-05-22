export default function SatisfactionReportTable({
  title = "Customer Satisfaction Data",
  rows = [],
}) {
  return (
    <section className="angel-card overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <p className="angel-mini-label">Data Table</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Showing {rows.length} satisfaction records.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-4 font-black">
                Ticket ID
              </th>
              <th className="whitespace-nowrap px-4 py-4 font-black">
                Rating
              </th>
              <th className="min-w-[360px] px-4 py-4 font-black">Comment</th>
              <th className="min-w-[260px] px-4 py-4 font-black">Reason</th>
              <th className="whitespace-nowrap px-4 py-4 font-black">
                Updated Date
              </th>
              <th className="whitespace-nowrap px-4 py-4 font-black">
                Solved
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.ticket_id}-${row.id}`} className="bg-white">
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                    {row.ticket_id || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black",
                        row.rating === "Good"
                          ? "bg-lime-100 text-lime-800"
                          : row.rating === "Bad"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {row.rating || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row.comment || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row.reason || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {row.date_key || row.date_display || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black",
                        row.is_solved
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {row.is_solved ? "Solved" : "Not Solved"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                >
                  No satisfaction data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}