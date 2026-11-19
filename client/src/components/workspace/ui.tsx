import React from "react";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

export type RiskTone = "critical" | "high" | "medium" | "low" | "neutral";

export function getRiskTone(risk: number): RiskTone {
  if (risk >= 80) return "critical";
  if (risk >= 60) return "high";
  if (risk >= 40) return "medium";
  return "low";
}

export function StatusText({
  label,
  tone = "neutral",
  showIcon = true,
}: {
  label: string;
  tone?: RiskTone | "success" | "warning" | "danger";
  showIcon?: boolean;
}) {
  const colorClass =
    tone === "critical" || tone === "danger"
      ? "text-red-400"
      : tone === "high" || tone === "warning"
      ? "text-amber-400"
      : tone === "low" || tone === "success"
      ? "text-emerald-400"
      : tone === "medium"
      ? "text-sky-400"
      : "text-slate-400";

  const Icon =
    tone === "critical" || tone === "danger"
      ? ShieldAlert
      : tone === "high" || tone === "warning"
      ? AlertCircle
      : tone === "low" || tone === "success"
      ? CheckCircle2
      : Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${colorClass}`}>
      {showIcon && <Icon size={13} className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionPanel({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="surface-card rounded-xl">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/80 px-5 py-4">
        <div>
          {subtitle && <div className="text-xs font-medium text-emerald-400">{subtitle}</div>}
          <h2 className="font-display mt-0.5 text-base font-semibold text-white">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  meta,
  accentClass = "text-white",
}: {
  label: string;
  value: string | number;
  meta: string;
  accentClass?: string;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className={`font-display mt-2 text-2xl font-semibold tabular-nums ${accentClass}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{meta}</div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
  emptyTitle = "No matching records",
  emptyAction,
}: {
  headers: { label: string; align?: "left" | "right" }[];
  rows: React.ReactNode[][];
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-300">{emptyTitle}</p>
        <p className="mt-1 text-xs text-slate-500">Adjust active filters or ingest a new record to populate this queue.</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800/80 bg-[#0e1520] text-slate-400">
            {headers.map((h) => (
              <th
                key={h.label}
                className={`whitespace-nowrap px-4 py-3 font-medium ${
                  h.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {rows.map((row, idx) => (
            <tr key={idx} className="transition-colors hover:bg-slate-800/35">
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`whitespace-nowrap px-4 py-3 text-slate-300 tabular-nums ${
                    headers[cellIdx]?.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
