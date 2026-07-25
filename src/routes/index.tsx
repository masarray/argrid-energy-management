import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, CircleAlert, Gauge, Lightbulb, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { alarms, fmtIDR, fmtNum, opportunities, powerFlow24h, weekComparison } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/")({ component: Overview });

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tooltip = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    fontSize: 11,
  },
};

function Overview() {
  const navigate = useNavigate();
  const { metrics, scenario, site, tick, setGuidedDemoOpen } = useSimulation();
  const annualOpportunity = opportunities.reduce((sum, item) => sum + item.annualSaving, 0);
  const demandPercent = (metrics.projectedDemand / metrics.demandLimit) * 100;
  const liveSeries = powerFlow24h.map((point, index) => ({
    ...point,
    load: +(point.load + Math.sin((index + tick) / 7) * 0.06).toFixed(2),
  }));

  const insight =
    scenario === "peak-demand"
      ? {
          tone: "warning",
          icon: Gauge,
          title: "Contract demand may be exceeded in 18 minutes",
          body: `Projected demand is ${metrics.projectedDemand.toFixed(2)} MW against a ${metrics.demandLimit.toFixed(2)} MW limit. Estimated demand-charge exposure: Rp 42.6 M.`,
          action: "Investigate demand",
          route: "/demand" as const,
        }
      : scenario === "voltage-dip"
        ? {
            tone: "critical",
            icon: Zap,
            title: "Voltage dip detected on MSB-02 / F-07",
            body: "The event reached 82% Un for 240 ms. ArGrid correlated the disturbance with two affected utility loads.",
            action: "Open electrical network",
            route: "/electrical" as const,
          }
        : {
            tone: "good",
            icon: Lightbulb,
            title: "Three high-confidence savings actions are ready",
            body: `The verified pipeline can add ${fmtIDR(348_000_000)} per year with payback below 18 months.`,
            action: "Review opportunities",
            route: "/opportunities" as const,
          };
  const InsightIcon = insight.icon;

  return (
    <AppShell title="Operational Overview" subtitle={`${site.name} · unified electrical, energy, and financial intelligence`}>
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-3">
        <KpiTile label="Live Load" value={metrics.currentPower.toFixed(2)} unit="MW" trend={-3.2} />
        <KpiTile label="Energy Today" value={fmtNum(metrics.todayEnergy / 1_000, 1)} unit="MWh" trend={1.8} />
        <KpiTile label="Cost Today" value={fmtIDR(metrics.todayCost)} trend={-4.5} tone="good" />
        <KpiTile
          label="Demand Forecast"
          value={`${demandPercent.toFixed(0)}%`}
          hint={`${metrics.projectedDemand.toFixed(2)} / ${metrics.demandLimit.toFixed(2)} MW`}
          tone={demandPercent > 96 ? "critical" : demandPercent > 88 ? "warning" : "neutral"}
        />
        <KpiTile label="Verified Savings" value={fmtIDR(metrics.verifiedSavings)} hint="annualized YTD" tone="good" />
        <KpiTile label="Active Alarms" value={String(metrics.activeAlarms)} hint={`${metrics.criticalAlarms} critical`} tone={metrics.criticalAlarms ? "critical" : "warning"} />
      </div>

      <button
        className={`w-full mb-3 text-left rounded-lg border px-4 py-3 flex items-center gap-3 transition-colors ${
          insight.tone === "critical"
            ? "border-red/35 bg-red/8 hover:bg-red/12"
            : insight.tone === "warning"
              ? "border-amber/35 bg-amber/8 hover:bg-amber/12"
              : "border-green/30 bg-green/7 hover:bg-green/11"
        }`}
        onClick={() => void navigate({ to: insight.route })}
      >
        <div className={`size-9 rounded-md grid place-items-center shrink-0 ${insight.tone === "critical" ? "bg-red/15 text-red" : insight.tone === "warning" ? "bg-amber/15 text-amber" : "bg-green/15 text-green"}`}>
          <InsightIcon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium">{insight.title}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{insight.body}</div>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[11px] text-primary shrink-0">{insight.action} <ArrowRight className="size-3.5" /></span>
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel
          title="Live Energy Flow"
          className="xl:col-span-7 h-[355px]"
          actions={<span className="text-[10.5px] text-muted-foreground">balanced within 0.7%</span>}
        >
          <EnergyFlow
            utility={Math.max(0, metrics.currentPower - metrics.solarPower)}
            solar={metrics.solarPower}
            total={metrics.currentPower}
          />
        </Panel>

        <Panel title="Cost & Demand Trajectory" className="xl:col-span-5 h-[355px]" actions={<button className="text-[10.5px] text-primary hover:underline" onClick={() => void navigate({ to: "/demand" })}>Open forecast →</button>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liveSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="overview-load" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false} />
              <XAxis dataKey="t" {...axis} interval={7} />
              <YAxis {...axis} width={38} domain={[0, 7]} tickFormatter={(v) => `${v}`} />
              <Tooltip {...tooltip} formatter={(v: number) => `${v.toFixed(2)} MW`} />
              <Area type="monotone" dataKey="load" name="Demand" stroke="var(--color-cyan)" strokeWidth={1.8} fill="url(#overview-load)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Energy Performance vs Previous Week" className="xl:col-span-5 h-[292px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekComparison} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 5" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} width={45} tickFormatter={(v) => `${Math.round(v / 1_000)}k`} />
              <Tooltip {...tooltip} formatter={(v: number) => `${fmtNum(v)} kWh`} />
              <Bar dataKey="lastWeek" name="Previous week" fill="var(--color-surface-3)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="thisWeek" name="Current week" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Opportunity Pipeline" className="xl:col-span-4 h-[292px]" actions={<span className="text-[10px] text-green">{fmtIDR(annualOpportunity)} / yr</span>}>
          <div className="space-y-3">
            {[
              { label: "Identified", value: annualOpportunity, width: 100 },
              { label: "Validated", value: 706_000_000, width: 76 },
              { label: "Approved", value: 492_000_000, width: 53 },
              { label: "Implemented", value: 312_000_000, width: 34 },
              { label: "Verified", value: 244_000_000, width: 26 },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="tabular">{fmtIDR(item.value)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className={`h-full rounded-full ${index === 4 ? "bg-green" : "bg-primary"}`} style={{ width: `${item.width}%`, opacity: 1 - index * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Operational Events" className="xl:col-span-3 h-[292px]" actions={<button className="text-[10px] text-primary hover:underline" onClick={() => void navigate({ to: "/alarms" })}>All events →</button>}>
          <ul className="space-y-0.5">
            {alarms.slice(0, 4).map((alarm) => (
              <li key={alarm.id} className="flex items-start gap-2.5 py-2 border-b border-border/70 last:border-0">
                <SeverityDot level={alarm.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] leading-snug line-clamp-2">{alarm.message}</div>
                  <div className="mt-1 text-[9.5px] text-muted-foreground tabular">{alarm.source}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <button className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:hidden btn-primary shadow-xl" onClick={() => setGuidedDemoOpen(true)}>
        <Sparkles className="size-3.5" /> Guided demo
      </button>
    </AppShell>
  );
}

function EnergyFlow({ utility, solar, total }: { utility: number; solar: number; total: number }) {
  const process = total * 0.61;
  const utilities = total * 0.24;
  const facilities = total * 0.145;
  const loss = total * 0.005;

  return (
    <div className="h-full flex flex-col">
      <svg viewBox="0 0 760 265" className="w-full flex-1" role="img" aria-label="Live energy flow from utility and solar to industrial loads">
        <defs>
          <linearGradient id="flow-line" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity=".55" />
            <stop offset="100%" stopColor="var(--color-cyan)" />
          </linearGradient>
        </defs>
        <FlowNode x={18} y={38} width={142} title="UTILITY GRID" value={`${utility.toFixed(2)} MW`} icon="grid" />
        <FlowNode x={18} y={158} width={142} title="ROOFTOP SOLAR" value={`${solar.toFixed(2)} MW`} icon="solar" accent />
        <FlowNode x={290} y={98} width={178} title="MAIN DISTRIBUTION" value={`${total.toFixed(2)} MW`} subtitle="20 kV → 400 V" icon="distribution" />
        <FlowNode x={600} y={20} width={142} title="PRODUCTION" value={`${process.toFixed(2)} MW`} subtitle="61.0%" icon="load" />
        <FlowNode x={600} y={105} width={142} title="UTILITIES" value={`${utilities.toFixed(2)} MW`} subtitle="24.0%" icon="load" />
        <FlowNode x={600} y={190} width={142} title="FACILITIES" value={`${facilities.toFixed(2)} MW`} subtitle="14.5%" icon="load" />

        <path d="M160 75 C225 75 230 125 290 125" fill="none" stroke="url(#flow-line)" strokeWidth="3" />
        <path d="M160 195 C225 195 230 145 290 145" fill="none" stroke="url(#flow-line)" strokeWidth="2" opacity=".75" />
        <path d="M468 125 C525 125 535 57 600 57" fill="none" stroke="url(#flow-line)" strokeWidth="3.5" />
        <path d="M468 135 C525 135 535 142 600 142" fill="none" stroke="url(#flow-line)" strokeWidth="2.5" opacity=".85" />
        <path d="M468 145 C525 145 535 227 600 227" fill="none" stroke="url(#flow-line)" strokeWidth="1.8" opacity=".7" />

        {[0, 1, 2, 3].map((index) => (
          <circle key={`a-${index}`} r="3" fill="var(--color-cyan)" opacity=".9">
            <animateMotion dur={`${3.2 + index * 0.25}s`} repeatCount="indefinite" path="M160 75 C225 75 230 125 290 125" begin={`${index * -0.8}s`} />
          </circle>
        ))}
        {[0, 1, 2].map((index) => (
          <circle key={`b-${index}`} r="2.5" fill="var(--color-green)" opacity=".85">
            <animateMotion dur={`${3.5 + index * 0.2}s`} repeatCount="indefinite" path="M160 195 C225 195 230 145 290 145" begin={`${index * -1}s`} />
          </circle>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-[10.5px]">
        <div><span className="text-muted-foreground">Distribution loss</span><div className="mt-1 tabular font-medium">{(loss * 1_000).toFixed(0)} kW · 0.5%</div></div>
        <div><span className="text-muted-foreground">Power factor</span><div className="mt-1 tabular font-medium">0.94 · healthy</div></div>
        <div><span className="text-muted-foreground">Balance confidence</span><div className="mt-1 flex items-center gap-1 text-green"><ShieldCheck className="size-3" /> 99.3%</div></div>
      </div>
    </div>
  );
}

function FlowNode({
  x,
  y,
  width,
  title,
  value,
  subtitle,
  accent = false,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={74} rx="7" fill="var(--color-surface-2)" stroke={accent ? "var(--color-green)" : "var(--color-border-strong)"} strokeOpacity={accent ? .55 : 1} />
      <circle cx={x + 19} cy={y + 20} r="5" fill={accent ? "var(--color-green)" : "var(--color-cyan)"} opacity=".9" />
      <text x={x + 31} y={y + 23} fill="var(--color-muted-foreground)" fontSize="9.5" letterSpacing="1.1">{title}</text>
      <text x={x + 16} y={y + 50} fill="var(--color-foreground)" fontSize="17" fontWeight="500" fontFamily="ui-sans-serif, system-ui">{value}</text>
      {subtitle && <text x={x + 16} y={y + 65} fill="var(--color-muted-foreground)" fontSize="9.5">{subtitle}</text>}
    </g>
  );
}
