import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { CircleCheck, Clock3, DatabaseZap, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/data-health")({ component: DataHealth });

type HealthRow = {
  source: string;
  type: string;
  connectivity: number;
  freshness: string;
  completeness: number;
  sync: string;
  quality: "Good" | "Estimated" | "Stale";
  billing: "Ready" | "Review" | "Blocked";
};

function DataHealth() {
  const { metrics, feeders, billingTenants, scenario, scenarioState, site } = useSimulation();
  const [validationOpen, setValidationOpen] = useState(false);
  const rows = useMemo<HealthRow[]>(() => {
    const electricalRows = feeders.map((feeder, index) => ({
      source: `PM-${feeder.id}`,
      type: `${feeder.name} power meter`,
      connectivity: 99.92 - index * 0.012,
      freshness: "< 2 s",
      completeness: 99.84 - index * 0.025,
      sync: index % 3 === 0 ? "PTP · ±2 ms" : "NTP · ±18 ms",
      quality: "Good" as const,
      billing: "Ready" as const,
    }));
    const billingRows = billingTenants.map((tenant, index) => ({
      source: tenant.meter,
      type: `${tenant.name} allocation meter`,
      connectivity: tenant.quality === "Measured" ? 99.88 - index * 0.018 : 96.4,
      freshness: tenant.quality === "Measured" ? "< 5 s" : "7 min gap",
      completeness: tenant.quality === "Measured" ? 99.72 - index * 0.03 : 94.6,
      sync: tenant.quality === "Measured" ? "NTP · ±24 ms" : "NTP · recovered",
      quality: tenant.quality === "Measured" ? "Good" as const : "Estimated" as const,
      billing: tenant.quality === "Measured" ? "Ready" as const : "Blocked" as const,
    }));
    return [
      { source: "GW-ENERGY-01", type: "Industrial telemetry gateway", connectivity: 99.98, freshness: "< 1 s", completeness: metrics.dataHealth, sync: "PTP grandmaster", quality: "Good", billing: "Ready" },
      ...electricalRows,
      ...billingRows,
    ];
  }, [billingTenants, feeders, metrics.dataHealth]);
  const blocked = rows.filter((row) => row.billing === "Blocked").length;
  const review = rows.filter((row) => row.quality !== "Good").length;
  const online = rows.filter((row) => row.connectivity >= 98).length;
  const measuredShare = rows.filter((row) => row.quality === "Good").length / rows.length * 100;
  const estimatedShare = rows.filter((row) => row.quality === "Estimated").length / rows.length * 100;
  const blockedShare = rows.filter((row) => row.billing === "Blocked").length / rows.length * 100;
  const exception = rows.find((row) => row.billing === "Blocked");

  return (
    <AppShell title="Data Health & Provenance" subtitle={`${site.shortName} · telemetry trust remains independent from electrical power-quality state`}>
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-4">
        <KpiTile label="Overall Data Health" value={`${metrics.dataHealth.toFixed(1)}%`} tone={metrics.dataHealth >= 98 ? "good" : "warning"} context="quality-weighted telemetry" />
        <KpiTile label="Online Sources" value={`${online} / ${rows.length}`} hint="connectivity ≥98%" />
        <KpiTile label="Quality Review" value={String(review)} tone={review ? "warning" : "good"} hint="estimated or stale" />
        <KpiTile label="Billing Blockers" value={String(blocked)} tone={blocked ? "critical" : "good"} context="measurement quality rules" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Source Health Matrix" eyebrow="Telemetry domain" subtitle={scenario === "voltage-dip" ? `PQ scenario ${scenarioState.phase}; communication and data quality remain unchanged` : "Connectivity, freshness, completeness, synchronization, and billing readiness"} className="xl:col-span-8" padded={false}>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-[11.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Source</th><th className="py-2.5 font-normal">Type</th><th className="py-2.5 font-normal text-right">Connectivity</th><th className="py-2.5 font-normal text-right">Freshness</th><th className="py-2.5 font-normal text-right">Completeness</th><th className="py-2.5 font-normal">Time sync</th><th className="py-2.5 font-normal">Quality</th><th className="pr-4 py-2.5 font-normal">Billing</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.source} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="flex items-center gap-2"><DatabaseZap className={`size-3.5 ${row.quality === "Good" ? "text-green" : "text-amber"}`} /><span className="font-medium tabular">{row.source}</span></div></td><td className="py-3 text-muted-foreground">{row.type}</td><td className={`py-3 text-right tabular ${row.connectivity < 98 ? "text-amber" : "text-green"}`}>{row.connectivity.toFixed(2)}%</td><td className={`py-3 text-right tabular ${row.freshness.includes("gap") ? "text-amber" : ""}`}>{row.freshness}</td><td className={`py-3 text-right tabular ${row.completeness < 98 ? "text-amber" : ""}`}>{row.completeness.toFixed(2)}%</td><td className="py-3 text-muted-foreground">{row.sync}</td><td className="py-3"><StatusPill status={row.quality === "Good" ? "normal" : row.quality === "Stale" ? "warning" : "In review"} /></td><td className={`pr-4 py-3 ${row.billing === "Blocked" ? "text-red" : row.billing === "Review" ? "text-amber" : "text-muted-foreground"}`}>{row.billing}</td></tr>)}</tbody></table></div>
        </Panel>

        <Panel title="Data Trust Summary" eyebrow="Quality distribution" className="xl:col-span-4">
          <div className="space-y-3"><TrustItem icon={<CircleCheck className="size-4 text-green" />} title="Good sources" value={`${measuredShare.toFixed(1)}%`} body="Directly measured with current connectivity and accepted time synchronization." /><TrustItem icon={<Clock3 className="size-4 text-amber" />} title="Estimated sources" value={`${estimatedShare.toFixed(1)}%`} body="Estimated only during the billing validation scenario and never displayed as measured." /><TrustItem icon={<ShieldAlert className="size-4 text-red" />} title="Billing blocked" value={`${blockedShare.toFixed(1)}%`} body="Excluded from invoice approval until the source-quality exception is resolved." /></div>
          <div className="mt-5 rounded-md border border-primary/25 bg-primary/8 p-3 text-[10.5px] leading-relaxed text-muted-foreground"><span className="font-medium text-primary">Domain separation active.</span> A voltage dip changes electrical quality and alarm state, but does not reduce telemetry quality unless communication actually fails.</div>
        </Panel>

        <Panel title="Quality Timeline · July 2026" eyebrow="Exception calendar" className="xl:col-span-7">
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[9.5px] text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}</div><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const issue = blocked > 0 && day === 25; return <div key={index} className={`grid aspect-square place-items-center rounded-md border text-[10.5px] tabular ${day < 1 || day > 31 ? "border-transparent text-transparent" : issue ? "border-amber/35 bg-amber/10 text-amber" : "border-border bg-surface-2 text-muted-foreground"}`}>{day}</div>; })}</div>
        </Panel>

        <Panel title="Quality Exception" eyebrow="Billing control" className="xl:col-span-5" tone={exception ? "critical" : "default"}>
          {exception ? <div className="rounded-md border border-amber/30 bg-amber/8 p-4"><div className="flex items-center gap-2 text-amber"><ShieldAlert className="size-4" /><span className="text-[11.5px] font-medium">{exception.source} requires validation</span></div><div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">A seven-minute source gap created estimated billing intervals. The affected invoice remains blocked while electrical operations continue normally.</div><div className="mt-4 grid grid-cols-2 gap-3 text-[10.5px]"><div><div className="text-muted-foreground">Affected period</div><div className="mt-1 tabular">25 Jul · scenario validation</div></div><div><div className="text-muted-foreground">Completeness</div><div className="mt-1 tabular">{exception.completeness.toFixed(1)}%</div></div></div><button className="btn-primary mt-4" onClick={() => setValidationOpen(!validationOpen)}>{validationOpen ? "Close validation" : "Open validation"}</button>{validationOpen && <div className="mt-3 rounded-md border border-border bg-background/35 p-3 text-[10px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">Validation workspace opened</div><div className="mt-1">The estimated profile, raw source gap, calculation version, and approval state are ready for engineering review.</div></div>}</div> : <div className="flex min-h-48 flex-col items-center justify-center text-center"><CircleCheck className="size-8 text-green" /><div className="mt-3 text-[12px] font-medium">No billing-quality exception</div><div className="mt-1 max-w-72 text-[10.5px] leading-relaxed text-muted-foreground">All active allocation sources are measured, synchronized, and billing-ready.</div></div>}
        </Panel>
      </div>
    </AppShell>
  );
}

function TrustItem({ icon, title, value, body }: { icon: ReactNode; title: string; value: string; body: string }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2">{icon}<span className="text-[11px] font-medium">{title}</span><span className="ml-auto text-[12px] tabular">{value}</span></div><div className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{body}</div></div>;
}
