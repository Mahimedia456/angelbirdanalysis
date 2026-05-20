export default function SummaryTable({ title, data = [] }) {
  return (
    <div className="angel-card overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">Top summary records.</p>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-black">Name</th>
              <th className="px-5 py-3 font-black">Value</th>
            </tr>
          </thead>

          <tbody>
            {data.length ? (
              data.slice(0, 12).map((item, index) => (
                <tr key={`${item.name}-${index}`} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold text-slate-700">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.value}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="px-5 py-6 text-center text-slate-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}