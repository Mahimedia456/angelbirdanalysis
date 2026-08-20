import {
  ClipboardList,
  FileSpreadsheet,
  Home,
  Menu,
  SmilePlus,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import logo from "../../assets/logo.svg";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  canViewReports,
} from "../../utils/permissions";

import HeaderUserMenu from "./HeaderUserMenu";

function NavigationLink({
  item,
  onClick,
  mobile = false,
}) {
  const Icon = item.icon;
  const location = useLocation();

  const queryType = new URLSearchParams(
    location.search
  ).get("type");

  const isReportTabActive =
    item.reportType &&
    location.pathname === "/reports" &&
    (queryType || "tickets") === item.reportType;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => {
        const active = item.reportType
          ? isReportTabActive
          : isActive;

        return [
          "inline-flex min-w-0 items-center gap-2 font-black transition",
          mobile
            ? "w-full rounded-2xl px-4 py-3 text-sm"
            : "rounded-full px-4 py-2.5 text-sm",
          active
            ? "text-slate-950"
            : mobile
            ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ");
      }}
      style={({ isActive }) => {
        const active = item.reportType
          ? isReportTabActive
          : isActive;

        return active
          ? {
              background: "var(--accent-color)",
            }
          : undefined;
      }}
    >
      <Icon
        size={16}
        className="shrink-0"
      />

      <span className="truncate">
        {item.label}
      </span>
    </NavLink>
  );
}

export default function Header() {
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const normalizedRole = String(
    user?.role || ""
  )
    .trim()
    .toLowerCase();

  const homeMenuAllowed = [
    "owner",
    "admin",
  ].includes(normalizedRole);

  const navItems = useMemo(() => {
    const items = [];

    if (homeMenuAllowed) {
      items.push({
        label: "Home",
        to: "/",
        icon: Home,
        end: true,
      });
    }

    if (canViewReports(user?.role)) {
      items.push({
        label: "Ticket Report",
        to: "/reports?type=tickets",
        icon: FileSpreadsheet,
        reportType: "tickets",
      });

      items.push({
        label: "Satisfaction Report",
        to: "/reports?type=satisfaction",
        icon: SmilePlus,
        reportType: "satisfaction",
      });

      items.push({
        label: "RMA Report",
        to: "/reports?type=rma",
        icon: ClipboardList,
        reportType: "rma",
      });
    }

    return items;
  }, [
    user?.role,
    homeMenuAllowed,
  ]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function closeProfileMenu() {
    setProfileMenuOpen(false);
  }

  function toggleProfileMenu() {
    setProfileMenuOpen(
      (current) => !current
    );
  }

  const logoDestination = homeMenuAllowed
    ? "/"
    : "/reports?type=tickets";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="angel-container">
        <div className="flex min-h-[76px] items-center justify-between gap-4">
          <Link
            to={logoDestination}
            onClick={() => {
              closeMobileMenu();
              closeProfileMenu();
            }}
            className="flex min-w-0 items-center gap-3 sm:gap-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <img
                src={logo}
                alt="Angelbird"
                className="h-7 w-7 object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-black uppercase tracking-[0.2em] text-slate-800 sm:text-[15px] sm:tracking-[0.28em]">
                Angelbird Reporting
              </p>

              <p className="mt-0.5 hidden truncate text-xs font-semibold text-slate-500 sm:block">
                Tickets · Satisfaction · RMA
              </p>
            </div>
          </Link>

          <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm lg:flex">
            {navItems.map((item) => (
              <NavigationLink
                key={item.to}
                item={item}
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <HeaderUserMenu
              open={profileMenuOpen}
              onToggle={toggleProfileMenu}
              onClose={closeProfileMenu}
            />

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(
                  (current) => !current
                );

                closeProfileMenu();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 pb-5 pt-4 lg:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavigationLink
                  key={item.to}
                  item={item}
                  mobile
                  onClick={closeMobileMenu}
                />
              ))}
            </nav>

            <div className="mt-4">
              <HeaderUserMenu
                compact
                onClose={closeMobileMenu}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}