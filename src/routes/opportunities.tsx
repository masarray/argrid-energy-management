import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BadgeDollarSign, CircleCheck, Clock3, Gauge, Lightbulb, ShieldCheck, TrendingUp, Wrench, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoToast, KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, opportunities } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/opportunities")({ component: Opportunities });

type Lens = "Cost" | "Energy" | "Carbon" | "Reliability";
type Opportunity = (typeof opportunities)[number];

function Opportunities() {
  const { scenario, setScenario } = useSimulation();
  const [lens, setLens] = useState<Lens>("Cost");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [notice, setNotice] = useState("");
  const total = opportunities.reduce((sum, item) => sum + item.annualSaving, 0);
  const open = opportunities.filter((item) => item.status === "Open").length;
  const highConfidence = opportunities.filter((item) => item.confidence === "High").reduce((sum, item) => sum + item.annualSaving, 0);

  const sorted = useMemo(() => [...opportunities].sort((a, b) => b.annualSaving - a.annualSaving), []);
  const lensValue = (item: Opportunity) => {
    if (lens === "Energy") return `${Math.round(item.annualSaving / 1_600_000)} MWh/yr`;
    if (lens === "Carbon") return `${Math.round(item.annualSaving / 5_800_000)} tCO₂e/yr`;
    if (lens === "Reliability") return item.urgency === "P1" ? "High impact" : item.urgency === "P2" ? "Medium impact" : "Low impact";
    return fmtIDR(item.annualSaving);
  };

  return (
    <AppShell
      title="Opportunity Intelligence"
      subtitle="Prioritized energy, cost, carbon, and reliability improvements"
      toolbar={<button className="btn-secondary" onClick={() => setScenario("efficiency")}><Lightbulb className="size-3.5" /> Load efficiency scenario</button>}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Annualized Opportunity" value={fmtIDR(total)} tone="good" hint="identified value" />
        <KpiTile label="High Confidence" value={fmtIDR(highConfidence)} tone="good" />
        <KpiTile label="Open Opportunities" value={String(open)} hint={`${opportunities.length} total`} />
        <KpiTile label="Average Payback" value="2.7" unit="yr" tone="good" />
      </div>

      <Panel
        title="Opportunity Value Lens"
        padded={false}
        actions={
          <div className="flex rounded-md border border-border bg-surface-2 p-0.5">
            {(["Cost", "Energy", "Carbon", "Reliability"] as Lens[]).map((item) => (
              <button key={item} onClick={() => setLens(item)} className={`h-6 rounded px-2 text-[9.5px] ${lens === item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{item}</button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-[11.5px]">
            <thead>
              <tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 font-normal">Priority</th>
                <th className="py-2.5 font-normal">Opportunity</th>
                <th className="py-2.5 font-normal">Asset</th>
                <th className="py-2.5 font-normal text-right">{lens} impact</th>
                <th className="py-2.5 font-normal text-right">Payback</th>
                <th className="py-2.5 font-normal">Confidence</th>
                <th className="py-2.5 font-normal">Status</th>
                <th className="pr-4 py-2.5 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((item) => (
                <tr key={item.id} className="hover:bg-surface-2/50 group">
                  <td className="px-4 py-3"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9.5px] tabular ${item.urgency === "P1" ? "border-red/35 bg-red/10 text-red" : item.urgency === "P2" ? "border-amber/35 bg-amber/10 text-amber" : "border-border text-muted-foreground"}`}>{item.urgency}</span></td>
                  <td className="py-3"><div className="font-medium">{item.title}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground tabular">{item.id}</div></td>
                  <td className="py-3 tabular text-muted-foreground">{item.asset}</td>
                  <td className={`py-3 text-right tabular font-medium ${lens === "Cost" ? "text-green" : "text-primary"}`}>{lensValue(item)}</td>
                  <td className="py-3 text-right tabular">{item.payback.toFixed(1)} yr</td>
                  <td className={`py-3 ${item.confidence === "High" ? "text-green" : "text-amber"}`}>{item.confidence}</td>
                  <td className="py-3"><StatusPill status={item.status} /></td>
                  <td className="pr-4 py-3 text-right"><button className="btn-secondary opacity-80 group-hover:opacity-100" onClick={() => setSelected(item)}>Investigate <ArrowRight className="size-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Detection Coverage"><Coverage icon={<Gauge className="size-4 text-primary" />} label="Demand & tariff" value="8 rules active" /><Coverage icon={<Clock3 className="size-4 text-amber" />} label="Schedule waste" value="12 rules active" /><Coverage icon={<Wrench className="size-4 text-violet" />} label="Equipment efficiency" value="17 rules active" /></Panel>
        <Panel title="Value Conversion"><div className="space-y-3">{[["Identified",100],["Validated",76],["Assigned",54],["Implemented",34],["Verified",27]].map(([label,value])=><div key={label as string}><div className="flex justify-between text-[10.5px]"><span className="text-muted-foreground">{label}</span><span className="tabular">{value}%</span></div><div className="mt-1.5 h-1.5 rounded bg-surface-3 overflow-hidden"><div className="h-full bg-primary rounded" style={{width:`${value}%`}} /></div></div>)}</div></Panel>
        <Panel title="Intelligence Status"><div className="rounded-md border border-green/25 bg-green/8 p-3"><div className="flex items-center gap-2 text-green"><ShieldCheck className="size-4" /><span className="text-[11px] font-medium">Analytics operating normally</span></div><div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">All priority detection rules have current baselines and sufficient data quality. {scenario === "efficiency" ? "The efficiency scenario is active." : "Select the efficiency scenario for the guided case."}</div></div></Panel>
      </div>

      {notice && <DemoToast message={notice} onClose={() => setNotice("")} />}
      {selected && <OpportunityDrawer item={selected} onClose={() => setSelected(null)} onAction={(message) => { setNotice(message); setSelected(null); }} />}
    </AppShell>
  );
}

function Coverage({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">{icon}<div><div className="text-[11px] font-medium">{label}</div><div className="text-[9.5px] text-muted-foreground">{value}</div></div><CircleCheck className="ml-auto size-3.5 text-green" /></div>}

function OpportunityDrawer({ item, onClose, onAction }: { item: Opportunity; onClose: () => void; onAction: (message: string) => void }) {
  return (
    <div className="fixed inset-0 z-[75] bg-black/45" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="absolute inset-y-0 right-0 w-full max-w-[460px] border-l border-border bg-surface shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 h-12 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur px-4"><div><div className="text-[9px] uppercase tracking-[0.14em] text-primary">{item.id} · Opportunity analysis</div><div className="text-[11px] text-muted-foreground">Evidence and recommended action</div></div><button className="size-8 grid place-items-center rounded-md hover:bg-surface-2" onClick={onClose} aria-label="Close opportunity"><X className="size-4" /></button></div>
        <div className="p-4 space-y-3">
          <div><h2 className="text-[17px] font-medium leading-snug">{item.title}</h2><div className="mt-1 text-[10.5px] text-muted-foreground">{item.asset} · detected 22 Jul 2026 · 03:14</div></div>
          <div className="grid grid-cols-2 gap-2"><DrawerMetric icon={<BadgeDollarSign className="size-4 text-green" />} label="Annual saving" value={fmtIDR(item.annualSaving)} /><DrawerMetric icon={<TrendingUp className="size-4 text-primary" />} label="Payback" value={`${item.payback.toFixed(1)} years`} /><DrawerMetric icon={<ShieldCheck className="size-4 text-green" />} label="Confidence" value={`${item.confidence} · 91%`} /><DrawerMetric icon={<Lightbulb className="size-4 text-amber" />} label="Priority" value={item.urgency} /></div>
          <Section title="Why ArGrid detected this"><p>Energy remained above the normalized occupied-hours baseline for 5.7 hours across four nights. Production and maintenance schedules show no valid operational requirement.</p><div className="mt-3 h-28 flex items-end gap-1.5 border-b border-border">{[42,45,44,48,49,52,71,75,73,76,72,74,51,48,45,43].map((height,index)=><div key={index} className={`flex-1 rounded-t-sm ${index>=6&&index<=11?"bg-amber":"bg-primary/55"}`} style={{height:`${height}%`}} />)}</div><div className="mt-2 flex justify-between text-[9px] text-muted-foreground"><span>Expected occupied window</span><span className="text-amber">Excess nighttime load</span></div></Section>
          <Section title="Probable cause"><div className="space-y-2"><Cause rank="01" name="Control schedule override left active" confidence="72%" /><Cause rank="02" name="Occupancy signal mapped incorrectly" confidence="18%" /><Cause rank="03" name="Maintenance bypass" confidence="10%" /></div></Section>
          <Section title="Recommended verification"><ol className="space-y-2 text-[10.5px] text-muted-foreground"><li>1. Confirm the BMS occupancy schedule for {item.asset}.</li><li>2. Verify manual override and maintenance bypass states.</li><li>3. Observe one complete night cycle after correction.</li></ol></Section>
          <div className="flex gap-2 pt-1"><button className="btn-primary flex-1" onClick={() => onAction(`${item.id} validated and assigned to the Utility Supervisor in demonstration mode.`)}>Validate & assign</button><button className="btn-secondary flex-1" onClick={() => onAction(`Work order WO-${item.id.slice(-3)} created from ${item.id} in demonstration mode.`)}>Create work order</button></div>
        </div>
      </aside>
    </div>
  );
}

function DrawerMetric({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2">{icon}<span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</span></div><div className="mt-2 text-[12px] font-medium tabular">{value}</div></div>}
function Section({title,children}:{title:string;children:ReactNode}){return <section className="rounded-md border border-border bg-surface-2 p-3"><h3 className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{title}</h3><div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{children}</div></section>}
function Cause({rank,name,confidence}:{rank:string;name:string;confidence:string}){return <div className="flex items-center gap-2 rounded border border-border bg-background/30 px-2.5 py-2"><span className="text-[9px] tabular text-primary">{rank}</span><span className="flex-1 text-[10.5px] text-foreground">{name}</span><span className="text-[9.5px] tabular text-muted-foreground">{confidence}</span></div>}
