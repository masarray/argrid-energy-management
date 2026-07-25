import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { BatteryCharging, Clock3, Gauge, Play, RotateCcw, TriangleAlert } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/demand")({ component: DemandAndCost });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function DemandAndCost() {
  const {
    metrics,
    scenario,
    scenarioState,
    setScenario,
    resetScenario,
    site,
    demandForecast,
    demandContributors,
    demandResponseIds,
    setDemandResponseIds,
  } = useSimulation();
  const selectedReductionKw = demandContributors
    .filter((item) => demandResponseIds.includes(item.id))
    .reduce((sum, item) => sum + item.availableReductionKw, 0);
  const demandPercent = metrics.projectedDemand / metrics.demandLimit * 100;
  const excessMw = Math.max(0, metrics.projectedDemand - metrics.demandLimit);
  const flexible = demandContributors.filter((item) => item.deferrable).slice(0, 4);

  return (
    <AppShell
      title="Demand & Cost"
      subtitle="Contractual interval demand, tariff exposure, and physically consistent response planning"
      toolbar={
        <div className="flex gap-2">
          {scenario !== "normal" && <button className="btn-secondary" onClick={resetScenario}><RotateCcw className="size-3.5" /> Reset scenario</button>}
          <button className="btn-secondary" onClick={() => setScenario("peak-demand")}><Play className="size-3.5" /> Trigger peak scenario</button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-5">
        <KpiTile label="Current interval" value={metrics.currentDemand.toFixed(2)} unit="MW" context={`${site.tariff.demandIntervalMinutes}-minute average`} />
        <KpiTile label="Projected close" value={metrics.projectedDemand.toFixed(2)} unit="MW" tone={demandPercent > 100 ? "critical" : demandPercent > 92 ? "warning" : "good"} progress={demandPercent} />
        <KpiTile label="Contract limit" value={metrics.demandLimit.toFixed(2)} unit="MW" context={site.tariff.label} />
        <KpiTile label="Interval remaining" value={formatDuration(metrics.intervalRemainingSeconds)} hint={`${scenarioState.label} · ${scenarioState.phase}`} />
        <KpiTile label="Charge exposure" value={fmtIDR(metrics.demandChargeExposure)} tone={metrics.demandChargeExposure > 0 ? "critical" : "good"} hint={metrics.demandChargeExposure > 0 ? "avoidable monthly demand charge" : "within contractual envelope"} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Interval Demand Forecast" eyebrow="Unified historian + forecast" subtitle="Actual interval average and deterministic forward projection" className="h-[410px] xl:col-span-8" tone={demandPercent > 100 ? "critical" : "accent"} actions={<span className={demandPercent > 100 ? "text-[10px] text-red" : "text-[10px] text-green"}>{demandPercent.toFixed(1)}% of limit</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandForecast} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
              <defs><linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.34} /><stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false} />
              <XAxis dataKey="minute" {...axis} tickFormatter={(value) => `${value}m`} interval={Math.max(2, Math.floor(site.tariff.demandIntervalMinutes / 6))} />
              <YAxis {...axis} width={44} domain={[0, Math.ceil(metrics.demandLimit + 0.8)]} />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(value: number) => `${value.toFixed(2)} MW`} />
              <ReferenceLine y={metrics.demandLimit} stroke="var(--color-red)" strokeDasharray="4 4" label={{ value: "Contract limit", fill: "var(--color-red)", fontSize: 9, position: "insideTopRight" }} />
              <ReferenceLine y={metrics.demandLimit * 0.92} stroke="var(--color-amber)" strokeDasharray="3 5" label={{ value: "Intervention", fill: "var(--color-amber)", fontSize: 9, position: "insideTopLeft" }} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="var(--color-cyan)" strokeWidth={2} strokeDasharray="5 4" fill="url(#forecast-fill)" connectNulls={false} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="var(--color-green)" strokeWidth={2} fill="transparent" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Predictive Intervention" eyebrow="Controlled what-if" subtitle="Only flexible loads contribute to simulated reduction" className="xl:col-span-4">
          <div className={`rounded-md border p-3 ${excessMw > 0 ? "border-red/30 bg-red/8" : "border-green/30 bg-green/8"}`}>
            <div className={`flex items-center gap-2 ${excessMw > 0 ? "text-red" : "text-green"}`}>
              {excessMw > 0 ? <TriangleAlert className="size-4" /> : <Gauge className="size-4" />}
              <span className="text-[11.5px] font-medium">{excessMw > 0 ? `${(excessMw * 1_000).toFixed(0)} kW exceedance predicted` : "Selected response keeps demand within limit"}</span>
            </div>
            <div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">Selected actions remove {selectedReductionKw.toFixed(0)} kW from the forward projection. The actual interval history remains unchanged.</div>
          </div>
          <div className="mt-4 space-y-2">
            {demandContributors.slice(0, 6).map((item) => (
              <label key={item.id} className={`flex items-center gap-3 rounded-md border px-3 py-2 ${item.deferrable ? "border-border bg-surface-2 cursor-pointer hover:border-primary/35" : "border-border/60 opacity-65"}`}>
                <input
                  type="checkbox"
                  disabled={!item.deferrable}
                  checked={demandResponseIds.includes(item.id)}
                  onChange={(event) => setDemandResponseIds(event.target.checked ? [...demandResponseIds, item.id] : demandResponseIds.filter((id) => id !== item.id))}
                />
                <div className="min-w-0 flex-1"><div className="truncate text-[11.5px] font-medium">{item.name}</div><div className="text-[9.5px] text-muted-foreground">{item.kw} kW · {item.share.toFixed(1)}% contribution</div></div>
                {item.deferrable && <span className="text-[9px] uppercase tracking-[0.1em] text-primary">−{item.availableReductionKw} kW</span>}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Tariff Exposure" eyebrow="Calculation source" className="xl:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <CostMetric icon={<Clock3 className="size-4" />} label="Current TOU period" value={metrics.tariffPeriod} hint={`${fmtIDR(metrics.tariffRateIdrPerKwh)} / kWh`} />
            <CostMetric icon={<BatteryCharging className="size-4" />} label="Demand rate" value={`${fmtIDR(site.tariff.demandRateIdrPerKw)} / kW`} hint="monthly maximum interval" />
            <CostMetric label="Month peak reference" value={`${(site.monthlyPeakKw / 1_000).toFixed(2)} MW`} hint="validated internal maximum" />
            <CostMetric label="Demand interval" value={`${site.tariff.demandIntervalMinutes} minutes`} hint="rolling contractual calculation" />
          </div>
        </Panel>

        <Panel title="Recommended Response Sequence" eyebrow="Operational constraints preserved" className="xl:col-span-7">
          <div className="grid gap-3 md:grid-cols-3">
            {flexible.slice(0, 3).map((item, index) => (
              <div key={item.id} className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-[9.5px] tabular text-primary">0{index + 1}</div>
                <div className="mt-1.5 text-[11.5px] font-medium">Defer {item.name}</div>
                <div className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">Apply only after operator verification of process, thermal, or service reserve.</div>
                <div className="mt-3 text-[11px] tabular text-green">−{item.availableReductionKw} kW available</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function CostMetric({ icon, label, value, hint }: { icon?: ReactNode; label: string; value: string; hint: string }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[9.5px] uppercase tracking-[0.1em]">{label}</span></div><div className="mt-2 text-[14px] font-medium tabular">{value}</div><div className="mt-1 text-[9.5px] text-muted-foreground">{hint}</div></div>;
}
