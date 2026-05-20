import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { applyTheme, getTheme } from "../../utils/storage";
import logo from "../../assets/logo.svg";

export default function AppLayout() {
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="angel-container grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
        <Sidebar />

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      <footer
        className="mt-16 px-6 py-12 text-white"
        style={{ background: "var(--footer-color)" }}
      >
        <div className="angel-container">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <img
                    src={logo}
                    alt="Angelbird"
                    className="h-8 w-8 object-contain brightness-0 invert"
                  />
                </div>

                <div>
                  <p className="text-lg font-black uppercase tracking-[0.28em]">
                    Angelbird
                  </p>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    Reporting Dashboard
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                Ticket analytics, product master reporting, CSV imports, KPI
                cards, configurable charts, pivot tables and export-ready
                reports.
              </p>

              <div
                className="mt-6 h-1.5 w-28 rounded-full"
                style={{ background: "var(--accent-color)" }}
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                Reports
              </p>

              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>Ticket Summary</p>
                <p>Product Master</p>
                <p>Category Reporting</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                Tools
              </p>

              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>CSV Upload</p>
                <p>Pivot Table</p>
                <p>Chart Mapping</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                Theme
              </p>

              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>Color Picker</p>
                <p>Chart Colors</p>
                <p>KPI Colors</p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/45">
            © Angelbird Reporting Dashboard
          </div>
        </div>
      </footer>
    </div>
  );
}