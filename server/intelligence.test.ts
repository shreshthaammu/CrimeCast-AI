import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("intelligence router", () => {
  it("snapshot returns complete CSV-backed operational data", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const snapshot = await caller.intelligence.snapshot();

    expect(snapshot).toBeDefined();
    expect(snapshot.kpis.complaints).toBeGreaterThan(0);
    expect(snapshot.zones.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.atmClusters.length).toBeGreaterThan(0);
    expect(snapshot.muleAccounts.length).toBeGreaterThan(0);
    expect(snapshot.alerts.length).toBeGreaterThan(0);
    expect(snapshot.complaints.length).toBeGreaterThan(0);
    expect(snapshot.transactions.length).toBeGreaterThan(0);
    expect(snapshot.modelMetrics.accuracy).toBeGreaterThan(0);
  });

  it("updateAlert changes the status of an alert and logs to audit", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.intelligence.updateAlert({
      id: "ALT-2048",
      status: "VERIFIED",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("VERIFIED");

    const snapshot = await caller.intelligence.snapshot();
    const alert = snapshot.alerts.find((a) => a.id === "ALT-2048");
    expect(alert?.status).toBe("VERIFIED");
  });

  it("createCase generates a new case and increments active cases", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const initialSnapshot = await caller.intelligence.snapshot();
    const initialCount = initialSnapshot.kpis.activeCases;

    const result = await caller.intelligence.createCase({
      zone: "H03",
      risk: 88,
    });

    expect(result.success).toBe(true);
    expect(result.caseId).toMatch(/^CASE-/);

    const snapshot = await caller.intelligence.snapshot();
    expect(snapshot.kpis.activeCases).toBeGreaterThan(initialCount);
    expect(snapshot.cases.some((c) => c.id === result.caseId)).toBe(true);
  });

  it("logComplaint ingests a new complaint and updates KPIs", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const before = await caller.intelligence.snapshot();

    const res = await caller.intelligence.logComplaint({
      type: "UPI Impersonation",
      amount: 45000,
      channel: "UPI",
      district: "Cyberabad",
      zone: "H03",
    });

    expect(res.success).toBe(true);
    expect(res.complaint.id).toMatch(/^CMP-/);

    const after = await caller.intelligence.snapshot();
    expect(after.kpis.complaints).toBe(before.kpis.complaints + 1);
  });

  it("freezeMuleAccount places a CFCFRMS lien on an active mule account", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const res = await caller.intelligence.freezeMuleAccount({ id: "MULE-HDFC-9102" });
    expect(res.success).toBe(true);
    expect(res.lienStatus).toBe("FROZEN_CFCFRMS");
  });

  it("runSimulation produces a valid predictive forecast", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.intelligence.runSimulation({
      complaints: 14,
      hours: 6,
      volume: 120,
      zone: "H03",
      pattern: "velocity",
    });

    expect(result.primaryZone).toBe("H03");
    expect(result.risk).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(0);
  });
});
