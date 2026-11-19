import fs from "node:fs";
import path from "node:path";

export type RiskZone = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  atmDensity: string;
  historicalFraudDensity: string;
  complaints: number;
  risk: number;
  confidence: number;
  similarity: number;
  window: string;
  nearestPcrUnit: string;
  jurisdictionStation: string;
  status: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dispatched: boolean;
  factors: string[];
};

export type AtmCluster = {
  id: string;
  zoneId: string;
  name: string;
  bankOperator: string;
  lat: number;
  lng: number;
  velocity: string;
  predictedWindow: string;
  cctvStatus: string;
  qrtUnit: string;
  station: string;
  dispatched: boolean;
};

export type MuleAccount = {
  id: string;
  bankName: string;
  ifscPrefix: string;
  alias: string;
  layerDepth: string;
  inflowAmount: number;
  outflowAmount: number;
  currentBalance: number;
  lienStatus: "FROZEN_CFCFRMS" | "ACTIVE_HIGH_RISK" | "PENDING_LIEN";
  firstFlaggedTime: string;
  linkedComplaintsCount: number;
  riskScore: number;
  predictedZone: string;
};

export type ComplaintRecord = {
  id: string;
  ackNo1930: string;
  time: string;
  rawTimestamp: string;
  district: string;
  state: string;
  type: string;
  amount: number;
  channel: string;
  lat: number;
  lng: number;
  zone: string;
  status: "OPEN" | "IN_REVIEW" | "LIEN_PLACED" | "RECOVERED" | "CLOSED";
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  risk: number;
  hash: string;
  muleAccountId: string;
  goldenHourMins: number;
};

export type AlertItem = {
  id: string;
  zone: string;
  title: string;
  risk: number;
  status: "NEW" | "UNDER INVESTIGATION" | "VERIFIED" | "FALSE POSITIVE" | "RESOLVED";
  time: string;
  reason: string;
  complaints: number;
  pcrUnit: string;
};

export type CaseItem = {
  id: string;
  title: string;
  zone: string;
  risk: number;
  status: "NEW" | "UNDER INVESTIGATION" | "VERIFIED" | "RESOLVED";
  assignee: string;
  updated: string;
  complaints: number;
  pcrUnit: string;
};

export type TransactionItem = {
  id: string;
  time: string;
  amount: number;
  channel: string;
  origin: string;
  muleAccountId: string;
  linked: number;
  velocity: string;
  signal: "HIGH" | "MEDIUM" | "LOW";
};

export type AuditLogItem = {
  time: string;
  actor: string;
  action: string;
  scope: string;
};

function parseCsv(fileName: string): Record<string, string>[] {
  const filePath = path.resolve(process.cwd(), "data", fileName);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    return row;
  });
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time}`;
}

function nearestZoneId(lat: number, lng: number, zones: RiskZone[]): string {
  if (zones.length === 0) return "H03";
  let best = zones[0];
  let bestDist = Infinity;
  for (const z of zones) {
    const d = (z.lat - lat) ** 2 + (z.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best.id;
}

function riskFromLevel(level: string, amount: number): number {
  const base = level === "CRITICAL" ? 89 : level === "HIGH" ? 73 : level === "MEDIUM" ? 54 : 31;
  const boost = amount >= 100000 ? 6 : amount >= 25000 ? 3 : 0;
  return Math.min(98, base + boost);
}

export function buildInitialSnapshot() {
  const zoneRows = parseCsv("risk_zones.csv");
  const atmRows = parseCsv("atm_clusters.csv");
  const muleRows = parseCsv("mule_accounts.csv");
  const complaintRows = parseCsv("complaints.csv");

  const atmClusters: AtmCluster[] = atmRows.map((r) => ({
    id: r.cluster_id,
    zoneId: r.zone_id,
    name: r.atm_name,
    bankOperator: r.bank_operator,
    lat: Number(r.latitude) || 17.412,
    lng: Number(r.longitude) || 78.452,
    velocity: r.hourly_withdrawal_velocity,
    predictedWindow: r.predicted_window,
    cctvStatus: r.surveillance_cctv,
    qrtUnit: r.quick_reaction_team,
    station: r.jurisdiction_station,
    dispatched: false,
  }));

  const muleAccounts: MuleAccount[] = muleRows.map((r) => ({
    id: r.mule_account_id,
    bankName: r.bank_name,
    ifscPrefix: r.ifsc_prefix,
    alias: r.account_holder_alias,
    layerDepth: r.layer_depth,
    inflowAmount: Number(r.inflow_amount) || 0,
    outflowAmount: Number(r.outflow_amount) || 0,
    currentBalance: Number(r.current_balance) || 0,
    lienStatus: (r.lien_status as MuleAccount["lienStatus"]) || "ACTIVE_HIGH_RISK",
    firstFlaggedTime: r.first_flagged_time,
    linkedComplaintsCount: Number(r.linked_complaints_count) || 0,
    riskScore: Number(r.risk_score) || 70,
    predictedZone: r.predicted_cashout_atm_zone || "H03",
  }));

  const zones: RiskZone[] = zoneRows.map((r) => {
    const risk = Number(r.risk_score) || 50;
    const status: RiskZone["status"] =
      risk >= 80 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 40 ? "MEDIUM" : "LOW";
    const zoneAtms = atmClusters.filter((a) => a.zoneId === r.zone_id);
    const zoneMules = muleAccounts.filter((m) => m.predictedZone === r.zone_id);
    const factors = [
      `${r.complaint_density} linked 1930 helpline complaints in ${r.district} corridor`,
      `${r.atm_density} ATM terminal concentration (${zoneAtms.length || 1} active cash-out clusters)`,
      zoneMules.length > 0
        ? `${zoneMules.length} active mule account hub(s) routing funds toward ${r.zone_id}`
        : `${r.historical_fraud_density} historical cash-out recurrence across prior cycles`,
      `Assigned unit ${r.nearest_pcr_unit} (${r.jurisdiction_police_stn}) within ${r.prediction_window.toLowerCase()}`,
    ];

    return {
      id: r.zone_id,
      name: r.zone_name,
      district: r.district,
      lat: Number(r.latitude) || 17.412,
      lng: Number(r.longitude) || 78.452,
      atmDensity: r.atm_density,
      historicalFraudDensity: r.historical_fraud_density,
      complaints: Number(r.complaint_density) || 0,
      risk,
      confidence: Number(r.model_confidence) || 75,
      similarity: Math.min(95, Math.round((Number(r.risk_score) || 60) * 0.92)),
      window: r.prediction_window,
      nearestPcrUnit: r.nearest_pcr_unit,
      jurisdictionStation: r.jurisdiction_police_stn,
      status,
      dispatched: false,
      factors,
    };
  });

  const complaints: ComplaintRecord[] = complaintRows.map((r) => {
    const lat = Number(r.latitude) || 17.412;
    const lng = Number(r.longitude) || 78.452;
    const amount = Number(r.transaction_amount) || 0;
    const riskLevel = (r.risk_level as ComplaintRecord["riskLevel"]) || "MEDIUM";
    return {
      id: r.complaint_id,
      ackNo1930: r.ack_no_1930,
      time: formatShortTime(r.timestamp),
      rawTimestamp: r.timestamp,
      district: r.district,
      state: r.state,
      type: r.fraud_type,
      amount,
      channel: r.transaction_channel,
      lat,
      lng,
      zone: nearestZoneId(lat, lng, zones),
      status: (r.status as ComplaintRecord["status"]) || "OPEN",
      riskLevel,
      risk: riskFromLevel(riskLevel, amount),
      hash: `cid_${r.victim_id_hash}`,
      muleAccountId: r.destination_mule_account,
      goldenHourMins: Number(r.golden_hour_mins_remaining) || 0,
    };
  });

  const alerts: AlertItem[] = zones
    .filter((z) => z.risk >= 50)
    .slice(0, 6)
    .map((z, idx) => ({
      id: `ALT-${2048 - idx}`,
      zone: z.id,
      title:
        z.risk >= 85
          ? `Critical cash-out surge · ${z.name}`
          : z.risk >= 65
          ? `High withdrawal velocity · ${z.name}`
          : `Elevated cluster activity · ${z.name}`,
      risk: z.risk,
      status: idx === 0 ? "NEW" : idx === 1 ? "UNDER INVESTIGATION" : idx === 2 ? "NEW" : "VERIFIED",
      time: idx === 0 ? "4 min ago" : idx === 1 ? "18 min ago" : idx === 2 ? "35 min ago" : "1 hr ago",
      reason: z.factors[0],
      complaints: z.complaints,
      pcrUnit: z.nearestPcrUnit,
    }));

  const transactions: TransactionItem[] = complaints.slice(0, 10).map((c, idx) => ({
    id: `TXN-${78422 - idx}`,
    time: c.time.split("·")[1]?.trim() || "22:00",
    amount: c.amount,
    channel: c.channel,
    origin: c.zone,
    muleAccountId: c.muleAccountId,
    linked: muleAccounts.find((m) => m.id === c.muleAccountId)?.linkedComplaintsCount || 2,
    velocity: c.risk >= 85 ? "4.6×" : c.risk >= 70 ? "3.2×" : "1.8×",
    signal: c.risk >= 80 ? "HIGH" : c.risk >= 55 ? "MEDIUM" : "LOW",
  }));

  const cases: CaseItem[] = [
    {
      id: "CASE-0091",
      title: "H03 Central Transit ATM cash-out ring",
      zone: "H03",
      risk: 92,
      status: "NEW",
      assignee: "A. Rao",
      updated: "4 min ago",
      complaints: 18,
      pcrUnit: "PCR-Delta-04",
    },
    {
      id: "CASE-0090",
      title: "H07 Secunderabad station mule aggregation",
      zone: "H07",
      risk: 84,
      status: "UNDER INVESTIGATION",
      assignee: "S. Iyer",
      updated: "18 min ago",
      complaints: 14,
      pcrUnit: "PCR-Echo-09",
    },
    {
      id: "CASE-0088",
      title: "H02 Panjagutta wallet layering chain",
      zone: "H02",
      risk: 68,
      status: "VERIFIED",
      assignee: "M. Khan",
      updated: "2 hr ago",
      complaints: 11,
      pcrUnit: "PCR-Bravo-02",
    },
    {
      id: "CASE-0084",
      title: "H09 Airport expressway card cloning trace",
      zone: "H09",
      risk: 42,
      status: "RESOLVED",
      assignee: "A. Rao",
      updated: "1 day ago",
      complaints: 5,
      pcrUnit: "PCR-Golf-03",
    },
  ];

  const totalExposureInr = complaints.reduce((acc, c) => acc + c.amount, 0);
  const frozenExposureInr = muleAccounts
    .filter((m) => m.lienStatus === "FROZEN_CFCFRMS")
    .reduce((acc, m) => acc + m.currentBalance, 0);

  return {
    kpis: {
      complaints: 1248 + complaints.length,
      activeCases: cases.filter((c) => c.status !== "RESOLVED").length + 35,
      highRiskTransactions: 96,
      predictedLocations: zones.length,
      activeAlerts: alerts.filter((a) => a.status === "NEW" || a.status === "UNDER INVESTIGATION").length + 8,
      resolvedCases: 214,
      totalExposureInr,
      frozenExposureInr,
      goldenHourUrgent: complaints.filter((c) => c.goldenHourMins > 0 && c.goldenHourMins <= 45).length,
    },
    zones,
    atmClusters,
    muleAccounts,
    alerts,
    complaints,
    transactions,
    trend: [
      { day: "17 Sep", complaints: 42, risk: 44, transactions: 112 },
      { day: "18 Sep", complaints: 51, risk: 49, transactions: 135 },
      { day: "19 Sep", complaints: 48, risk: 46, transactions: 126 },
      { day: "20 Sep", complaints: 67, risk: 61, transactions: 151 },
      { day: "21 Sep", complaints: 62, risk: 64, transactions: 173 },
      { day: "22 Sep", complaints: 74, risk: 74, transactions: 198 },
      { day: "23 Sep", complaints: 83, risk: 82, transactions: 224 },
    ],
    hourly: [
      { hour: "00:00", risk: 24, volume: 12 },
      { hour: "04:00", risk: 15, volume: 7 },
      { hour: "08:00", risk: 34, volume: 21 },
      { hour: "12:00", risk: 52, volume: 38 },
      { hour: "16:00", risk: 68, volume: 49 },
      { hour: "20:00", risk: 88, volume: 71 },
      { hour: "23:00", risk: 76, volume: 54 },
    ],
    featureImportance: [
      { feature: "Mule layer velocity & split depth", value: 28 },
      { feature: "Historical zone cash-out density", value: 23 },
      { feature: "1930 complaint temporal clustering", value: 18 },
      { feature: "ATM terminal proximity & corridor", value: 14 },
      { feature: "Golden-hour remaining window", value: 10 },
      { feature: "Channel & device fingerprint overlap", value: 7 },
    ],
    modelMetrics: {
      evaluatedRows: 1248 + complaints.length,
      accuracy: 0.842,
      precision: 0.814,
      recall: 0.786,
      f1: 0.80,
      rocAuc: 0.891,
      top1: 0.68,
      top3: 0.91,
      meanError: "1.9 km",
      coverage: 0.935,
    },
    cases,
    auditLogs: [
      { time: "22:18:04", actor: "A. Rao", action: "Reviewed alert ALT-2048 & golden-hour queue", scope: "Zone H03" },
      { time: "22:05:19", actor: "CFCFRMS Engine", action: "Placed statutory lien on MULE-SBI-4891", scope: "INR 88,000 held" },
      { time: "22:02:31", actor: "S. Iyer", action: "Escalated ALT-2047 to active investigation", scope: "Zone H07" },
      { time: "21:46:08", actor: "N. Mehta", action: "Executed spatial risk forecast", scope: "H03 · 2h window" },
      { time: "21:31:12", actor: "I4C Ingestion", action: "Ingested 1930 helpline complaint CMP-10480", scope: "Zone H02" },
      { time: "20:18:44", actor: "M. Khan", action: "Verified case file CASE-0088", scope: "Panjagutta PS" },
    ] as AuditLogItem[],
  };
}
