import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CircleCheck, Clock3, DatabaseZap, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { dataHealthRows } from "@/lib/demo-domain";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/data-health")({ component: DataHealth });

function DataHealth() {
  const { metrics } = useSimulation();
  const [validationOpen, setValidationOpen] = useState(false);
  const blocked = dataHealthRows.filter((row) => row.billing === "Blocked").length;
  const review = dataHealthRows.filter((row) => row.quality !== "Good").length;

  return (
    <AppShell title="Data Health & Provenance" subtitle="Trust, completeness, time synchronization, and billing readiness">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Overall Data Health" value={`${metrics.dataHealth.toFixed(1)}%`} tone="good" />
        <KpiTile label="Online Sources" value="48 / 49" hint="one intermittent meter" />
        <KpiTile label="Quality Review" value={String(review)} tone="warning" hint="stale or estimated" />
        <KpiTile label="Billing Blockers" value={String(blocked)} tone={blocked ? "critical" : "good"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Source Health Matrix" className="xl:col-span-8" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-[11.5px]">
              <thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Source</th><th className="py-2.5 font-normal">Type</th><th className="py-2.5 font-normal text-right">Connectivity</th><th className="py-2.5 font-normal text-right">Freshness</th><th className="py-2.5 font-normal text-right">Completeness</th><th className="py-2.5 font-normal">Time sync</th><th className="py-2.5 font-normal">Quality</th><th className="pr-4 py-2.5 font-normal">Billing</th></tr></thead>
              <tbody className="divide-y divide-border">{dataHealthRows.map((row)=><tr key={row.source} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="flex items-center gap-2"><DatabaseZap className={`size-3.5 ${row.quality === "Good" ? "text-green" : "text-amber"}`} /><span className="font-medium tabular">{row.source}</span></div></td><td className="py-3 text-muted-foreground">{row.type}</td><td className={`py-3 text-right tabular ${row.connectivity < 97 ? "text-amber" : "text-green"}`}>{row.connectivity.toFixed(1)}%</td><td className={`py-3 text-right tabular ${row.freshness.includes("min") ? "text-amber" : ""}`}>{row.freshness}</td><td className={`py-3 text-right tabular ${row.completeness < 95 ? "text-amber" : ""}`}>{row.completeness.toFixed(1)}%</td><td className="py-3 text-muted-foreground">{row.sync}</td><td className="py-3"><StatusPill status={row.quality === "Good" ? "normal" : row.quality === "Stale" ? "warning" : "In review"} /></td><td className={`pr-4 py-3 ${row.billing === "Blocked" ? "text-red" : row.billing === "Review" ? "text-amber" : "text-muted-foreground"}`}>{row.billing}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Data Trust Summary" className="xl:col-span-4">
          <div className="space-y-3">
            <TrustItem icon={<CircleCheck className="size-4 text-green" />} title="Measured intervals" value="97.9%" body="Directly measured with good source quality." />
            <TrustItem icon={<Clock3 className="size-4 text-amber" />} title="Estimated intervals" value="1.8%" body="Substituted using approved profile-based estimation." />
            <TrustItem icon={<ShieldAlert className="size-4 text-red" />} title="Blocked intervals" value="0.3%" body="Excluded from billing and verification pending review." />
          </div>
          <div className="mt-5 rounded-md border border-primary/25 bg-primary/8 p-3 text-[10.5px] leading-relaxed text-muted-foreground"><span className="text-primary font-medium">Traceability active.</span> Every billing and savings calculation retains source point, aggregation, quality, timestamp, and calculation version.</div>
        </Panel>

        <Panel title="Missing-Data Calendar · July 2026" className="xl:col-span-7">
          <div className="grid grid-cols-7 gap-2 text-center text-[9.5px] text-muted-foreground mb-2">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day)=><div key={day}>{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-2">{Array.from({length:35},(_,index)=>{const day=index-2;const issue=day===8||day===17||day===23;return <div key={index} className={`aspect-square rounded-md border grid place-items-center text-[10.5px] tabular ${day<1||day>31?"border-transparent text-transparent":issue?"border-amber/35 bg-amber/10 text-amber":"border-border bg-surface-2 text-muted-foreground"}`}>{day}</div>})}</div>
        </Panel>

        <Panel title="Quality Exception" className="xl:col-span-5">
          <div className="rounded-md border border-amber/30 bg-amber/8 p-4"><div className="flex items-center gap-2 text-amber"><ShieldAlert className="size-4" /><span className="text-[11.5px] font-medium">STM-LINE-02 requires validation</span></div><div className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">Seven minutes of stale steam data caused 31 estimated intervals. The billing period remains blocked until engineering approval.</div><div className="mt-4 grid grid-cols-2 gap-3 text-[10.5px]"><div><div className="text-muted-foreground">Affected period</div><div className="mt-1 tabular">24 Jul · 13:08–13:15</div></div><div><div className="text-muted-foreground">Estimated quantity</div><div className="mt-1 tabular">1,284 kg steam</div></div></div><button className="btn-primary mt-4" onClick={() => setValidationOpen(!validationOpen)}>{validationOpen ? "Close validation" : "Open validation"}</button>{validationOpen && <div className="mt-3 rounded-md border border-border bg-background/35 p-3 text-[10px] leading-relaxed text-muted-foreground"><div className="font-medium text-foreground">Validation workspace opened</div><div className="mt-1">Profile estimate version EST-04 is ready for engineering review. Approval would release 31 intervals and unblock the billing calculation.</div></div>}</div>
        </Panel>
      </div>
    </AppShell>
  );
}

function TrustItem({icon,title,value,body}:{icon:ReactNode;title:string;value:string;body:string}){return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2">{icon}<span className="text-[11px] font-medium">{title}</span><span className="ml-auto text-[12px] tabular">{value}</span></div><div className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{body}</div></div>}
