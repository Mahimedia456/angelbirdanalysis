import { BarChart3, FileSpreadsheet, Palette, Upload } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.svg";

const navItems = [
  { label: "Upload", to: "/", icon: Upload },
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Reports", to: "/reports", icon: FileSpreadsheet },
  { label: "Settings", to: "/settings", icon: Palette },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="angel-container">
        <div className="flex h-[76px] items-center justify-between">
          <Link to="/" className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <img
                src={logo}
                alt="Angelbird"
                className="h-7 w-7 object-contain"
              />
            </div>

            <div>
              <p className="text-[15px] font-black uppercase tracking-[0.28em] text-slate-800">
                Angelbird Reporting
              </p>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Ticket Analytics · Product Master
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                  style={({ isActive }) =>
                    isActive ? { background: "var(--accent-color)" } : undefined
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <Link
            to="/settings"
            className="hidden rounded-full px-5 py-2.5 text-sm font-black text-white shadow-sm lg:inline-flex"
            style={{ background: "var(--header-color)" }}
          >
            Customize
          </Link>
        </div>
      </div>
    </header>
  );
}