import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { buildInitialSnapshot } from "./dataLoader";

const snapshot = buildInitialSnapshot();

function nowTimeStr() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  intelligence: router({
    snapshot: publicProcedure.query(() => structuredClone(snapshot)),

    updateAlert: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["NEW", "UNDER INVESTIGATION", "VERIFIED", "FALSE POSITIVE", "RESOLVED"]),
        })
      )
      .mutation(({ input }) => {
        const alert = snapshot.alerts.find((a) => a.id === input.id);
        if (alert) {
          alert.status = input.status;
          snapshot.kpis.activeAlerts =
            snapshot.alerts.filter((a) => a.status === "NEW" || a.status === "UNDER INVESTIGATION").length + 8;
          snapshot.auditLogs.unshift({
            time: nowTimeStr(),
            actor: "A. Rao",
            action: `Updated alert ${input.id} to ${input.status}`,
            scope: `Zone ${alert.zone}`,
          });
        }
        return { success: true, id: input.id, status: input.status };
      }),

    createCase: publicProcedure
      .input(z.object({ zone: z.string(), risk: z.number(), title: z.string().optional() }))
      .mutation(({ input }) => {
        const zoneObj = snapshot.zones.find((z) => z.id === input.zone);
        const caseId = `CASE-${Math.floor(1000 + Math.random() * 8999)}`;
        snapshot.cases.unshift({
          id: caseId,
          title:
            input.title ||
            (zoneObj ? `${zoneObj.id} · ${zoneObj.name} escalation` : `Zone ${input.zone} escalation`),
          zone: input.zone,
          risk: input.risk,
          status: "NEW",
          assignee: "A. Rao",
          updated: "Just now",
          complaints: zoneObj?.complaints || 5,
          pcrUnit: zoneObj?.nearestPcrUnit || "PCR-Delta-04",
        });
        snapshot.kpis.activeCases += 1;
        snapshot.auditLogs.unshift({
          time: nowTimeStr(),
          actor: "A. Rao",
          action: `Opened investigation case ${caseId}`,
          scope: `${input.zone} (${input.risk}% risk)`,
        });
        return { success: true, caseId, zone: input.zone };
      }),

    updateCaseStatus: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["NEW", "UNDER INVESTIGATION", "VERIFIED", "RESOLVED"]),
          assignee: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const found = snapshot.cases.find((c) => c.id === input.id);
        if (found) {
          const prevStatus = found.status;
          found.status = input.status;
          if (input.assignee) found.assignee = input.assignee;
          found.updated = "Just now";
          if (prevStatus !== "RESOLVED" && input.status === "RESOLVED") {
            snapshot.kpis.activeCases = Math.max(0, snapshot.kpis.activeCases - 1);
            snapshot.kpis.resolvedCases += 1;
          } else if (prevStatus === "RESOLVED" && input.status !== "RESOLVED") {
            snapshot.kpis.activeCases += 1;
            snapshot.kpis.resolvedCases = Math.max(0, snapshot.kpis.resolvedCases - 1);
          }
          snapshot.auditLogs.unshift({
            time: nowTimeStr(),
            actor: found.assignee,
            action: `Moved ${input.id} to ${input.status}`,
            scope: `Zone ${found.zone}`,
          });
        }
        return { success: true, id: input.id, status: input.status };
      }),

    logComplaint: publicProcedure
      .input(
        z.object({
          type: z.string().min(2),
          amount: z.number().min(100),
          channel: z.string().min(2),
          district: z.string().min(2),
          zone: z.string().min(2),
          muleAccountId: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const nextNum = 10483 + snapshot.complaints.length;
        const id = `CMP-${nextNum}`;
        const ackNo1930 = `219092600${nextNum}`;
        const zoneObj = snapshot.zones.find((z) => z.id === input.zone) || snapshot.zones[0];
        const risk = Math.min(97, Math.round((zoneObj?.risk || 70) * 0.7 + (input.amount >= 50000 ? 28 : 18)));
        const riskLevel = risk >= 80 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 40 ? "MEDIUM" : "LOW";
        const now = new Date();
        const timeStr = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
        const muleId = input.muleAccountId || snapshot.muleAccounts[0]?.id || "MULE-SBI-4891";

        const record = {
          id,
          ackNo1930,
          time: timeStr,
          rawTimestamp: now.toISOString(),
          district: input.district,
          state: "Telangana",
          type: input.type,
          amount: input.amount,
          channel: input.channel,
          lat: zoneObj?.lat || 17.412,
          lng: zoneObj?.lng || 78.452,
          zone: input.zone,
          status: "OPEN" as const,
          riskLevel: riskLevel as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          risk,
          hash: `cid_${Math.random().toString(16).slice(2, 12)}`,
          muleAccountId: muleId,
          goldenHourMins: 45,
        };

        snapshot.complaints.unshift(record);
        snapshot.transactions.unshift({
          id: `TXN-${78423 + snapshot.transactions.length}`,
          time: nowTimeStr().slice(0, 5),
          amount: input.amount,
          channel: input.channel,
          origin: input.zone,
          muleAccountId: muleId,
          linked: 3,
          velocity: risk >= 80 ? "4.4×" : "2.8×",
          signal: risk >= 80 ? "HIGH" : "MEDIUM",
        });

        snapshot.kpis.complaints += 1;
        snapshot.kpis.totalExposureInr += input.amount;
        snapshot.kpis.goldenHourUrgent += 1;
        if (risk >= 75) snapshot.kpis.highRiskTransactions += 1;
        if (zoneObj) {
          zoneObj.complaints += 1;
          zoneObj.risk = Math.min(98, zoneObj.risk + 1);
        }

        snapshot.auditLogs.unshift({
          time: nowTimeStr(),
          actor: "1930 Intake Desk",
          action: `Logged complaint ${id} (INR ${input.amount.toLocaleString()})`,
          scope: `Zone ${input.zone} · ${muleId}`,
        });

        return { success: true, complaint: record };
      }),

    updateComplaintStatus: publicProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["OPEN", "IN_REVIEW", "LIEN_PLACED", "RECOVERED", "CLOSED"]),
        })
      )
      .mutation(({ input }) => {
        const comp = snapshot.complaints.find((c) => c.id === input.id);
        if (comp) {
          comp.status = input.status;
          snapshot.auditLogs.unshift({
            time: nowTimeStr(),
            actor: "A. Rao",
            action: `Updated complaint ${input.id} status to ${input.status}`,
            scope: `Ack ${comp.ackNo1930}`,
          });
        }
        return { success: true, id: input.id, status: input.status };
      }),

    freezeMuleAccount: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const mule = snapshot.muleAccounts.find((m) => m.id === input.id);
        if (mule && mule.lienStatus !== "FROZEN_CFCFRMS") {
          mule.lienStatus = "FROZEN_CFCFRMS";
          snapshot.kpis.frozenExposureInr += mule.currentBalance;
          snapshot.auditLogs.unshift({
            time: nowTimeStr(),
            actor: "CFCFRMS Lien Desk",
            action: `Froze mule account ${mule.id} (${mule.bankName})`,
            scope: `INR ${mule.currentBalance.toLocaleString()} secured`,
          });
        }
        return { success: true, id: input.id, lienStatus: mule?.lienStatus ?? "FROZEN_CFCFRMS" };
      }),

    dispatchPcr: publicProcedure
      .input(z.object({ zoneId: z.string(), clusterId: z.string().optional() }))
      .mutation(({ input }) => {
        const zone = snapshot.zones.find((z) => z.id === input.zoneId);
        if (zone) {
          zone.dispatched = true;
        }
        if (input.clusterId) {
          const cluster = snapshot.atmClusters.find((c) => c.id === input.clusterId);
          if (cluster) cluster.dispatched = true;
        }
        const unit = zone?.nearestPcrUnit || "PCR-Delta-04";
        snapshot.auditLogs.unshift({
          time: nowTimeStr(),
          actor: "Dispatch Control",
          action: `Dispatched ${unit} for ATM corridor surveillance`,
          scope: input.clusterId ? `${input.zoneId} · ${input.clusterId}` : `Zone ${input.zoneId}`,
        });
        return { success: true, zoneId: input.zoneId, unit };
      }),

    runSimulation: publicProcedure
      .input(
        z.object({
          complaints: z.number(),
          hours: z.number(),
          volume: z.number(),
          zone: z.string(),
          pattern: z.string(),
        })
      )
      .mutation(({ input }) => {
        const zoneObj = snapshot.zones.find((z) => z.id === input.zone);
        const intensity = Math.min(
          97,
          Math.round(
            38 +
              input.complaints * 2.1 +
              input.volume * 0.12 +
              (input.pattern === "velocity" ? 14 : input.pattern === "network" ? 10 : 5)
          )
        );
        snapshot.auditLogs.unshift({
          time: nowTimeStr(),
          actor: "N. Mehta",
          action: `Ran ${input.hours}h predictive forecast (${intensity}% projected risk)`,
          scope: `Zone ${input.zone} · ${input.pattern}`,
        });
        return {
          forecast: true,
          primaryZone: input.zone,
          zoneName: zoneObj?.name || input.zone,
          pcrUnit: zoneObj?.nearestPcrUnit || "PCR-Delta-04",
          risk: intensity,
          confidence: Math.min(94, 62 + input.complaints),
          window: `Next ${input.hours} hours`,
          explanation: [
            `${input.complaints} correlated complaints clustered within ${input.hours}h window`,
            `${input.volume} anomalous transactions matching ${input.pattern} dispersal signature`,
            `ATM density & historical cash-out prior applied for ${zoneObj?.name || input.zone}`,
            `Recommended field unit: ${zoneObj?.nearestPcrUnit || "PCR-Delta-04"} (${zoneObj?.jurisdictionStation || "Cyber PS"})`,
          ],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
