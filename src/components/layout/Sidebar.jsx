import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  FileSpreadsheet,
  Palette,
  Upload,
} from "lucide-react";

const items = [
  {
    label: "Upload Data",
    to: "/",
    icon: Upload,
    description: "Import CSV and product files",
  },
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: BarChart3,
    description: "KPI, charts and product reporting",
  },
  {
    label: "Reports",
    to: "/reports",
    icon: FileSpreadsheet,
    description: "Printable summaries and pivots",
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Palette,
    description: "Colors and chart mapping",
  },
];

export default function Sidebar() {
  return (
    <aside className="no-print hidden h-fit lg:block">
      <div className="sticky top-[100px] space-y-5">
        <div
          className="overflow-hidden rounded-[34px] p-6 shadow-soft"
          style={{ background: "var(--accent-color)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-slate-900">
            <Boxes size={22} />
          </div>

          <p className="mt-6 angel-mini-label text-slate-700">
            Creative Freedom
          </p>

          <h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.05em] text-slate-950">
            Product reporting without limits.
          </h2>

          <p className="mt-4 text-sm leading-6 text-slate-700">
            Import products, create KPI reporting, analyze stock, categories,
            value and custom pivots.
          </p>
        </div>

        <div className="angel-card p-3">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "group flex gap-3 rounded-2xl px-4 py-4 transition",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <div
                    className={[
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      "bg-white/10 group-hover:bg-white",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black">{item.label}</p>
                    <p
                      className={[
                        "mt-1 text-xs leading-5",
                        "text-current opacity-60",
                      ].join(" ")}
                    >
                      {item.description}
                    </p>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}