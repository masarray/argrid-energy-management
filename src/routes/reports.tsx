import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Download, FileBarChart, Mail, Play, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoToast, KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { reports } from "@/lib/demo-domain";

export const Route = createFileRoute("/reports")({ component: Reports });

function Reports() {
  const [preview, setPreview] = useState<(typeof reports)[number] | null>(null);
  const [notice, setNotice] = useState("");
  return (
    <AppShell title="Reports & Evidence" subtitle="Scheduled executive, engineering, billing, and audit-ready reporting">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Report Templates" value={String(reports.length)} />
        <KpiTile label="Scheduled Runs" value="14" hint="next 30 days" />
        <KpiTile label="Delivery Success" value="99.4%" tone="good" />
        <KpiTile label="Audit Evidence" value="184" unit="items" hint="version controlled" />
      </div>

      <Panel title="Report Library" padded={false} actions={<button className="btn-primary" onClick={() => setPreview(reports[0])}><Play className="size-3.5" /> Generate report</button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-[11.5px]">
            <thead><tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border"><th className="px-4 py-2.5 font-normal">Report</th><th className="py-2.5 font-normal">Scope</th><th className="py-2.5 font-normal">Frequency</th><th className="py-2.5 font-normal">Last generated</th><th className="py-2.5 font-normal">Delivery</th><th className="py-2.5 font-normal">Status</th><th className="pr-4 py-2.5 font-normal text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border">{reports.map((report) => <tr key={report.name} className="hover:bg-surface-2/45"><td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="size-8 rounded-md border border-border bg-surface-2 grid place-items-center text-primary"><FileBarChart className="size-4" /></div><div className="font-medium">{report.name}</div></div></td><td className="py-3 text-muted-foreground">{report.scope}</td><td className="py-3"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="size-3.5" />{report.frequency}</span></td><td className="py-3 tabular text-muted-foreground">{report.last}</td><td className="py-3"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Mail className="size-3.5" />{report.delivery}</span></td><td className="py-3"><StatusPill status={report.status === "Scheduled" ? "Assigned" : report.status === "Generated" ? "Converted" : "normal"} /></td><td className="pr-4 py-3 text-right"><button className="btn-secondary" onClick={()=>setPreview(report)}>Preview</button></td></tr>)}</tbody>
          </table>
        </div>
      </Panel>

      {notice && <DemoToast message={notice} onClose={() => setNotice("")} />}
      {preview && <div className="fixed inset-0 z-[80] bg-black/60 p-4 sm:p-8 grid place-items-center" onMouseDown={(event)=>{if(event.target===event.currentTarget)setPreview(null)}}><div className="w-full max-w-4xl max-h-full overflow-auto rounded-xl border border-border bg-surface shadow-2xl"><div className="sticky top-0 z-10 h-12 flex items-center justify-between border-b border-border bg-surface px-4"><div><div className="text-[11.5px] font-medium">{preview.name}</div><div className="text-[9.5px] text-muted-foreground">Presentation-ready preview · simulated data</div></div><div className="flex items-center gap-2"><button className="btn-secondary" onClick={() => setNotice("Report export prepared in demonstration mode. A production build would generate a versioned PDF on the reporting service.")}><Download className="size-3.5" /> Export PDF</button><button className="size-8 grid place-items-center rounded-md hover:bg-surface-2" onClick={()=>setPreview(null)} aria-label="Close preview"><X className="size-4" /></button></div></div><div className="bg-[#e9ecef] p-4 sm:p-8"><div className="mx-auto max-w-[760px] bg-white text-slate-900 min-h-[900px] shadow-xl p-8 sm:p-12"><div className="flex items-start justify-between border-b border-slate-200 pb-6"><div><div className="text-xs uppercase tracking-[.18em] text-cyan-700">ArGrid Intelligence Report</div><h2 className="mt-2 text-2xl font-medium">{preview.name}</h2><p className="mt-2 text-sm text-slate-500">{preview.scope} · July 2026</p></div><div className="text-right text-xs text-slate-500">AGR-RPT-0726-041<br/>Generated 25 Jul 2026</div></div><div className="mt-8 grid grid-cols-3 gap-4">{[["Energy performance","−4.8%"],["Verified saving","Rp 1.15 B"],["Data confidence","98.4%"]].map(([label,value])=><div key={label} className="border border-slate-200 rounded-md p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-xl font-medium">{value}</div></div>)}</div><h3 className="mt-10 text-sm font-medium">Executive findings</h3><div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600"><p>Energy performance remains ahead of the normalized monthly target, supported by verified utility optimization and improved demand control.</p><p>Peak-demand exposure is concentrated in four flexible loads. A coordinated operating sequence can avoid an estimated Rp 42.6 million charge during the current interval.</p><p>Two data-quality exceptions require validation before the next billing-period close.</p></div><div className="mt-10 h-44 rounded-md border border-slate-200 bg-slate-50 p-4"><div className="text-xs text-slate-500">Monthly energy trajectory</div><div className="mt-6 flex h-24 items-end gap-3">{[55,61,58,68,72,76,70,82,78,86,83,91].map((h,i)=><div key={i} className="flex-1 rounded-t-sm bg-cyan-700/80" style={{height:`${h}%`}} />)}</div></div><div className="mt-10 border-t border-slate-200 pt-4 text-[10px] text-slate-400">This report uses simulated demonstration data. All calculations include source, quality, and version traceability within ArGrid.</div></div></div></div></div>}
    </AppShell>
  );
}
