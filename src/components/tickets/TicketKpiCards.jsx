import {
  Activity,
  ClipboardCheck,
  DatabaseZap,
  FileWarning,
  HardDrive,
  HelpCircle,
  Layers3,
  RefreshCcw,
} from "lucide-react";

const iconMap = {
  totalTickets: Activity,
  dataRecoveryCount: DatabaseZap,
  rmaCount: RefreshCcw,
  troubleshootCount: HelpCircle,
  registrationCount: ClipboardCheck,
  hardwareCount: HardDrive,
  firmwareCount: FileWarning,
  totalProductCategories: Layers3,
};

export default function TicketKpiCards({ analytics }) {
  const items = [
    {
      key: "totalTickets",
      label: "Total Tickets",
      value: analytics.kpis.totalTickets,
      helper: "Filtered ticket rows",
    },
    {
      key: "dataRecoveryCount",
      label: "Data Recovery",
      value: analytics.kpis.dataRecoveryCount,
      helper: "Data recovery / DR tickets",
    },
    {
      key: "rmaCount",
      label: "RMA",
      value: analytics.kpis.rmaCount,
      helper: "RMA related tickets",
    },
    {
      key: "troubleshootCount",
      label: "Troubleshooting",
      value: analytics.kpis.troubleshootCount,
      helper: "Troubleshooting cases",
    },
    {
      key: "registrationCount",
      label: "Registration",
      value: analytics.kpis.registrationCount,
      helper: "Registration support",
    },
    {
      key: "hardwareCount",
      label: "Hardware Issue",
      value: analytics.kpis.hardwareCount,
      helper: "Hardware issue cases",
    },
    {
      key: "firmwareCount",
      label: "Firmware",
      value: analytics.kpis.firmwareCount,
      helper: "Firmware related tickets",
    },
    {
      key: "totalProductCategories",
      label: "Product Categories",
      value: analytics.kpis.totalProductCategories,
      helper: "Unique product categories",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = iconMap[item.key] || Activity;

        return (
          <div key={item.key} className="angel-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="angel-mini-label">{item.label}</p>

                <h3 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  {item.value}
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