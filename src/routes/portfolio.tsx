import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Building2, CircleAlert, Factory, Server, Warehouse } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { portfolioSites } from "@/lib/demo-domain";

export const Route = createFileRoute("/portfolio")({ component: Portfolio });

const typeIcons = { Manufacturing: Factory, "Data Center": Server, "Commercial Campus": Building2, "Cold Storage": Warehouse };

function Portfolio() {
  const totalPower = portfolioSites.reduce((sum, site) => sum + site.power, 0);
  const savings = portfolioSites.reduce((sum, site) => sum + site.savings, 0);
  const opportunity = portfolioSites.reduce((sum, site) => sum + site.opportunity, 0);
  const attention = portfolioSites.filter((site) => site.state !== "On target").length;

  return (
    <AppShell title="Enterprise Portfolio" subtitle="Performance, risk, and verified value across connected sites">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Connected Sites" value={String(portfolioSites.length)} hint="4 operational archetypes" />
        <KpiTile label="Live Portfolio Load" value={totalPower.toFixed(2)} unit="MW" />
        <KpiTile label="Verified Savings" value={fmtIDR(savings)} tone="good" hint="annualized" />
        <KpiTile label="Open Opportunity" value={fmtIDR(opportunity)} tone={attention ? "warning" : "good"} hint={`${attention} sites need review`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Site Performance Matrix" className="xl:col-span-8" padded={false} actions={<span className="text-[10.5px] text-muted-foreground">ranked by intervention priority</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-[11.5px]">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                  <th className="px-4 py-2.5 font-normal">Site</th>
                  <th className="py-2.5 font-normal text-right">Load</th>
                  <th className="py-2.5 font-normal text-right">Intensity</th>
                  <th className="py-2.5 font-normal text-right">Cost variance</th>
                  <th className="py-2.5 font-normal text-right">Verified saving</th>
                  <th className="py-2.5 font-normal text-right">Opportunity</th>
                  <th className="py-2.5 font-normal text-center">Alarms</th>
                  <th className="pr-4 py-2.5 font-normal">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {portfolioSites.map((site) => {
                  const Icon = typeIcons[site.type as keyof typeof typeIcons] ?? Building2;
                  return (
                    <tr key={site.id} className="hover:bg-surface-2/55 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-md border border-border bg-surface-2 grid place-items-center text-primary"><Icon className="size-4" /></div>
                          <div><div className="font-medium">{site.name}</div><div className="text-[9.5px] text-muted-foreground">{site.type} · {site.id}</div></div>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular">{site.power.toFixed(2)} MW</td>
                      <td className="py-3 text-right tabular text-muted-foreground">{fmtNum(site.intensity, site.type === "Data Center" ? 2 : 0)}</td>
                      <td className={`py-3 text-right tabular ${site.costVariance > 0 ? "text-amber" : "text-green"}`}>
                        <span className="inline-flex items-center gap-1">{site.costVariance > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(site.costVariance).toFixed(1)}%</span>
                      </td>
                      <td className="py-3 text-right tabular text-green">{fmtIDR(site.savings)}</td>
                      <td className="py-3 text-right tabular">{fmtIDR(site.opportunity)}</td>
                      <td className="py-3 text-center tabular">{site.alarms ? <span className="inline-flex items-center gap-1 text-amber"><CircleAlert className="size-3" /> {site.alarms}</span> : <span className="text-muted-foreground">0</span>}</td>
                      <td className="pr-4 py-3"><StatusPill status={site.state === "On target" ? "normal" : site.state === "Attention" ? "critical" : "warning"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Intervention Priority" className="xl:col-span-4">
          <div className="space-y-4">
            {[...portfolioSites].sort((a, b) => b.opportunity - a.opportunity).map((site, index) => (
              <div key={site.id}>
                <div className="flex items-center justify-between gap-4 text-[11.5px]"><span className="truncate"><span className="mr-2 text-muted-foreground tabular">0{index + 1}</span>{site.name}</span><span className="tabular shrink-0">{fmtIDR(site.opportunity)}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(site.opportunity / Math.max(...portfolioSites.map((item) => item.opportunity))) * 100}%`, opacity: 1 - index * .14 }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md border border-amber/25 bg-amber/8 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-amber font-medium">Makassar requires attention.</span> Refrigeration intensity is 14.8% above the normalized cold-chain baseline.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
