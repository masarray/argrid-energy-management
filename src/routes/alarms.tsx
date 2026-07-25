import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, CircleAlert, Filter, Radio, RotateCcw } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { alarms as sourceAlarms, powerQualityEvents } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/alarms")({ component: AlarmsPage });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function AlarmsPage() {
  const { scenario, setScenario } = useSimulation();
  const [alarms, setAlarms] = useState(sourceAlarms);
  const [filter, setFilter] = useState<"All" | "Unacknowledged" | "Critical">("All");
  const visible = useMemo(() => alarms.filter((alarm) => filter === "All" || filter === "Unacknowledged" ? filter === "All" || !alarm.ack : alarm.severity === "Critical"), [alarms, filter]);
  const critical = alarms.filter((alarm) => alarm.severity === "Critical").length + (scenario === "voltage-dip" ? 1 : 0);
  const warning = alarms.filter((alarm) => alarm.severity === "Warning").length;
  const unack = alarms.filter((alarm) => !alarm.ack).length;

  const acknowledge = (id: string) => setAlarms((current) => current.map((alarm) => alarm.id === id ? { ...alarm, ack: true } : alarm));

  return (
    <AppShell title="Alarms & Power Quality" subtitle="Prioritized alarm handling and event investigation" toolbar={<button className="btn-secondary" onClick={() => setScenario("voltage-dip")}><CircleAlert className="size-3.5" /> Trigger PQ event</button>}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Critical" value={String(critical)} tone={critical ? "critical" : "good"} hint="P1 · immediate response" />
        <KpiTile label="Warning" value={String(warning)} tone="warning" />
        <KpiTile label="Unacknowledged" value={String(unack)} tone={unack ? "warning" : "good"} />
        <KpiTile label="Average Ack Time" value="4.2" unit="min" tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Active & Recent Alarms" className="xl:col-span-8" padded={false} actions={<div className="flex items-center gap-1"><Filter className="size-3 text-muted-foreground" />{(["All","Unacknowledged","Critical"] as const).map((item)=><button key={item} onClick={()=>setFilter(item)} className={`h-6 rounded px-2 text-[9.5px] ${filter===item?"bg-primary/15 text-primary":"text-muted-foreground hover:text-foreground"}`}>{item}</button>)}</div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[11.5px]">
              <thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Priority</th><th className="py-2.5 font-normal">Timestamp</th><th className="py-2.5 font-normal">Source</th><th className="py-2.5 font-normal">Condition</th><th className="pr-4 py-2.5 font-normal text-right">Response</th></tr></thead>
              <tbody className="divide-y divide-border">
                {scenario === "voltage-dip" && <tr className="bg-red/5"><td className="px-4 py-3"><SeverityDot level="Critical" /></td><td className="py-3 tabular text-muted-foreground">Live · now</td><td className="py-3 font-medium">MSB-02 / F-07</td><td className="py-3"><div>Voltage sag 82% Un for 240 ms</div><div className="mt-0.5 text-[9.5px] text-red">Active simulated event · two affected assets</div></td><td className="pr-4 py-3 text-right"><button className="btn-primary" onClick={()=>setScenario("normal")}><RotateCcw className="size-3" /> Clear scenario</button></td></tr>}
                {visible.map((alarm) => <tr key={alarm.id} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="flex items-center gap-2"><SeverityDot level={alarm.severity} /><span className={`text-[9.5px] uppercase tracking-[0.08em] ${alarm.severity==="Critical"?"text-red":alarm.severity==="Warning"?"text-amber":"text-primary"}`}>{alarm.severity}</span></div></td><td className="py-3 tabular text-muted-foreground">{alarm.ts}</td><td className="py-3 font-medium">{alarm.source}</td><td className="py-3">{alarm.message}</td><td className="pr-4 py-3 text-right">{alarm.ack?<span className="inline-flex items-center gap-1 text-[10px] text-green"><Check className="size-3"/> acknowledged</span>:<button className="btn-secondary" onClick={()=>acknowledge(alarm.id)}>Acknowledge</button>}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="PQ Event Envelope" className="xl:col-span-4 h-[430px]" actions={<span className="text-[10px] text-muted-foreground">ITIC context · 30 days</span>}>
          <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:8,right:8,left:-8,bottom:8}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5"/><XAxis type="number" dataKey="duration" name="Duration" scale="log" domain={[0.001,1000]} {...axis} tickFormatter={(value)=>`${value}s`}/><YAxis type="number" dataKey="magnitude" name="Magnitude" domain={[0,160]} {...axis} tickFormatter={(value)=>`${value}%`}/><ZAxis range={[36,42]}/><ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="3 3"/><ReferenceLine y={110} stroke="var(--color-amber)" strokeDasharray="3 3"/><Tooltip contentStyle={{background:"var(--color-surface-2)",border:"1px solid var(--color-border-strong)",borderRadius:6,fontSize:11}}/><Scatter data={powerQualityEvents.filter((event)=>event.type==="sag")} fill="var(--color-red)"/><Scatter data={powerQualityEvents.filter((event)=>event.type==="swell")} fill="var(--color-amber)"/><Scatter data={powerQualityEvents.filter((event)=>event.type==="normal")} fill="var(--color-cyan)"/></ScatterChart></ResponsiveContainer>
        </Panel>

        <Panel title="Event Correlation" className="xl:col-span-7">
          <div className="grid md:grid-cols-4 gap-2">{[{time:"14:32:18.000",name:"Voltage dip detected",source:"PM-MSB-02",tone:"red"},{time:"14:32:18.042",name:"Contactor undervoltage",source:"MCC-07",tone:"amber"},{time:"14:32:18.084",name:"Drive ride-through active",source:"VSD-P07",tone:"primary"},{time:"14:32:18.263",name:"Voltage recovered",source:"PM-MSB-02",tone:"green"}].map((event,index)=><div key={event.time} className="relative rounded-md border border-border bg-surface-2 p-3">{index<3&&<div className="hidden md:block absolute top-6 -right-2.5 h-px w-3 bg-border-strong"/>}<div className={`size-2 rounded-full ${event.tone === "red" ? "bg-red" : event.tone === "amber" ? "bg-amber" : event.tone === "green" ? "bg-green" : "bg-primary"}`}/><div className="mt-2 text-[10px] tabular text-muted-foreground">{event.time}</div><div className="mt-1 text-[10.5px] font-medium">{event.name}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">{event.source}</div></div>)}</div>
        </Panel>

        <Panel title="Alarm System Health" className="xl:col-span-5">
          <div className="grid grid-cols-2 gap-3"><Health label="Standing alarms" value="2" state="review"/><Health label="Chattering alarms" value="0" state="good"/><Health label="Shelved alarms" value="1" state="review"/><Health label="Flood rate" value="0.4/min" state="good"/></div><div className="mt-4 flex items-start gap-2 rounded-md border border-green/25 bg-green/8 p-3 text-[10.5px] text-muted-foreground"><Radio className="size-4 text-green shrink-0"/><div><span className="text-green font-medium">Alarm performance stable.</span> No alarm flood or nuisance-alarm pattern is active.</div></div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Health({label,value,state}:{label:string;value:string;state:"good"|"review"}){return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className={`mt-2 text-[16px] font-medium tabular ${state==="good"?"text-green":"text-amber"}`}>{value}</div></div>}
