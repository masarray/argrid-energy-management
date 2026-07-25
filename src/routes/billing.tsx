import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, CheckCircle2, CircleAlert, FileText, LockKeyhole, Receipt, Send, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoToast, KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { useSimulation } from "@/lib/simulation";
import type { BillingTenant } from "@/lib/simulation-engine";

export const Route = createFileRoute("/billing")({ component: Billing });

function Billing() {
  const { scenario, scenarioState, setScenario, billingTenants, utilityBillValidation, site } = useSimulation();
  const [selected, setSelected] = useState<BillingTenant | null>(null);
  const [periodLocked, setPeriodLocked] = useState(false);
  const [notice, setNotice] = useState("");
  const total = billingTenants.reduce((sum, tenant) => sum + tenant.amount, 0);
  const exceptions = billingTenants.filter((tenant) => tenant.quality !== "Measured").length;
  const billingProgress = scenarioState.phase === "approval" ? 100 : scenarioState.phase === "analysis" ? 72 : scenarioState.phase === "validation" ? Math.max(18, scenarioState.progress * 45) : 88;
  const overdue = billingTenants.filter((tenant) => tenant.status === "Overdue").length;

  return (
    <AppShell title="Billing & Cost Allocation" subtitle={`${site.shortName} · tariff-derived tenant allocation and utility invoice validation`} toolbar={<button className="btn-secondary" onClick={() => setScenario("billing")}><Receipt className="size-3.5" /> Load billing close</button>}>
      <div className="grid grid-cols-2 gap-3 mb-3 xl:grid-cols-5">
        <KpiTile label="Period total" value={fmtIDR(total)} tone="good" hint={`${billingTenants.length} allocation accounts`} />
        <KpiTile label="Billing progress" value={`${billingProgress.toFixed(0)}%`} hint={scenarioState.label} progress={billingProgress} />
        <KpiTile label="Validation exceptions" value={String(exceptions)} tone={exceptions ? "warning" : "good"} context="quality-based" />
        <KpiTile label="Overdue" value={String(overdue)} tone={overdue ? "critical" : "good"} />
        <KpiTile label="Source completeness" value="99.6%" tone="good" context="independent of electrical PQ" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel title="Billing Period Control" eyebrow="Controlled lifecycle" subtitle={`${scenarioState.phase} · ${scenarioState.label}`} className="xl:col-span-4">
          <div className="space-y-3">
            {[
              { label: "Meter data validation", state: exceptions ? `${exceptions} exception` : "Complete", icon: CheckCircle2 },
              { label: "Tariff calculation", state: scenarioState.phase === "validation" ? "Pending" : "Complete", icon: Calculator },
              { label: "Allocation review", state: exceptions ? `${exceptions} exception` : "Complete", icon: CircleAlert },
              { label: "Invoice approval", state: scenarioState.phase === "approval" ? `${billingTenants.length} ready` : `${billingTenants.length - exceptions} of ${billingTenants.length}`, icon: FileText },
            ].map((step, index) => {
              const Icon = step.icon;
              const warning = step.state.includes("exception") || step.state.includes("Pending") || step.state.includes("of");
              return <div key={step.label} className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3"><div className={`grid size-8 place-items-center rounded-md ${warning ? "bg-amber/10 text-amber" : "bg-green/10 text-green"}`}><Icon className="size-4"/></div><div><div className="text-[11px] font-medium">{step.label}</div><div className={`mt-0.5 text-[9.5px] ${warning ? "text-amber" : "text-green"}`}>{step.state}</div></div><span className="ml-auto text-[9px] tabular text-muted-foreground">0{index + 1}</span></div>;
            })}
          </div>
          <button className={`mt-4 w-full ${periodLocked ? "btn-secondary" : "btn-primary"}`} disabled={exceptions > 0 && !periodLocked} onClick={() => setPeriodLocked(!periodLocked)}>{periodLocked ? <><CheckCircle2 className="size-3.5"/> Period locked</> : <><LockKeyhole className="size-3.5"/> Lock billing period</>}</button>
          <div className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground">Locking freezes source readings, tariff version {site.tariff.label}, allocation rules, and calculation results for audit.</div>
        </Panel>

        <Panel title="Tenant Invoice Workspace" eyebrow="Allocation engine" subtitle="Energy, demand, tariff, tax, and source quality calculated from one billing model" className="xl:col-span-8" padded={false} actions={<span className="text-[10px] text-muted-foreground">{scenario === "billing" ? `${scenarioState.label}` : "validated monthly model"}</span>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-[11.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Account</th><th className="py-2.5 font-normal">Meter quality</th><th className="py-2.5 font-normal text-right">Energy</th><th className="py-2.5 font-normal text-right">Peak demand</th><th className="py-2.5 font-normal text-right">Amount</th><th className="py-2.5 font-normal">Status</th><th className="pr-4 py-2.5 font-normal text-right">Invoice</th></tr></thead><tbody className="divide-y divide-border">{billingTenants.map((tenant) => <tr key={tenant.id} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="font-medium">{tenant.name}</div><div className="mt-0.5 text-[9.5px] tabular text-muted-foreground">{tenant.id} · {tenant.meter}</div></td><td className={`py-3 ${tenant.quality === "Measured" ? "text-green" : "text-amber"}`}>{tenant.quality}</td><td className="py-3 text-right tabular">{fmtNum(tenant.kwh)} kWh</td><td className="py-3 text-right tabular">{fmtNum(tenant.demand)} kW</td><td className="py-3 text-right tabular font-medium">{fmtIDR(tenant.amount)}</td><td className="py-3">{tenant.status === "Overdue" ? <span className="inline-flex rounded border border-red/35 bg-red/10 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.08em] text-red">Overdue</span> : <StatusPill status={tenant.status === "Approved" ? "Converted" : tenant.status === "Sent" ? "Assigned" : "Open"}/>}</td><td className="pr-4 py-3 text-right"><button className="btn-secondary" onClick={() => setSelected(tenant)}>View</button></td></tr>)}</tbody></table></div>
        </Panel>

        <Panel title="Utility Bill Validation" eyebrow="Independent calculation comparison" subtitle={`Tariff: ${site.tariff.label}`} className="xl:col-span-7" tone={utilityBillValidation.discrepancyIdr > 0 ? "critical" : "default"}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <ValidationColumn title="Internal calculation" items={[["Energy", `${fmtNum(utilityBillValidation.internalEnergyKwh)} kWh`], ["Peak demand", `${fmtNum(utilityBillValidation.internalPeakKw)} kW`], ["Calculated total", fmtIDR(utilityBillValidation.internalTotalIdr)]]} />
            <div className="text-center"><div className="text-[9px] uppercase tracking-[.12em] text-muted-foreground">Variance</div><div className={`mt-2 font-display text-lg tabular ${utilityBillValidation.discrepancyIdr > 0 ? "text-amber" : "text-green"}`}>{fmtIDR(utilityBillValidation.discrepancyIdr)}</div><div className="mt-1 text-[9.5px] text-muted-foreground">{utilityBillValidation.internalTotalIdr > 0 ? (utilityBillValidation.discrepancyIdr / utilityBillValidation.internalTotalIdr * 100).toFixed(2) : "0.00"}%</div></div>
            <ValidationColumn title="Utility invoice" items={[["Energy", `${fmtNum(utilityBillValidation.utilityEnergyKwh)} kWh`], ["Peak demand", `${fmtNum(utilityBillValidation.utilityPeakKw)} kW`], ["Received total", fmtIDR(utilityBillValidation.utilityTotalIdr)]]} />
          </div>
          <div className={`mt-4 flex items-start gap-2 rounded-md border p-3 ${utilityBillValidation.discrepancyIdr > 0 ? "border-amber/30 bg-amber/8" : "border-green/25 bg-green/8"}`}><CircleAlert className={`size-4 shrink-0 ${utilityBillValidation.discrepancyIdr > 0 ? "text-amber" : "text-green"}`}/><div><div className={`text-[11px] font-medium ${utilityBillValidation.discrepancyIdr > 0 ? "text-amber" : "text-green"}`}>{utilityBillValidation.discrepancyIdr > 0 ? "Potential demand-charge mismatch" : "Utility invoice aligned"}</div><div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Internal maximum {fmtNum(utilityBillValidation.internalPeakKw)} kW versus utility value {fmtNum(utilityBillValidation.utilityPeakKw)} kW. The discrepancy is calculated from the configured demand tariff.</div></div>{utilityBillValidation.discrepancyIdr > 0 && <button className="btn-secondary ml-auto shrink-0" onClick={() => setNotice("Billing discrepancy case opened with meter, interval, and tariff evidence.")}>Open case</button>}</div>
        </Panel>

        <Panel title="Billing Traceability" eyebrow="Calculation provenance" className="xl:col-span-5">
          <div className="space-y-2">{["Invoice line", `Tariff rule · ${site.tariff.label}`, `${site.tariff.demandIntervalMinutes}-minute billing intervals`, "Revenue meter allocation", "Raw measurement + quality + calculation version"].map((item, index) => <div key={item} className="flex items-center gap-3"><div className="grid size-6 place-items-center rounded-full border border-primary/30 bg-primary/8 text-[9px] tabular text-primary">{index + 1}</div><div className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[10.5px]">{item}</div></div>)}</div>
        </Panel>
      </div>

      {notice && <DemoToast message={notice} onClose={() => setNotice("")} />}
      {selected && <InvoiceModal tenant={selected} onClose={() => setSelected(null)} onAction={(message) => { setNotice(message); setSelected(null); }} />}
    </AppShell>
  );
}

function ValidationColumn({ title, items }: { title: string; items: string[][] }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{title}</div><div className="mt-3 space-y-2">{items.map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-[10.5px]"><span className="text-muted-foreground">{label}</span><span className="text-right tabular">{value}</span></div>)}</div></div>;
}

function InvoiceModal({ tenant, onClose, onAction }: { tenant: BillingTenant; onClose: () => void; onAction: (message: string) => void }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-full w-full max-w-3xl overflow-auto rounded-xl border border-border bg-surface shadow-2xl"><div className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-surface px-4"><div><div className="text-[11.5px] font-medium">Invoice preview · {tenant.id}</div><div className="text-[9.5px] text-muted-foreground">Calculation-engine output · pro-forma demonstration</div></div><button className="grid size-8 place-items-center rounded-md hover:bg-surface-2" onClick={onClose} aria-label="Close invoice"><X className="size-4"/></button></div><div className="p-4 sm:p-6"><div className="rounded-lg bg-[#f7f8fa] p-6 text-slate-900 sm:p-8"><div className="flex items-start justify-between border-b border-slate-200 pb-5"><div><div className="text-lg font-medium">ArGrid Utility Services</div><div className="mt-1 text-xs text-slate-500">Industrial energy allocation statement</div></div><div className="text-right"><div className="text-xs text-slate-500">INVOICE</div><div className="mt-1 text-sm font-medium">AGR-0726-{tenant.id.slice(-3)}</div></div></div><div className="mt-6 grid grid-cols-2 gap-6 text-xs"><div><div className="text-slate-500">Bill to</div><div className="mt-1 font-medium">{tenant.name}</div><div className="mt-1 text-slate-500">Meter {tenant.meter}</div></div><div className="text-right"><div><span className="text-slate-500">Period:</span> 01–31 Jul 2026</div><div className="mt-1"><span className="text-slate-500">Due:</span> 15 Aug 2026</div><div className="mt-1"><span className="text-slate-500">Quality:</span> {tenant.quality}</div></div></div><table className="mt-7 w-full text-xs"><thead><tr className="border-b border-slate-300 text-left text-slate-500"><th className="py-2 font-normal">Charge</th><th className="py-2 font-normal text-right">Basis</th><th className="py-2 font-normal text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-200"><tr><td className="py-3">Energy charge</td><td className="py-3 text-right">{fmtNum(tenant.kwh)} kWh</td><td className="py-3 text-right">{fmtIDR(tenant.energyCharge)}</td></tr><tr><td className="py-3">Demand allocation</td><td className="py-3 text-right">{fmtNum(tenant.demand)} kW</td><td className="py-3 text-right">{fmtIDR(tenant.demandCharge)}</td></tr><tr><td className="py-3">Tax and services</td><td className="py-3 text-right">Validated rules</td><td className="py-3 text-right">{fmtIDR(tenant.taxAndServices)}</td></tr></tbody></table><div className="mt-6 flex justify-end"><div className="flex w-64 justify-between border-t border-slate-300 pt-3 text-sm font-medium"><span>Total due</span><span>{fmtIDR(tenant.amount)}</span></div></div><div className="mt-8 text-[10px] leading-relaxed text-slate-400">Each charge is generated from the same allocation, tariff, demand, and source-quality engine used by the workspace. Simulated demonstration invoice; not a fiscal document.</div></div><div className="mt-4 flex justify-end gap-2"><button className="btn-secondary" onClick={() => onAction(`${tenant.id} draft queued for delivery in demonstration mode.`)}><Send className="size-3.5"/> Send draft</button><button className="btn-primary" disabled={tenant.quality !== "Measured"} onClick={() => onAction(`${tenant.id} approved with validated calculation inputs.`)}><CheckCircle2 className="size-3.5"/> Approve invoice</button></div></div></div></div>;
}
