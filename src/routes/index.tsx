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
import {
  Activity,
  ArrowRight,
  Building2,
  CircleDollarSign,
  CloudSun,
  Factory,
  Gauge,
  Leaf,
  Lightbulb,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { alarms, fmtIDR, fmtNum, opportunities, powerFlow24h, weekComparison } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/")({ component: Overview });

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const tooltip = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    boxShadow: "0 14px 40px rgba(0,0,0,.28)",
    fontSize: 11,
  },
};

function Overview() {
  const navigate = useNavigate();
  const { metrics, scenario, site, tick, setGuidedDemoOpen } = useSimulation();
  const annualOpportunity = opportunities.reduce((sum, item) => sum + item.annualSaving, 0);
  const demandPercent = (metrics.projectedDemand / metrics.demandLimit) * 100;
  const demandHeadroom = metrics.demandLimit - metrics.projectedDemand;
  const renewableShare = (metrics.solarPower / Math.max(metrics.currentPower, 0.01)) * 100;
  const liveSeries = powerFlow24h.map((point, index) => ({
    ...point,
    load: +(point.load + Math.sin((index + tick) / 7) * 0.06).toFixed(2),
  }));

  const insight =
    scenario === "peak-demand"
      ? {
          tone: "warning",
          icon: Gauge,
          eyebrow: "Priority intelligence · Demand control",
          title: "Contract demand may be exceeded in 18 minutes",
          body: `Projected demand is ${metrics.projectedDemand.toFixed(2)} MW against a ${metrics.demandLimit.toFixed(2)} MW limit. Four flexible loads account for 61% of the increase.`,
          impact: "Rp 42.6 M exposure",
          window: "18 min response window",
          action: "Investigate demand",
          route: "/demand" as const,
        }
      : scenario === "voltage-dip"
        ? {
            tone: "critical",
            icon: Zap,
            eyebrow: "Priority intelligence · Power quality",
            title: "Voltage dip detected on MSB-02 / F-07",
            body: "The event reached 82% Un for 240 ms. ArGrid correlated the disturbance with two affected utility loads and preserved the event context.",
            impact: "2 affected processes",
            window: "Event evidence ready",
            action: "Open electrical network",
            route: "/electrical" as const,
          }
        : {
            tone: "good",
            icon: Lightbulb,
            eyebrow: "Priority intelligence · Verified value",
            title: "Three high-confidence savings actions are ready",
            body: `The verified pipeline can add ${fmtIDR(348_000_000)} per year with payback below 18 months and quality-weighted evidence above 94%.`,
            impact: "Rp 348 M / year",
            window: "3 actions ready",
            action: "Review opportunities",
            route: "/opportunities" as const,
          };
  const InsightIcon = insight.icon;

  return (
    <AppShell
      title="Operational Overview"
      subtitle={`${site.name} · electrical operations, energy performance and commercial intelligence`}
    >
      <div className="space-y-3.5">
        <section className="overview-command-strip" aria-label="Site operating status">
          <CommandStatus
            icon={RadioTower}
            label="Electrical availability"
            value="99.99%"
            detail="All primary sources healthy"
            tone="good"
          />
          <CommandStatus
            icon={CloudSun}
            label="Renewable contribution"
            value={`${renewableShare.toFixed(1)}%`}
            detail={`${metrics.solarPower.toFixed(2)} MW rooftop solar`}
            tone="good"
          />
          <CommandStatus
            icon={CircleDollarSign}
            label="Tariff position"
            value="LWBP"
            detail="Peak tariff begins at 18:00"
          />
          <CommandStatus
            icon={ShieldCheck}
            label="Decision confidence"
            value={`${metrics.dataHealth.toFixed(1)}%`}
            detail="Quality-weighted telemetry"
            tone={metrics.dataHealth > 97 ? "good" : "warning"}
          />
        </section>

        <div className="section-kicker">Executive operating picture</div>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-12" aria-label="Primary energy KPIs">
          <KpiTile
            className="xl:col-span-2"
            label="Live Load"
            context="Plant active power"
            value={metrics.currentPower.toFixed(2)}
            unit="MW"
            trend={-3.2}
            trendLabel="vs same hour"
            icon={Activity}
            sparkline={[36, 42, 40, 54, 58, 63, 60, 68]}
          />
          <KpiTile
            className="xl:col-span-2"
            label="Energy Today"
            context="Midnight to current time"
            value={fmtNum(metrics.todayEnergy / 1_000, 1)}
            unit="MWh"
            trend={1.8}
            trendLabel="vs normalized plan"
            icon={Zap}
            sparkline={[24, 33, 38, 47, 55, 64, 76, 88]}
          />
          <KpiTile
            className="xl:col-span-2"
            label="Cost Today"
            context="Blended utility tariff"
            value={fmtIDR(metrics.todayCost)}
            trend={-4.5}
            trendLabel="favorable variance"
            tone="good"
            icon={CircleDollarSign}
            sparkline={[70, 65, 62, 60, 55, 51, 48, 45]}
          />
          <KpiTile
            className="col-span-2 xl:col-span-4"
            label="Demand Operating Envelope"
            context="Projected close of current demand interval"
            value={`${demandPercent.toFixed(0)}%`}
            hint={`${metrics.projectedDemand.toFixed(2)} / ${metrics.demandLimit.toFixed(2)} MW`}
            tone={demandPercent > 96 ? "critical" : demandPercent > 88 ? "warning" : "neutral"}
            icon={Gauge}
            progress={demandPercent}
          />
          <KpiTile
            className="col-span-2 xl:col-span-2"
            label="Verified Savings"
            context="Annualized and M&V approved"
            value={fmtIDR(metrics.verifiedSavings)}
            hint="YTD verified value"
            tone="good"
            icon={Leaf}
            sparkline={[22, 30, 36, 43, 58, 66, 79, 94]}
          />
        </section>

        <button
          className={`priority-insight priority-insight--${insight.tone} w-full p-4 text-left`}
          onClick={() => void navigate({ to: insight.route })}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-current/20 bg-current/8 text-[var(--signal-color)]">
                <InsightIcon className="size-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-[9.5px] uppercase tracking-[0.16em] text-[var(--signal-color)]">
                  {insight.eyebrow}
                </div>
                <div className="mt-1 text-[14px] font-medium tracking-tight text-foreground">{insight.title}</div>
                <div className="mt-1 max-w-4xl text-[11.5px] leading-relaxed text-muted-foreground">{insight.body}</div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
              <span className="signal-chip text-[10.5px] text-foreground">
                <TriangleAlert className="size-3.5 text-[var(--signal-color)]" /> {insight.impact}
              </span>
              <span className="signal-chip text-[10.5px] text-muted-foreground">{insight.window}</span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--signal-color)]/35 bg-[var(--signal-color)]/10 px-3 text-[10.5px] font-medium text-[var(--signal-color)]">
                {insight.action} <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>
        </button>

        <div className="section-kicker">Live system and commercial trajectory</div>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            title="Live Energy Flow"
            eyebrow="Electrical balance"
            subtitle="Source-to-load allocation with quality-weighted balance"
            className="h-[392px] xl:col-span-7"
            tone="accent"
            actions={
              <span className="inline-flex items-center gap-1.5 rounded border border-green/20 bg-green/8 px-2 py-1 text-[9.5px] text-green">
                <ShieldCheck className="size-3" /> balanced within 0.7%
              </span>
            }
          >
            <EnergyFlow
              utility={Math.max(0, metrics.currentPower - metrics.solarPower)}
              solar={metrics.solarPower}
              total={metrics.currentPower}
            />
          </Panel>

          <Panel
            title="Cost & Demand Trajectory"
            eyebrow="Predictive operating envelope"
            subtitle="Actual demand, forecast risk and contract threshold"
            className="h-[392px] xl:col-span-5"
            tone={demandPercent > 96 ? "critical" : "default"}
            actions={
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={() => void navigate({ to: "/demand" })}
              >
                Open forecast →
              </button>
            }
          >
            <div className="flex h-full flex-col">
              <div className="grid grid-cols-3 gap-2 border-b border-border/70 pb-3">
                <ForecastMetric label="Projected" value={`${metrics.projectedDemand.toFixed(2)} MW`} />
                <ForecastMetric
                  label="Headroom"
                  value={`${demandHeadroom >= 0 ? "+" : ""}${demandHeadroom.toFixed(2)} MW`}
                  tone={demandHeadroom < 0 ? "critical" : "good"}
                />
                <ForecastMetric label="Interval close" value="00:18:24" />
              </div>
              <div className="min-h-0 flex-1 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="overview-load" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.38} />
                        <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.015} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 6" vertical={false} />
                    <XAxis dataKey="t" {...axis} interval={7} />
                    <YAxis {...axis} width={38} domain={[0, 7]} tickFormatter={(value) => `${value}`} />
                    <Tooltip {...tooltip} formatter={(value: number) => `${value.toFixed(2)} MW`} />
                    <Area
                      type="monotone"
                      dataKey="load"
                      name="Demand"
                      stroke="var(--color-cyan)"
                      strokeWidth={1.8}
                      fill="url(#overview-load)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
        </section>

        <div className="section-kicker">Performance, action and reliability</div>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            title="Energy Performance"
            eyebrow="Normalized comparison"
            subtitle="Current week against previous operating pattern"
            className="h-[304px] xl:col-span-5"
            actions={<span className="text-[10px] text-green">4.8% favorable</span>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekComparison} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 6" vertical={false} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} width={45} tickFormatter={(value) => `${Math.round(value / 1_000)}k`} />
                <Tooltip {...tooltip} formatter={(value: number) => `${fmtNum(value)} kWh`} />
                <Bar dataKey="lastWeek" name="Previous week" fill="var(--color-surface-3)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="thisWeek" name="Current week" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel
            title="Opportunity Pipeline"
            eyebrow="Value conversion"
            subtitle="Annualized opportunity progressing to verified savings"
            className="h-[304px] xl:col-span-4"
            actions={<span className="text-[10px] text-green">{fmtIDR(annualOpportunity)} / yr</span>}
          >
            <div className="space-y-3">
              {[
                { label: "Identified", value: annualOpportunity, width: 100 },
                { label: "Validated", value: 706_000_000, width: 76 },
                { label: "Approved", value: 492_000_000, width: 53 },
                { label: "Implemented", value: 312_000_000, width: 34 },
                { label: "Verified", value: 244_000_000, width: 26 },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="tabular text-foreground">{fmtIDR(item.value)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/80">
                    <div
                      className={`h-full rounded-full ${index === 4 ? "bg-green" : "bg-primary"}`}
                      style={{ width: `${item.width}%`, opacity: 1 - index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Operational Events"
            eyebrow="Reliability watch"
            subtitle="Latest conditions requiring review"
            className="h-[304px] xl:col-span-3"
            actions={
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={() => void navigate({ to: "/alarms" })}
              >
                All events →
              </button>
            }
          >
            <ul className="space-y-0.5">
              {alarms.slice(0, 4).map((alarm, index) => (
                <li key={alarm.id} className="flex items-start gap-2.5 border-b border-border/65 py-2.5 last:border-0">
                  <SeverityDot level={alarm.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[11.5px] leading-snug text-foreground/92">{alarm.message}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
                      <span className="truncate tabular">{alarm.source}</span>
                      <span className="shrink-0">{index * 4 + 2} min ago</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <button
        className="btn-primary fixed bottom-4 left-1/2 -translate-x-1/2 shadow-xl lg:hidden"
        onClick={() => setGuidedDemoOpen(true)}
      >
        <Sparkles className="size-3.5" /> Guided demo
      </button>
    </AppShell>
  );
}

function CommandStatus({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: typeof RadioTower;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warning";
}) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : "text-primary";
  return (
    <div className="overview-command-item flex items-center gap-3">
      <div className={`grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2/70 ${toneClass}`}>
        <Icon className="size-4" strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[12.5px] font-medium tabular text-foreground">{value}</span>
          <span className="truncate text-[9.5px] text-muted-foreground/75">{detail}</span>
        </div>
      </div>
    </div>
  );
}

function ForecastMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "critical";
}) {
  const valueClass = tone === "good" ? "text-green" : tone === "critical" ? "text-red" : "text-foreground";
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[12.5px] font-medium tabular ${valueClass}`}>{value}</div>
    </div>
  );
}

function EnergyFlow({ utility, solar, total }: { utility: number; solar: number; total: number }) {
  const process = total * 0.61;
  const utilities = total * 0.24;
  const facilities = total * 0.145;
  const loss = total * 0.005;
  const renewable = (solar / Math.max(total, 0.01)) * 100;

  return (
    <div className="flex h-full flex-col">
      <div className="energy-flow-stage min-h-0 flex-1 p-1.5">
        <svg
          viewBox="0 0 780 278"
          className="h-full w-full"
          role="img"
          aria-label="Live energy flow from utility and solar to industrial loads"
        >
          <defs>
            <linearGradient id="flow-line" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity=".5" />
              <stop offset="100%" stopColor="var(--color-cyan)" />
            </linearGradient>
            <linearGradient id="flow-green" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--color-green)" stopOpacity=".5" />
              <stop offset="100%" stopColor="var(--color-green)" />
            </linearGradient>
          </defs>

          <FlowNode x={18} y={37} width={150} title="UTILITY GRID" value={`${utility.toFixed(2)} MW`} subtitle="Primary source" />
          <FlowNode x={18} y={168} width={150} title="ROOFTOP SOLAR" value={`${solar.toFixed(2)} MW`} subtitle={`${renewable.toFixed(1)}% contribution`} accent="green" />
          <FlowNode x={292} y={102} width={190} title="MAIN DISTRIBUTION" value={`${total.toFixed(2)} MW`} subtitle="20 kV → 400 V · synchronized" accent="primary" />
          <FlowNode x={612} y={18} width={150} title="PRODUCTION" value={`${process.toFixed(2)} MW`} subtitle="61.0% · 4 active lines" />
          <FlowNode x={612} y={103} width={150} title="UTILITIES" value={`${utilities.toFixed(2)} MW`} subtitle="24.0% · stable" />
          <FlowNode x={612} y={188} width={150} title="FACILITIES" value={`${facilities.toFixed(2)} MW`} subtitle="14.5% · normal" />

          <FlowPath d="M168 74 C230 74 238 128 292 128" width={3} />
          <FlowPath d="M168 205 C230 205 238 152 292 152" width={2.2} green />
          <FlowPath d="M482 128 C542 128 548 55 612 55" width={3.6} />
          <FlowPath d="M482 138 C545 138 550 140 612 140" width={2.6} opacity={0.84} />
          <FlowPath d="M482 148 C542 148 550 225 612 225" width={1.9} opacity={0.68} />

          {[0, 1, 2, 3].map((index) => (
            <circle key={`utility-${index}`} r="3" fill="var(--color-cyan)" opacity=".9">
              <animateMotion
                dur={`${3.2 + index * 0.25}s`}
                repeatCount="indefinite"
                path="M168 74 C230 74 238 128 292 128"
                begin={`${index * -0.8}s`}
              />
            </circle>
          ))}
          {[0, 1, 2].map((index) => (
            <circle key={`solar-${index}`} r="2.6" fill="var(--color-green)" opacity=".9">
              <animateMotion
                dur={`${3.5 + index * 0.2}s`}
                repeatCount="indefinite"
                path="M168 205 C230 205 238 152 292 152"
                begin={`${index * -1}s`}
              />
            </circle>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-[10px] sm:grid-cols-4">
        <FlowStat label="Distribution loss" value={`${(loss * 1_000).toFixed(0)} kW · 0.5%`} />
        <FlowStat label="Power factor" value="0.94 · healthy" />
        <FlowStat label="Renewable share" value={`${renewable.toFixed(1)}% · live`} tone="good" />
        <FlowStat label="Balance confidence" value="99.3% · trusted" tone="good" />
      </div>
    </div>
  );
}

function FlowPath({
  d,
  width,
  opacity = 1,
  green = false,
}: {
  d: string;
  width: number;
  opacity?: number;
  green?: boolean;
}) {
  return (
    <>
      <path d={d} fill="none" stroke="var(--color-border-strong)" strokeWidth={width + 3} opacity=".34" />
      <path
        d={d}
        fill="none"
        stroke={green ? "url(#flow-green)" : "url(#flow-line)"}
        strokeWidth={width}
        opacity={opacity}
      />
    </>
  );
}

function FlowStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good";
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <div className={`mt-1 tabular font-medium ${tone === "good" ? "text-green" : "text-foreground"}`}>{value}</div>
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
  accent = "neutral",
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  value: string;
  subtitle?: string;
  accent?: "neutral" | "green" | "primary";
}) {
  const signal = accent === "green" ? "var(--color-green)" : "var(--color-cyan)";
  const stroke = accent === "neutral" ? "var(--color-border-strong)" : signal;
  return (
    <g>
      <rect x={x} y={y} width={width} height={76} rx="7" fill="var(--color-surface-2)" stroke={stroke} strokeOpacity={accent === "neutral" ? 1 : 0.58} />
      <rect x={x + 1} y={y + 1} width={width - 2} height="25" rx="6" fill="var(--color-surface-3)" opacity=".42" />
      <circle cx={x + 18} cy={y + 18} r="4.5" fill={signal} opacity=".92" />
      <text x={x + 30} y={y + 21} fill="var(--color-muted-foreground)" fontSize="9.2" letterSpacing="1.05">
        {title}
      </text>
      <text x={x + 15} y={y + 50} fill="var(--color-foreground)" fontSize="17" fontWeight="500" fontFamily="ui-sans-serif, system-ui">
        {value}
      </text>
      {subtitle && (
        <text x={x + 15} y={y + 66} fill="var(--color-muted-foreground)" fontSize="9.2">
          {subtitle}
        </text>
      )}
    </g>
  );
}
