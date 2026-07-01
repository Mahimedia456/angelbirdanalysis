import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Palette,
  Save,
  Settings2,
} from "lucide-react";

import ThemeSettings, {
  DEFAULT_THEME,
} from "../components/settings/ThemeSettings";

import ChartSettings, {
  DEFAULT_CHART_COLORS,
  DEFAULT_CHART_SETTINGS,
} from "../components/settings/ChartSettings";

import {
  fetchUiSettings,
  updateUiSettings,
} from "../services/settingsApi";

import {
  applyTheme,
  saveChartColors,
  saveChartSettings,
  saveTheme,
} from "../utils/storage";

export default function SettingsPage() {
  const [
    theme,
    setTheme,
  ] = useState({
    ...DEFAULT_THEME,
  });

  const [
    chartSettings,
    setChartSettings,
  ] = useState({
    ...DEFAULT_CHART_SETTINGS,
  });

  const [
    chartColors,
    setChartColors,
  ] = useState([
    ...DEFAULT_CHART_COLORS,
  ]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchUiSettings({
            signal:
              controller.signal,
          });

        const nextTheme = {
          ...DEFAULT_THEME,
          ...(data?.theme || {}),
        };

        const nextChartSettings = {
          ...DEFAULT_CHART_SETTINGS,
          ...(data?.chartSettings ||
            {}),
        };

        const nextChartColors =
          Array.isArray(
            data?.chartColors
          ) &&
          data.chartColors.length
            ? data.chartColors
            : [
                ...DEFAULT_CHART_COLORS,
              ];

        setTheme(
          nextTheme
        );

        setChartSettings(
          nextChartSettings
        );

        setChartColors(
          nextChartColors
        );

        applyTheme(
          nextTheme
        );

        saveTheme(
          nextTheme
        );

        saveChartSettings(
          nextChartSettings
        );

        saveChartColors(
          nextChartColors
        );
      } catch (loadError) {
        if (
          loadError.name ===
          "AbortError"
        ) {
          return;
        }

        setError(
          loadError.message ||
            "Unable to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const saved =
        await updateUiSettings({
          theme,
          chartSettings,
          chartColors,
        });

      const savedTheme = {
        ...DEFAULT_THEME,
        ...(saved?.theme ||
          theme),
      };

      const savedChartSettings = {
        ...DEFAULT_CHART_SETTINGS,
        ...(saved?.chartSettings ||
          chartSettings),
      };

      const savedChartColors =
        Array.isArray(
          saved?.chartColors
        ) &&
        saved.chartColors.length
          ? saved.chartColors
          : chartColors;

      setTheme(
        savedTheme
      );

      setChartSettings(
        savedChartSettings
      );

      setChartColors(
        savedChartColors
      );

      applyTheme(
        savedTheme
      );

      saveTheme(
        savedTheme
      );

      saveChartSettings(
        savedChartSettings
      );

      saveChartColors(
        savedChartColors
      );

      setSuccess(
        "Settings saved to the database successfully."
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-slate-900 p-7 text-white shadow-soft md:p-9">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 angel-grid-bg" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-950"
                style={{
                  background:
                    "var(--accent-color)",
                }}
              >
                <Palette
                  size={20}
                />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
                Application Settings
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-black leading-none tracking-[-0.055em] md:text-5xl">
              Theme and chart settings.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
              Configure global colors,
              visualization types and the
              shared chart palette for
              Angelbird Analytics.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <Settings2
                size={19}
                style={{
                  color:
                    "var(--accent-color)",
                }}
              />

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                  Storage
                </p>

                <p className="mt-1 font-black text-white">
                  Supabase Database
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm font-bold leading-6">
            {error}
          </p>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-4 text-lime-800">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm font-bold leading-6">
            {success}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[340px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2
              size={34}
              className="mx-auto animate-spin text-slate-700"
            />

            <p className="mt-4 text-sm font-black text-slate-500">
              Loading database settings...
            </p>
          </div>
        </div>
      ) : (
        <>
          <ThemeSettings
            theme={theme}
            onChange={
              setTheme
            }
            disabled={saving}
          />

          <ChartSettings
            settings={
              chartSettings
            }
            colors={
              chartColors
            }
            onSettingsChange={
              setChartSettings
            }
            onColorsChange={
              setChartColors
            }
            disabled={saving}
          />

          <div className="sticky bottom-4 z-30 flex justify-end">
            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="angel-btn angel-btn-dark min-w-[190px] gap-2 shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={18}
                />
              )}

              {saving
                ? "Saving Settings..."
                : "Save Settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}