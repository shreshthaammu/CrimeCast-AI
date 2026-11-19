import { useMemo, useState } from "react";
import { BriefcaseBusiness, Lock, MapPin, Play, Radio, ShieldCheck, ZoomIn, ZoomOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { IntelligenceSnapshot } from "./types";
import { DataTable, PageHeader, SectionPanel, StatTile, StatusText, getRiskTone } from "./ui";

export function RiskMapView({
  data,
  onOpenSim,
}: {
  data: IntelligenceSnapshot;
  onOpenSim: () => void;
}) {
  const [selectedZone, setSelectedZone] = useState<string>(data.zones[0]?.id || "H03");
  const [showAtms, setShowAtms] = useState(true);
  const [zoom, setZoom] = useState(1);

  const utils = trpc.useUtils();
  const createCase = trpc.intelligence.createCase.useMutation();
  const dispatchPcr = trpc.intelligence.dispatchPcr.useMutation();

  const selected = data.zones.find((z) => z.id === selectedZone) || data.zones[0];
  const zoneAtms = useMemo(
    () => data.atmClusters.filter((a) => a.zoneId === selected?.id),
    [data.atmClusters, selected?.id]
  );

  const handleEscalate = () => {
    if (!selected) return;
    createCase.mutate(
      { zone: selected.id, risk: selected.risk },
      {
        onSuccess: (res) => {
          toast.success(`Case ${res.caseId} opened`, {
            description: `Zone ${selected.id} assigned to investigation queue.`,
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const handleDispatch = (clusterId?: string) => {
    if (!selected) return;
    dispatchPcr.mutate(
      { zoneId: selected.id, clusterId },
      {
        onSuccess: (res) => {
          toast.success(`Unit ${res.unit} dispatched`, {
            description: clusterId
              ? `Surveillance alert sent to ${clusterId} in Zone ${res.zoneId}.`
              : `PCR patrol routed to ${selected.name}.`,
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const projectCoord = (lat: number, lng: number) => {
    const x = 14 + ((lng - 78.33) / 0.18) * 72;
    const y = 84 - ((lat - 17.34) / 0.12) * 68;
    return { x: Math.min(92, Math.max(8, x)), y: Math.min(90, Math.max(10, y)) };
  };

  return (
    <>
      <PageHeader
        title="Geographic Risk & ATM Surveillance Grid"
        description="Spatial correlation of 1930 complaint density, mule cash-out windows, and ATM cluster telemetry across monitored corridors."
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowAtms((v) => !v)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                showAtms
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                  : "border-slate-700 bg-[#111924] text-slate-300 hover:text-white"
              }`}
            >
              {showAtms ? "Hide ATM Clusters" : "Show ATM Clusters"}
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

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <SectionPanel
          title="Hyderabad & Cyberabad Regional Risk Grid"
          subtitle="Live Spatial Telemetry"
          action={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))))}
                aria-label="Zoom out"
                className="rounded-md border border-slate-700 bg-[#0b111a] p-1.5 text-slate-300 hover:text-white"
              >
                <ZoomOut size={14} />
              </button>
              <span className="font-mono text-xs text-slate-400 tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
                aria-label="Zoom in"
                className="rounded-md border border-slate-700 bg-[#0b111a] p-1.5 text-slate-300 hover:text-white"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          }
        >
          <div
            className="relative h-[470px] overflow-hidden rounded-lg border border-slate-800 bg-[#0c141f]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            <div
              className="relative h-full w-full transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <svg viewBox="0 0 800 470" className="pointer-events-none absolute inset-0 h-full w-full opacity-45">
                <path
                  d="M 40 90 C 180 65, 290 140, 420 110 S 620 80, 760 145 M 30 240 C 160 205, 310 265, 450 220 S 630 230, 770 285 M 70 390 C 210 345, 360 400, 520 365 S 680 350, 755 395"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1.8"
                />
                <path
                  d="M 190 20 C 175 130, 210 240, 195 450 M 440 15 C 460 140, 420 270, 455 455 M 630 25 C 610 150, 645 290, 620 450"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
              </svg>

              {showAtms &&
                data.atmClusters.map((atm) => {
                  const pos = projectCoord(atm.lat, atm.lng);
                  const activeZone = atm.zoneId === selected?.id;
                  return (
                    <div
                      key={atm.id}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      title={`${atm.id}: ${atm.name} (${atm.velocity})`}
                      className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity ${
                        activeZone ? "z-10 opacity-95" : "z-0 opacity-45"
                      }`}
                    >
                      <div className="h-2.5 w-2.5 rotate-45 border border-sky-300 bg-sky-500/80" />
                    </div>
                  );
                })}

              {data.zones.map((z) => {
                const isSelected = selected?.id === z.id;
                const pos = projectCoord(z.lat, z.lng);
                const nodeColor =
                  z.risk >= 80
                    ? "border-red-300 bg-red-500 text-white"
                    : z.risk >= 60
                    ? "border-amber-200 bg-amber-500 text-slate-950"
                    : z.risk >= 40
                    ? "border-sky-200 bg-sky-500 text-slate-950"
                    : "border-emerald-200 bg-emerald-500 text-slate-950";

                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZone(z.id)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
                      isSelected ? "z-30 scale-115" : "z-20 hover:scale-110"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-xs font-bold shadow-lg ${nodeColor} ${
                        isSelected ? "ring-4 ring-emerald-400/35" : ""
                      }`}
                    >
                      {z.id}
                    </div>
                    <div
                      className={`mt-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                        isSelected
                          ? "border-emerald-400 bg-[#0b111a] text-emerald-300"
                          : "border-slate-700 bg-[#0b111a]/95 text-slate-200"
                      }`}
                    >
                      {z.risk}%
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-4 rounded-lg border border-slate-800 bg-[#0b111a]/95 px-3.5 py-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical (80%+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> High (60–79%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Medium (40–59%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rotate-45 bg-sky-400" /> ATM Cluster
              </span>
            </div>
          </div>
        </SectionPanel>

        {selected && (
          <SectionPanel subtitle="Zone Intelligence" title={`${selected.id} · ${selected.name}`}>
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="text-xs text-slate-400">Predicted Cash-Out Risk</div>
                <div className="font-display mt-1 text-4xl font-semibold text-white tabular-nums">
                  {selected.risk}%
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {selected.district} · {selected.window}
                </div>
              </div>
              <div className="text-right">
                <StatusText label={selected.status} tone={getRiskTone(selected.risk)} />
                <div className="mt-1.5 font-mono text-xs text-emerald-400 tabular-nums">
                  {selected.confidence}% confidence
                </div>
                <div className="mt-0.5 text-xs text-slate-500">ATM Density: {selected.atmDensity}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-b border-slate-800/80 pb-4">
              <div className="text-xs font-medium text-slate-400">Explainable Risk Drivers</div>
              {selected.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                  <span className="font-mono text-emerald-400 tabular-nums">{i + 1}.</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Field Unit</span>
                <span className="font-mono font-medium text-white">{selected.nearestPcrUnit}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Jurisdiction Station</span>
                <span className="text-slate-200">{selected.jurisdictionStation}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDispatch()}
                disabled={dispatchPcr.isPending || selected.dispatched}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:bg-emerald-500/20 disabled:text-emerald-300"
              >
                <Radio size={14} />
                {selected.dispatched
                  ? `${selected.nearestPcrUnit} Dispatched`
                  : `Dispatch ${selected.nearestPcrUnit} to ${selected.id}`}
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={createCase.isPending}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0b111a] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                <BriefcaseBusiness size={14} />
                Open Investigation Case for {selected.id}
              </button>
            </div>
          </SectionPanel>
        )}
      </div>

      <div className="mt-5">
        <SectionPanel
          title={`ATM Surveillance Clusters · Zone ${selected?.id}`}
          subtitle="Predicted Cash-Out Terminals"
          noPadding
        >
          <DataTable
            headers={[
              { label: "Cluster ID" },
              { label: "ATM Location" },
              { label: "Operator" },
              { label: "Velocity" },
              { label: "Cash-Out Window" },
              { label: "CCTV Link" },
              { label: "QRT / ETA" },
              { label: "Action", align: "right" },
            ]}
            rows={(zoneAtms.length > 0 ? zoneAtms : data.atmClusters.slice(0, 4)).map((atm) => [
              <span key={atm.id} className="font-mono font-medium text-white">
                {atm.id}
              </span>,
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin size={12} className="text-slate-400" />
                {atm.name}
              </span>,
              atm.bankOperator,
              <span className="font-mono font-medium text-amber-400">{atm.velocity}</span>,
              <span className="font-mono text-slate-300">{atm.predictedWindow}</span>,
              <StatusText
                label={atm.cctvStatus}
                tone={atm.cctvStatus.includes("Active") ? "success" : "warning"}
              />,
              atm.qrtUnit,
              <button
                key={`btn-${atm.id}`}
                type="button"
                onClick={() => handleDispatch(atm.id)}
                disabled={atm.dispatched}
                className="rounded-md border border-slate-700 bg-[#0b111a] px-2.5 py-1 text-xs font-medium text-emerald-300 hover:border-emerald-500/50 disabled:opacity-50"
              >
                {atm.dispatched ? "Alert Sent" : "Alert QRT"}
              </button>,
            ])}
          />
        </SectionPanel>
      </div>
    </>
  );
}

export function NetworkView({ data }: { data: IntelligenceSnapshot }) {
  const utils = trpc.useUtils();
  const freezeMule = trpc.intelligence.freezeMuleAccount.useMutation();

  const handleFreeze = (id: string) => {
    freezeMule.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success(`CFCFRMS Lien placed on ${id}`, {
            description: "Account balance frozen pending judicial recovery order.",
          });
          utils.intelligence.snapshot.invalidate();
        },
      }
    );
  };

  const layer1 = data.muleAccounts.filter((m) => m.layerDepth.includes("Layer 1"));
  const layer2 = data.muleAccounts.filter((m) => m.layerDepth.includes("Layer 2"));
  const layer3 = data.muleAccounts.filter((m) => m.layerDepth.includes("Layer 3"));

  return (
    <>
      <PageHeader
        title="Mule Account & Layering Topology"
        description="Multi-hop fund dispersal graph linking 1930 victim inflows, aggregator mule accounts, CFCFRMS lien holds, and terminal cash-out zones."
      />

      <SectionPanel title="Fund Layering Flow" subtitle="Transaction Graph">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border-b border-slate-800 pb-4 md:border-b-0 md:border-r md:pr-4">
            <div className="text-xs font-medium text-sky-400">01. Victim Intake (1930)</div>
            <div className="mt-3 space-y-2.5">
              {data.complaints.slice(0, 3).map((c) => (
                <div key={c.id} className="border-b border-slate-800/60 pb-2 text-xs last:border-0">
                  <div className="flex justify-between font-mono text-white">
                    <span>{c.id}</span>
                    <span>INR {c.amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-0.5 text-slate-400">{c.type}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-800 pb-4 md:border-b-0 md:border-r md:pr-4">
            <div className="text-xs font-medium text-amber-400">02. Layer 1 Direct Inflow</div>
            <div className="mt-3 space-y-2.5">
              {layer1.map((m) => (
                <div key={m.id} className="border-b border-slate-800/60 pb-2 text-xs last:border-0">
                  <div className="font-mono font-medium text-white">{m.id}</div>
                  <div className="mt-0.5 text-slate-400">
                    {m.bankName} · Zone {m.predictedZone}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-800 pb-4 md:border-b-0 md:border-r md:pr-4">
            <div className="text-xs font-medium text-red-400">03. Layer 2 & 3 Hubs</div>
            <div className="mt-3 space-y-2.5">
              {[...layer2, ...layer3].map((m) => (
                <div key={m.id} className="border-b border-slate-800/60 pb-2 text-xs last:border-0">
                  <div className="font-mono font-medium text-white">{m.id}</div>
                  <div className="mt-0.5 text-slate-400">
                    {m.layerDepth} · {m.riskScore}% risk
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-emerald-400">04. Terminal ATM Zones</div>
            <div className="mt-3 space-y-2.5">
              {data.zones.slice(0, 3).map((z) => (
                <div key={z.id} className="border-b border-slate-800/60 pb-2 text-xs last:border-0">
                  <div className="flex justify-between font-mono text-white">
                    <span>{z.id}</span>
                    <span className="text-red-400">{z.risk}%</span>
                  </div>
                  <div className="mt-0.5 text-slate-400">
                    {z.name} · {z.nearestPcrUnit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      <div className="mt-5">
        <SectionPanel title="Flagged Mule Accounts & CFCFRMS Lien Control" subtitle="Active Entities" noPadding>
          <DataTable
            headers={[
              { label: "Mule Account ID" },
              { label: "Bank / IFSC" },
              { label: "Layer Depth" },
              { label: "Inflow", align: "right" },
              { label: "Hold Balance", align: "right" },
              { label: "Target Zone" },
              { label: "Lien Status" },
              { label: "Action", align: "right" },
            ]}
            rows={data.muleAccounts.map((m) => [
              <div key={m.id}>
                <div className="font-mono font-medium text-white">{m.id}</div>
                <div className="text-[11px] text-slate-500">{m.alias}</div>
              </div>,
              <div>
                <div className="text-slate-200">{m.bankName}</div>
                <div className="font-mono text-[11px] text-slate-500">{m.ifscPrefix}</div>
              </div>,
              m.layerDepth,
              <span className="font-mono text-slate-200">INR {m.inflowAmount.toLocaleString()}</span>,
              <span className="font-mono font-medium text-emerald-400">
                INR {m.currentBalance.toLocaleString()}
              </span>,
              <span className="font-mono text-white">{m.predictedZone}</span>,
              <StatusText
                label={m.lienStatus.replaceAll("_", " ")}
                tone={
                  m.lienStatus === "FROZEN_CFCFRMS"
                    ? "success"
                    : m.lienStatus === "ACTIVE_HIGH_RISK"
                    ? "danger"
                    : "warning"
                }
              />,
              m.lienStatus === "FROZEN_CFCFRMS" ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <ShieldCheck size={13} /> Secured
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFreeze(m.id)}
                  disabled={freezeMule.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/25"
                >
                  <Lock size={12} /> Place Lien
                </button>
              ),
            ])}
          />
        </SectionPanel>
      </div>
    </>
  );
}
