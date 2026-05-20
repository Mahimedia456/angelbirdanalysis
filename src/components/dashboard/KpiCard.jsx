export default function KpiCard({ label, value, helper }) {
  return (
    <div
      className="rounded-3xl border border-slate-200 p-5 shadow-soft"
      style={{ background: "var(--kpi-color)" }}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <h3 className="mt-4 text-4xl font-black text-slate-900">{value}</h3>

      {helper ? <p className="mt-3 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}