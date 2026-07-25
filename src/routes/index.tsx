import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, CircleDollarSign, CloudSun, Gauge, Leaf, Lightbulb, RadioTower, ShieldCheck, Sparkles, TriangleAlert, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { fmtIDR, fmtNum, opportunities } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/")({ component: Overview });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tooltip = { contentStyle: { background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, boxShadow: "0 14px 40px rgba(0,0,0,.28)", fontSize: 11 } };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function Overview() {
  const navigate = useNavigate();
  const {
    metrics,
    scenario,
    scenarioState,
    site,
    setGuidedDemoOpen,
    historian24h,
    feeders,
    alarms,
  } = useSimulation();
  const annualOpportunity = opportunities.reduce((sum, item) => sum + item.annualSaving, 0);
  const demandPercent = metrics.projectedDemand / metrics.demandLimit * 100;
  const demandHeadroom = metrics.demandLimit - metrics.projectedDemand;
  const performanceData = historian24h.filter((_, index) => index % 8 === 0).map((point) => ({
    t: point.t,
    actual: +(point.loadMw * 1_000).toFixed(0),
    baseline: +(point.loadMw * 1_045).toFixed(0),
  }));
  const processKw = feeders.filter((item) => item.kind === "process" || item.kind === "it-load").reduce((sum, item) => sum + item.kw, 0);
  const utilityKw = feeders.filter((item) => ["cooling", "compressed-air", "utility"].includes(item.kind)).reduce((sum, item) => sum + item.kw, 0);
  const facilityKw = Math.max(0, metrics.currentPower * 1_000 - processKw - utilityKw);

  const insight = scenario === "peak-demand"
    ? {
        tone: "warning",
        icon: Gauge,
        eyebrow: `Priority intelligence · ${scenarioState.label}`,
        title: metrics.demandChargeExposure > 0 ? `Contract demand is projected to exceed by ${((metrics.projectedDemand - metrics.demandLimit) * 1_000).toFixed(0)} kW` : "Demand is approaching the intervention threshold",
        body: `The ${site.tariff.demandIntervalMinutes}-minute interval is derived from the same historian shown in Demand & Cost. Flexible loads can be evaluated without rewriting actual history.`,
        impact: metrics.demandChargeExposure > 0 ? `${fmtIDR(metrics.demandChargeExposure)} exposure` : `${demandPercent.toFixed(1)}% of contract limit`,
        window: `${formatDuration(metrics.intervalRemainingSeconds)} remaining`,
        action: "Investigate demand",
        route: "/demand" as const,
      }
    : scenario === "voltage-dip" && scenarioState.phase !== "precondition"
      ? {
          tone: scenarioState.phase === "event" ? "critical" : "warning",
          icon: Zap,
          eyebrow: `Priority intelligence · ${scenarioState.label}`,
          title: scenarioState.phase === "event" ? "Voltage dip active on MSB-02 / F-07" : "Voltage restored; correlated PQ evidence is ready",
          body: "The 82% Un, 240 ms event follows a deterministic onset, recovery, and analysis sequence. Telemetry quality remains independent from electrical quality.",
          impact: `${alarms.filter((alarm) => alarm.severity === "Critical").length} critical event`,
          window: scenarioState.phase === "event" ? "Event active" : "Recovery verified",
          action: "Open electrical network",
          route: "/electrical" as const,
        }
      : scenario === "efficiency" && scenarioState.eventActive
        ? {
            tone: "warning",
            icon: Lightbulb,
            eyebrow: `Priority intelligence · ${scenarioState.label}`,
            title: "Utility energy intensity is above normalized baseline",
            body: "The engine increases only the affected utility load while production or service demand remains stable, creating an explainable efficiency opportunity.",
            impact: "Opportunity evidence ready",
            window: scenarioState.phase,
            action: "Review opportunities",
            route: "/opportunities" as const,
          }
        : {
            tone: "good",
            icon: ShieldCheck,
            eyebrow: "Priority intelligence · Stable operating envelope",
            title: "Electrical balance, demand, tariff, and data quality are healthy",
            body: `Grid import, rooftop solar, feeder load, transformer loss, interval demand, and cost are reconciled by one deterministic calculation engine.`,
            impact: `${metrics.balanceErrorPercent.toFixed(3)}% balance error`,
            window: `${metrics.dataHealth.toFixed(1)}% data confidence`,
            action: "Start guided demo",
            route: "/" as const,
          };
  const InsightIcon = insight.icon;

  return (
    <AppShell title="Operational Overview" subtitle={`${site.name} · causal electrical, energy, demand, cost, and alarm simulation`}>
      <div className="space-y-3.5">
        <section className="overview-command-strip" aria-label="Site operating status">
          <CommandStatus icon={RadioTower} label="Simulation state" value={scenarioState.phase} detail={scenarioState.label} tone={scenarioState.eventActive ? "warning" : "good"} />
          <CommandStatus icon={CloudSun} label="Renewable contribution" value={`${metrics.renewableShare.toFixed(1)}%`} detail={`${metrics.solarPower.toFixed(2)} MW · daylight bounded`} tone="good" />
          <CommandStatus icon={CircleDollarSign} label="Tariff position" value={metrics.tariffPeriod.split(" · ")[0]} detail={`${fmtIDR(metrics.tariffRateIdrPerKwh)} / kWh`} />
          <CommandStatus icon={ShieldCheck} label="Decision confidence" value={`${metrics.dataHealth.toFixed(1)}%`} detail="Telemetry quality · independent of PQ" tone={metrics.dataHealth > 98 ? "good" : "warning"} />
        </section>

        <div className="section-kicker">Executive operating picture</div>
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-12" aria-label="Primary energy KPIs">
          <KpiTile className="xl:col-span-2" label="Plant Load" context="Sum of live feeder demand" value={metrics.currentPower.toFixed(2)} unit="MW" icon={Activity} sparkline={historian24h.slice(-8).map((point) => point.loadMw / Math.max(metrics.demandLimit, 0.1) * 100)} />
          <KpiTile className="xl:col-span-2" label="Grid Import" context="Load + loss − solar" value={metrics.gridPower.toFixed(2)} unit="MW" icon={Zap} sparkline={historian24h.slice(-8).map((point) => point.gridMw / Math.max(metrics.demandLimit, 0.1) * 100)} />
          <KpiTile className="xl:col-span-2" label="Energy Today" context="Power integrated from midnight" value={fmtNum(metrics.todayEnergy / 1_000, 1)} unit="MWh" icon={Zap} />
          <KpiTile className="col-span-2 xl:col-span-4" label="Demand Operating Envelope" context={`${site.tariff.demandIntervalMinutes}-minute contractual average`} value={`${demandPercent.toFixed(0)}%`} hint={`${metrics.projectedDemand.toFixed(2)} / ${metrics.demandLimit.toFixed(2)} MW · ${formatDuration(metrics.intervalRemainingSeconds)}`} tone={demandPercent > 100 ? "critical" : demandPercent > 92 ? "warning" : "good"} icon={Gauge} progress={demandPercent} />
          <KpiTile className="col-span-2 xl:col-span-2" label="Verified Savings" context="Stable M&V-approved ledger" value={fmtIDR(metrics.verifiedSavings)} hint="does not increment without verification" tone="good" icon={Leaf} />
        </section>

        <button className={`priority-insight priority-insight--${insight.tone} w-full p-4 text-left`} onClick={() => insight.action === "Start guided demo" ? setGuidedDemoOpen(true) : void navigate({ to: insight.route })}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3.5"><div className="grid size-10 shrink-0 place-items-center rounded-lg border border-current/20 bg-current/8 text-[var(--signal-color)]"><InsightIcon className="size-5" strokeWidth={1.8} /></div><div className="min-w-0"><div className="text-[9.5px] uppercase tracking-[0.16em] text-[var(--signal-color)]">{insight.eyebrow}</div><div className="mt-1 text-[14px] font-medium tracking-tight text-foreground">{insight.title}</div><div className="mt-1 max-w-4xl text-[11.5px] leading-relaxed text-muted-foreground">{insight.body}</div></div></div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end"><span className="signal-chip text-[10.5px] text-foreground"><TriangleAlert className="size-3.5 text-[var(--signal-color)]" /> {insight.impact}</span><span className="signal-chip text-[10.5px] text-muted-foreground">{insight.window}</span><span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--signal-color)]/35 bg-[var(--signal-color)]/10 px-3 text-[10.5px] font-medium text-[var(--signal-color)]">{insight.action} <ArrowRight className="size-3.5" /></span></div>
          </div>
        </button>

        <div className="section-kicker">Live system and contractual demand</div>
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Live Energy Flow" eyebrow="Electrical balance" subtitle="Source-to-load allocation reconciled with transformer loss" className="h-[392px] xl:col-span-7" tone="accent" actions={<span className="inline-flex items-center gap-1.5 rounded border border-green/20 bg-green/8 px-2 py-1 text-[9.5px] text-green"><ShieldCheck className="size-3" /> error {metrics.balanceErrorPercent.toFixed(3)}%</span>}>
            <EnergyFlow utility={metrics.gridPower} solar={metrics.solarPower} total={metrics.currentPower} lossKw={metrics.transformerLossKw} processKw={processKw} utilityKw={utilityKw} facilityKw={facilityKw} />
          </Panel>

          <Panel title="Demand Trajectory" eyebrow="Historian-linked operating envelope" subtitle="24-hour grid import with active contract threshold" className="h-[392px] xl:col-span-5" tone={demandPercent > 100 ? "critical" : "default"} actions={<button className="text-[10px] text-primary hover:underline" onClick={() => void navigate({ to: "/demand" })}>Open interval forecast →</button>}>
            <div className="flex h-full flex-col"><div className="grid grid-cols-3 gap-2 border-b border-border/70 pb-3"><ForecastMetric label="Projected" value={`${metrics.projectedDemand.toFixed(2)} MW`} /><ForecastMetric label="Headroom" value={`${demandHeadroom >= 0 ? "+" : ""}${demandHeadroom.toFixed(2)} MW`} tone={demandHeadroom < 0 ? "critical" : "good"} /><ForecastMetric label="Interval close" value={formatDuration(metrics.intervalRemainingSeconds)} /></div><div className="min-h-0 flex-1 pt-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historian24h} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="overview-load" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 6" vertical={false} /><XAxis dataKey="t" {...axis} interval={15} /><YAxis {...axis} width={38} domain={[0, Math.ceil(metrics.demandLimit + 1)]} /><Tooltip {...tooltip} formatter={(value: number) => `${value.toFixed(2)} MW`} /><ReferenceLine y={metrics.demandLimit} stroke="var(--color-red)" strokeDasharray="4 4" /><Area type="monotone" dataKey="gridMw" name="Grid import" stroke="var(--color-cyan)" strokeWidth={1.8} fill="url(#overview-load)" dot={false} /></AreaChart></ResponsiveContainer></div></div>
          </Panel>
        </section>

        <div className="section-kicker">Performance, action and reliability</div>
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Energy Performance" eyebrow="Normalized 24-hour comparison" subtitle="Historian values against a deterministic 4.5% baseline" className="h-[304px] xl:col-span-5" actions={<span className="text-[10px] text-green">4.5% favorable model</span>}><ResponsiveContainer width="100%" height="100%"><BarChart data={performanceData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 6" vertical={false} /><XAxis dataKey="t" {...axis} /><YAxis {...axis} width={45} tickFormatter={(value) => `${Math.round(value / 1_000)}k`} /><Tooltip {...tooltip} formatter={(value: number) => `${fmtNum(value)} kW`} /><Bar dataKey="baseline" name="Normalized baseline" fill="var(--color-surface-3)" radius={[2, 2, 0, 0]} /><Bar dataKey="actual" name="Actual" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></Panel>

          <Panel title="Opportunity Pipeline" eyebrow="Value conversion" subtitle="Commercial workflow remains separate from live measurement counters" className="h-[304px] xl:col-span-4" actions={<span className="text-[10px] text-green">{fmtIDR(annualOpportunity)} / yr</span>}><div className="space-y-3">{[
            { label: "Identified", value: annualOpportunity, width: 100 },
            { label: "Validated", value: 706_000_000, width: 76 },
            { label: "Approved", value: 492_000_000, width: 53 },
            { label: "Implemented", value: 312_000_000, width: 34 },
            { label: "Verified", value: metrics.verifiedSavings, width: Math.min(100, metrics.verifiedSavings / annualOpportunity * 100) },
          ].map((item, index) => <div key={item.label}><div className="flex items-center justify-between text-[10.5px]"><span className="text-muted-foreground">{item.label}</span><span className="tabular text-foreground">{fmtIDR(item.value)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/80"><div className={`h-full rounded-full ${index === 4 ? "bg-green" : "bg-primary"}`} style={{ width: `${item.width}%`, opacity: 1 - index * 0.1 }} /></div></div>)}</div></Panel>

          <Panel title="Operational Attention" eyebrow="Rule-engine output" subtitle="Only conditions generated by current measurements" className="h-[304px] xl:col-span-3" actions={<button className="text-[10px] text-primary hover:underline" onClick={() => void navigate({ to: "/alarms" })}>Alarm lifecycle →</button>}>
            {alarms.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><ShieldCheck className="size-8 text-green" strokeWidth={1.4} /><div className="mt-3 text-[12px] font-medium">No active abnormal condition</div><div className="mt-1 max-w-56 text-[10.5px] leading-relaxed text-muted-foreground">The demo no longer fabricates standing alarms during normal operation.</div></div> : <ul className="space-y-0.5">{alarms.slice(0, 4).map((alarm) => <li key={alarm.id} className="flex items-start gap-2.5 border-b border-border/65 py-2.5 last:border-0"><SeverityDot level={alarm.severity} /><div className="min-w-0 flex-1"><div className="line-clamp-2 text-[11.5px] leading-snug text-foreground/92">{alarm.message}</div><div className="mt-1 flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground"><span className="truncate tabular">{alarm.source}</span><span className="shrink-0 uppercase">{alarm.state}</span></div></div></li>)}</ul>}
          </Panel>
        </section>
      </div>

      <button className="btn-primary fixed bottom-4 left-1/2 -translate-x-1/2 shadow-xl lg:hidden" onClick={() => setGuidedDemoOpen(true)}><Sparkles className="size-3.5" /> Guided demo</button>
    </AppShell>
  );
}

function CommandStatus({ icon: Icon, label, value, detail, tone = "neutral" }: { icon: typeof RadioTower; label: string; value: string; detail: string; tone?: "neutral" | "good" | "warning" }) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : "text-primary";
  return <div className="overview-command-item flex items-center gap-3"><div className={`grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2/70 ${toneClass}`}><Icon className="size-4" strokeWidth={1.7} /></div><div className="min-w-0"><div className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{label}</div><div className="mt-0.5 flex items-baseline gap-2"><span className="text-[12.5px] font-medium tabular text-foreground">{value}</span><span className="truncate text-[9.5px] text-muted-foreground/75">{detail}</span></div></div></div>;
}

function ForecastMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "critical" }) {
  const valueClass = tone === "good" ? "text-green" : tone === "critical" ? "text-red" : "text-foreground";
  return <div><div className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{label}</div><div className={`mt-1 text-[12.5px] font-medium tabular ${valueClass}`}>{value}</div></div>;
}

function EnergyFlow({ utility, solar, total, lossKw, processKw, utilityKw, facilityKw }: { utility: number; solar: number; total: number; lossKw: number; processKw: number; utilityKw: number; facilityKw: number }) {
  const renewable = solar / Math.max(total, 0.01) * 100;
  return <div className="flex h-full flex-col"><div className="energy-flow-stage min-h-0 flex-1 p-1.5"><svg viewBox="0 0 780 278" className="h-full w-full" role="img" aria-label="Live energy flow reconciled by the balance engine"><defs><linearGradient id="flow-line" x1="0" x2="1"><stop offset="0%" stopColor="var(--color-cyan)" stopOpacity=".5" /><stop offset="100%" stopColor="var(--color-cyan)" /></linearGradient><linearGradient id="flow-green" x1="0" x2="1"><stop offset="0%" stopColor="var(--color-green)" stopOpacity=".5" /><stop offset="100%" stopColor="var(--color-green)" /></linearGradient></defs><FlowNode x={18} y={37} width={150} title="UTILITY GRID" value={`${utility.toFixed(2)} MW`} subtitle="Contract demand source" /><FlowNode x={18} y={168} width={150} title="ROOFTOP SOLAR" value={`${solar.toFixed(2)} MW`} subtitle={`${renewable.toFixed(1)}% · daylight bounded`} accent="green" /><FlowNode x={292} y={102} width={190} title="MAIN DISTRIBUTION" value={`${total.toFixed(2)} MW`} subtitle={`Loss ${lossKw.toFixed(0)} kW · synchronized`} accent="primary" /><FlowNode x={612} y={18} width={150} title="PROCESS / IT" value={`${(processKw / 1_000).toFixed(2)} MW`} subtitle="Derived feeder group" /><FlowNode x={612} y={103} width={150} title="UTILITIES" value={`${(utilityKw / 1_000).toFixed(2)} MW`} subtitle="Cooling, air, auxiliaries" /><FlowNode x={612} y={188} width={150} title="FACILITIES" value={`${(facilityKw / 1_000).toFixed(2)} MW`} subtitle="Buildings and services" /><FlowPath d="M168 74 C230 74 238 128 292 128" width={3} /><FlowPath d="M168 205 C230 205 238 152 292 152" width={2.2} green /><FlowPath d="M482 128 C542 128 548 55 612 55" width={3.6} /><FlowPath d="M482 138 C545 138 550 140 612 140" width={2.6} opacity={0.84} /><FlowPath d="M482 148 C542 148 550 225 612 225" width={1.9} opacity={0.68} />{[0, 1, 2].map((index) => <circle key={`utility-${index}`} r="3" fill="var(--color-cyan)" opacity=".9"><animateMotion dur={`${3.2 + index * 0.25}s`} repeatCount="indefinite" path="M168 74 C230 74 238 128 292 128" begin={`${index * -0.8}s`} /></circle>)}{[0, 1].map((index) => <circle key={`solar-${index}`} r="2.7" fill="var(--color-green)" opacity=".85"><animateMotion dur={`${3.5 + index * 0.2}s`} repeatCount="indefinite" path="M168 205 C230 205 238 152 292 152" begin={`${index * -1}s`} /></circle>)}</svg></div><div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-[10.5px]"><div><span className="text-muted-foreground">Transformer loss</span><div className="mt-1 tabular font-medium">{lossKw.toFixed(0)} kW</div></div><div><span className="text-muted-foreground">Power factor</span><div className="mt-1 tabular font-medium">reconciled upstream</div></div><div><span className="text-muted-foreground">Source balance</span><div className="mt-1 flex items-center gap-1 text-green"><ShieldCheck className="size-3" /> physically closed</div></div></div></div>;
}

function FlowNode({ x, y, width, title, value, subtitle, accent = "neutral" }: { x: number; y: number; width: number; title: string; value: string; subtitle: string; accent?: "neutral" | "green" | "primary" }) {
  const stroke = accent === "green" ? "var(--color-green)" : accent === "primary" ? "var(--color-primary)" : "var(--color-border-strong)";
  const dot = accent === "green" ? "var(--color-green)" : "var(--color-cyan)";
  return <g><rect x={x} y={y} width={width} height={74} rx="7" fill="var(--color-surface-2)" stroke={stroke} strokeOpacity={accent === "neutral" ? 1 : 0.55} /><circle cx={x + 19} cy={y + 20} r="5" fill={dot} opacity=".9" /><text x={x + 31} y={y + 23} fill="var(--color-muted-foreground)" fontSize="9.5" letterSpacing="1.1">{title}</text><text x={x + 16} y={y + 50} fill="var(--color-foreground)" fontSize="17" fontWeight="500">{value}</text><text x={x + 16} y={y + 65} fill="var(--color-muted-foreground)" fontSize="9.5">{subtitle}</text></g>;
}

function FlowPath({ d, width, opacity = 1, green = false }: { d: string; width: number; opacity?: number; green?: boolean }) {
  return <path d={d} fill="none" stroke={green ? "url(#flow-green)" : "url(#flow-line)"} strokeWidth={width} opacity={opacity} />;
}
