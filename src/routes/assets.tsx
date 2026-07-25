import { createFileRoute } from "@tanstack/react-router";
import { Boxes, CircleAlert, ShieldCheck, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/assets")({ component: Assets });

type AssetRow = {
  id: string;
  type: string;
  location: string;
  loading: number;
  health: number;
  capacity: number;
  alarm: "Normal" | "Warning" | "Critical";
  maintenance: string;
};

function Assets() {
  const { metrics, feeders, site, scenario, scenarioState } = useSimulation();
  const transformerLoading = metrics.currentPower / site.transformerCapacityMva * 100;
  const transformerSpare = Math.max(0, site.transformerCapacityMva * metrics.powerFactor - metrics.currentPower);
  const solarLoading = site.solarCapacityKw > 0 ? metrics.solarPower * 1_000 / site.solarCapacityKw * 100 : 0;
  const utilityAssets: AssetRow[] = [
    { id: "TX-01", type: "Transformer", location: "Main Substation", loading: transformerLoading, health: transformerLoading > 88 ? 84 : 96, capacity: transformerSpare, alarm: transformerLoading > 95 ? "Critical" : transformerLoading > 85 ? "Warning" : "Normal", maintenance: "112 days" },
    { id: "PV-INV-01", type: "Solar Inverter Group", location: "Rooftop PV", loading: solarLoading, health: 97, capacity: Math.max(0, (site.solarCapacityKw - metrics.solarPower * 1_000) / 1_000), alarm: "Normal", maintenance: "74 days" },
    ...feeders.slice(0, 6).map((feeder, index) => {
      const efficiencyAffected = scenario === "efficiency" && scenarioState.eventActive && (feeder.kind === "compressed-air" || feeder.kind === "cooling");
      return {
        id: feeder.id,
        type: feeder.name,
        location: "Main Distribution",
        loading: feeder.load,
        health: efficiencyAffected ? 78 : Math.max(82, 98 - index * 2 - Math.max(0, feeder.load - 80) * 0.2),
        capacity: Math.max(0, (feeder.ratedKw - feeder.kw) / 1_000),
        alarm: feeder.status === "critical" ? "Critical" : feeder.status === "warning" || efficiencyAffected ? "Warning" : "Normal",
        maintenance: `${35 + index * 18} days`,
      } satisfies AssetRow;
    }),
  ];
  const warning = utilityAssets.filter((asset) => asset.alarm !== "Normal").length;
  const averageHealth = utilityAssets.reduce((sum, asset) => sum + asset.health, 0) / utilityAssets.length;
  const availableCapacity = utilityAssets.reduce((sum, asset) => sum + asset.capacity, 0);
  const priorities = [...utilityAssets].sort((a, b) => a.health - b.health).slice(0, 4);
  const outlook = Array.from({ length: 12 }, (_, index) => Math.min(98, transformerLoading + index * (site.type === "Data Center" ? 1.15 : site.type === "Manufacturing" ? 0.78 : 0.56)));

  return (
    <AppShell title="Asset & Capacity Intelligence" subtitle={`${site.shortName} · live loading, spare capacity, and scenario-linked condition`}>
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-4">
        <KpiTile label="Tracked Assets" value={String(utilityAssets.length)} hint="engine-linked critical assets" />
        <KpiTile label="Average Health" value={`${averageHealth.toFixed(0)}%`} tone={averageHealth > 90 ? "good" : "warning"} />
        <KpiTile label="Available Capacity" value={availableCapacity.toFixed(2)} unit="MW" context="transformer + modeled assets" />
        <KpiTile label="Needs Attention" value={String(warning)} tone={warning ? "warning" : "good"} hint="condition or loading" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Critical Asset Portfolio" eyebrow="Live model output" subtitle="Loading and spare capacity reconcile with feeder and transformer state" className="xl:col-span-8" padded={false}>
          <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-[11.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Asset</th><th className="py-2.5 font-normal">Location</th><th className="py-2.5 font-normal text-right">Loading</th><th className="py-2.5 font-normal text-right">Health</th><th className="py-2.5 font-normal text-right">Spare</th><th className="py-2.5 font-normal">Status</th><th className="pr-4 py-2.5 font-normal">Maintenance</th></tr></thead><tbody className="divide-y divide-border">{utilityAssets.map((asset) => <tr key={asset.id} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-md border border-border bg-surface-2 text-primary"><Boxes className="size-4" /></div><div><div className="font-medium">{asset.id}</div><div className="text-[9.5px] text-muted-foreground">{asset.type}</div></div></div></td><td className="py-3 text-muted-foreground">{asset.location}</td><td className={`py-3 text-right tabular ${asset.loading > 85 ? "text-amber" : ""}`}>{asset.loading.toFixed(1)}%</td><td className={`py-3 text-right tabular ${asset.health < 82 ? "text-amber" : "text-green"}`}>{asset.health.toFixed(0)}%</td><td className="py-3 text-right tabular">{asset.capacity.toFixed(2)} MW</td><td className="py-3"><StatusPill status={asset.alarm === "Normal" ? "normal" : asset.alarm === "Warning" ? "warning" : "critical"} /></td><td className="pr-4 py-3 text-muted-foreground">{asset.maintenance}</td></tr>)}</tbody></table></div>
        </Panel>

        <Panel title="Condition Priorities" eyebrow="Scenario-aware health" className="xl:col-span-4">
          <div className="space-y-3">{priorities.map((asset, index) => <div key={asset.id} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2"><span className="text-[9.5px] tabular text-muted-foreground">0{index + 1}</span><span className="text-[11.5px] font-medium">{asset.id} · {asset.type}</span>{asset.health < 82 && <CircleAlert className="ml-auto size-3.5 text-amber" />}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full ${asset.health < 82 ? "bg-amber" : "bg-green"}`} style={{ width: `${asset.health}%` }} /></div><div className="mt-2 flex justify-between text-[9.5px] text-muted-foreground"><span>Health {asset.health.toFixed(0)}%</span><span>Maintenance {asset.maintenance}</span></div></div>)}</div>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/8 p-3"><Wrench className="mt-0.5 size-4 text-primary" /><div><div className="text-[11px] font-medium">Maintenance recommendation</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{scenario === "efficiency" && scenarioState.eventActive ? "Inspect the affected cooling or compressed-air asset after validating the normalized efficiency drift." : "No scenario-specific urgent maintenance action. Continue condition-based inspection schedule."}</div></div></div>
        </Panel>

        <Panel title="Transformer Capacity Snapshot" eyebrow="Electrical balance source" className="xl:col-span-7">
          <div className="rounded-md border border-border bg-surface-2 p-4"><div className="flex items-center justify-between"><div><div className="text-[12px] font-medium">TX-01 · {site.transformerCapacityMva.toFixed(1)} MVA</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">{site.shortName} main distribution transformer</div></div><ShieldCheck className={`size-4 ${transformerLoading < 85 ? "text-green" : "text-amber"}`} /></div><div className="mt-4 grid grid-cols-4 gap-3 text-[10.5px]"><div><div className="text-muted-foreground">Loading</div><div className="mt-1 tabular font-medium">{transformerLoading.toFixed(1)}%</div></div><div><div className="text-muted-foreground">Spare</div><div className="mt-1 tabular font-medium">{transformerSpare.toFixed(2)} MW</div></div><div><div className="text-muted-foreground">Loss</div><div className="mt-1 tabular font-medium">{metrics.transformerLossKw.toFixed(0)} kW</div></div><div><div className="text-muted-foreground">Power factor</div><div className="mt-1 tabular font-medium">{metrics.powerFactor.toFixed(2)}</div></div></div></div>
        </Panel>

        <Panel title="Capacity Outlook" eyebrow="Planning projection" className="xl:col-span-5">
          <div className="flex h-36 items-end gap-2 border-b border-border px-2">{outlook.map((value, index) => <div key={index} className={`flex-1 rounded-t-sm ${value > 85 ? "bg-amber" : "bg-primary"}`} style={{ height: `${value}%`, opacity: 0.55 + index * 0.025 }} />)}</div><div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>Jul 2026</span><span>Forecast · Jun 2027</span></div><div className="mt-4 text-[10.5px] leading-relaxed text-muted-foreground">The projection begins at the current reconciled transformer loading of {transformerLoading.toFixed(1)}%, then applies the site-type planning growth model.</div>
        </Panel>
      </div>
    </AppShell>
  );
}
