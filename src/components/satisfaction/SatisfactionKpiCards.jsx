const cards = [
  {
    key: "totalResponses",
    label: "Total Responses",
    valueKey: "totalResponses",
    suffix: "",
  },
  {
    key: "goodCount",
    label: "Good Ratings",
    valueKey: "goodCount",
    percentKey: "goodPercent",
  },
  {
    key: "badCount",
    label: "Bad Ratings",
    valueKey: "badCount",
    percentKey: "badPercent",
  },
  {
    key: "solvedCount",
    label: "Solved Tickets",
    valueKey: "solvedCount",
    percentKey: "solvedPercent",
  },
  {
    key: "notSolvedCount",
    label: "Not Solved",
    valueKey: "notSolvedCount",
    percentKey: "notSolvedPercent",
  },
  {
    key: "commentCount",
    label: "With Comments",
    valueKey: "commentCount",
    percentKey: "commentPercent",
  },
];

export default function SatisfactionKpiCards({ analytics }) {
  const kpis = analytics?.kpis || {};

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.key} className="angel-card p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            {card.label}
          </p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="text-4xl font-black tracking-[-0.06em] text-slate-900">
              {kpis[card.valueKey] ?? 0}
            </p>

            {card.percentKey ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {kpis[card.percentKey] ?? 0}%
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}