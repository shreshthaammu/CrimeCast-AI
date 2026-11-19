import { FormEvent, useState } from "react";
import { BriefcaseBusiness, Play, PlusCircle, ShieldCheck, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MuleAccount, RiskZone } from "./types";
import { StatusText, getRiskTone } from "./ui";

export function SimulationModal({
  open,
  onClose,
  zones,
  onCaseCreated,
}: {
  open: boolean;
  onClose: () => void;
  zones: RiskZone[];
  onCaseCreated?: () => void;
}) {
  const [sim, setSim] = useState({
    complaints: 12,
    hours: 6,
    volume: 80,
    zone: zones[0]?.id || "H03",
    pattern: "velocity",
  });
  const [simResult, setSimResult] = useState<{
    primaryZone: string;
    zoneName: string;
    pcrUnit: string;
    risk: number;
    confidence: number;
    window: string;
    explanation: string[];
  } | null>(null);

  const runSimulation = trpc.intelligence.runSimulation.useMutation();
  const createCase = trpc.intelligence.createCase.useMutation();
  const utils = trpc.useUtils();

  if (!open) return null;

  const handleRun = () => {
    runSimulation.mutate(sim, {
      onSuccess: (res) => {
        setSimResult(res);
        toast.success("Predictive forecast computed", {
          description: `Projected cash-out risk ${res.risk}% in Zone ${res.primaryZone}.`,
        });
      },
      onError: () => toast.error("Forecast computation failed. Please retry."),
    });
  };

  const handleCreateCaseFromSim = () => {
    if (!simResult) return;
    createCase.mutate(
      {
        zone: simResult.primaryZone,
        risk: simResult.risk,
        title: `${simResult.primaryZone} · Forecast escalation (${simResult.window})`,
      },
      {
        onSuccess: (res) => {
          toast.success(`Case ${res.caseId} opened`, {
            description: `Queued for officer verification in Zone ${res.zone}.`,
          });
          utils.intelligence.snapshot.invalidate();
          onCaseCreated?.();
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700/80 bg-[#111924] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-400">Predictive Scenario Modeling</p>
            <h2 className="font-display mt-1 text-xl font-semibold text-white">
              Run Withdrawal Risk Forecast
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Adjust complaint intake density, transaction burst volume, and corridor parameters to project ATM cash-out concentration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-300">
            Correlated 1930 Complaints
            <input
              type="range"
              min="4"
              max="35"
              value={sim.complaints}
              onChange={(e) => setSim({ ...sim, complaints: Number(e.target.value) })}
              className="mt-2.5 w-full accent-emerald-400"
            />
            <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
              {sim.complaints} complaints
            </div>
          </label>

          <label className="text-xs font-medium text-slate-300">
            Forecast Horizon
            <select
              value={sim.hours}
              onChange={(e) => setSim({ ...sim, hours: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2 text-xs text-slate-200"
            >
              <option value={2}>Next 2 hours</option>
              <option value={6}>Next 6 hours</option>
              <option value={12}>Next 12 hours</option>
              <option value={24}>Next 24 hours</option>
            </select>
          </label>

          <label className="text-xs font-medium text-slate-300">
            Anomalous Transfer Volume
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={sim.volume}
              onChange={(e) => setSim({ ...sim, volume: Number(e.target.value) })}
              className="mt-2.5 w-full accent-emerald-400"
            />
            <div className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
              {sim.volume} transactions
            </div>
          </label>

          <label className="text-xs font-medium text-slate-300">
            Target Geographic Grid
            <select
              value={sim.zone}
              onChange={(e) => setSim({ ...sim, zone: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2 text-xs text-slate-200"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} · {z.name} ({z.district})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-xs font-medium text-slate-300">
          Dispersal Signature
          <select
            value={sim.pattern}
            onChange={(e) => setSim({ ...sim, pattern: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2 text-xs text-slate-200"
          >
            <option value="velocity">High-velocity ATM cash-out burst</option>
            <option value="network">Multi-layer mule wallet aggregation</option>
            <option value="temporal">Off-hours nocturnal withdrawal cluster</option>
          </select>
        </label>

        {simResult && (
          <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-emerald-300">
                  Projected Forecast · {simResult.primaryZone} ({simResult.zoneName})
                </div>
                <div className="font-display mt-1 text-3xl font-semibold text-white tabular-nums">
                  {simResult.risk}%
                  <span className="ml-2 text-sm font-normal text-slate-400">projected risk</span>
                </div>
              </div>
              <div className="text-right">
                <StatusText
                  label={`${simResult.confidence}% confidence`}
                  tone={getRiskTone(simResult.risk)}
                />
                <div className="mt-1 text-xs text-slate-400">{simResult.window}</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-emerald-500/20 pt-3">
              {simResult.explanation.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={runSimulation.isPending}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 whitespace-nowrap"
          >
            <Play size={13} fill="currentColor" />
            {runSimulation.isPending ? "Computing..." : "Run Forecast"}
          </button>
          {simResult && (
            <button
              type="button"
              onClick={handleCreateCaseFromSim}
              disabled={createCase.isPending}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 whitespace-nowrap"
            >
              <BriefcaseBusiness size={14} />
              Open Investigation Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogComplaintModal({
  open,
  onClose,
  zones,
  muleAccounts,
}: {
  open: boolean;
  onClose: () => void;
  zones: RiskZone[];
  muleAccounts: MuleAccount[];
}) {
  const [form, setForm] = useState({
    type: "UPI Impersonation / Fake QR",
    amount: "25000",
    channel: "UPI",
    district: zones[0]?.district || "Cyberabad",
    zone: zones[0]?.id || "H03",
    muleAccountId: muleAccounts[0]?.id || "MULE-SBI-4891",
  });

  const logComplaint = trpc.intelligence.logComplaint.useMutation();
  const utils = trpc.useUtils();

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(form.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      toast.error("Enter a valid transaction amount of at least INR 100.");
      return;
    }

    logComplaint.mutate(
      {
        type: form.type,
        amount: numericAmount,
        channel: form.channel,
        district: form.district,
        zone: form.zone,
        muleAccountId: form.muleAccountId,
      },
      {
        onSuccess: (res) => {
          toast.success(`1930 Complaint ${res.complaint.id} logged`, {
            description: `Ack ${res.complaint.ackNo1930} routed to Zone ${res.complaint.zone} (${res.complaint.risk}% risk).`,
          });
          utils.intelligence.snapshot.invalidate();
          onClose();
        },
        onError: () => toast.error("Failed to ingest complaint record."),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700/80 bg-[#111924] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-400">1930 Helpline Intake</p>
            <h2 className="font-display mt-1 text-xl font-semibold text-white">
              Log Cyber Financial Complaint
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Ingest an active fraud report into the golden-hour correlation and CFCFRMS lien pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-slate-300">
            Fraud Typology
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2.5 text-xs text-slate-200"
            >
              <option>UPI Impersonation / Fake QR</option>
              <option>Digital Arrest (CBI/ED)</option>
              <option>Remote Access APK (AnyDesk)</option>
              <option>Stock Market IPO Fraud</option>
              <option>SIM Swap / OTP Intercept</option>
              <option>Wallet Takeover</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">
              Disputed Amount (INR)
              <input
                type="number"
                min={100}
                step={100}
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2.5 font-mono text-xs text-white"
              />
            </label>

            <label className="block text-xs font-medium text-slate-300">
              Payment Rail
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2.5 text-xs text-slate-200"
              >
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="Netbanking">Netbanking</option>
                <option value="Wallet">Wallet</option>
                <option value="AEPS">AEPS</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-300">
              Predicted Grid Zone
              <select
                value={form.zone}
                onChange={(e) => {
                  const z = zones.find((item) => item.id === e.target.value);
                  setForm({
                    ...form,
                    zone: e.target.value,
                    district: z?.district || form.district,
                  });
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2.5 text-xs text-slate-200"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} · {z.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-300">
              Destination Mule Hub
              <select
                value={form.muleAccountId}
                onChange={(e) => setForm({ ...form, muleAccountId: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0b111a] px-3 py-2.5 font-mono text-xs text-slate-200"
              >
                {muleAccounts.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} ({m.bankName})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0e1520] px-3 py-2.5 text-xs text-slate-400">
            <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
            <span>Victim identity is automatically SHA-256 hashed at intake.</span>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logComplaint.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <PlusCircle size={14} />
              {logComplaint.isPending ? "Ingesting..." : "Submit Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
