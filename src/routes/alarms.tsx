import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, CircleAlert, Filter, Radio, RotateCcw } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/alarms")({ component: AlarmsPage });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function AlarmsPage() {
  const {
    scenario,
    scenarioState,
    setScenario,
    resetScenario,
    alarms,
    acknowledgeAlarm,
    powerQualityEvents,
    now,
  } = useSimulation();
  const [filter, setFilter] = useState<"All" | "Unacknowledged" | "Critical">("All");
  const visible = useMemo(
    () => alarms.filter((alarm) => filter === "All" || (filter === "Unacknowledged" ? !alarm.ack : alarm.severity === "Critical")),
    [alarms, filter],
  );
  const critical = alarms.filter((alarm) => alarm.severity === "Critical" && alarm.state === "active").length;
  const warning = alarms.filter((alarm) => alarm.severity === "Warning" && alarm.state === "active").length;
  const unacknowledged = alarms.filter((alarm) => !alarm.ack && alarm.state !== "cleared").length;
  const voltageSequence = scenario === "voltage-dip" && scenarioState.phase !== "precondition";

  return (
    <AppShell
      title="Alarms & Power Quality"
      subtitle="Measurement-driven alarm lifecycle, deterministic event sequence, and PQ evidence"
      toolbar={
        <div className="flex gap-2">
          {scenario !== "normal" && <button className="btn-secondary" onClick={resetScenario}><RotateCcw className="size-3.5" /> Reset</button>}
          <button className="btn-secondary" onClick={() => setScenario("voltage-dip")}><CircleAlert className="size-3.5" /> Trigger PQ event</button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-4">
        <KpiTile label="Critical active" value={String(critical)} tone={critical ? "critical" : "good"} hint="P1 · immediate response" />
        <KpiTile label="Warning active" value={String(warning)} tone={warning ? "warning" : "good"} />
        <KpiTile label="Unacknowledged" value={String(unacknowledged)} tone={unacknowledged ? "warning" : "good"} context="active + returned" />
        <KpiTile label="Scenario phase" value={scenarioState.phase} hint={scenarioState.label} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Active & Recent Alarms" eyebrow="Rule engine output" subtitle="Threshold, delay, return-to-normal, and acknowledgement remain distinct" className="xl:col-span-8" padded={false} actions={<div className="flex items-center gap-1"><Filter className="size-3 text-muted-foreground" />{(["All", "Unacknowledged", "Critical"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`h-6 rounded px-2 text-[9.5px] ${filter === item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{item}</button>)}</div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-[11.5px]">
              <thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Priority</th><th className="py-2.5 font-normal">State</th><th className="py-2.5 font-normal">Timestamp</th><th className="py-2.5 font-normal">Source</th><th className="py-2.5 font-normal">Condition</th><th className="pr-4 py-2.5 font-normal text-right">Response</th></tr></thead>
              <tbody className="divide-y divide-border">
                {visible.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-[11px] text-muted-foreground">No alarm matches the selected filter. Normal operation does not fabricate standing alarms.</td></tr>}
                {visible.map((alarm) => (
                  <tr key={alarm.id} className={`hover:bg-surface-2/45 ${alarm.state === "active" && alarm.severity === "Critical" ? "bg-red/5" : ""}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><SeverityDot level={alarm.severity} /><span className={`text-[9.5px] uppercase tracking-[0.08em] ${alarm.severity === "Critical" ? "text-red" : alarm.severity === "Warning" ? "text-amber" : "text-primary"}`}>{alarm.severity}</span></div></td>
                    <td className="py-3"><span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] ${alarm.state === "active" ? "border-red/25 bg-red/8 text-red" : "border-amber/25 bg-amber/8 text-amber"}`}>{alarm.state}</span></td>
                    <td className="py-3 tabular text-muted-foreground">{alarm.ts}</td>
                    <td className="py-3 font-medium">{alarm.source}</td>
                    <td className="py-3"><div>{alarm.message}</div><div className="mt-1 text-[9.5px] text-muted-foreground">Cause: {alarm.cause}</div></td>
                    <td className="pr-4 py-3 text-right">{alarm.ack ? <span className="inline-flex items-center gap-1 text-[10px] text-green"><Check className="size-3"/> acknowledged</span> : <button className="btn-secondary" onClick={() => acknowledgeAlarm(alarm.id)}>Acknowledge</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="PQ Event Envelope" eyebrow="Deterministic 30-day context" subtitle="Current scenario event is added only after event onset" className="h-[430px] xl:col-span-4" actions={<span className="text-[10px] text-muted-foreground">ITIC context</span>}>
          <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 8 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5"/><XAxis type="number" dataKey="duration" name="Duration" scale="log" domain={[0.001, 1000]} {...axis} tickFormatter={(value) => `${value}s`}/><YAxis type="number" dataKey="magnitude" name="Magnitude" domain={[0, 160]} {...axis} tickFormatter={(value) => `${value}%`}/><ZAxis range={[36, 48]}/><ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="3 3"/><ReferenceLine y={110} stroke="var(--color-amber)" strokeDasharray="3 3"/><Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }}/><Scatter data={powerQualityEvents.filter((event) => event.type === "sag")} fill="var(--color-red)"/><Scatter data={powerQualityEvents.filter((event) => event.type === "swell")} fill="var(--color-amber)"/><Scatter data={powerQualityEvents.filter((event) => event.type === "normal")} fill="var(--color-cyan)"/></ScatterChart></ResponsiveContainer>
        </Panel>

        <Panel title="Event Correlation" eyebrow="Causal sequence" subtitle={voltageSequence ? `Scenario ${scenarioState.phase} · generated ${now.toLocaleTimeString("en-GB")}` : "Trigger the voltage-dip scenario to replay the event lifecycle"} className="xl:col-span-7">
          {voltageSequence ? <div className="grid gap-2 md:grid-cols-4">{[
            { time: "+0.000 s", name: "Voltage dip detected", source: "PM-MSB-02", tone: "red" },
            { time: "+0.042 s", name: "Contactor undervoltage", source: "MCC-07", tone: "amber" },
            { time: "+0.084 s", name: "Drive ride-through active", source: "VSD-P07", tone: "primary" },
            { time: "+0.240 s", name: "Voltage recovered", source: "PM-MSB-02", tone: "green" },
          ].map((event, index) => <div key={event.time} className="relative rounded-md border border-border bg-surface-2 p-3">{index < 3 && <div className="absolute top-6 -right-2.5 hidden h-px w-3 bg-border-strong md:block"/>}<div className={`size-2 rounded-full ${event.tone === "red" ? "bg-red" : event.tone === "amber" ? "bg-amber" : event.tone === "green" ? "bg-green" : "bg-primary"}`}/><div className="mt-2 text-[10px] tabular text-muted-foreground">{event.time}</div><div className="mt-1 text-[10.5px] font-medium">{event.name}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">{event.source}</div></div>)}</div> : <div className="rounded-md border border-border bg-surface-2 p-6 text-center text-[10.5px] text-muted-foreground">No active PQ sequence. The engine remains in steady state.</div>}
        </Panel>

        <Panel title="Alarm System Health" eyebrow="Lifecycle hygiene" className="xl:col-span-5">
          <div className="grid grid-cols-2 gap-3"><Health label="Standing alarms" value={String(alarms.filter((alarm) => alarm.state === "active").length)} state={alarms.some((alarm) => alarm.state === "active") ? "review" : "good"}/><Health label="Chattering alarms" value="0" state="good"/><Health label="Returned unack" value={String(alarms.filter((alarm) => alarm.state === "returned" && !alarm.ack).length)} state={alarms.some((alarm) => alarm.state === "returned" && !alarm.ack) ? "review" : "good"}/><Health label="Flood rate" value={alarms.length > 4 ? ">1/min" : "<0.5/min"} state={alarms.length > 4 ? "review" : "good"}/></div><div className="mt-4 flex items-start gap-2 rounded-md border border-green/25 bg-green/8 p-3 text-[10.5px] text-muted-foreground"><Radio className="size-4 shrink-0 text-green"/><div><span className="font-medium text-green">Rule engine deterministic.</span> Alarm counts originate from current measurement conditions, not static dashboard records.</div></div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Health({ label, value, state }: { label: string; value: string; state: "good" | "review" }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className={`mt-2 text-[16px] font-medium tabular ${state === "good" ? "text-green" : "text-amber"}`}>{value}</div></div>;
}
