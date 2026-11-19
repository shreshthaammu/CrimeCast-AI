import { useMemo, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileBarChart,
  FileSearch,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Network,
  Play,
  PlusCircle,
  Radar,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth, WorkspaceRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { IntelligenceSnapshot, RiskZone } from "@/components/workspace/types";
import { DataTable, PageHeader, SectionPanel, StatTile, StatusText, getRiskTone } from "@/components/workspace/ui";
import { LogComplaintModal, SimulationModal } from "@/components/workspace/Modals";
import { NetworkView, RiskMapView } from "@/components/workspace/MapAndNetwork";

const investigatorNav = [
  ["Dashboard", "/investigator/dashboard", LayoutDashboard],
  ["Complaints", "/complaints", FileSearch],
  ["Transactions", "/transactions", Activity],
  ["Risk Map", "/risk-map", MapPin],
  ["Predictions", "/predictions", Target],
  ["Alerts", "/alerts", Bell],
  ["Cases", "/cases", BriefcaseBusiness],
  ["Mule Network", "/network", Network],
  ["Reports", "/reports", FileBarChart],
  ["Audit Logs", "/audit-logs", ShieldCheck],
  ["Settings", "/settings", Settings2],
] as const;

const analystNav = [
  ["Dashboard", "/analyst/dashboard", LayoutDashboard],
  ["Analytics", "/analytics", BarChart3],
  ["Mule Network", "/network", Network],
  ["Data Governance", "/data", Database],
  ["Models", "/models", BrainCircuit],
  ["Predictions", "/predictions", Target],
  ["Risk Map", "/risk-map", MapPin],
  ["Reports", "/reports", FileBarChart],
  ["Settings", "/settings", Settings2],
] as const;

const adminNav = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Complaints", "/complaints", FileSearch],
  ["Transactions", "/transactions", Activity],
  ["Risk Map", "/risk-map", MapPin],
  ["Predictions", "/predictions", Target],
  ["Alerts", "/alerts", Bell],
  ["Cases", "/cases", BriefcaseBusiness],
  ["Mule Network", "/network", Network],
  ["Analytics", "/analytics", BarChart3],
  ["Models", "/models", BrainCircuit],
  ["Data Governance", "/data", Database],
  ["Reports", "/reports", FileBarChart],
  ["Audit Logs", "/audit-logs", ShieldCheck],
  ["Settings", "/settings", Settings2],
] as const;

const titles: Record<string, string> = {
  "/investigator/dashboard": "Investigator Console",
  "/analyst/dashboard": "Analyst Console",
  "/admin/dashboard": "Command Console",
  "/complaints": "1930 Complaints Queue",
  "/transactions": "Monitored Transactions",
  "/risk-map": "Geographic Risk Map",
  "/predictions": "Withdrawal Predictions",
  "/alerts": "Intelligence Alerts",
  "/cases": "Case Management",
  "/network": "Mule Network Analysis",
  "/analytics": "Pattern & Trend Analytics",
  "/models": "Models & Evaluation",
  "/data": "Data Governance",
  "/reports": "Intelligence Reports",
  "/audit-logs": "Audit & Compliance Trail",
  "/audit": "Audit & Compliance Trail",
  "/settings": "Workspace Settings",
};

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Dashboard({
  data,
  role,
  onOpenSim,
  onOpenComplaint,
}: {
  data: IntelligenceSnapshot;
  role: WorkspaceRole;
  onOpenSim: () => void;
  onOpenComplaint: () => void;
}) {
  const utils = trpc.useUtils();
  const createCase = trpc.intelligence.createCase.useMutation();
  const updateComplaintStatus = trpc.intelligence.updateComplaintStatus.useMutation();
  const dispatchPcr = trpc.intelligence.dispatchPcr.useMutation();

  const handleCreateCase = (zoneId: string, risk: number) => {
    createCase.mutate(
      { zone: zoneId, risk },
      {
        onSuccess: (res) => {
          toast.success(`Case ${res.caseId} opened`, {
            description: `Zone ${res.zone} routed to active investigation queue.`,
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const handleQuickLien = (complaintId: string) => {
    updateComplaintStatus.mutate(
      { id: complaintId, status: "LIEN_PLACED" },
      {
        onSuccess: () => {
          toast.success(`CFCFRMS Lien placed on ${complaintId}`, {
            description: "Bank hold instruction queued during golden-hour window.",
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const handleDispatch = (zone: RiskZone) => {
    dispatchPcr.mutate(
      { zoneId: zone.id },
      {
        onSuccess: (res) => {
          toast.success(`${res.unit} dispatched to ${zone.name}`, {
            description: `Surveillance advisory sent to ${zone.jurisdictionStation}.`,
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const urgentGoldenHour = useMemo(
    () =>
      data.complaints
        .filter((c) => c.goldenHourMins > 0 && c.status !== "LIEN_PLACED" && c.status !== "RECOVERED")
        .sort((a, b) => a.goldenHourMins - b.goldenHourMins)
        .slice(0, 4),
    [data.complaints]
  );

  if (role === "admin") {
    return (
      <>
        <PageHeader
          title="Regional Command Console"
          description="System-wide cybercrime oversight, CFCFRMS recovery metrics, and predictive model reliability."
          actions={
            <>
              <button
                type="button"
                onClick={onOpenComplaint}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111924] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
              >
                <PlusCircle size={14} />
                Log 1930 Complaint
              </button>
              <button
                type="button"
                onClick={onOpenSim}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
              >
                <Play size={13} fill="currentColor" />
                Run Forecast
              </button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="1930 Complaints Ingested"
            value={data.kpis.complaints.toLocaleString()}
            meta="Active jurisdictional pipeline"
          />
          <StatTile
            label="Funds Secured (CFCFRMS)"
            value={`INR ${data.kpis.frozenExposureInr.toLocaleString()}`}
            meta="Held in frozen mule accounts"
            accentClass="text-emerald-400"
          />
          <StatTile
            label="Open Investigation Cases"
            value={data.kpis.activeCases}
            meta={`${data.kpis.activeAlerts} active alerts`}
            accentClass="text-amber-400"
          />
          <StatTile
            label="Spatial Model Accuracy"
            value={`${(data.modelMetrics.accuracy * 100).toFixed(1)}%`}
            meta={`Top-3 Zone Hit Rate: ${(data.modelMetrics.top3 * 100).toFixed(0)}%`}
            accentClass="text-sky-400"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <SectionPanel
            subtitle="Priority Corridors"
            title="Critical Withdrawal Concentrations"
            action={
              <Link href="/risk-map" className="text-xs font-medium text-emerald-400 hover:underline">
                Open Live Map
              </Link>
            }
          >
            <div className="divide-y divide-slate-800/70">
              {data.zones.slice(0, 5).map((zone) => (
                <div key={zone.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium text-white">
                      <span className="font-mono text-emerald-400">{zone.id}</span> · {zone.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {zone.window} · {zone.nearestPcrUnit} · {zone.complaints} complaints
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusText label={`${zone.risk}% ${zone.status}`} tone={getRiskTone(zone.risk)} />
                    <button
                      type="button"
                      onClick={() => handleCreateCase(zone.id, zone.risk)}
                      className="rounded-md border border-slate-700 bg-[#0b111a] px-2.5 py-1 text-xs font-medium text-emerald-300 hover:border-emerald-500/50"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel
            subtitle="Governance"
            title="Recent Authorized Audit Actions"
            action={
              <Link href="/audit-logs" className="text-xs font-medium text-emerald-400 hover:underline">
                Full Audit Trail
              </Link>
            }
          >
            <div className="divide-y divide-slate-800/70">
              {data.auditLogs.slice(0, 6).map((log, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-xs font-medium text-slate-200">{log.action}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {log.actor} · {log.scope}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">{log.time}</span>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      </>
    );
  }

  if (role === "analyst") {
    return (
      <>
        <PageHeader
          title="Analyst Intelligence Workspace"
          description="Predictive model evaluation, spatial feature weights, and temporal withdrawal velocity."
          actions={
            <button
              type="button"
              onClick={onOpenSim}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              Run Forecast
            </button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Evaluated Records"
            value={data.modelMetrics.evaluatedRows.toLocaleString()}
            meta="Cross-validated corpus"
          />
          <StatTile
            label="Model F1 Score"
            value={data.modelMetrics.f1.toFixed(2)}
            meta={`ROC-AUC ${data.modelMetrics.rocAuc.toFixed(2)}`}
            accentClass="text-emerald-400"
          />
          <StatTile
            label="Zone Coverage"
            value={`${(data.modelMetrics.coverage * 100).toFixed(1)}%`}
            meta="ATM corridor coverage"
          />
          <StatTile
            label="Mean Distance Error"
            value={data.modelMetrics.meanError}
            meta="Spatial localization delta"
            accentClass="text-sky-400"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <SectionPanel subtitle="7-Day Signal Trajectory" title="Complaint Intake vs Risk Index">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b111a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#10b981" fill="url(#riskGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="complaints" stroke="#38bdf8" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionPanel>

          <SectionPanel subtitle="Model Explainability" title="Feature Contribution Weights">
            <div className="space-y-3.5">
              {data.featureImportance.map((item) => (
                <div key={item.feature}>
                  <div className="flex justify-between text-xs font-medium text-slate-200">
                    <span>{item.feature}</span>
                    <span className="font-mono text-emerald-400 tabular-nums">{item.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, item.value * 3.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Predictive Withdrawal Intelligence"
        description="Real-time 1930 helpline correlation, golden-hour CFCFRMS lien prioritization, and spatial ATM cash-out forecasting."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenComplaint}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111924] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
            >
              <PlusCircle size={14} />
              Log Complaint
            </button>
            <button
              type="button"
              onClick={onOpenSim}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              Run Forecast
            </button>
          </>
        }
      />

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
        <AlertTriangle size={15} className="shrink-0 text-amber-400" />
        <span>
          <strong>Officer Verification Notice:</strong> Predictive zone scores and mule network alerts support decision-making and require authorized review prior to enforcement action.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="1930 Complaints" value={data.kpis.complaints.toLocaleString()} meta="Ingested total" />
        <StatTile
          label="Golden-Hour Urgent"
          value={data.kpis.goldenHourUrgent}
          meta="Freeze window < 45m"
          accentClass="text-red-400"
        />
        <StatTile
          label="Active Alerts"
          value={data.kpis.activeAlerts}
          meta="Requires triage"
          accentClass="text-amber-400"
        />
        <StatTile label="Open Cases" value={data.kpis.activeCases} meta="Active queue" />
        <StatTile
          label="Funds Frozen"
          value={`INR ${(data.kpis.frozenExposureInr / 1000).toFixed(0)}k`}
          meta="CFCFRMS liens"
          accentClass="text-emerald-400"
        />
        <StatTile label="Resolved Cases" value={data.kpis.resolvedCases} meta="Verified closures" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionPanel
          subtitle="Predicted Withdrawal Zones"
          title="Immediate ATM Cash-Out Risk"
          action={
            <Link href="/risk-map" className="text-xs font-medium text-emerald-400 hover:underline">
              Open Risk Map
            </Link>
          }
        >
          <div className="divide-y divide-slate-800/70">
            {data.zones.slice(0, 5).map((zone) => (
              <div key={zone.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">
                    <span className="font-mono text-emerald-400">{zone.id}</span> · {zone.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-400">
                    {zone.window} · {zone.confidence}% confidence · {zone.nearestPcrUnit}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusText label={`${zone.risk}% ${zone.status}`} tone={getRiskTone(zone.risk)} />
                  <button
                    type="button"
                    onClick={() => handleDispatch(zone)}
                    disabled={zone.dispatched}
                    className="rounded-md border border-slate-700 bg-[#0b111a] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-emerald-500/50 disabled:opacity-50"
                  >
                    {zone.dispatched ? "Dispatched" : "Dispatch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateCase(zone.id, zone.risk)}
                    className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          subtitle="Golden-Hour Triage"
          title="Urgent Lien & Freeze Queue"
          action={
            <Link href="/complaints" className="text-xs font-medium text-emerald-400 hover:underline">
              All Complaints
            </Link>
          }
        >
          <div className="divide-y divide-slate-800/70">
            {urgentGoldenHour.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All active golden-hour complaints have statutory liens placed.
              </div>
            ) : (
              urgentGoldenHour.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Link href={`/complaints/${c.id}`} className="font-mono font-semibold text-white hover:text-emerald-400">
                        {c.id}
                      </Link>
                      <span className="text-slate-400">·</span>
                      <span className="truncate text-slate-300">{c.type}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} className="text-red-400" />
                      <span className="font-mono text-red-400 tabular-nums">{c.goldenHourMins}m left</span>
                      <span>·</span>
                      <span className="font-mono">INR {c.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLien(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/25 whitespace-nowrap"
                  >
                    <Lock size={12} /> Place Lien
                  </button>
                </div>
              ))
            )}
          </div>
        </SectionPanel>
      </div>

      <div className="mt-5">
        <SectionPanel subtitle="Operational Workflow" title="Golden-Hour Enforcement Pipeline">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {[
              "1. 1930 Helpline Intake",
              "2. Mule Graph Correlation",
              "3. CFCFRMS Lien Hold",
              "4. ATM Zone Forecast",
              "5. PCR / QRT Alert",
              "6. Officer Verification",
            ].map((step, idx) => (
              <div key={step} className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0b111a] px-3 py-2 text-xs font-medium text-slate-200">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>{step}</span>
                </div>
                {idx < 5 && <ChevronRight size={14} className="text-slate-600" />}
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </>
  );
}

function ComplaintsView({
  data,
  onOpenComplaint,
}: {
  data: IntelligenceSnapshot;
  onOpenComplaint: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const utils = trpc.useUtils();
  const updateStatus = trpc.intelligence.updateComplaintStatus.useMutation();

  const filtered = useMemo(() => {
    return data.complaints.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.ackNo1930.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.muleAccountId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.complaints, statusFilter, query]);

  const handleStatusChange = (
    id: string,
    status: "OPEN" | "IN_REVIEW" | "LIEN_PLACED" | "RECOVERED" | "CLOSED"
  ) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Complaint ${id} updated to ${status.replaceAll("_", " ")}`);
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="1930 Cybercrime Complaints Queue"
        description="Anonymized financial fraud reports correlated with destination mule hubs and golden-hour recovery windows."
        actions={
          <button
            type="button"
            onClick={onOpenComplaint}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
          >
            <PlusCircle size={14} />
            Log 1930 Complaint
          </button>
        }
      />

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#111924] p-1">
          {["ALL", "OPEN", "IN_REVIEW", "LIEN_PLACED", "RECOVERED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by ID, Ack No, fraud type..."
            className="w-full rounded-lg border border-slate-800 bg-[#111924] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 sm:w-64"
          />
        </div>
      </div>

      <SectionPanel title={`Complaints Ledger (${filtered.length})`} subtitle="Live Intake" noPadding>
        <DataTable
          headers={[
            { label: "Complaint / 1930 Ack" },
            { label: "Fraud Typology" },
            { label: "Amount", align: "right" },
            { label: "Corridor" },
            { label: "Mule Hub" },
            { label: "Golden Hour" },
            { label: "Risk" },
            { label: "Status" },
          ]}
          rows={filtered.map((c) => [
            <div key={c.id}>
              <Link href={`/complaints/${c.id}`} className="font-mono font-semibold text-emerald-400 hover:underline">
                {c.id}
              </Link>
              <div className="font-mono text-[11px] text-slate-500">{c.ackNo1930}</div>
            </div>,
            <div>
              <div className="font-medium text-slate-200">{c.type}</div>
              <div className="text-[11px] text-slate-500">
                {c.channel} · {c.time}
              </div>
            </div>,
            <span className="font-mono font-medium text-white">INR {c.amount.toLocaleString()}</span>,
            `${c.district} · ${c.zone}`,
            <span className="font-mono text-xs text-slate-300">{c.muleAccountId}</span>,
            c.goldenHourMins > 0 ? (
              <span className={`font-mono text-xs ${c.goldenHourMins <= 30 ? "text-red-400" : "text-amber-400"}`}>
                {c.goldenHourMins} min
              </span>
            ) : (
              <span className="text-xs text-slate-500">Closed</span>
            ),
            <StatusText label={`${c.risk}%`} tone={getRiskTone(c.risk)} />,
            <select
              aria-label={`Update status for ${c.id}`}
              value={c.status}
              onChange={(e) =>
                handleStatusChange(
                  c.id,
                  e.target.value as "OPEN" | "IN_REVIEW" | "LIEN_PLACED" | "RECOVERED" | "CLOSED"
                )
              }
              className="rounded-md border border-slate-700 bg-[#0b111a] px-2 py-1 text-xs text-slate-200"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="LIEN_PLACED">LIEN PLACED</option>
              <option value="RECOVERED">RECOVERED</option>
              <option value="CLOSED">CLOSED</option>
            </select>,
          ])}
        />
      </SectionPanel>
    </>
  );
}

function AlertsView({ data }: { data: IntelligenceSnapshot }) {
  const utils = trpc.useUtils();
  const updateAlert = trpc.intelligence.updateAlert.useMutation();
  const createCase = trpc.intelligence.createCase.useMutation();

  const handleUpdateStatus = (id: string, status: "VERIFIED" | "FALSE POSITIVE" | "UNDER INVESTIGATION") => {
    updateAlert.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Alert ${id} marked as ${status}`);
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const handleCreateCase = (zone: string, risk: number) => {
    createCase.mutate(
      { zone, risk },
      {
        onSuccess: (res) => {
          toast.success(`Case ${res.caseId} opened`, {
            description: `Zone ${res.zone} queued for investigator action.`,
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Active Intelligence Alerts"
        description="Real-time alerts derived from cross-channel fraud velocity, ATM cluster pressure, and mule layering."
      />
      <div className="space-y-4">
        {data.alerts.map((a) => (
          <SectionPanel key={a.id} title={a.title} subtitle={`${a.id} · Zone ${a.zone} · ${a.pcrUnit}`}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-2xl font-semibold text-white tabular-nums">
                    {a.risk}% risk
                  </span>
                  <StatusText
                    label={a.status}
                    tone={a.status === "NEW" ? "critical" : a.status === "VERIFIED" ? "success" : "neutral"}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300">{a.reason}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>Window: Next 6 hours</span>
                  <span>·</span>
                  <span>{a.time}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{a.complaints} linked complaints</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(a.id, "VERIFIED")}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(a.id, "FALSE POSITIVE")}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                >
                  False Positive
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateCase(a.zone, a.risk)}
                  className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Create Case
                </button>
              </div>
            </div>
          </SectionPanel>
        ))}
      </div>
    </>
  );
}

function CasesView({ data }: { data: IntelligenceSnapshot }) {
  const utils = trpc.useUtils();
  const updateCase = trpc.intelligence.updateCaseStatus.useMutation();

  const handleStatusChange = (
    id: string,
    status: "NEW" | "UNDER INVESTIGATION" | "VERIFIED" | "RESOLVED"
  ) => {
    updateCase.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Case ${id} transitioned to ${status}`);
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Case Management Queue"
        description="Operational investigation cases, assigned field officers, and statutory resolution tracking."
      />
      <SectionPanel title="Active & Resolved Cases" subtitle="Operations" noPadding>
        <DataTable
          headers={[
            { label: "Case ID" },
            { label: "Investigation Summary" },
            { label: "Zone / PCR" },
            { label: "Risk" },
            { label: "Assignee" },
            { label: "Updated" },
            { label: "Status" },
          ]}
          rows={data.cases.map((c) => [
            <Link key={c.id} href={`/cases/${c.id}`} className="font-mono font-semibold text-emerald-400 hover:underline">
              {c.id}
            </Link>,
            <span className="font-medium text-slate-200">{c.title}</span>,
            <span className="font-mono text-xs text-slate-300">
              {c.zone} · {c.pcrUnit}
            </span>,
            <StatusText label={`${c.risk}%`} tone={getRiskTone(c.risk)} />,
            c.assignee,
            c.updated,
            <select
              key={`sel-${c.id}`}
              aria-label={`Status for ${c.id}`}
              value={c.status}
              onChange={(e) =>
                handleStatusChange(
                  c.id,
                  e.target.value as "NEW" | "UNDER INVESTIGATION" | "VERIFIED" | "RESOLVED"
                )
              }
              className="rounded-md border border-slate-700 bg-[#0b111a] px-2 py-1 text-xs text-slate-200"
            >
              <option value="NEW">NEW</option>
              <option value="UNDER INVESTIGATION">UNDER INVESTIGATION</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>,
          ])}
        />
      </SectionPanel>
    </>
  );
}

function RouteContent({
  path,
  data,
  role,
  onOpenSim,
  onOpenComplaint,
}: {
  path: string;
  data: IntelligenceSnapshot;
  role: WorkspaceRole;
  onOpenSim: () => void;
  onOpenComplaint: () => void;
}) {
  if (path.endsWith("/dashboard") || path === "/") {
    return (
      <Dashboard
        data={data}
        role={role}
        onOpenSim={onOpenSim}
        onOpenComplaint={onOpenComplaint}
      />
    );
  }

  if (path.startsWith("/complaints/")) {
    const id = path.split("/").pop();
    const complaint = data.complaints.find((item) => item.id === id) || data.complaints[0];
    if (!complaint) return <div className="text-sm text-slate-400">Complaint record not found.</div>;
    return (
      <>
        <PageHeader
          title={`Complaint ${complaint.id}`}
          description={`1930 Helpline Acknowledgement ${complaint.ackNo1930} · ${complaint.district}, ${complaint.state}`}
          actions={
            <Link
              href="/complaints"
              className="rounded-lg border border-slate-700 bg-[#111924] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to Queue
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Fraud Typology" value={complaint.type} meta={complaint.channel} />
          <StatTile
            label="Disputed Amount"
            value={`INR ${complaint.amount.toLocaleString()}`}
            meta={complaint.time}
          />
          <StatTile
            label="Risk Score"
            value={`${complaint.risk}%`}
            meta={complaint.status.replaceAll("_", " ")}
            accentClass="text-red-400"
          />
          <StatTile
            label="Destination Mule"
            value={complaint.muleAccountId}
            meta={`Predicted Zone ${complaint.zone}`}
            accentClass="text-emerald-400"
          />
        </div>
        <div className="mt-5">
          <SectionPanel title="Privacy & Forensic Metadata" subtitle="Chain of Custody">
            <p className="text-xs leading-relaxed text-slate-300">
              Anonymized victim hash: <code className="font-mono text-emerald-400">{complaint.hash}</code>.
              Personally identifiable citizen records are masked at ingestion in compliance with cyber forensic standards.
              Remaining golden-hour intervention window:{" "}
              <span className="font-mono font-semibold text-white">{complaint.goldenHourMins} minutes</span>.
            </p>
          </SectionPanel>
        </div>
      </>
    );
  }

  if (path === "/complaints") {
    return <ComplaintsView data={data} onOpenComplaint={onOpenComplaint} />;
  }

  if (path === "/transactions") {
    return (
      <>
        <PageHeader
          title="Monitored Financial Transactions"
          description="High-velocity transfer stream correlated with flagged mule accounts and withdrawal corridors."
        />
        <SectionPanel title="Suspicious Activity Stream" subtitle="Real-Time Telemetry" noPadding>
          <DataTable
            headers={[
              { label: "Transaction ID" },
              { label: "Time" },
              { label: "Amount", align: "right" },
              { label: "Origin Zone" },
              { label: "Rail" },
              { label: "Mule Account" },
              { label: "Velocity" },
              { label: "Signal" },
            ]}
            rows={data.transactions.map((t) => [
              <span key={t.id} className="font-mono font-medium text-white">
                {t.id}
              </span>,
              <span className="font-mono text-slate-400">{t.time}</span>,
              <span className="font-mono font-medium text-white">INR {t.amount.toLocaleString()}</span>,
              <span className="font-mono">{t.origin}</span>,
              t.channel,
              <span className="font-mono text-slate-300">{t.muleAccountId}</span>,
              <span className="font-mono text-amber-400">{t.velocity}</span>,
              <StatusText
                label={t.signal}
                tone={t.signal === "HIGH" ? "critical" : t.signal === "MEDIUM" ? "high" : "low"}
              />,
            ])}
          />
        </SectionPanel>
      </>
    );
  }

  if (path === "/predictions") {
    return (
      <>
        <PageHeader
          title="ATM Withdrawal Predictions"
          description="Zone-level cash-out forecasts with explainable feature drivers and assigned PCR interception units."
          actions={
            <button
              type="button"
              onClick={onOpenSim}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              Run Forecast
            </button>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {data.zones.map((z) => (
            <SectionPanel
              key={z.id}
              title={`${z.id} · ${z.name}`}
              subtitle={`${z.district} · ${z.nearestPcrUnit}`}
              action={<StatusText label={`${z.confidence}% confidence`} tone="success" />}
            >
              <div className="flex items-baseline justify-between border-b border-slate-800/70 pb-3">
                <div className="font-display text-3xl font-semibold text-white tabular-nums">
                  {z.risk}% <span className="text-xs font-normal text-slate-400">cash-out risk</span>
                </div>
                <span className="text-xs text-slate-400">{z.window}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {z.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="font-mono text-emerald-400">{idx + 1}.</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </SectionPanel>
          ))}
        </div>
      </>
    );
  }

  if (path === "/risk-map") {
    return <RiskMapView data={data} onOpenSim={onOpenSim} />;
  }

  if (path === "/alerts") {
    return <AlertsView data={data} />;
  }

  if (path.startsWith("/cases/")) {
    const id = path.split("/").pop();
    const item = data.cases.find((entry) => entry.id === id) || data.cases[0];
    if (!item) return <div className="text-sm text-slate-400">Case not found.</div>;
    return (
      <>
        <PageHeader
          title={`Case ${item.id}`}
          description="Authorized investigation file, assigned field unit, and case progression history."
          actions={
            <Link
              href="/cases"
              className="rounded-lg border border-slate-700 bg-[#111924] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to Cases
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Risk Score" value={`${item.risk}%`} meta="Predicted corridor signal" accentClass="text-red-400" />
          <StatTile label="Assigned Officer" value={item.assignee} meta={item.pcrUnit} />
          <StatTile label="Workflow Status" value={item.status} meta={item.updated} />
          <StatTile label="Correlated Complaints" value={item.complaints} meta={`Zone ${item.zone}`} />
        </div>
        <div className="mt-5">
          <SectionPanel title={item.title} subtitle="Case Governance">
            <p className="text-xs leading-relaxed text-slate-300">
              Every state transition, lien request, and patrol dispatch associated with {item.id} is recorded in the immutable operational audit log for judicial admissibility.
            </p>
          </SectionPanel>
        </div>
      </>
    );
  }

  if (path === "/cases") {
    return <CasesView data={data} />;
  }

  if (path === "/network") {
    return <NetworkView data={data} />;
  }

  if (path === "/analytics") {
    return (
      <>
        <PageHeader
          title="Pattern & Trend Analytics"
          description="Temporal fraud velocity, hourly ATM withdrawal concentration, and corridor risk distribution."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionPanel title="7-Day Complaint & Risk Trajectory" subtitle="Temporal Trend">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b111a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="complaints" stroke="#10b981" fill="url(#analyticsFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="risk" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionPanel>

          <SectionPanel title="Hourly Withdrawal Velocity Profile" subtitle="Circadian Risk">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b111a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="risk" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionPanel>
        </div>
      </>
    );
  }

  if (path === "/models") {
    return (
      <>
        <PageHeader
          title="Models & Evaluation Metrics"
          description="Cross-validated classification and spatial localization benchmarks across monitored grids."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Accuracy", data.modelMetrics.accuracy],
            ["Precision", data.modelMetrics.precision],
            ["Recall", data.modelMetrics.recall],
            ["F1-Score", data.modelMetrics.f1],
            ["ROC-AUC", data.modelMetrics.rocAuc],
            ["Top-1 Zone Hit", data.modelMetrics.top1],
            ["Top-3 Zone Hit", data.modelMetrics.top3],
            ["Population Coverage", data.modelMetrics.coverage],
          ].map(([label, value]) => (
            <StatTile
              key={label as string}
              label={label as string}
              value={`${(Number(value) * 100).toFixed(1)}%`}
              meta="Evaluated snapshot"
              accentClass="text-emerald-400"
            />
          ))}
        </div>
        <div className="mt-5">
          <SectionPanel title="Feature Importance Breakdown" subtitle="Model Explainability" noPadding>
            <DataTable
              headers={[{ label: "Model Feature" }, { label: "Relative Contribution Weight", align: "right" }]}
              rows={data.featureImportance.map((item) => [
                <span key={item.feature} className="font-medium text-slate-200">
                  {item.feature}
                </span>,
                <span className="font-mono font-semibold text-emerald-400">{item.value}%</span>,
              ])}
            />
          </SectionPanel>
        </div>
      </>
    );
  }

  if (path === "/data") {
    return (
      <>
        <PageHeader
          title="Data Governance & Provenance"
          description="Ingested telemetry pipelines, anonymization standards, and jurisdictional compliance controls."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Ingestion Pipeline" value="I4C / 1930" meta="Helpline & CFCFRMS feed" />
          <StatTile label="Records Evaluated" value={data.modelMetrics.evaluatedRows.toLocaleString()} meta="Correlated events" />
          <StatTile label="PII Masking" value="100%" meta="SHA-256 salted hashes" accentClass="text-emerald-400" />
          <StatTile label="Pipeline Health" value="Operational" meta="All 4 data feeds active" />
        </div>
        <div className="mt-5">
          <SectionPanel title="Privacy-by-Design Architecture" subtitle="Compliance">
            <p className="text-sm leading-7 text-slate-300">
              All complaint ingestion streams strip citizen PII at entry and replace account identifiers with irreversible cryptographic hashes. Risk correlation operates strictly on anonymized transaction velocity, mule layer depth, and corridor-level ATM densities under authorized law enforcement access controls.
            </p>
          </SectionPanel>
        </div>
      </>
    );
  }

  if (path === "/reports") {
    const exportComplaintsCsv = () => {
      const headers = ["ID", "Ack1930", "Timestamp", "District", "FraudType", "AmountINR", "Channel", "Zone", "MuleAccount", "Status", "Risk"];
      const lines = data.complaints.map((c) =>
        [c.id, c.ackNo1930, `"${c.time}"`, c.district, `"${c.type}"`, c.amount, c.channel, c.zone, c.muleAccountId, c.status, c.risk].join(",")
      );
      downloadFile("crimecast-complaints-export.csv", [headers.join(","), ...lines].join("\n"), "text/csv;charset=utf-8;");
      toast.success("Complaints CSV exported");
    };

    const exportIncidentBriefing = () => {
      const md = [
        "# CrimeCast AI · Operational Intelligence Briefing",
        `Generated: ${new Date().toISOString()}`,
        "",
        "## Executive Summary",
        `- Total 1930 Complaints: ${data.kpis.complaints}`,
        `- Active Cases: ${data.kpis.activeCases}`,
        `- CFCFRMS Frozen Balance: INR ${data.kpis.frozenExposureInr.toLocaleString()}`,
        "",
        "## Priority Risk Zones",
        ...data.zones.map(
          (z) => `- ${z.id} (${z.name}): ${z.risk}% risk · ${z.window} · Unit ${z.nearestPcrUnit} (${z.jurisdictionStation})`
        ),
        "",
        "## Flagged Mule Accounts",
        ...data.muleAccounts.map(
          (m) => `- ${m.id} (${m.bankName}): ${m.lienStatus} · Balance INR ${m.currentBalance.toLocaleString()} · Zone ${m.predictedZone}`
        ),
      ].join("\n");
      downloadFile("crimecast-incident-briefing.md", md, "text/markdown;charset=utf-8;");
      toast.success("Operational briefing downloaded");
    };

    return (
      <>
        <PageHeader
          title="Intelligence Reports & Export"
          description="Generate structured forensic exports and operational briefings with chain-of-custody provenance."
        />
        <SectionPanel title="Available Export Packages" subtitle="Authorized Downloads">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={exportIncidentBriefing}
              className="flex flex-col items-start rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5 text-left transition-colors hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <Download size={16} />
                Export Incident Intelligence Briefing (.MD)
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Includes priority ATM corridors, PCR dispatch assignments, and mule account lien summary.
              </p>
            </button>
            <button
              type="button"
              onClick={exportComplaintsCsv}
              className="flex flex-col items-start rounded-lg border border-slate-700 bg-[#0b111a] p-5 text-left transition-colors hover:bg-slate-800/70"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                <Download size={16} />
                Export 1930 Complaints Ledger (.CSV)
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Structured spreadsheet formatted for inter-agency cybercrime database reconciliation.
              </p>
            </button>
          </div>
          <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-200">
            Analytical outputs require supervising officer sign-off prior to judicial submission.
          </div>
        </SectionPanel>
      </>
    );
  }

  if (path === "/audit-logs" || path === "/audit") {
    return (
      <>
        <PageHeader
          title="Audit & Compliance Trail"
          description="Chronological record of operator actions, CFCFRMS liens, case transitions, and patrol dispatches."
        />
        <SectionPanel title="Activity Ledger" subtitle="Immutable Governance Log" noPadding>
          <DataTable
            headers={[{ label: "Timestamp" }, { label: "Officer / System" }, { label: "Action Performed" }, { label: "Scope" }]}
            rows={data.auditLogs.map((log, i) => [
              <span key={i} className="font-mono text-slate-400">
                {log.time}
              </span>,
              <span className="font-medium text-white">{log.actor}</span>,
              log.action,
              <span className="font-mono text-xs text-slate-300">{log.scope}</span>,
            ])}
          />
        </SectionPanel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Workspace Settings"
        description="Operator credentials, active division permissions, and console display configuration."
      />
      <SectionPanel title="Operator & Console Profile" subtitle="Active Configuration">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-[#0b111a] p-4">
            <div className="text-xs text-slate-400">Active Operating Division</div>
            <div className="font-display mt-1.5 text-lg font-semibold capitalize text-white">{role}</div>
            <div className="mt-1 text-xs text-emerald-400">Authenticated command session</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#0b111a] p-4">
            <div className="text-xs text-slate-400">Display Theme</div>
            <div className="font-display mt-1.5 text-lg font-semibold text-white">Dark Command Slate</div>
            <div className="mt-1 text-xs text-slate-400">High-contrast operational palette</div>
          </div>
        </div>
      </SectionPanel>
    </>
  );
}

export default function Workspace() {
  const [path, setLocation] = useLocation();
  const { user, switchRole, logout } = useAuth();
  const { data, isLoading, error, refetch } = trpc.intelligence.snapshot.useQuery();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [showLogComplaint, setShowLogComplaint] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const role = user?.role || "investigator";
  const nav = role === "analyst" ? analystNav : role === "admin" ? adminNav : investigatorNav;
  const allowed = useMemo(() => nav.map((item) => item[1]), [nav]);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || !data) return [];
    const results: { label: string; sub: string; href: string }[] = [];

    data.complaints.forEach((c) => {
      if (c.id.toLowerCase().includes(q) || c.ackNo1930.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)) {
        results.push({ label: `${c.id} · ${c.type}`, sub: `INR ${c.amount.toLocaleString()} · ${c.zone}`, href: `/complaints/${c.id}` });
      }
    });
    data.zones.forEach((z) => {
      if (z.id.toLowerCase().includes(q) || z.name.toLowerCase().includes(q)) {
        results.push({ label: `${z.id} · ${z.name}`, sub: `${z.risk}% risk · ${z.nearestPcrUnit}`, href: "/risk-map" });
      }
    });
    data.cases.forEach((c) => {
      if (c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) {
        results.push({ label: `${c.id} · ${c.title}`, sub: `${c.status} · ${c.assignee}`, href: `/cases/${c.id}` });
      }
    });
    return results.slice(0, 6);
  }, [searchTerm, data]);

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (path === "/") {
    return <Redirect to={`/${role}/dashboard`} />;
  }

  if (path === "/audit") {
    return <Redirect to="/audit-logs" />;
  }

  const basePath = path.split("/").slice(0, 2).join("/");
  if (!allowed.includes(path as never) && !path.endsWith("/dashboard") && !allowed.includes(basePath as never)) {
    return <Redirect to={`/${role}/dashboard`} />;
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b111a] text-sm text-slate-400">
        <RefreshCw className="mr-3 animate-spin text-emerald-400" size={18} />
        Loading intelligence workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b111a] text-sm text-red-300">
        <div>Unable to reach the intelligence service.</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const currentPath = path === "/" ? `/${role}/dashboard` : path;
  const currentTitle =
    titles[currentPath] ||
    (currentPath.startsWith("/complaints/")
      ? "Complaint Detail"
      : currentPath.startsWith("/cases/")
      ? "Case Detail"
      : "Dashboard");

  return (
    <div className="min-h-screen bg-[#0b111a] text-[#e9eff5]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800/80 bg-[#0e1520] transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-2.5">
            <Radar className="text-emerald-400" size={20} />
            <span className="font-display text-base font-semibold tracking-tight text-white whitespace-nowrap">
              CrimeCast AI
            </span>
          </div>
          <button type="button" className="text-slate-400 hover:text-white lg:hidden" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-800/80 p-3.5">
          <div className="mb-2 text-xs font-medium text-slate-400">Operating Division</div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-[#0b111a] p-1">
            {(["investigator", "analyst", "admin"] as WorkspaceRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  switchRole(r);
                  setLocation(`/${r}/dashboard`);
                  toast.success(`Switched to ${r} division`);
                }}
                className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                  role === r ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
          {nav.map(([label, href, Icon]) => {
            const active = currentPath === href;
            return (
              <Link
                key={`${label}-${href}`}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-emerald-500/12 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="text-xs font-semibold text-white">{user.name}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">
            {user.designation} · {user.badgeId}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              setLocation("/login");
            }}
            className="mt-3 flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-6 border-b border-slate-800/80 bg-[#0b111a]/95 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs whitespace-nowrap truncate">
              <span className="capitalize text-slate-400">{role}</span>
              <span className="text-slate-600">/</span>
              <span className="font-display font-semibold text-white">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, zone, case..."
                className="w-56 rounded-lg border border-slate-800 bg-[#111924] py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-slate-700 bg-[#111924] p-1.5 shadow-2xl">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocation(res.href);
                        setSearchTerm("");
                      }}
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <span className="text-xs font-medium text-white">{res.label}</span>
                      <span className="text-[11px] text-slate-400">{res.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSim(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 whitespace-nowrap shrink-0"
            >
              <Play size={12} fill="currentColor" />
              Run Forecast
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
          <RouteContent
            path={currentPath}
            data={data}
            role={role}
            onOpenSim={() => setShowSim(true)}
            onOpenComplaint={() => setShowLogComplaint(true)}
          />
        </div>
      </main>

      <SimulationModal
        open={showSim}
        onClose={() => setShowSim(false)}
        zones={data.zones}
        onCaseCreated={() => refetch()}
      />

      <LogComplaintModal
        open={showLogComplaint}
        onClose={() => setShowLogComplaint(false)}
        zones={data.zones}
        muleAccounts={data.muleAccounts}
      />
    </div>
  );
}
