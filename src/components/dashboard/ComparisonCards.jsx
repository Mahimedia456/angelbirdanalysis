import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

function formatChange(value) {
  const number = Number(value || 0);

  if (number > 0) return `+${number.toFixed(1)}%`;
  if (number < 0) return `${number.toFixed(1)}%`;

  return "0%";
}

function getTone(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return {
      icon: ArrowUpRight,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      label: "Increase",
    };
  }

  if (number < 0) {
    return {
      icon: ArrowDownRight,
      className: "bg-red-50 text-red-700 border-red-100",
      label: "Decrease",
    };
  }

  return {
    icon: Minus,
    className: "bg-slate-50 text-slate-600 border-slate-100",
    label: "No change",
  };
}

export default function ComparisonCards({ title = "Comparison", items = [] }) {
  if (!items?.length) {
    return (
      <div className="angel-card p-6">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">
          No comparison data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="angel-card p-6">
      <div className="mb-5">
        <p className="angel-mini-label">Comparison</p>
        <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
          {title}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = getTone(item.changePercent);
          const Icon = tone.icon;

          return (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">Current</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {item.current}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400">Previous</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {item.previous}
                  </p>
                </div>
              </div>

              <div
                className={[
                  "mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black",
                  tone.className,
                ].join(" ")}
              >
                <Icon size={15} />
                {formatChange(item.changePercent)} · {tone.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}