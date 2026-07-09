import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logo from "../../assets/logo.svg";
import { useAuth } from "../../context/AuthContext";

const quickAccounts = [
  {
    label: "Owner",
    email: "aamir@mahimediasolutions.com",
  },
  {
    label: "Admin",
    email: "shahid@mahimediasolutions.com",
  },
  {
    label: "Analyst",
    email: "angelbird@mahimediasolutions.com",
  },
  {
    label: "Viewer",
    email: "angelbird2@mahimediasolutions.com",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    signIn,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const destination =
    location.state?.from || "/";

  useEffect(() => {
    document.title =
      "Login | Angelbird Analytics";
  }, []);

  if (!authLoading && isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await signIn({
        email: email.trim(),
        password,
      });

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (error) {
      setError("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      setError("");
    }
  }

  function useQuickAccount(account) {
    setEmail(account.email);

    setPassword(
      "Mahimediasolutions@786"
    );

    setError("");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-4 py-4">
      <div className="pointer-events-none absolute inset-0 angel-grid-bg opacity-45" />

      <div
        className="pointer-events-none absolute -right-36 -top-40 h-[380px] w-[380px] rounded-full opacity-75"
        style={{
          background:
            "var(--accent-color)",
        }}
      />

      <div className="pointer-events-none absolute -bottom-64 -left-52 h-[500px] w-[500px] rounded-full border-[90px] border-slate-200/60" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md">
            <img
              src={logo}
              alt="Angelbird"
              className="h-10 w-10 object-contain"
            />
          </div>

          <p className="mt-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-800">
            Angelbird Reporting
          </p>

         
        </div>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="border-b border-slate-100 px-6 py-5 text-center">
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-950"
              style={{
                background:
                  "var(--accent-color)",
              }}
            >
              <ShieldCheck size={19} />
            </div>

            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Secure Workspace Access
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
              Sign in to continue
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter your Angelbird account credentials.
            </p>
          </div>

          <div className="px-6 py-5">
            {error ? (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-xs font-bold leading-5">
                  {error}
                </p>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={
                      handleEmailChange
                    }
                    placeholder="name@mahimediasolutions.com"
                    className="h-[52px] w-full rounded-[15px] border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    style={{
                      paddingLeft: "3rem",
                      paddingRight: "1rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter your password"
                    className="h-[52px] w-full rounded-[15px] border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    style={{
                      paddingLeft: "3rem",
                      paddingRight: "3rem",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  authLoading
                }
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    "var(--header-color)",
                }}
              >
                {submitting ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowRight size={18} />
                )}

                {submitting
                  ? "Signing In..."
                  : "Sign In"}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Development Access
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickAccounts.map(
                (account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() =>
                      useQuickAccount(
                        account
                      )
                    }
                    className="group min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900">
                          {account.label}
                        </p>

                        <p
                          className="mt-0.5 truncate text-[9px] text-slate-500"
                          title={
                            account.email
                          }
                        >
                          {account.email}
                        </p>
                      </div>

                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-slate-300 transition group-hover:text-lime-600"
                      />
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
          Angelbird Analytics Workspace
        </p>
      </div>
    </main>
  );
}