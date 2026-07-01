import {
  LogOut,
  Palette,
  UserRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  canManageSettings,
  formatRoleName,
} from "../../utils/permissions";

function getUserInitials(
  user
) {
  const source =
    user?.fullName ||
    user?.email ||
    "Angelbird User";

  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase()
    )
    .join("");
}

export default function HeaderUserMenu({
  open,
  onToggle,
  onClose,
  compact = false,
}) {
  const navigate =
    useNavigate();

  const {
    user,
    signOut,
  } = useAuth();

  const settingsAllowed =
    canManageSettings(
      user?.role
    );

  async function handleLogout() {
    onClose?.();

    await signOut();

    navigate("/login", {
      replace: true,
    });
  }

  if (compact) {
    return (
      <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-slate-950"
            style={{
              background:
                "var(--accent-color)",
            }}
          >
            {getUserInitials(
              user
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              {user?.fullName ||
                user?.email ||
                "Angelbird User"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {user?.email || "-"}
            </p>
          </div>

          <UserRound
            size={18}
            className="shrink-0 text-slate-400"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 shadow-sm">
            {formatRoleName(
              user?.role
            )}
          </span>

          <div className="flex gap-2">
            {settingsAllowed ? (
              <Link
                to="/settings"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-100"
              >
                <Palette
                  size={15}
                />

                Settings
              </Link>
            ) : null}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-100"
            >
              <LogOut
                size={15}
              />

              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-slate-300"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-slate-950"
          style={{
            background:
              "var(--accent-color)",
          }}
        >
          {getUserInitials(
            user
          )}
        </div>

        <div className="hidden min-w-0 text-left xl:block">
          <p className="max-w-[180px] truncate text-xs font-black text-slate-900">
            {user?.fullName ||
              user?.email ||
              "Angelbird User"}
          </p>

          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
            {formatRoleName(
              user?.role
            )}
          </p>
        </div>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
            aria-label="Close user menu"
          />

          <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[290px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-slate-950"
                  style={{
                    background:
                      "var(--accent-color)",
                  }}
                >
                  {getUserInitials(
                    user
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {user?.fullName ||
                      "Angelbird User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email ||
                      "-"}
                  </p>
                </div>
              </div>

              <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                {formatRoleName(
                  user?.role
                )}
              </span>
            </div>

            <div className="p-2">
              {settingsAllowed ? (
                <Link
                  to="/settings"
                  onClick={onClose}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <Palette
                    size={17}
                  />

                  Settings
                </Link>
              ) : null}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <LogOut
                  size={17}
                />

                Sign Out
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}