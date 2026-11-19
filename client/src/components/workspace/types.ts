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

export type IntelligenceSnapshot = {
  kpis: {
    complaints: number;
    activeCases: number;
    highRiskTransactions: number;
    predictedLocations: number;
    activeAlerts: number;
    resolvedCases: number;
    totalExposureInr: number;
    frozenExposureInr: number;
    goldenHourUrgent: number;
  };
  zones: RiskZone[];
  atmClusters: AtmCluster[];
  muleAccounts: MuleAccount[];
  alerts: AlertItem[];
  complaints: ComplaintRecord[];
  transactions: TransactionItem[];
  trend: { day: string; complaints: number; risk: number; transactions: number }[];
  hourly: { hour: string; risk: number; volume: number }[];
  featureImportance: { feature: string; value: number }[];
  modelMetrics: {
    evaluatedRows: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    rocAuc: number;
    top1: number;
    top3: number;
    meanError: string;
    coverage: number;
  };
  cases: CaseItem[];
  auditLogs: AuditLogItem[];
};
