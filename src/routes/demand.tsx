import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { BatteryCharging, Clock3, Gauge, Play, TriangleAlert } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR } from "@/lib/argrid-data";
import { demandContributors } from "@/lib/demo-domain";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/demand")({ component: DemandAndCost });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function DemandAndCost() {
  const { metrics, scenario, setScenario, tick } = useSimulation();
  const [deferredLoads, setDeferredLoads] = useState<string[]>([]);
  const reduction = demandContributors.filter((item) => deferredLoads.includes(item.name)).reduce((sum, item) => sum + item.kw / 1_000, 0);
  const simulatedDemand = Math.max(0, metrics.projectedDemand - reduction);
  const excess = Math.max(0, simulatedDemand - metrics.demandLimit);
  const exposure = excess * 355_000_000;
  const demandPercent = (simulatedDemand / metrics.demandLimit) * 100;

  const series = useMemo(() => Array.from({ length: 24 }, (_, index) => {
    const progress = index / 23;
    const base = metrics.currentPower - 0.32 + progress * (metrics.projectedDemand - metrics.currentPower + 0.32);
    return { minute: `${index * 2}`, actual: index < 9 ? +(base + Math.sin((index + tick) / 4) * .03).toFixed(2) : null, forecast: +(base - reduction * progress).toFixed(2) };
  }), [metrics.currentPower, metrics.projectedDemand, reduction, tick]);

  return (
    <AppShell title="Demand & Cost" subtitle="Predictive interval control, tariff exposure, and what-if response planning" toolbar={<button className="btn-secondary" onClick={() => setScenario("peak-demand")}><Play className="size-3.5" /> Trigger peak scenario</button>}>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-3">
        <KpiTile label="Current Demand" value={metrics.currentPower.toFixed(2)} unit="MW" />
        <KpiTile label="Projected Demand" value={simulatedDemand.toFixed(2)} unit="MW" tone={demandPercent > 100 ? "critical" : demandPercent > 92 ? "warning" : "good"} />
        <KpiTile label="Contract Limit" value={metrics.demandLimit.toFixed(2)} unit="MW" />
        <KpiTile label="Interval Remaining" value="18:42" unit="min" hint="15-minute window" />
        <KpiTile label="Charge Exposure" value={fmtIDR(exposure)} tone={exposure > 0 ? "critical" : "good"} hint={exposure > 0 ? "avoidable" : "within limit"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Interval Demand Forecast" className="xl:col-span-8 h-[390px]" actions={<span className={`text-[10.5px] ${demandPercent > 100 ? "text-red" : "text-green"}`}>{demandPercent.toFixed(1)}% of contract limit</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
              <defs><linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={.35} /><stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={.02} /></linearGradient></defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false} />
              <XAxis dataKey="minute" {...axis} tickFormatter={(value) => `${value}m`} interval={3} />
              <YAxis {...axis} width={44} domain={[0, Math.ceil(metrics.demandLimit + .8)]} tickFormatter={(value) => `${value}`} />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(value: number) => `${value.toFixed(2)} MW`} />
              <ReferenceLine y={metrics.demandLimit} stroke="var(--color-red)" strokeDasharray="4 4" label={{ value: "Contract limit", fill: "var(--color-red)", fontSize: 9, position: "insideTopRight" }} />
              <ReferenceLine y={metrics.demandLimit * .92} stroke="var(--color-amber)" strokeDasharray="3 5" />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="var(--color-cyan)" strokeWidth={2} strokeDasharray="5 4" fill="url(#forecast-fill)" />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="var(--color-green)" strokeWidth={2} fill="transparent" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Predictive Intervention" className="xl:col-span-4">
          <div className={`rounded-md border p-3 ${excess > 0 ? "border-red/30 bg-red/8" : "border-green/30 bg-green/8"}`}>
            <div className={`flex items-center gap-2 ${excess > 0 ? "text-red" : "text-green"}`}>{excess > 0 ? <TriangleAlert className="size-4" /> : <Gauge className="size-4" />}<span className="text-[11.5px] font-medium">{excess > 0 ? `Exceedance of ${excess.toFixed(2)} MW predicted` : "Simulated response keeps demand within limit"}</span></div>
            <div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{excess > 0 ? "Defer one or more flexible loads before the interval closes to avoid the projected demand charge." : `Selected actions reduce the forecast by ${reduction.toFixed(2)} MW.`}</div>
          </div>
          <div className="mt-4 space-y-2">
            {demandContributors.map((item) => (
              <label key={item.name} className={`flex items-center gap-3 rounded-md border px-3 py-2 ${item.deferrable ? "border-border bg-surface-2 cursor-pointer hover:border-primary/35" : "border-border/60 opacity-65"}`}>
                <input type="checkbox" disabled={!item.deferrable} checked={deferredLoads.includes(item.name)} onChange={(event) => setDeferredLoads((current) => event.target.checked ? [...current, item.name] : current.filter((name) => name !== item.name))} />
                <div className="min-w-0 flex-1"><div className="text-[11.5px] font-medium truncate">{item.name}</div><div className="text-[9.5px] text-muted-foreground">{item.kw} kW · {item.share}% contribution</div></div>
                {item.deferrable && <span className="text-[9px] uppercase tracking-[0.1em] text-primary">flexible</span>}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Tariff Exposure" className="xl:col-span-5">
          <div className="grid grid-cols-2 gap-3"><CostMetric icon={<Clock3 className="size-4" />} label="Current TOU period" value="WBP · peak" hint="17:00–22:00" /><CostMetric icon={<BatteryCharging className="size-4" />} label="Demand rate" value="Rp 355k/kW" hint="monthly maximum" /><CostMetric label="Month-to-date demand" value="5.74 MW" hint="23 Jul 2026" /><CostMetric label="Remaining budget" value="Rp 286 M" hint="Jul energy budget" /></div>
        </Panel>

        <Panel title="Recommended Response Sequence" className="xl:col-span-7">
          <div className="grid md:grid-cols-3 gap-3">
            {[{n:"01", title:"Defer Chiller 2", body:"Delay restart by 12 minutes while chilled-water buffer remains healthy.", impact:"−0.82 MW"},{n:"02",title:"Unload Compressor C-03",body:"Hold standby pressure using C-01 and C-02 within safe operating margin.",impact:"−0.74 MW"},{n:"03",title:"Discharge BESS",body:"Optional 0.5 MW support for ten minutes if production cannot be deferred.",impact:"−0.50 MW"}].map((step) => <div key={step.n} className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9.5px] text-primary tabular">{step.n}</div><div className="mt-1.5 text-[11.5px] font-medium">{step.title}</div><div className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{step.body}</div><div className="mt-3 text-[11px] tabular text-green">{step.impact}</div></div>)}
          </div>
        </Panel>
      </div>
      {scenario !== "peak-demand" && <div className="mt-3 text-[10.5px] text-muted-foreground">Select or trigger the peak-demand scenario to show the highest-risk demonstration state.</div>}
    </AppShell>
  );
}

function CostMetric({ icon, label, value, hint }: { icon?: ReactNode; label: string; value: string; hint: string }) { return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[9.5px] uppercase tracking-[0.1em]">{label}</span></div><div className="mt-2 text-[15px] font-medium tabular">{value}</div><div className="mt-1 text-[9.5px] text-muted-foreground">{hint}</div></div>; }
