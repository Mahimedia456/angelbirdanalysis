export default function ProductCategoryCards({ categorySummary = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {categorySummary.map((item) => (
        <div key={item.name} className="angel-card p-5">
          <p className="angel-mini-label">{item.name}</p>

          <h3 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-900">
            {item.value}
          </h3>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            Product count by category
          </p>
        </div>
      ))}
    </div>
  );
}