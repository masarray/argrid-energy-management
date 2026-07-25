import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CircleAlert, Layers3, Radio, Search, ShieldCheck, Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill } from "@/components/argrid-ui";
import { fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/electrical")({ component: ElectricalNetwork });

type Layer = "Operations" | "Energy" | "Power quality" | "Maintenance";
const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function ElectricalNetwork() {
  const { metrics, scenario, scenarioState, setScenario, feeders, historian24h, site } = useSimulation();
  const [selectedId, setSelectedId] = useState("F-07");
  const [layer, setLayer] = useState<Layer>("Operations");
  const selected = feeders.find((feeder) => feeder.id === selectedId) ?? feeders[0];
  const totalKW = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);
  const voltageEvent = scenario === "voltage-dip" && scenarioState.phase !== "precondition";
  const transformerLoading = metrics.currentPower / site.transformerCapacityMva * 100;
  const busVoltage = feeders.reduce((sum, feeder) => sum + feeder.voltageV, 0) / Math.max(feeders.length, 1);
  const chartData = useMemo(
    () => historian24h.map((point) => ({ t: point.t, load: point.loadMw * selected.contributionPercent / 100 })),
    [historian24h, selected.contributionPercent],
  );

  return (
    <AppShell
      title="Electrical Network"
      subtitle={`Live one-line · ${site.shortName} · source/load/loss balance from Simulation Engine v2`}
      toolbar={<button className="btn-secondary" onClick={() => setScenario("voltage-dip")}><Zap className="size-3.5" /> Trigger voltage dip</button>}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground"><Layers3 className="size-3.5" /> View layer</div>
        <div className="flex rounded-md border border-border bg-surface-2 p-0.5">{(["Operations", "Energy", "Power quality", "Maintenance"] as Layer[]).map((item) => <button key={item} className={`h-6 rounded px-2 text-[9.5px] ${layer === item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setLayer(item)}>{item}</button>)}</div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground"><Radio className="size-3 text-green" /> {scenarioState.label} · balance error {metrics.balanceErrorPercent.toFixed(3)}%</div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title={`One-Line Diagram · ${layer}`} eyebrow="Unified electrical state" subtitle={`${metrics.gridPower.toFixed(2)} MW grid + ${metrics.solarPower.toFixed(2)} MW solar → ${metrics.currentPower.toFixed(2)} MW load + ${metrics.transformerLossKw.toFixed(0)} kW loss`} className="h-[540px] xl:col-span-8" tone={scenarioState.phase === "event" ? "critical" : "accent"} actions={<span className="text-[10.5px] text-muted-foreground">click feeder to inspect</span>}>
          <div className="relative h-full w-full overflow-hidden rounded-md grid-bg">
            <svg viewBox="0 0 820 470" className="h-full w-full" role="img" aria-label="Interactive electrical one-line diagram driven by the simulation balance engine">
              <rect x="344" y="15" width="132" height="42" rx="5" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
              <text x="410" y="33" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9.5" letterSpacing="1">UTILITY 20 kV</text>
              <text x="410" y="49" textAnchor="middle" fill="var(--color-foreground)" fontSize="11.5" fontWeight="500">{metrics.gridPower.toFixed(2)} MW · {metrics.powerFactor.toFixed(2)} PF</text>
              <line x1="410" y1="57" x2="410" y2="80" stroke="var(--color-cyan)" strokeWidth="2" />
              <circle cx="410" cy="92" r="10" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" /><circle cx="410" cy="104" r="10" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" />
              <line x1="410" y1="114" x2="410" y2="138" stroke="var(--color-cyan)" strokeWidth="2" />
              <text x="428" y="101" fill="var(--color-muted-foreground)" fontSize="8.5">TX-01 · {site.transformerCapacityMva.toFixed(1)} MVA · {transformerLoading.toFixed(0)}%</text>
              <rect x="398" y="138" width="24" height="18" rx="1" fill="var(--color-green)" /><text x="430" y="151" fill="var(--color-muted-foreground)" fontSize="8.5">52-Q0 · CLOSED</text>
              <line x1="410" y1="156" x2="410" y2="181" stroke="var(--color-cyan)" strokeWidth="2" />
              <line x1="74" y1="181" x2="746" y2="181" stroke="var(--color-cyan)" strokeWidth="3" />
              <text x="75" y="171" fill="var(--color-muted-foreground)" fontSize="8.5">MSB-MAIN · {busVoltage.toFixed(0)} V · 50.00 Hz</text>

              {feeders.map((feeder, index) => {
                const x = 78 + index * 94;
                const color = feeder.status === "critical" ? "var(--color-red)" : feeder.status === "warning" ? "var(--color-amber)" : "var(--color-cyan)";
                const breaker = feeder.status === "critical" ? "var(--color-red)" : feeder.status === "warning" ? "var(--color-amber)" : "var(--color-green)";
                const selectedNode = selectedId === feeder.id;
                const maintenanceHealth = Math.max(72, 99 - index * 3);
                const displayValue = layer === "Energy" ? `${feeder.kw.toFixed(0)} kW` : layer === "Power quality" ? `${(feeder.voltageV / 400 * 100).toFixed(0)}% Un` : layer === "Maintenance" ? `${maintenanceHealth}% health` : `${feeder.load.toFixed(0)}% load`;
                return (
                  <g key={feeder.id} onClick={() => setSelectedId(feeder.id)} className="cursor-pointer">
                    {selectedNode && <rect x={x - 39} y="205" width="78" height="159" rx="8" fill="var(--color-primary)" opacity=".07" stroke="var(--color-primary)" strokeOpacity=".55" strokeDasharray="3 3" />}
                    <line x1={x} y1="181" x2={x} y2="216" stroke={color} strokeWidth={selectedNode ? 2.4 : 1.6} />
                    <rect x={x - 10} y="216" width="20" height="14" rx="1" fill={breaker} />
                    <line x1={x} y1="230" x2={x} y2="260" stroke={color} strokeWidth={selectedNode ? 2.4 : 1.6} />
                    <rect x={x - 34} y="260" width="68" height="94" rx="5" fill="var(--color-surface-2)" stroke={selectedNode ? "var(--color-primary)" : "var(--color-border-strong)"} />
                    <text x={x} y="276" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8.5">{feeder.id}</text>
                    <text x={x} y="291" textAnchor="middle" fill="var(--color-foreground)" fontSize="9.5" fontWeight="500">{feeder.name.length > 12 ? `${feeder.name.slice(0, 11)}…` : feeder.name}</text>
                    <text x={x} y="315" textAnchor="middle" fill={color} fontSize="12.5" fontWeight="500">{displayValue.split(" ")[0]}</text>
                    <text x={x} y="328" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">{displayValue.split(" ").slice(1).join(" ")}</text>
                    <rect x={x - 25} y="339" width="50" height="4" rx="2" fill="var(--color-surface-3)" /><rect x={x - 25} y="339" width={50 * Math.min(feeder.load, 100) / 100} height="4" rx="2" fill={color} />
                  </g>
                );
              })}

              <g transform="translate(24 424)"><rect width="10" height="8" fill="var(--color-green)"/><text x="16" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Normal / closed</text><rect x="120" width="10" height="8" fill="var(--color-amber)"/><text x="136" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Warning</text><rect x="220" width="10" height="8" fill="var(--color-red)"/><text x="236" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Critical event</text><text x="620" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Simulation mode · no field command</text></g>
            </svg>
          </div>
        </Panel>

        <div className="space-y-3 xl:col-span-4">
          <Panel title={`${selected.id} · ${selected.name}`} className="h-[275px]" actions={<StatusPill status={selected.status} />}>
            <div className="grid grid-cols-2 gap-3 text-[11.5px]"><Stat label="Active power" value={`${selected.kw.toFixed(0)} kW`} /><Stat label="Loading" value={`${selected.load.toFixed(1)}%`} tone={selected.load > 88 ? "warn" : undefined} /><Stat label="Voltage L-L" value={`${selected.voltageV.toFixed(0)} V`} tone={selected.voltageV < 360 ? "critical" : undefined} /><Stat label="Current" value={`${selected.currentA.toFixed(0)} A`} /><Stat label="Power factor" value={selected.powerFactor.toFixed(2)} tone={selected.powerFactor < 0.9 ? "warn" : undefined} /><Stat label="THD-V" value={`${selected.thdV.toFixed(1)}%`} /></div>
            {voltageEvent && selected.id === "F-07" ? <div className={`mt-4 flex items-start gap-2 rounded-md border p-2.5 text-[10.5px] ${scenarioState.phase === "event" ? "border-red/30 bg-red/9 text-red" : "border-amber/30 bg-amber/8 text-amber"}`}><CircleAlert className="size-4 shrink-0" /><div><div className="font-medium">Voltage sag 82% Un · 240 ms</div><div className="mt-0.5 opacity-75">{scenarioState.label}. Event and downstream recovery remain correlated.</div></div></div> : <div className="mt-4 flex items-start gap-2 rounded-md border border-green/25 bg-green/8 p-2.5 text-[10.5px] text-green"><ShieldCheck className="size-4 shrink-0" />Measurements are within the selected layer limits.</div>}
          </Panel>

          <Panel title="Selected Feeder · 24h Trend" className="h-[252px]">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false}/><XAxis dataKey="t" {...axis} interval={15}/><YAxis {...axis} width={40}/><Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(value: number) => `${value.toFixed(2)} MW`}/><Line type="monotone" dataKey="load" stroke="var(--color-cyan)" strokeWidth={1.7} dot={false}/></LineChart></ResponsiveContainer>
          </Panel>
        </div>

        <Panel title="All Feeders" className="xl:col-span-12" padded={false} actions={<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Search className="size-3"/> Feeder sum {fmtNum(totalKW)} kW · load balance source</div>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-[11.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">ID</th><th className="py-2.5 font-normal">Feeder</th><th className="py-2.5 font-normal text-right">Power</th><th className="py-2.5 font-normal text-right">Loading</th><th className="py-2.5 font-normal text-right">System share</th><th className="py-2.5 font-normal text-right">Voltage</th><th className="pr-4 py-2.5 font-normal">Status</th></tr></thead><tbody className="divide-y divide-border">{feeders.map((feeder) => <tr key={feeder.id} onClick={() => setSelectedId(feeder.id)} className={`cursor-pointer hover:bg-surface-2/50 ${selectedId === feeder.id ? "bg-primary/7" : ""}`}><td className="px-4 py-2.5 tabular text-muted-foreground">{feeder.id}</td><td className="py-2.5 font-medium">{feeder.name}</td><td className="py-2.5 text-right tabular">{fmtNum(feeder.kw)} kW</td><td className="py-2.5 text-right tabular">{feeder.load.toFixed(1)}%</td><td className="py-2.5 text-right tabular text-muted-foreground">{feeder.contributionPercent.toFixed(1)}%</td><td className="py-2.5 text-right tabular">{feeder.voltageV.toFixed(0)} V</td><td className="pr-4 py-2.5"><StatusPill status={feeder.status}/></td></tr>)}</tbody></table></div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "critical" }) {
  return <div><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className={`mt-1 tabular font-medium ${tone === "warn" ? "text-amber" : tone === "critical" ? "text-red" : ""}`}>{value}</div></div>;
}
