import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  DatabaseZap,
  FastForward,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Menu,
  Pause,
  Play,
  Radio,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  demoSites,
  scenarioOptions,
  useSimulation,
  type DemoSiteId,
  type ScenarioId,
  type TimeScale,
} from "@/lib/simulation";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { to: "/opportunities", label: "Opportunities", icon: Lightbulb },
  { to: "/actions", label: "Actions & Savings", icon: CircleDollarSign },
  { to: "/electrical", label: "Electrical Network", icon: Zap },
  { to: "/analytics", label: "Energy Analytics", icon: Activity },
  { to: "/demand", label: "Demand & Cost", icon: Gauge },
  { to: "/alarms", label: "Alarms & Events", icon: Bell },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/sustainability", label: "Sustainability", icon: Leaf },
  { to: "/data-health", label: "Data Health", icon: DatabaseZap },
] as const;

const demoSteps: Array<{
  route: (typeof nav)[number]["to"];
  scenario: ScenarioId;
  eyebrow: string;
  title: string;
  body: string;
}> = [
  { route: "/", scenario: "normal", eyebrow: "1 · Enterprise visibility", title: "Start with a reconciled operating picture", body: "The overview uses one historian and balance model for electrical load, solar, demand, cost, alarms, and data quality." },
  { route: "/demand", scenario: "peak-demand", eyebrow: "2 · Predictive intervention", title: "Prevent a demand-charge event", body: "ArGrid progresses through load convergence, forecast ramp, and the intervention window while preserving the actual interval history." },
  { route: "/electrical", scenario: "voltage-dip", eyebrow: "3 · Electrical investigation", title: "Replay onset, recovery, and evidence", body: "The one-line, alarm lifecycle, and PQ event envelope share one deterministic 82% Un event sequence." },
  { route: "/opportunities", scenario: "efficiency", eyebrow: "4 · Opportunity intelligence", title: "Turn measured drift into prioritized work", body: "Only the affected utility model rises above baseline, keeping production or service output stable for explainable diagnosis." },
  { route: "/actions", scenario: "efficiency", eyebrow: "5 · Verified value", title: "Keep verified savings separate from live counters", body: "The savings ledger remains stable until an action completes its verification and persistence workflow." },
  { route: "/billing", scenario: "billing", eyebrow: "6 · Commercial workflow", title: "Close the period with auditable calculations", body: "Meter quality, tariff version, interval demand, allocation, discrepancy, and approval progress through a controlled state machine." },
];

export function AppShell({ title, subtitle, toolbar, children }: { title: string; subtitle?: string; toolbar?: ReactNode; children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const {
    scenario,
    setScenario,
    scenarioState,
    running,
    setRunning,
    timeScale,
    setTimeScale,
    stepForward,
    resetSimulation,
    metrics,
    now,
    site,
    siteId,
    setSiteId,
    guidedDemoOpen,
    setGuidedDemoOpen,
  } = useSimulation();

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return nav.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 5);
  }, [search]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-background text-foreground">
      {mobileNav && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setMobileNav(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[224px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:w-[64px] lg:translate-x-0 xl:w-[224px] ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[56px] items-center gap-2.5 border-b border-sidebar-border px-3">
          <ArGridMark />
          <div className="leading-tight lg:hidden xl:block"><div className="font-display text-[13px] font-medium tracking-tight">ArGrid</div><div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Energy Intelligence</div></div>
          <button aria-label="Close navigation" className="ml-auto grid size-8 place-items-center rounded-md hover:bg-sidebar-accent lg:hidden" onClick={() => setMobileNav(false)}><X className="size-4" /></button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          <div className="px-2 pb-1.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70 lg:hidden xl:block">Workspace</div>
          {nav.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} title={item.label} onClick={() => setMobileNav(false)} className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] transition-colors ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}>
              {active && <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r bg-primary" />}
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2.1 : 1.6} />
              <span className="flex-1 whitespace-nowrap lg:hidden xl:block">{item.label}</span>
              {item.to === "/alarms" && metrics.activeAlarms > 0 && <span className="rounded bg-red/15 px-1.5 py-0.5 text-[9px] tabular text-red lg:hidden xl:inline-flex">{metrics.activeAlarms}</span>}
            </Link>;
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground"><span className="inline-block size-1.5 rounded-full bg-green shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-green)_12%,transparent)]" /><span className="lg:hidden xl:inline">Data health</span><span className="ml-auto tabular text-foreground lg:hidden xl:inline">{metrics.dataHealth.toFixed(1)}%</span></div>
          <div className="mt-2 hidden items-center justify-between text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground/55 xl:flex"><span>v1.2 · engine v2</span><span>GPL-3.0</span></div>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-[56px] shrink-0 items-center gap-2.5 border-b border-border bg-surface/96 px-3 backdrop-blur lg:px-4">
          <button aria-label="Open navigation" className="grid size-8 place-items-center rounded-md hover:bg-surface-2 lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-4" /></button>

          <label className="relative hidden items-center sm:flex"><span className="sr-only">Select demo site</span><span className="pointer-events-none absolute left-2.5 size-1.5 rounded-full bg-green" /><select value={siteId} onChange={(event) => setSiteId(event.target.value as DemoSiteId)} className="h-8 appearance-none rounded-md border border-transparent bg-transparent pl-6 pr-7 text-[11.5px] font-medium hover:bg-surface-2 focus:border-primary/40 focus:outline-none">{Object.values(demoSites).map((option) => <option key={option.id} value={option.id} className="bg-surface-2">{option.shortName}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-muted-foreground" /></label>

          <div className="relative hidden max-w-md flex-1 lg:block"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && searchResults[0]) { void navigate({ to: searchResults[0].to }); setSearch(""); } }} placeholder="Search workspaces, feeders, meters, assets…" className="h-8 w-full rounded-md border border-border bg-surface-2 pl-8 pr-3 text-[11.5px] placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none" />{searchResults.length > 0 && <div className="panel-2 absolute left-0 right-0 top-10 z-50 p-1.5 shadow-2xl">{searchResults.map((result) => { const Icon = result.icon; return <button key={result.to} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[12px] hover:bg-surface-3" onClick={() => { void navigate({ to: result.to }); setSearch(""); }}><Icon className="size-3.5 text-primary" />{result.label}</button>; })}</div>}</div>

          <button className="ml-auto hidden h-8 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/8 px-2.5 text-[10.5px] text-primary hover:bg-primary/14 sm:flex" onClick={() => setGuidedDemoOpen(true)}><Sparkles className="size-3.5" /> Guided demo</button>
          <button className="relative grid size-8 place-items-center rounded-md hover:bg-surface-2" title="Open active alarms" onClick={() => void navigate({ to: "/alarms" })}><Bell className="size-4 text-muted-foreground" />{metrics.criticalAlarms > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red" />}</button>
          <button className="grid size-8 place-items-center rounded-md hover:bg-surface-2" title="Open data health" onClick={() => void navigate({ to: "/data-health" })}><ShieldCheck className="size-4 text-green" /></button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <div className="hidden h-8 items-center gap-2 px-2 text-[11px] sm:flex" title="Current demonstration role"><div className="grid size-6 place-items-center rounded-full border border-primary/30 bg-primary/12"><User className="size-3.5 text-primary" /></div><span className="hidden text-muted-foreground xl:inline">Energy Manager</span></div>
        </header>

        <div className="flex min-h-[40px] shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface/72 px-3 py-1.5 lg:px-4">
          <label className="relative flex items-center"><span className="sr-only">Select demonstration scenario</span><select value={scenario} onChange={(event) => setScenario(event.target.value as ScenarioId)} className="h-7 appearance-none rounded-md border border-border bg-surface-2 pl-2.5 pr-7 text-[10.5px] text-muted-foreground focus:border-primary/50 focus:outline-none">{scenarioOptions.map((option) => <option key={option.id} value={option.id} className="bg-surface-2">{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-muted-foreground" /></label>

          <button className={`flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[9.5px] tracking-[0.08em] ${running ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`} onClick={() => setRunning(!running)} title={running ? "Pause simulation clock" : "Resume simulation clock"}>{running ? <Radio className="size-3" /> : <Pause className="size-3" />}{running ? "RUNNING" : "PAUSED"}</button>

          <label className="relative hidden items-center md:flex"><span className="sr-only">Simulation time scale</span><select value={timeScale} onChange={(event) => setTimeScale(Number(event.target.value) as TimeScale)} className="h-7 appearance-none rounded-md border border-border bg-surface-2 pl-2.5 pr-7 text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground focus:border-primary/50 focus:outline-none"><option value={1} className="bg-surface-2">Live 1×</option><option value={60} className="bg-surface-2">Demo 60×</option></select><ChevronDown className="pointer-events-none absolute right-2 size-3 text-muted-foreground" /></label>

          <button className="hidden h-7 items-center gap-1 rounded-md border border-border bg-surface-2 px-2 text-[9.5px] text-muted-foreground hover:text-foreground md:flex" onClick={() => stepForward(5)} title="Advance simulation by five minutes"><FastForward className="size-3" /> +5 min</button>
          <button className="hidden h-7 items-center gap-1 rounded-md border border-border bg-surface-2 px-2 text-[9.5px] text-muted-foreground hover:text-foreground xl:flex" onClick={resetSimulation} title="Reset site, clock, scenario, actions, and acknowledgements"><RotateCcw className="size-3" /> Reset</button>

          <span className={`inline-flex h-7 items-center rounded border px-2 text-[8.5px] uppercase tracking-[0.13em] ${scenarioState.eventActive ? "border-amber/25 bg-amber/8 text-amber" : "border-border bg-surface-2 text-muted-foreground"}`}>{scenarioState.phase} · {scenarioState.label}</span>
          <span className="ml-auto hidden text-[9.5px] tabular text-muted-foreground lg:inline">Simulation clock · {timeScale}× · {now.toLocaleTimeString("en-GB")}</span>
        </div>

        <div className="flex items-end justify-between gap-4 border-b border-border bg-surface/48 px-4 py-3 lg:px-6">
          <div className="min-w-0"><div className="truncate text-[9.5px] uppercase tracking-[0.15em] text-muted-foreground">{site.region} · {site.type}</div><h1 className="mt-0.5 truncate font-display text-[18px] font-medium leading-tight tracking-tight lg:text-[20px]">{title}</h1>{subtitle && <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{subtitle}</div>}</div>
          <div className="hidden shrink-0 text-right md:block">{toolbar ?? <><div className="text-[10px] text-muted-foreground">Operational timestamp</div><div className="mt-0.5 text-[11px] tabular text-foreground">{now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div></>}</div>
        </div>

        <main className="app-canvas flex-1 overflow-auto p-3 sm:p-4 lg:p-5">{children}</main>
      </div>

      {guidedDemoOpen && <GuidedDemo onClose={() => setGuidedDemoOpen(false)} />}
    </div>
  );
}

function ArGridMark() {
  return <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md border border-primary/35 bg-primary/10" aria-label="ArGrid"><svg viewBox="0 0 32 32" className="size-6" role="img" aria-hidden="true"><path d="M5 22.5 13.5 7h5L27 22.5h-5.1l-1.8-3.6H11.8L10 22.5H5Z" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinejoin="round" /><path d="M13.7 15.5h7.1M16 7v15.5" stroke="currentColor" className="text-primary" strokeWidth="1.5" opacity=".72" /><circle cx="16" cy="15.5" r="1.8" fill="currentColor" className="text-primary" /></svg></div>;
}

function GuidedDemo({ onClose }: { onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { setScenario } = useSimulation();
  const step = demoSteps[stepIndex];

  useEffect(() => {
    setScenario(step.scenario);
    void navigate({ to: step.route });
  }, [navigate, setScenario, step.route, step.scenario]);

  return <section className="fixed bottom-4 right-4 z-[70] w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-xl border border-primary/30 bg-surface/98 shadow-2xl backdrop-blur" aria-label="Guided demo"><div className="h-1 bg-surface-3"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(stepIndex + 1) / demoSteps.length * 100}%` }} /></div><div className="p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-[9.5px] uppercase tracking-[0.16em] text-primary">{step.eyebrow}</div><h2 className="mt-1.5 text-[16px] font-medium">{step.title}</h2></div><button className="grid size-7 place-items-center rounded-md hover:bg-surface-2" onClick={onClose} aria-label="Close guided demo"><X className="size-4 text-muted-foreground" /></button></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{step.body}</p><div className="mt-4 flex items-center justify-between"><span className="text-[10.5px] tabular text-muted-foreground">{stepIndex + 1} / {demoSteps.length}</span><div className="flex gap-2"><button className="btn-secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>Back</button>{stepIndex < demoSteps.length - 1 ? <button className="btn-primary" onClick={() => setStepIndex((value) => value + 1)}>Next <Play className="size-3.5" /></button> : <button className="btn-primary" onClick={onClose}>Finish <BookOpenCheck className="size-3.5" /></button>}</div></div></div></section>;
}
