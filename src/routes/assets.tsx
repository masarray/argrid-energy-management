import { createFileRoute } from "@tanstack/react-router";
import { Boxes, CircleAlert, ShieldCheck, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { assets } from "@/lib/demo-domain";

export const Route = createFileRoute("/assets")({ component: Assets });

function Assets() {
  const warning = assets.filter((asset) => asset.alarm !== "Normal").length;
  const averageHealth = assets.reduce((sum, asset) => sum + asset.health, 0) / assets.length;
  const availableCapacity = assets.reduce((sum, asset) => sum + asset.capacity, 0);

  return (
    <AppShell title="Asset & Capacity Intelligence" subtitle="Loading, condition, spare capacity, and maintenance readiness">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Tracked Assets" value={String(assets.length)} hint="critical utility assets" />
        <KpiTile label="Average Health" value={`${averageHealth.toFixed(0)}%`} tone="good" />
        <KpiTile label="Available Capacity" value={availableCapacity.toFixed(1)} unit="MW" />
        <KpiTile label="Needs Attention" value={String(warning)} tone="warning" hint="condition or maintenance" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Critical Asset Portfolio" className="xl:col-span-8" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[11.5px]">
              <thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Asset</th><th className="py-2.5 font-normal">Location</th><th className="py-2.5 font-normal text-right">Loading</th><th className="py-2.5 font-normal text-right">Health</th><th className="py-2.5 font-normal text-right">Capacity</th><th className="py-2.5 font-normal">Status</th><th className="pr-4 py-2.5 font-normal">Maintenance</th></tr></thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-2/45">
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="size-8 rounded-md border border-border bg-surface-2 grid place-items-center text-primary"><Boxes className="size-4" /></div><div><div className="font-medium">{asset.id}</div><div className="text-[9.5px] text-muted-foreground">{asset.type}</div></div></div></td>
                    <td className="py-3 text-muted-foreground">{asset.location}</td>
                    <td className={`py-3 text-right tabular ${asset.loading > 82 ? "text-amber" : ""}`}>{asset.loading}%</td>
                    <td className={`py-3 text-right tabular ${asset.health < 80 ? "text-amber" : "text-green"}`}>{asset.health}%</td>
                    <td className="py-3 text-right tabular">{asset.capacity.toFixed(1)} MW</td>
                    <td className="py-3"><StatusPill status={asset.alarm === "Normal" ? "normal" : asset.alarm === "Warning" ? "warning" : "critical"} /></td>
                    <td className="pr-4 py-3 text-muted-foreground">{asset.maintenance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Condition Priorities" className="xl:col-span-4">
          <div className="space-y-3">
            {assets.slice().sort((a,b) => a.health - b.health).slice(0,4).map((asset, index) => (
              <div key={asset.id} className="rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2"><span className="text-[9.5px] tabular text-muted-foreground">0{index+1}</span><span className="text-[11.5px] font-medium">{asset.id} · {asset.type}</span>{asset.health < 80 && <CircleAlert className="ml-auto size-3.5 text-amber" />}</div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden"><div className={`h-full rounded-full ${asset.health < 80 ? "bg-amber" : "bg-green"}`} style={{ width: `${asset.health}%` }} /></div>
                <div className="mt-2 flex justify-between text-[9.5px] text-muted-foreground"><span>Health {asset.health}%</span><span>Maintenance {asset.maintenance}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/8 p-3"><Wrench className="mt-0.5 size-4 text-primary" /><div><div className="text-[11px] font-medium">Maintenance recommendation</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Inspect compressor C-04 leak and chiller CH-02 approach temperature in the same utility shutdown window.</div></div></div>
        </Panel>

        <Panel title="Transformer Capacity Snapshot" className="xl:col-span-7">
          <div className="grid md:grid-cols-2 gap-3">
            {assets.filter((asset) => asset.type === "Transformer").map((asset) => <div key={asset.id} className="rounded-md border border-border bg-surface-2 p-4"><div className="flex items-center justify-between"><div><div className="text-[12px] font-medium">{asset.id}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">{asset.location}</div></div><ShieldCheck className={`size-4 ${asset.health > 90 ? "text-green" : "text-amber"}`} /></div><div className="mt-4 grid grid-cols-3 gap-3 text-[10.5px]"><div><div className="text-muted-foreground">Loading</div><div className="mt-1 tabular font-medium">{asset.loading}%</div></div><div><div className="text-muted-foreground">Spare</div><div className="mt-1 tabular font-medium">{asset.capacity.toFixed(1)} MW</div></div><div><div className="text-muted-foreground">Health</div><div className="mt-1 tabular font-medium">{asset.health}%</div></div></div></div>)}
          </div>
        </Panel>

        <Panel title="Capacity Outlook" className="xl:col-span-5">
          <div className="flex h-36 items-end gap-2 border-b border-border px-2">{[58,61,63,67,69,72,75,78,82,84,86,88].map((value,index)=><div key={index} className={`flex-1 rounded-t-sm ${value > 84 ? "bg-amber" : "bg-primary"}`} style={{height:`${value}%`,opacity:.55+index*.025}} />)}</div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>Jul 2026</span><span>Forecast · Jun 2027</span></div>
          <div className="mt-4 text-[10.5px] leading-relaxed text-muted-foreground">TX-02 reaches the 85% planning threshold in March 2027 under the current production-growth scenario.</div>
        </Panel>
      </div>
    </AppShell>
  );
}
