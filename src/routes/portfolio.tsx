import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Building2, CircleAlert, Factory, Server } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";
import { buildSimulationSnapshot, demoSites, type DemoSiteId } from "@/lib/simulation-engine";

export const Route = createFileRoute("/portfolio")({ component: Portfolio });

const typeIcons = { Manufacturing: Factory, "Data Center": Server, "Commercial Campus": Building2 };
const opportunityBySite: Record<DemoSiteId, number> = {
  cikarang: 943_900_000,
  "batam-dc": 612_000_000,
  "surabaya-campus": 388_000_000,
};

function Portfolio() {
  const { now, siteId, scenario, scenarioState } = useSimulation();
  const portfolioSites = (Object.keys(demoSites) as DemoSiteId[]).map((id) => {
    const profile = demoSites[id];
    const activeScenario = id === siteId ? scenario : "normal";
    const elapsed = id === siteId ? scenarioState.elapsedSeconds : 0;
    const snapshot = buildSimulationSnapshot({
      siteId: id,
      now,
      scenario: activeScenario,
      scenarioElapsedSeconds: elapsed,
      timeScale: 1,
      responseIds: [],
      acknowledgedIds: new Set(),
    });
    const intensity = profile.type === "Data Center"
      ? snapshot.metrics.currentPower / Math.max(snapshot.feeders.filter((item) => item.kind === "it-load").reduce((sum, item) => sum + item.kw, 0) / 1_000, 0.1)
      : profile.type === "Manufacturing"
        ? snapshot.metrics.currentPower * 1_000 / 94
        : snapshot.metrics.currentPower * 1_000 / 82;
    const demandRatio = snapshot.metrics.projectedDemand / snapshot.metrics.demandLimit;
    const state = snapshot.metrics.criticalAlarms > 0 || demandRatio > 1 ? "Attention" : demandRatio > 0.92 ? "Review" : "On target";
    const costVariance = profile.type === "Data Center" ? -2.4 : profile.type === "Manufacturing" ? -4.5 : 1.8;
    return {
      id,
      name: profile.name,
      type: profile.type,
      power: snapshot.metrics.currentPower,
      intensity,
      costVariance,
      savings: profile.verifiedSavingsIdr,
      opportunity: opportunityBySite[id],
      alarms: snapshot.metrics.activeAlarms,
      state,
      demandRatio,
      renewable: snapshot.metrics.renewableShare,
    };
  });
  const totalPower = portfolioSites.reduce((sum, site) => sum + site.power, 0);
  const savings = portfolioSites.reduce((sum, site) => sum + site.savings, 0);
  const opportunity = portfolioSites.reduce((sum, site) => sum + site.opportunity, 0);
  const attention = portfolioSites.filter((site) => site.state !== "On target").length;

  return (
    <AppShell title="Enterprise Portfolio" subtitle="Site-specific performance, demand risk, and verified value from the shared simulation clock">
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-4">
        <KpiTile label="Connected Sites" value={String(portfolioSites.length)} hint="3 operational archetypes" />
        <KpiTile label="Live Portfolio Load" value={totalPower.toFixed(2)} unit="MW" context="sum of reconciled site loads" />
        <KpiTile label="Verified Savings" value={fmtIDR(savings)} tone="good" hint="stable annualized ledger" />
        <KpiTile label="Open Opportunity" value={fmtIDR(opportunity)} tone={attention ? "warning" : "good"} hint={`${attention} sites need review`} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Site Performance Matrix" eyebrow="Pure engine comparison" subtitle="Each site uses its own schedule, feeders, tariff, solar, and demand interval" className="xl:col-span-8" padded={false} actions={<span className="text-[10.5px] text-muted-foreground">shared simulation timestamp</span>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-[11.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Site</th><th className="py-2.5 font-normal text-right">Load</th><th className="py-2.5 font-normal text-right">Intensity</th><th className="py-2.5 font-normal text-right">Demand</th><th className="py-2.5 font-normal text-right">Renewable</th><th className="py-2.5 font-normal text-right">Cost variance</th><th className="py-2.5 font-normal text-right">Verified saving</th><th className="py-2.5 font-normal text-center">Alarms</th><th className="pr-4 py-2.5 font-normal">State</th></tr></thead><tbody className="divide-y divide-border">{portfolioSites.map((site) => { const Icon = typeIcons[site.type]; return <tr key={site.id} className="transition-colors hover:bg-surface-2/55"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-md border border-border bg-surface-2 text-primary"><Icon className="size-4" /></div><div><div className="font-medium">{site.name}</div><div className="text-[9.5px] text-muted-foreground">{site.type} · {site.id}</div></div></div></td><td className="py-3 text-right tabular">{site.power.toFixed(2)} MW</td><td className="py-3 text-right tabular text-muted-foreground">{site.type === "Data Center" ? site.intensity.toFixed(2) : fmtNum(site.intensity, 1)}</td><td className={`py-3 text-right tabular ${site.demandRatio > 1 ? "text-red" : site.demandRatio > 0.92 ? "text-amber" : "text-green"}`}>{(site.demandRatio * 100).toFixed(1)}%</td><td className="py-3 text-right tabular text-green">{site.renewable.toFixed(1)}%</td><td className={`py-3 text-right tabular ${site.costVariance > 0 ? "text-amber" : "text-green"}`}><span className="inline-flex items-center gap-1">{site.costVariance > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(site.costVariance).toFixed(1)}%</span></td><td className="py-3 text-right tabular text-green">{fmtIDR(site.savings)}</td><td className="py-3 text-center tabular">{site.alarms ? <span className="inline-flex items-center gap-1 text-amber"><CircleAlert className="size-3" /> {site.alarms}</span> : <span className="text-muted-foreground">0</span>}</td><td className="pr-4 py-3"><StatusPill status={site.state === "On target" ? "normal" : site.state === "Attention" ? "critical" : "warning"} /></td></tr>; })}</tbody></table></div>
        </Panel>

        <Panel title="Intervention Priority" eyebrow="Annualized value" subtitle="Commercial priority remains distinct from live telemetry" className="xl:col-span-4">
          <div className="space-y-4">{[...portfolioSites].sort((a, b) => b.opportunity - a.opportunity).map((site, index) => <div key={site.id}><div className="flex items-center justify-between gap-4 text-[11.5px]"><span className="truncate"><span className="mr-2 tabular text-muted-foreground">0{index + 1}</span>{site.name}</span><span className="shrink-0 tabular">{fmtIDR(site.opportunity)}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-primary" style={{ width: `${site.opportunity / Math.max(...portfolioSites.map((item) => item.opportunity)) * 100}%`, opacity: 1 - index * 0.14 }} /></div></div>)}</div>
          <div className="mt-6 rounded-md border border-primary/25 bg-primary/8 p-3 text-[11px] leading-relaxed text-muted-foreground"><span className="font-medium text-primary">Portfolio continuity active.</span> Site selection changes the active scenario context without turning the other sites into scaled copies.</div>
        </Panel>
      </div>
    </AppShell>
  );
}
