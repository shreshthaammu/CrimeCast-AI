import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Radar, ShieldCheck } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { WorkspaceRole, useAuth } from "@/contexts/AuthContext";

const operatorEmails: Record<WorkspaceRole, string> = {
  investigator: "a.rao@crimecast.gov.in",
  analyst: "n.mehta@crimecast.gov.in",
  admin: "r.sen@crimecast.gov.in",
};

const roleDescriptions: Record<WorkspaceRole, string> = {
  investigator: "1930 helpline triage, CFCFRMS liens, PCR dispatch, and case escalation.",
  analyst: "Spatial forecasting, mule network topology, and model performance diagnostics.",
  admin: "Regional command oversight, governance audit trail, and operational policy.",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const [role, setRole] = useState<WorkspaceRole>("investigator");
  const [email, setEmail] = useState(operatorEmails.investigator);
  const [password, setPassword] = useState("CrimeCast@123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Redirect to={`/${user.role}/dashboard`} />;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!login(email, password, role)) {
      setError("Enter valid agency credentials for the selected role.");
      return;
    }
    setLocation(`/${role}/dashboard`);
  };

  const selectRole = (nextRole: WorkspaceRole) => {
    setRole(nextRole);
    setEmail(operatorEmails[nextRole]);
    setError("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b111a] px-4 py-8 text-[#e9eff5]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#111924] lg:grid-cols-[1.08fr_430px]">
        <section className="hidden flex-col justify-between border-r border-slate-800 bg-[#0e1520] p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Radar size={20} />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-white">
                CrimeCast AI
              </div>
              <div className="text-xs text-slate-400">
                Predictive Cybercrime Intelligence
              </div>
            </div>
          </div>

          <div className="my-16 max-w-md">
            <p className="text-xs font-medium text-emerald-400">
              Law Enforcement & Financial Forensics Console
            </p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-white">
              Turn golden-hour fraud signals into preemptive field intervention.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Correlate 1930 cybercrime helpline intake, multi-hop mule account layering, and ATM withdrawal hotspots in a single unified command console.
            </p>
          </div>

          <div className="flex items-center gap-2.5 border-t border-slate-800/80 pt-5 text-xs text-slate-400">
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
            <span>Decision-support intelligence requiring authorized officer verification.</span>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Radar size={20} className="text-emerald-400" />
            <span className="font-display text-lg font-semibold text-white">CrimeCast AI</span>
          </div>

          <div>
            <p className="text-xs font-medium text-emerald-400">Authorized Access</p>
            <h2 className="font-display mt-1.5 text-2xl font-semibold text-white">
              Sign in to Command Workspace
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Select your operational division and authenticate.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1.5 rounded-lg border border-slate-800 bg-[#0c121b] p-1">
            {(["investigator", "analyst", "admin"] as WorkspaceRole[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectRole(item)}
                className={`rounded-md px-2.5 py-2 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  role === item
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-400">{roleDescriptions[role]}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-medium text-slate-300">
              Agency Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1.5 w-full rounded-lg border border-slate-800 bg-[#0b111a] px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500"
              />
            </label>

            <label className="block text-xs font-medium text-slate-300">
              Passcode
              <div className="relative mt-1.5">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-[#0b111a] px-3.5 py-2.5 pr-11 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <LockKeyhole size={15} />
              Enter Workspace
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
