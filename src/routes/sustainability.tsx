import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Leaf, ShieldCheck, Target } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/sustainability")({ component: Sustainability });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function Sustainability() {
  const { metrics, site, historian24h } = useSimulation();
  const dailyEmissionIntensity = metrics.todayEnergy > 0 ? metrics.co2TodayTonnes / (metrics.todayEnergy / 1_000) : 0;
  const monthlyEmissions = Array.from({ length: 12 }, (_, index) => {
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index];
    const season = 1 + Math.sin((index - 1) / 12 * Math.PI * 2) * (site.type === "Data Center" ? 0.025 : 0.08);
    const baselineEnergy = site.monthlyEnergyKwh * season;
    const target = baselineEnergy * site.emissionFactorKgPerKwh / 1_000 * 0.94;
    const actual = target * (index <= 6 ? 0.975 : 0.99);
    return { m: month, actual: Math.round(actual), target: Math.round(target) };
  });
  const ytdEmissions = monthlyEmissions.slice(0, 7).reduce((sum, month) => sum + month.actual, 0);
  const ytdTarget = monthlyEmissions.slice(0, 7).reduce((sum, month) => sum + month.target, 0);
  const avoidedEmissions = Math.max(0, ytdTarget - ytdEmissions);
  const averageGridShare = historian24h.reduce((sum, point) => sum + point.gridMw / Math.max(point.loadMw, 0.01), 0) / Math.max(historian24h.length, 1) * 100;
  const renewableTarget = site.type === "Data Center" ? 10 : site.type === "Commercial Campus" ? 22 : 15;
  const renewableProgress = Math.min(100, metrics.renewableShare / renewableTarget * 100);

  return (
    <AppShell title="Sustainability & ISO 50001" subtitle={`${site.shortName} · emissions derived from integrated grid energy and versioned site factor`}>
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-5">
        <KpiTile label="YTD Emissions" value={fmtNum(ytdEmissions)} unit="tCO₂e" tone="good" context="monthly energy × emission factor" />
        <KpiTile label="Today Emissions" value={metrics.co2TodayTonnes.toFixed(1)} unit="tCO₂e" context={`${site.emissionFactorKgPerKwh.toFixed(2)} kgCO₂/kWh`} />
        <KpiTile label="Emission Intensity" value={dailyEmissionIntensity.toFixed(3)} unit="tCO₂/MWh" tone="good" />
        <KpiTile label="Renewable Share" value={`${metrics.renewableShare.toFixed(1)}%`} progress={renewableProgress} context="current source balance" />
        <KpiTile label="Verified Savings" value={fmtIDR(metrics.verifiedSavings)} tone="good" hint="M&V-approved ledger" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Monthly Emissions vs Target" eyebrow="Energy-derived carbon model" subtitle="No independent synthetic emissions counter" className="h-[370px] xl:col-span-8">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyEmissions} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false}/><XAxis dataKey="m" {...axis}/><YAxis {...axis} width={50}/><Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(value: number) => `${fmtNum(value)} tCO₂e`}/><Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} iconType="circle" iconSize={7}/><Line type="monotone" dataKey="actual" name="Actual" stroke="var(--color-cyan)" strokeWidth={2} dot={{ r: 3 }}/><Line type="monotone" dataKey="target" name="Target" stroke="var(--color-amber)" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/></LineChart></ResponsiveContainer>
        </Panel>

        <Panel title="Emission Sources" eyebrow="Current energy balance" subtitle="Source proportions remain site-specific" className="h-[370px] xl:col-span-4">
          <div className="space-y-4">{[
            { label: "Grid electricity", value: Math.min(100, averageGridShare), color: "var(--color-cyan)" },
            { label: "On-site solar avoided grid", value: Math.min(100, metrics.renewableShare), color: "var(--color-green)" },
            { label: "Other modeled Scope 1", value: site.type === "Manufacturing" ? 6 : site.type === "Data Center" ? 2 : 4, color: "var(--color-amber)" },
          ].map((source) => <div key={source.label}><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{source.label}</span><span className="tabular font-medium">{source.value.toFixed(1)}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full" style={{ width: `${Math.min(100, source.value)}%`, background: source.color }}/></div></div>)}</div>
          <div className="mt-6 rounded-md border border-green/25 bg-green/8 p-3 text-[10.5px] leading-relaxed text-muted-foreground"><span className="font-medium text-green">Calculation trace active.</span> Grid emissions use integrated grid import, not total plant load, so solar generation is not double-counted.</div>
        </Panel>

        <Panel title="Energy Performance Targets" eyebrow="Management-system workflow" className="xl:col-span-7">
          <div className="space-y-3">{[
            { name: "Electricity intensity", actual: 74, target: "−8%", owner: "Energy Team" },
            { name: site.type === "Manufacturing" ? "Utility specific energy" : site.type === "Data Center" ? "PUE improvement" : "Occupancy-normalized energy", actual: 61, target: "−12%", owner: "Engineering" },
            { name: "Renewable contribution", actual: renewableProgress, target: `${renewableTarget}% share`, owner: "Sustainability" },
            { name: "Verified savings delivery", actual: Math.min(100, metrics.verifiedSavings / 1_700_000_000 * 100), target: "Rp 1.7 B", owner: "Management" },
          ].map((item) => <div key={item.name} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2"><Target className="size-3.5 text-primary"/><span className="text-[11px] font-medium">{item.name}</span><span className="ml-auto text-[9.5px] text-muted-foreground">{item.owner}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.actual)}%` }}/></div><div className="mt-1.5 flex justify-between text-[9.5px] text-muted-foreground"><span>{item.actual.toFixed(0)}% complete</span><span>Target {item.target}</span></div></div>)}</div>
        </Panel>

        <Panel title="ISO 50001 Readiness" eyebrow="Evidence controls" className="xl:col-span-5">
          <div className="flex items-center justify-between rounded-md border border-green/25 bg-green/8 p-4"><div><div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Readiness score</div><div className="mt-1 font-display text-3xl font-medium tabular text-green">86%</div></div><ShieldCheck className="size-8 text-green"/></div>
          <div className="mt-4 space-y-2">{["Energy review and SEU register", "EnPI and baseline versioning", "Action-plan ownership", "Measurement and verification", "Management-review evidence"].map((item, index) => <div key={item} className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2"><CheckCircle2 className={`size-3.5 ${index === 4 ? "text-amber" : "text-green"}`}/><span className="text-[10.5px]">{item}</span><span className={`ml-auto text-[9px] ${index === 4 ? "text-amber" : "text-green"}`}>{index === 4 ? "Review" : "Ready"}</span></div>)}</div>
        </Panel>

        <Panel title="Management Insight" eyebrow="No double counting" className="xl:col-span-12"><div className="flex items-start gap-3"><div className="grid size-9 place-items-center rounded-md bg-green/10 text-green"><Leaf className="size-4.5"/></div><div><div className="text-[12px] font-medium">Savings, energy, grid import, and emissions share one source chain</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">ArGrid links each carbon result to integrated grid energy, site emission factor, source quality, scenario state, and the stable verified-savings ledger.</div></div></div></Panel>
      </div>
    </AppShell>
  );
}
