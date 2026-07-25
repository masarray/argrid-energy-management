import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, FileBarChart, Mail, Play, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoToast, KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { PdfExportButton } from "@/components/pdf-export-button";
import { reports } from "@/lib/demo-domain";
import { exportExecutiveReportPdf, exportInvoicePdf } from "@/lib/pdf-engine";

export const Route = createFileRoute("/reports")({ component: Reports });

const reportTrend = [72, 75, 74, 79, 82, 84, 83, 88, 86, 91, 90, 94];

function Reports() {
  const [preview, setPreview] = useState<(typeof reports)[number] | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <AppShell
      title="Reports & Evidence"
      subtitle="Scheduled executive, engineering, billing, and audit-ready reporting"
    >
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-3">
        <KpiTile label="Report Templates" value={String(reports.length)} />
        <KpiTile label="Scheduled Runs" value="14" hint="next 30 days" />
        <KpiTile label="Delivery Success" value="99.4%" tone="good" />
        <KpiTile label="Audit Evidence" value="184" unit="items" hint="version controlled" />
        <KpiTile label="PDF Engine" value="Ready" hint="browser-local generation" tone="good" />
      </div>

      <Panel
        title="Report Library"
        padded={false}
        actions={
          <button className="btn-primary" onClick={() => setPreview(reports[0])}>
            <Play className="size-3.5" /> Generate report
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[11.5px]">
            <thead>
              <tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 font-normal">Report</th>
                <th className="py-2.5 font-normal">Scope</th>
                <th className="py-2.5 font-normal">Frequency</th>
                <th className="py-2.5 font-normal">Last generated</th>
                <th className="py-2.5 font-normal">Delivery</th>
                <th className="py-2.5 font-normal">Status</th>
                <th className="pr-4 py-2.5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report) => (
                <tr key={report.name} className="hover:bg-surface-2/45">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-md border border-border bg-surface-2 grid place-items-center text-primary">
                        <FileBarChart className="size-4" />
                      </div>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="mt-0.5 text-[9.5px] text-muted-foreground">
                          Vector text · searchable PDF · source traceability
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{report.scope}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {report.frequency}
                    </span>
                  </td>
                  <td className="py-3 tabular text-muted-foreground">{report.last}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3.5" />
                      {report.delivery}
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusPill
                      status={
                        report.status === "Scheduled"
                          ? "Assigned"
                          : report.status === "Generated"
                            ? "Converted"
                            : "normal"
                      }
                    />
                  </td>
                  <td className="pr-4 py-3 text-right">
                    <button className="btn-secondary" onClick={() => setPreview(report)}>
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="PDF Engine Capability">
          <div className="space-y-2 text-[10.5px] text-muted-foreground">
            {[
              "Structured vector reports with searchable text",
              "Branded dashboard snapshots with automatic pagination",
              "Auditable invoice documents with calculation trace",
              "Document metadata, page numbers, timestamp, and disclaimers",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-green" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => setPreview(reports[0])}>
              <FileBarChart className="size-3.5" /> Report PDF
            </button>
            <PdfExportButton
              label="Invoice PDF"
              onExport={(onProgress) =>
                exportInvoicePdf(
                  {
                    invoiceNumber: "AGR-0726-T03",
                    tenantName: "Tenant C · Cold Storage",
                    tenantId: "T-003",
                    meterId: "MTR-T03",
                    period: "01–31 July 2026",
                    dueDate: "15 August 2026",
                    quality: "Estimated · approval required",
                    energyKwh: 220_600,
                    peakDemandKw: 540,
                    charges: [
                      {
                        label: "Active energy",
                        basis: "220,600 kWh · blended tariff",
                        amount: 230_364_000,
                      },
                      {
                        label: "Demand charge",
                        basis: "540 kW · monthly peak",
                        amount: 40_824_000,
                      },
                      {
                        label: "Tax and service",
                        basis: "Validated billing rules",
                        amount: 20_412_000,
                      },
                    ],
                    total: 291_600_000,
                    calculationVersion: "CALC-0726-04",
                  },
                  onProgress,
                )
              }
              onSuccess={() => setNotice("Auditable tenant invoice PDF generated successfully.")}
            />
          </div>
        </Panel>
        <Panel title="Report Delivery" className="xl:col-span-2">
          <div className="grid grid-cols-3 gap-3 text-[10.5px]">
            {[
              ["Browser download", "Available now", "No server required"],
              ["Scheduled delivery", "Demo workflow", "Backend-ready contract"],
              ["Evidence archive", "Versioned", "Calculation and source IDs"],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-muted-foreground">{label}</div>
                <div className="mt-2 text-[12px] font-medium">{value}</div>
                <div className="mt-1 text-[9.5px] text-muted-foreground">{note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {notice && <DemoToast message={notice} onClose={() => setNotice("")} />}
      {preview && (
        <ReportPreview
          report={preview}
          onClose={() => setPreview(null)}
          onNotice={setNotice}
        />
      )}
    </AppShell>
  );
}

function ReportPreview({
  report,
  onClose,
  onNotice,
}: {
  report: (typeof reports)[number];
  onClose: () => void;
  onNotice: (message: string) => void;
}) {
  const reportId = `AGR-RPT-0726-${String(reports.indexOf(report) + 41).padStart(3, "0")}`;
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 p-4 sm:p-8 grid place-items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-full overflow-auto rounded-xl border border-border bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 min-h-12 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
          <div>
            <div className="text-[11.5px] font-medium">{report.name}</div>
            <div className="text-[9.5px] text-muted-foreground">
              Presentation-ready preview · simulated data · real client-side PDF output
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PdfExportButton
              label="Download PDF"
              className="btn-primary"
              onExport={(onProgress) =>
                exportExecutiveReportPdf(
                  {
                    reportId,
                    title: report.name,
                    scope: report.scope,
                    period: "July 2026",
                    generatedAt: new Date(),
                    metrics: [
                      {
                        label: "Energy performance",
                        value: "-4.8%",
                        note: "vs normalized baseline",
                      },
                      {
                        label: "Verified saving",
                        value: "IDR 1.15 B",
                        note: "annualized YTD",
                      },
                      {
                        label: "Data confidence",
                        value: "98.4%",
                        note: "quality-weighted",
                      },
                    ],
                    findings: [
                      "Energy performance remains ahead of the normalized monthly target, supported by verified utility optimization and improved demand control.",
                      "Peak-demand exposure is concentrated in four flexible loads. A coordinated operating sequence can avoid an estimated IDR 42.6 million charge during the current interval.",
                      "Two data-quality exceptions require validation before the next billing-period close.",
                    ],
                    monthlyTrend: reportTrend,
                    evidence: [
                      {
                        label: "Calculation version",
                        value: "CALC-ENERGY-2026.07.4",
                      },
                      { label: "Baseline version", value: "ENB-2025-NORM-v3" },
                      { label: "Source completeness", value: "99.6%" },
                      {
                        label: "Quality state",
                        value: "Measured with two reviewed intervals",
                      },
                      {
                        label: "Document classification",
                        value: "Public demonstration / simulated data",
                      },
                    ],
                  },
                  onProgress,
                )
              }
              onSuccess={() => onNotice(`${report.name} PDF generated successfully.`)}
            />
            <button
              className="size-8 grid place-items-center rounded-md hover:bg-surface-2"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="bg-[#e9ecef] p-4 sm:p-8">
          <div className="mx-auto max-w-[760px] bg-white text-slate-900 min-h-[900px] shadow-xl p-8 sm:p-12">
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="text-xs uppercase tracking-[.18em] text-cyan-700">
                  ArGrid Intelligence Report
                </div>
                <h2 className="mt-2 text-2xl font-medium">{report.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{report.scope} · July 2026</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                {reportId}
                <br />
                Generated 25 Jul 2026
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ["Energy performance", "-4.8%"],
                ["Verified saving", "IDR 1.15 B"],
                ["Data confidence", "98.4%"],
              ].map(([label, value]) => (
                <div key={label} className="border border-slate-200 rounded-md p-4">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-2 text-xl font-medium">{value}</div>
                </div>
              ))}
            </div>
            <h3 className="mt-10 text-sm font-medium">Executive findings</h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                Energy performance remains ahead of the normalized monthly target, supported by
                verified utility optimization and improved demand control.
              </p>
              <p>
                Peak-demand exposure is concentrated in four flexible loads. A coordinated operating
                sequence can avoid an estimated IDR 42.6 million charge during the current interval.
              </p>
              <p>Two data-quality exceptions require validation before the next billing-period close.</p>
            </div>
            <div className="mt-10 h-44 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Monthly energy trajectory</div>
              <div className="mt-6 flex h-24 items-end gap-3">
                {reportTrend.map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-cyan-700/80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-10 border-t border-slate-200 pt-4 text-[10px] text-slate-400">
              This report uses simulated demonstration data. All calculations include source, quality,
              and version traceability within ArGrid.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
