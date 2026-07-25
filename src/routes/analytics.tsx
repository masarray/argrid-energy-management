import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/argrid-ui";
import { fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Energy Analytics — ArGrid" },
      { name: "description", content: "Historian-linked baseline, EnPI, and site-specific load profiles." },
      { property: "og:title", content: "ArGrid Energy Analytics" },
      { property: "og:description", content: "Baseline comparison, load profiles, and EnPI trends." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tt = { contentStyle: { background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 } };
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const colors = ["var(--color-cyan)", "var(--color-green)", "var(--color-amber)", "var(--color-violet)", "var(--color-muted-foreground)"];

function profileLoad(type: string, day: number, hour: number) {
  const weekend = day > 4;
  if (type === "Data Center") return 3.25 + Math.sin(hour / 24 * Math.PI * 2) * 0.08 + Math.max(0, Math.sin((hour - 7) / 12 * Math.PI)) * 0.42;
  if (type === "Commercial Campus") {
    const occupied = hour >= 7 && hour < 20;
    return occupied ? (weekend ? 1.25 : 2.1) + Math.max(0, Math.sin((hour - 7) / 12 * Math.PI)) * 0.55 : 0.48;
  }
  const activeShift = hour >= 6 && hour < 22;
  return (activeShift ? 5.1 : 2.75) * (weekend ? 0.68 : 1) + Math.sin(hour * 0.9 + day) * 0.16;
}

function Analytics() {
  const { site, feeders, historian24h, metrics } = useSimulation();
  const heatmap = useMemo(
    () => Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, hour) => +Math.max(0.1, profileLoad(site.type, day, hour)).toFixed(2))),
    [site.type],
  );
  const max = Math.max(...heatmap.flat());
  const monthlyEnergy = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index];
    const season = 1 + Math.sin((index - 1) / 12 * Math.PI * 2) * (site.type === "Data Center" ? 0.025 : 0.08);
    const baseline = site.monthlyEnergyKwh * season;
    const actual = baseline * (index <= 6 ? 0.955 : 0.97);
    return { m: month, baseline: Math.round(baseline), actual: Math.round(actual) };
  }), [site.monthlyEnergyKwh, site.type]);
  const usage = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const feeder of feeders) {
      const group = feeder.kind === "process" || feeder.kind === "it-load" ? "Core load" : feeder.kind === "cooling" ? "Cooling" : feeder.kind === "compressed-air" ? "Compressed air" : feeder.kind === "building" || feeder.kind === "lighting" ? "Facilities" : "Utilities";
      grouped.set(group, (grouped.get(group) ?? 0) + feeder.kw);
    }
    const total = [...grouped.values()].reduce((sum, value) => sum + value, 0);
    return [...grouped.entries()].map(([name, value], index) => ({ name, value: total > 0 ? value / total * 100 : 0, color: colors[index % colors.length] }));
  }, [feeders]);
  const enpi = useMemo(() => historian24h.map((point, index) => {
    const serviceOutput = site.type === "Manufacturing" ? 92 + Math.sin(index / 8) * 8 : site.type === "Data Center" ? 2.85 + Math.sin(index / 12) * 0.06 : 78 + Math.sin(index / 10) * 12;
    return { t: point.t, value: site.type === "Data Center" ? point.loadMw / serviceOutput : point.loadMw * 1_000 / serviceOutput };
  }), [historian24h, site.type]);

  return (
    <AppShell title="Energy Analytics" subtitle={`${site.shortName} · site-specific baseline, load profile, and historian-linked EnPI`}>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Monthly Energy — Actual vs Normalized Baseline" eyebrow="Site profile" subtitle={`${site.type} seasonality · current verified performance model`} className="h-[340px] xl:col-span-8">
          <ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthlyEnergy} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="m" {...chartAxis} /><YAxis {...chartAxis} width={56} tickFormatter={(value) => `${(value / 1_000_000).toFixed(1)}M`} /><Tooltip {...tt} formatter={(value: number) => `${fmtNum(value)} kWh`} /><Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} iconType="circle" iconSize={7} /><Bar dataKey="baseline" name="Normalized baseline" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={18} /><Bar dataKey="actual" name="Actual" fill="var(--color-cyan)" radius={[3, 3, 0, 0]} barSize={18} /><Line type="monotone" dataKey="actual" stroke="var(--color-amber)" strokeWidth={1.5} dot={{ r: 2 }} /></ComposedChart></ResponsiveContainer>
        </Panel>

        <Panel title="Energy Split by Live Feeder Model" eyebrow="Current balance" subtitle={`${metrics.currentPower.toFixed(2)} MW reconciled load`} className="h-[340px] xl:col-span-4">
          <div className="flex h-full items-center gap-3"><ResponsiveContainer width="55%" height="90%"><PieChart><Pie data={usage} dataKey="value" innerRadius={44} outerRadius={80} paddingAngle={1} stroke="var(--color-surface)">{usage.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><ul className="flex-1 space-y-2 text-[12px]">{usage.map((item) => <li key={item.name} className="flex items-center gap-2"><span className="size-2 rounded-sm" style={{ background: item.color }} /><span className="flex-1 text-muted-foreground">{item.name}</span><span className="tabular font-medium">{item.value.toFixed(1)}%</span></li>)}</ul></div>
        </Panel>

        <Panel title="Load Profile Heatmap — Site Operating Model" eyebrow="Seven-day profile" subtitle={`${site.type} schedule, occupancy, and service behavior`} className="h-[320px] xl:col-span-8" actions={<span className="text-[10.5px] text-muted-foreground">MW · profile-specific</span>}>
          <div className="flex h-full flex-col"><div className="grid flex-1 grid-cols-[32px_1fr] gap-2"><div className="flex flex-col justify-between py-1 text-[10px] tabular text-muted-foreground">{days.map((day) => <div key={day}>{day}</div>)}</div><div className="grid grid-rows-7 gap-[3px]">{heatmap.map((row, dayIndex) => <div key={days[dayIndex]} className="grid grid-cols-24 gap-[3px]" style={{ gridTemplateColumns: "repeat(24,1fr)" }}>{row.map((value, hour) => { const opacity = value / max * 0.95 + 0.05; return <div key={hour} className="rounded-[2px]" style={{ background: `color-mix(in oklch, var(--color-cyan) ${opacity * 100}%, var(--color-surface-3))` }} title={`${days[dayIndex]} ${hour}:00 · ${value} MW`} />; })}</div>)}</div></div><div className="mt-2 grid gap-[3px] pl-[40px] text-[9px] tabular text-muted-foreground" style={{ gridTemplateColumns: "repeat(24,1fr)" }}>{Array.from({ length: 24 }, (_, hour) => <div key={hour} className="text-center">{hour % 3 === 0 ? hour : ""}</div>)}</div></div>
        </Panel>

        <Panel title={site.type === "Manufacturing" ? "EnPI — kWh / production unit" : site.type === "Data Center" ? "PUE proxy — load / IT output" : "EnPI — kWh / occupancy index"} eyebrow="Historian-linked performance" className="h-[320px] xl:col-span-4">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={enpi} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}><defs><linearGradient id="gEnpi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-violet)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-violet)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="t" {...chartAxis} interval={15} /><YAxis {...chartAxis} width={40} /><Tooltip {...tt} formatter={(value: number) => value.toFixed(2)} /><Area type="monotone" dataKey="value" stroke="var(--color-violet)" strokeWidth={1.6} fill="url(#gEnpi)" /></AreaChart></ResponsiveContainer>
        </Panel>
      </div>
    </AppShell>
  );
}
