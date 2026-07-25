import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, CheckCircle2, CircleAlert, FileText, LockKeyhole, Receipt, Send, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoToast, KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";

export const Route = createFileRoute("/billing")({ component: Billing });

const tenants = [
  { id: "T-001", name: "Tenant A · Plastics Line", meter: "MTR-T01", kwh: 184_200, demand: 480, amount: 244_800_000, status: "Sent", quality: "Measured" },
  { id: "T-002", name: "Tenant B · Metal Fabrication", meter: "MTR-T02", kwh: 96_400, demand: 260, amount: 128_100_000, status: "Approved", quality: "Measured" },
  { id: "T-003", name: "Tenant C · Cold Storage", meter: "MTR-T03", kwh: 220_600, demand: 540, amount: 291_600_000, status: "Draft", quality: "Estimated" },
  { id: "T-004", name: "Tenant D · Packaging", meter: "MTR-T04", kwh: 62_100, demand: 180, amount: 82_400_000, status: "Sent", quality: "Measured" },
  { id: "T-005", name: "Tenant E · Assembly", meter: "MTR-T05", kwh: 128_900, demand: 340, amount: 171_200_000, status: "Overdue", quality: "Measured" },
];

type Tenant = (typeof tenants)[number];

function Billing() {
  const { scenario, setScenario } = useSimulation();
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [periodLocked, setPeriodLocked] = useState(false);
  const [notice, setNotice] = useState("");
  const total = tenants.reduce((sum, tenant) => sum + tenant.amount, 0);
  const exceptions = tenants.filter((tenant) => tenant.quality !== "Measured").length;

  return (
    <AppShell title="Billing & Cost Allocation" subtitle="July 2026 · auditable tenant billing and utility invoice validation" toolbar={<button className="btn-secondary" onClick={() => setScenario("billing")}><Receipt className="size-3.5" /> Load billing scenario</button>}>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-3">
        <KpiTile label="Period Total" value={fmtIDR(total)} tone="good" hint="5 tenants" />
        <KpiTile label="Billing Progress" value="92%" hint="approval workflow" />
        <KpiTile label="Validation Exceptions" value={String(exceptions)} tone={exceptions ? "warning" : "good"} />
        <KpiTile label="Overdue" value="1" tone="critical" hint="4 days" />
        <KpiTile label="Data Completeness" value="99.6%" tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Billing Period Control" className="xl:col-span-4">
          <div className="space-y-3">
            {[{label:"Meter data validation",state:"Complete",icon:CheckCircle2},{label:"Tariff calculation",state:"Complete",icon:Calculator},{label:"Allocation review",state:exceptions?"1 exception":"Complete",icon:CircleAlert},{label:"Invoice approval",state:"4 of 5",icon:FileText}].map((step,index)=>{const Icon=step.icon;const warning=step.state.includes("exception")||step.state.includes("of");return <div key={step.label} className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3"><div className={`size-8 rounded-md grid place-items-center ${warning?"bg-amber/10 text-amber":"bg-green/10 text-green"}`}><Icon className="size-4"/></div><div><div className="text-[11px] font-medium">{step.label}</div><div className={`mt-0.5 text-[9.5px] ${warning?"text-amber":"text-green"}`}>{step.state}</div></div><span className="ml-auto text-[9px] tabular text-muted-foreground">0{index+1}</span></div>})}
          </div>
          <button className={`mt-4 w-full ${periodLocked?"btn-secondary":"btn-primary"}`} onClick={()=>setPeriodLocked(!periodLocked)}>{periodLocked?<><CheckCircle2 className="size-3.5"/> Period locked</>:<><LockKeyhole className="size-3.5"/> Lock billing period</>}</button>
          <div className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground">Locking freezes source readings, tariff versions, allocation rules, and calculation results for audit.</div>
        </Panel>

        <Panel title="Tenant Invoice Workspace" className="xl:col-span-8" padded={false} actions={<span className="text-[10px] text-muted-foreground">{scenario === "billing" ? "billing-close scenario active" : "live period"}</span>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-[11.5px]"><thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Tenant</th><th className="py-2.5 font-normal">Meter quality</th><th className="py-2.5 font-normal text-right">Energy</th><th className="py-2.5 font-normal text-right">Peak demand</th><th className="py-2.5 font-normal text-right">Amount</th><th className="py-2.5 font-normal">Status</th><th className="pr-4 py-2.5 font-normal text-right">Invoice</th></tr></thead><tbody className="divide-y divide-border">{tenants.map((tenant)=><tr key={tenant.id} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="font-medium">{tenant.name}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground tabular">{tenant.id} · {tenant.meter}</div></td><td className={`py-3 ${tenant.quality==="Measured"?"text-green":"text-amber"}`}>{tenant.quality}</td><td className="py-3 text-right tabular">{fmtNum(tenant.kwh)} kWh</td><td className="py-3 text-right tabular">{tenant.demand} kW</td><td className="py-3 text-right tabular font-medium">{fmtIDR(tenant.amount)}</td><td className="py-3">{tenant.status==="Overdue"?<span className="inline-flex rounded border border-red/35 bg-red/10 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.08em] text-red">Overdue</span>:<StatusPill status={tenant.status==="Approved"?"Converted":tenant.status==="Sent"?"Assigned":"Open"}/>}</td><td className="pr-4 py-3 text-right"><button className="btn-secondary" onClick={()=>setSelected(tenant)}>View</button></td></tr>)}</tbody></table></div>
        </Panel>

        <Panel title="Utility Bill Validation" className="xl:col-span-7">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center"><ValidationColumn title="Internal calculation" items={[["Energy","2,014,820 kWh"],["Peak demand","5,740 kW"],["Energy charge","Rp 2.42 B"],["Demand charge","Rp 318.6 M"],["Tax & surcharge","Rp 301.8 M"]]} /><div className="text-center"><div className="text-[9px] uppercase tracking-[.12em] text-muted-foreground">Variance</div><div className="mt-2 font-display text-lg text-amber tabular">+Rp 19.3 M</div><div className="mt-1 text-[9.5px] text-muted-foreground">0.63%</div></div><ValidationColumn title="Utility invoice" items={[["Energy","2,014,820 kWh"],["Peak demand","5,812 kW"],["Energy charge","Rp 2.42 B"],["Demand charge","Rp 337.9 M"],["Tax & surcharge","Rp 301.8 M"]]} /></div>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber/30 bg-amber/8 p-3"><CircleAlert className="size-4 text-amber shrink-0"/><div><div className="text-[11px] font-medium text-amber">Potential demand-charge mismatch</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">The utility invoice uses a 5,812 kW peak while the internal validated interval maximum is 5,740 kW. Investigation evidence is ready.</div></div><button className="btn-secondary ml-auto shrink-0" onClick={() => setNotice("Billing discrepancy case BILL-0726-019 opened and assigned to Finance Validation.")}>Open case</button></div>
        </Panel>

        <Panel title="Billing Traceability" className="xl:col-span-5">
          <div className="space-y-2">{["Invoice line","Tariff rule WBP-2026-02","15-minute billing intervals","Revenue meter source","Raw measurement + quality"].map((item,index)=><div key={item} className="flex items-center gap-3"><div className="size-6 rounded-full border border-primary/30 bg-primary/8 grid place-items-center text-[9px] tabular text-primary">{index+1}</div><div className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[10.5px]">{item}</div></div>)}</div>
        </Panel>
      </div>

      {notice && <DemoToast message={notice} onClose={() => setNotice("")} />}
      {selected && <InvoiceModal tenant={selected} onClose={()=>setSelected(null)} onAction={(message) => { setNotice(message); setSelected(null); }} />}
    </AppShell>
  );
}

function ValidationColumn({title,items}:{title:string;items:string[][]}){return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{title}</div><div className="mt-3 space-y-2">{items.map(([label,value])=><div key={label} className="flex justify-between gap-3 text-[10.5px]"><span className="text-muted-foreground">{label}</span><span className="tabular text-right">{value}</span></div>)}</div></div>}

function InvoiceModal({tenant,onClose,onAction}:{tenant:Tenant;onClose:()=>void;onAction:(message:string)=>void}){const energyCharge=tenant.amount*.79;const demandCharge=tenant.amount*.14;const tax=tenant.amount-energyCharge-demandCharge;return <div className="fixed inset-0 z-[80] bg-black/60 p-4 grid place-items-center" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}><div className="w-full max-w-3xl max-h-full overflow-auto rounded-xl border border-border bg-surface shadow-2xl"><div className="sticky top-0 z-10 h-12 flex items-center justify-between border-b border-border bg-surface px-4"><div><div className="text-[11.5px] font-medium">Invoice preview · {tenant.id}</div><div className="text-[9.5px] text-muted-foreground">Pro-forma demonstration statement</div></div><button className="size-8 grid place-items-center rounded-md hover:bg-surface-2" onClick={onClose} aria-label="Close invoice"><X className="size-4"/></button></div><div className="p-4 sm:p-6"><div className="rounded-lg bg-[#f7f8fa] text-slate-900 p-6 sm:p-8"><div className="flex items-start justify-between border-b border-slate-200 pb-5"><div><div className="text-lg font-medium">ArGrid Utility Services</div><div className="mt-1 text-xs text-slate-500">Industrial energy allocation statement</div></div><div className="text-right"><div className="text-xs text-slate-500">INVOICE</div><div className="mt-1 text-sm font-medium">AGR-0726-{tenant.id.slice(-3)}</div></div></div><div className="mt-6 grid grid-cols-2 gap-6 text-xs"><div><div className="text-slate-500">Bill to</div><div className="mt-1 font-medium">{tenant.name}</div><div className="mt-1 text-slate-500">Meter {tenant.meter}</div></div><div className="text-right"><div><span className="text-slate-500">Period:</span> 01–31 Jul 2026</div><div className="mt-1"><span className="text-slate-500">Due:</span> 15 Aug 2026</div><div className="mt-1"><span className="text-slate-500">Quality:</span> {tenant.quality}</div></div></div><table className="mt-7 w-full text-xs"><thead><tr className="border-b border-slate-300 text-left text-slate-500"><th className="py-2 font-normal">Charge</th><th className="py-2 font-normal text-right">Basis</th><th className="py-2 font-normal text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-200"><tr><td className="py-3">Energy charge</td><td className="py-3 text-right">{fmtNum(tenant.kwh)} kWh</td><td className="py-3 text-right">{fmtIDR(energyCharge)}</td></tr><tr><td className="py-3">Demand charge</td><td className="py-3 text-right">{tenant.demand} kW</td><td className="py-3 text-right">{fmtIDR(demandCharge)}</td></tr><tr><td className="py-3">Tax and services</td><td className="py-3 text-right">Applied rules</td><td className="py-3 text-right">{fmtIDR(tax)}</td></tr></tbody></table><div className="mt-6 flex justify-end"><div className="w-64 border-t border-slate-300 pt-3 flex justify-between text-sm font-medium"><span>Total due</span><span>{fmtIDR(tenant.amount)}</span></div></div><div className="mt-8 text-[10px] leading-relaxed text-slate-400">Each charge is traceable to tariff version, billing interval, meter reading, source quality, and calculation version in ArGrid. Simulated demonstration invoice; not a fiscal document.</div></div><div className="mt-4 flex justify-end gap-2"><button className="btn-secondary" onClick={() => onAction(`${tenant.id} draft queued for delivery in demonstration mode.`)}><Send className="size-3.5"/> Send draft</button><button className="btn-primary" onClick={() => onAction(`${tenant.id} approved with calculation version CALC-0726-04.`)}><CheckCircle2 className="size-3.5"/> Approve invoice</button></div></div></div></div>}
