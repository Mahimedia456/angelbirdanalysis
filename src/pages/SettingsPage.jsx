import ThemeSettings from "../components/settings/ThemeSettings";
import ChartSettings from "../components/settings/ChartSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="angel-section p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
          Settings
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Theme and Chart Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Configure Angelbird colors and map each output to your preferred chart type.
        </p>
      </section>

      <ThemeSettings />
      <ChartSettings />
    </div>
  );
}