import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { actionItems, savingsLedger } from "@/lib/demo-domain";

export const Route = createFileRoute("/actions")({ component: ActionsAndSavings });

const stages = ["Validated", "Approved", "In Progress", "Verification", "Verified"];

function ActionsAndSavings() {
  const verified = savingsLedger.reduce((sum, item) => sum + item.saving, 0);
  const active = actionItems.filter((item) => item.stage !== "Verified").length;
  const atRisk = savingsLedger.filter((item) => item.persistence !== "Stable").length;

  return (
    <AppShell title="Actions & Verified Savings" subtitle="Human-in-the-loop workflow from validation to persistent financial value">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Active Actions" value={String(active)} hint="across 4 teams" />
        <KpiTile label="Verified Value" value={fmtIDR(verified)} tone="good" hint="annualized" />
        <KpiTile label="Average Payback" value="1.28" unit="yr" tone="good" />
        <KpiTile label="Savings at Risk" value={String(atRisk)} tone="warning" hint="persistence review" />
      </div>

      <Panel title="Action Conversion" className="mb-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {stages.map((stage, index) => {
            const count = actionItems.filter((item) => item.stage === stage).length;
            const value = actionItems.filter((item) => item.stage === stage).reduce((sum, item) => sum + item.estimated, 0);
            return (
              <div key={stage} className="relative rounded-md border border-border bg-surface-2 p-3">
                {index < stages.length - 1 && <div className="hidden md:block absolute top-1/2 -right-2.5 h-px w-3 bg-border-strong" />}
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">{stage}</div>
                <div className="mt-2 font-display text-[22px] font-medium tabular">{count}</div>
                <div className="mt-1 text-[10.5px] text-green tabular">{fmtIDR(value)}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Action Board" className="xl:col-span-7" padded={false}>
          <div className="divide-y divide-border">
            {actionItems.map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-surface-2/45 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 size-8 rounded-md grid place-items-center border ${item.stage === "Verified" ? "border-green/30 bg-green/10 text-green" : "border-primary/25 bg-primary/8 text-primary"}`}>
                    {item.stage === "Verified" ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-[12px]">{item.title}</span><StatusPill status={item.stage === "Verified" ? "Converted" : item.stage === "In Progress" ? "Assigned" : item.stage === "Verification" ? "In review" : "Open"} /></div>
                    <div className="mt-1 text-[10.5px] text-muted-foreground">{item.asset} · {item.owner} · due {item.due}</div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10.5px]"><span>Estimated <strong className="font-medium text-foreground tabular">{fmtIDR(item.estimated)}</strong></span>{item.verified > 0 && <span>Verified <strong className="font-medium text-green tabular">{fmtIDR(item.verified)}</strong></span>}<span className="text-muted-foreground">Confidence {item.confidence}%</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Verification Snapshot" className="xl:col-span-5">
          <div className="rounded-md border border-green/25 bg-green/7 p-3">
            <div className="flex items-center gap-2 text-green"><ShieldCheck className="size-4" /><span className="text-[11px] font-medium">Baseline verification passed</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]"><Metric label="Adjusted baseline" value="1,284 MWh" /><Metric label="Reporting period" value="1,152 MWh" /><Metric label="Avoided energy" value="132 MWh" /><Metric label="Confidence" value="91%" /></div>
          </div>
          <div className="mt-4 h-28 flex items-end gap-2 border-b border-border px-2">
            {[82, 78, 75, 76, 73, 67, 62, 60, 58, 57, 56, 55].map((value, index) => <div key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${value}%`, opacity: .45 + index * .045 }} />)}
          </div>
          <div className="mt-2 flex justify-between text-[9.5px] text-muted-foreground"><span>Baseline</span><span>Post-implementation</span></div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-surface-2 p-3"><div><div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Annualized verified saving</div><div className="mt-1 font-display text-xl font-medium text-green tabular">Rp 172.6 M</div></div><TrendingUp className="size-5 text-green" /></div>
        </Panel>

        <Panel title="Savings Ledger" className="xl:col-span-12" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-[11.5px]">
              <thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Initiative</th><th className="py-2.5 font-normal">Site</th><th className="py-2.5 font-normal text-right">Avoided energy</th><th className="py-2.5 font-normal text-right">Verified saving</th><th className="py-2.5 font-normal text-right">Payback</th><th className="py-2.5 font-normal text-right">Confidence</th><th className="pr-4 py-2.5 font-normal">Persistence</th></tr></thead>
              <tbody className="divide-y divide-border">{savingsLedger.map((item) => <tr key={item.initiative} className="hover:bg-surface-2/45"><td className="px-4 py-3 font-medium">{item.initiative}</td><td className="py-3 text-muted-foreground">{item.site}</td><td className="py-3 text-right tabular">{fmtNum(item.energy)} kWh</td><td className="py-3 text-right tabular text-green">{fmtIDR(item.saving)}</td><td className="py-3 text-right tabular">{item.payback.toFixed(1)} yr</td><td className="py-3 text-right tabular">{item.confidence}%</td><td className={`pr-4 py-3 ${item.persistence === "Stable" ? "text-green" : "text-amber"}`}>{item.persistence}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-1 tabular font-medium">{value}</div></div>; }
