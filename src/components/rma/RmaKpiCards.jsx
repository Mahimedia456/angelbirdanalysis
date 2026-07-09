import {
  Activity,
  DatabaseZap,
  Globe2,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";

export default function RmaKpiCards({ analytics }) {
  const safeAnalytics = analytics || {};

  const items = [
    {
      label: "Total RMA",
      value: safeAnalytics.totalRma || 0,
      helper: "Filtered RMA records",
      icon: Activity,
    },
   
    {
      label: "RMA Types",
      value: safeAnalytics.byRmaType?.length || 0,
      helper: "Unique RMA categories",
      icon: DatabaseZap,
    },
    {
      label: "Regions",
      value: safeAnalytics.byRegion?.length || 0,
      helper: "Active regions",
      icon: Globe2,
    },
    {
      label: "TSE",
      value: safeAnalytics.byTse?.length || 0,
      helper: "Active TSE members",
      icon: UserRoundCheck,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="angel-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="angel-mini-label">{item.label}</p>

                <h3 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  {Number(item.value || 0).toLocaleString()}
                </h3>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {item.helper}
                </p>
              </div>

              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-900"
                style={{ background: "var(--accent-color)" }}
              >
                <Icon size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}