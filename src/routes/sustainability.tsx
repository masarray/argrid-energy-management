import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Leaf, ShieldCheck, Target } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { co2Trend, fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/sustainability")({ component: Sustainability });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function Sustainability() {
  const { metrics } = useSimulation();
  return (
    <AppShell title="Sustainability & ISO 50001" subtitle="Energy performance, emissions, targets, and management-system evidence">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-3">
        <KpiTile label="YTD Emissions" value="10,240" unit="tCO₂e" trend={-4.2} tone="good" />
        <KpiTile label="Emission Intensity" value="0.318" unit="tCO₂/MWh" trend={-1.6} tone="good" />
        <KpiTile label="Renewable Share" value={`${metrics.renewableShare.toFixed(1)}%`} trend={2.3} />
        <KpiTile label="Avoided Emissions" value="2,184" unit="tCO₂e" tone="good" />
        <KpiTile label="Target Progress" value="74%" hint="2026 reduction plan" tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Monthly Emissions vs Target" className="xl:col-span-8 h-[370px]">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={co2Trend} margin={{top:8,right:8,left:-4,bottom:0}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false}/><XAxis dataKey="m" {...axis}/><YAxis {...axis} width={50}/><Tooltip contentStyle={{background:"var(--color-surface-2)",border:"1px solid var(--color-border-strong)",borderRadius:6,fontSize:11}} formatter={(value:number)=>`${fmtNum(value)} tCO₂e`}/><Legend wrapperStyle={{fontSize:11,color:"var(--color-muted-foreground)"}} iconType="circle" iconSize={7}/><Line type="monotone" dataKey="actual" name="Actual" stroke="var(--color-cyan)" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="target" name="Target" stroke="var(--color-amber)" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/></LineChart></ResponsiveContainer>
        </Panel>

        <Panel title="Emission Sources" className="xl:col-span-4 h-[370px]">
          <div className="space-y-4">{[{label:"Grid electricity",value:82,color:"var(--color-cyan)"},{label:"Diesel generators",value:9,color:"var(--color-orange)"},{label:"Natural gas",value:6,color:"var(--color-amber)"},{label:"Refrigerants",value:3,color:"var(--color-violet)"}].map((source)=><div key={source.label}><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{source.label}</span><span className="tabular font-medium">{source.value}%</span></div><div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full" style={{width:`${source.value}%`,background:source.color}}/></div></div>)}</div>
          <div className="mt-6 rounded-md border border-green/25 bg-green/8 p-3 text-[10.5px] leading-relaxed text-muted-foreground"><span className="text-green font-medium">Trajectory on target.</span> Annual emissions are forecast 6.4% below the 2025 normalized baseline.</div>
        </Panel>

        <Panel title="Energy Performance Targets" className="xl:col-span-7">
          <div className="space-y-3">{[{name:"Electricity intensity",actual:74,target:"−8%",owner:"Energy Team"},{name:"Compressed-air specific energy",actual:61,target:"−12%",owner:"Utility Engineering"},{name:"Renewable contribution",actual:83,target:"15% share",owner:"Sustainability"},{name:"Verified savings delivery",actual:68,target:"Rp 1.7 B",owner:"Plant Management"}].map((item)=><div key={item.name} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2"><Target className="size-3.5 text-primary"/><span className="text-[11px] font-medium">{item.name}</span><span className="ml-auto text-[9.5px] text-muted-foreground">{item.owner}</span></div><div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{width:`${item.actual}%`}}/></div><div className="mt-1.5 flex justify-between text-[9.5px] text-muted-foreground"><span>{item.actual}% complete</span><span>Target {item.target}</span></div></div>)}</div>
        </Panel>

        <Panel title="ISO 50001 Readiness" className="xl:col-span-5">
          <div className="flex items-center justify-between rounded-md border border-green/25 bg-green/8 p-4"><div><div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Readiness score</div><div className="mt-1 font-display text-3xl font-medium text-green tabular">86%</div></div><ShieldCheck className="size-8 text-green"/></div>
          <div className="mt-4 space-y-2">{["Energy review and SEU register","EnPI and baseline versioning","Action-plan ownership","Measurement and verification","Management-review evidence"].map((item,index)=><div key={item} className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2"><CheckCircle2 className={`size-3.5 ${index===4?"text-amber":"text-green"}`}/><span className="text-[10.5px]">{item}</span><span className={`ml-auto text-[9px] ${index===4?"text-amber":"text-green"}`}>{index===4?"Review":"Ready"}</span></div>)}</div>
        </Panel>

        <Panel title="Management Insight" className="xl:col-span-12"><div className="flex items-start gap-3"><div className="size-9 rounded-md bg-green/10 text-green grid place-items-center"><Leaf className="size-4.5"/></div><div><div className="text-[12px] font-medium">Savings and emissions remain linked to verified operational actions</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">ArGrid avoids double-counting by connecting each avoided-emission record to a verified savings initiative, calculation version, baseline period, and source-quality statement.</div></div></div></Panel>
      </div>
    </AppShell>
  );
}
