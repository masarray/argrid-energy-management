import type { jsPDF as JsPdfDocument } from "jspdf";

export type PdfProgressStage =
  | "loading"
  | "capturing"
  | "composing"
  | "saving"
  | "complete";

export type PdfProgress = {
  stage: PdfProgressStage;
  percent: number;
  message: string;
};

export type PdfProgressHandler = (progress: PdfProgress) => void;

export type DashboardPdfOptions = {
  title: string;
  subtitle?: string;
  filename: string;
  site?: string;
  period?: string;
  confidentiality?: string;
  orientation?: "portrait" | "landscape";
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  tenantName: string;
  tenantId: string;
  meterId: string;
  period: string;
  dueDate: string;
  quality: string;
  energyKwh: number;
  peakDemandKw: number;
  charges: Array<{ label: string; basis: string; amount: number }>;
  total: number;
  calculationVersion: string;
};

export type ExecutiveReportPdfInput = {
  reportId: string;
  title: string;
  scope: string;
  period: string;
  generatedAt: Date;
  metrics: Array<{ label: string; value: string; note?: string }>;
  findings: string[];
  monthlyTrend: number[];
  evidence: Array<{ label: string; value: string }>;
};

const PDF_COLORS = {
  ink: [20, 30, 42] as const,
  muted: [101, 116, 133] as const,
  border: [218, 225, 232] as const,
  surface: [246, 248, 250] as const,
  cyan: [8, 145, 178] as const,
  cyanSoft: [226, 247, 252] as const,
  green: [14, 135, 93] as const,
  dark: [9, 15, 23] as const,
  darkText: [229, 237, 245] as const,
  darkMuted: [133, 151, 169] as const,
};

const noopProgress: PdfProgressHandler = () => undefined;

async function loadPdfRuntime() {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);
  return { jsPDF, html2canvas: html2canvasModule.default };
}

function safeFilename(filename: string) {
  const normalized = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function reportTimestamp(date = new Date()) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function drawBrandHeader(
  pdf: JsPdfDocument,
  options: {
    title: string;
    subtitle?: string;
    pageNumber?: number;
    pageCount?: number;
    dark?: boolean;
  },
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const dark = options.dark ?? false;
  if (dark) {
    pdf.setFillColor(...PDF_COLORS.dark);
    pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");
  }
  pdf.setFillColor(...PDF_COLORS.cyan);
  pdf.rect(0, 0, 4, 58, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...(dark ? PDF_COLORS.darkMuted : PDF_COLORS.muted));
  pdf.text("ARGRID  |  INDUSTRIAL ENERGY INTELLIGENCE", 30, 18);
  pdf.setFontSize(16);
  pdf.setTextColor(...(dark ? PDF_COLORS.darkText : PDF_COLORS.ink));
  pdf.text(options.title, 30, 38);
  if (options.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...(dark ? PDF_COLORS.darkMuted : PDF_COLORS.muted));
    pdf.text(options.subtitle, 30, 51);
  }
  pdf.setDrawColor(...(dark ? PDF_COLORS.darkMuted : PDF_COLORS.border));
  pdf.setLineWidth(0.35);
  pdf.line(30, 58, pageWidth - 30, 58);
  if (options.pageNumber && options.pageCount) {
    pdf.setFontSize(8);
    pdf.text(`Page ${options.pageNumber} / ${options.pageCount}`, pageWidth - 30, 18, {
      align: "right",
    });
  }
}

function drawFooter(pdf: JsPdfDocument, text: string, dark = false) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(...(dark ? PDF_COLORS.darkMuted : PDF_COLORS.border));
  pdf.setLineWidth(0.3);
  pdf.line(30, pageHeight - 24, pageWidth - 30, pageHeight - 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...(dark ? PDF_COLORS.darkMuted : PDF_COLORS.muted));
  pdf.text(text, 30, pageHeight - 10);
  pdf.text(`Generated ${reportTimestamp()}`, pageWidth - 30, pageHeight - 10, {
    align: "right",
  });
}

export async function exportDashboardPdf(
  element: HTMLElement,
  options: DashboardPdfOptions,
  onProgress: PdfProgressHandler = noopProgress,
) {
  onProgress({ stage: "loading", percent: 8, message: "Loading PDF engine" });
  const { jsPDF, html2canvas } = await loadPdfRuntime();

  onProgress({ stage: "capturing", percent: 24, message: "Capturing live workspace" });
  await document.fonts?.ready;
  const canvas = await html2canvas(element, {
    backgroundColor: "#0b1119",
    scale: Math.min(2, Math.max(1.35, window.devicePixelRatio || 1)),
    useCORS: true,
    logging: false,
    removeContainer: true,
    imageTimeout: 12_000,
    windowWidth: Math.max(element.scrollWidth, element.clientWidth),
    windowHeight: Math.max(element.scrollHeight, element.clientHeight),
    ignoreElements: (node) =>
      node instanceof HTMLElement && node.dataset.pdfHide === "true",
  });

  onProgress({ stage: "composing", percent: 54, message: "Composing branded pages" });
  const orientation = options.orientation ?? "landscape";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 30;
  const contentTop = 70;
  const contentBottom = pageHeight - 36;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = contentBottom - contentTop;
  const pixelsPerPoint = canvas.width / contentWidth;
  const sliceHeightPx = Math.max(1, Math.floor(contentHeight * pixelsPerPoint));
  const pageCount = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage("a4", orientation);
    drawBrandHeader(pdf, {
      title: options.title,
      subtitle: [options.subtitle, options.site, options.period].filter(Boolean).join("  |  "),
      pageNumber: pageIndex + 1,
      pageCount,
      dark: true,
    });
    const sourceY = pageIndex * sliceHeightPx;
    const sourceHeight = Math.min(sliceHeightPx, canvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("Unable to initialize PDF page canvas");
    context.fillStyle = "#0b1119";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      sourceHeight,
    );
    const imageHeight = sourceHeight / pixelsPerPoint;
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.9),
      "JPEG",
      margin,
      contentTop,
      contentWidth,
      imageHeight,
      undefined,
      "FAST",
    );
    drawFooter(
      pdf,
      options.confidentiality ??
        "ArGrid public demonstration - simulated telemetry - not for protection or field control",
      true,
    );
    onProgress({
      stage: "composing",
      percent: 54 + Math.round(((pageIndex + 1) / pageCount) * 34),
      message: `Composing page ${pageIndex + 1} of ${pageCount}`,
    });
  }

  onProgress({ stage: "saving", percent: 94, message: "Saving PDF" });
  pdf.setProperties({
    title: options.title,
    subject: options.subtitle ?? "ArGrid energy management report",
    author: "ArGrid Energy Management",
    creator: "ArGrid browser PDF engine",
    keywords: "energy management, electrical operations, industrial, report",
  });
  pdf.save(safeFilename(options.filename));
  onProgress({ stage: "complete", percent: 100, message: "PDF ready" });
}

export async function exportInvoicePdf(
  input: InvoicePdfInput,
  onProgress: PdfProgressHandler = noopProgress,
) {
  onProgress({ stage: "loading", percent: 12, message: "Loading invoice engine" });
  const { jsPDF } = await loadPdfRuntime();
  onProgress({ stage: "composing", percent: 40, message: "Composing invoice" });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  drawBrandHeader(pdf, {
    title: "Energy Allocation Statement",
    subtitle: `Invoice ${input.invoiceNumber}  |  ${input.period}`,
  });

  let y = 86;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...PDF_COLORS.ink);
  pdf.text("BILL TO", 30, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.text(input.tenantName, 30, y + 18);
  pdf.setFontSize(8.5);
  pdf.setTextColor(...PDF_COLORS.muted);
  pdf.text(`${input.tenantId}  |  Meter ${input.meterId}`, 30, y + 33);

  const infoX = pageWidth - 215;
  const infoRows = [
    ["Invoice", input.invoiceNumber],
    ["Billing period", input.period],
    ["Due date", input.dueDate],
    ["Data quality", input.quality],
  ];
  infoRows.forEach(([label, value], index) => {
    const rowY = y + index * 16;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(label, infoX, rowY);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(value, pageWidth - 30, rowY, { align: "right" });
  });

  y = 168;
  pdf.setFillColor(...PDF_COLORS.cyanSoft);
  pdf.roundedRect(30, y, pageWidth - 60, 58, 5, 5, "F");
  const summary = [
    ["Energy consumption", `${formatNumber(input.energyKwh)} kWh`],
    ["Peak demand", `${formatNumber(input.peakDemandKw)} kW`],
    ["Total due", formatIdr(input.total)],
  ];
  const summaryWidth = (pageWidth - 80) / summary.length;
  summary.forEach(([label, value], index) => {
    const x = 40 + index * summaryWidth;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(label, x, y + 19);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(index === 2 ? 13 : 11.5);
    pdf.setTextColor(...(index === 2 ? PDF_COLORS.cyan : PDF_COLORS.ink));
    pdf.text(value, x, y + 41);
  });

  y = 252;
  const tableX = 30;
  const tableWidth = pageWidth - 60;
  const colWidths = [205, 155, tableWidth - 360];
  const headers = ["Charge", "Basis", "Amount"];
  pdf.setFillColor(...PDF_COLORS.ink);
  pdf.rect(tableX, y, tableWidth, 25, "F");
  let x = tableX;
  headers.forEach((header, index) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(header, index === 2 ? x + colWidths[index] - 8 : x + 8, y + 16, {
      align: index === 2 ? "right" : "left",
    });
    x += colWidths[index];
  });

  y += 25;
  input.charges.forEach((charge, index) => {
    const rowHeight = 31;
    if (index % 2 === 0) {
      pdf.setFillColor(...PDF_COLORS.surface);
      pdf.rect(tableX, y, tableWidth, rowHeight, "F");
    }
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.line(tableX, y + rowHeight, tableX + tableWidth, y + rowHeight);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(charge.label, tableX + 8, y + 19);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(charge.basis, tableX + colWidths[0] + 8, y + 19);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(formatIdr(charge.amount), tableX + tableWidth - 8, y + 19, { align: "right" });
    y += rowHeight;
  });

  y += 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...PDF_COLORS.ink);
  pdf.text("TOTAL DUE", pageWidth - 205, y);
  pdf.setFontSize(15);
  pdf.setTextColor(...PDF_COLORS.cyan);
  pdf.text(formatIdr(input.total), pageWidth - 30, y, { align: "right" });

  y += 43;
  pdf.setFillColor(...PDF_COLORS.surface);
  pdf.roundedRect(30, y, pageWidth - 60, 78, 5, 5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...PDF_COLORS.ink);
  pdf.text("CALCULATION TRACE", 42, y + 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.3);
  pdf.setTextColor(...PDF_COLORS.muted);
  [
    `Calculation version: ${input.calculationVersion}`,
    "Invoice line -> tariff rule -> billing interval -> meter reading -> source quality",
    "This demonstration statement is not a fiscal document and uses simulated data.",
  ].forEach((line, index) => pdf.text(line, 42, y + 36 + index * 13));

  drawFooter(pdf, "ArGrid auditable billing demonstration - GPL-3.0-only frontend");
  pdf.setProperties({
    title: input.invoiceNumber,
    subject: `Energy allocation statement for ${input.tenantName}`,
    author: "ArGrid Energy Management",
    creator: "ArGrid browser PDF engine",
  });
  onProgress({ stage: "saving", percent: 92, message: "Saving invoice" });
  pdf.save(safeFilename(`${input.invoiceNumber}-${input.tenantId}.pdf`));
  onProgress({ stage: "complete", percent: 100, message: "Invoice PDF ready" });
}

export async function exportExecutiveReportPdf(
  input: ExecutiveReportPdfInput,
  onProgress: PdfProgressHandler = noopProgress,
) {
  onProgress({ stage: "loading", percent: 10, message: "Loading reporting engine" });
  const { jsPDF } = await loadPdfRuntime();
  onProgress({ stage: "composing", percent: 32, message: "Composing executive report" });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  drawBrandHeader(pdf, {
    title: input.title,
    subtitle: `${input.scope}  |  ${input.period}  |  ${input.reportId}`,
  });

  let y = 82;
  const metricGap = 8;
  const metricWidth = (pageWidth - 60 - metricGap * (input.metrics.length - 1)) / input.metrics.length;
  input.metrics.forEach((metric, index) => {
    const x = 30 + index * (metricWidth + metricGap);
    pdf.setFillColor(...PDF_COLORS.surface);
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.roundedRect(x, y, metricWidth, 66, 4, 4, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(metric.label, x + 10, y + 17);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(metric.value, x + 10, y + 40);
    if (metric.note) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.setTextColor(...PDF_COLORS.muted);
      pdf.text(metric.note, x + 10, y + 55);
    }
  });

  y += 92;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(...PDF_COLORS.ink);
  pdf.text("Executive findings", 30, y);
  y += 18;
  input.findings.forEach((finding, index) => {
    const wrapped = pdf.splitTextToSize(finding, pageWidth - 86) as string[];
    pdf.setFillColor(...(index === 0 ? PDF_COLORS.cyanSoft : PDF_COLORS.surface));
    const boxHeight = Math.max(38, wrapped.length * 11 + 20);
    pdf.roundedRect(30, y, pageWidth - 60, boxHeight, 4, 4, "F");
    pdf.setFillColor(...(index === 0 ? PDF_COLORS.cyan : PDF_COLORS.muted));
    pdf.circle(45, y + 18, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.7);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(wrapped, 56, y + 16);
    y += boxHeight + 8;
  });

  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text("Monthly performance trajectory", 30, y);
  y += 18;
  const chartX = 30;
  const chartWidth = pageWidth - 60;
  const chartHeight = 126;
  pdf.setFillColor(...PDF_COLORS.surface);
  pdf.roundedRect(chartX, y, chartWidth, chartHeight, 4, 4, "F");
  const values = input.monthlyTrend.length > 0 ? input.monthlyTrend : [1];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const plotX = chartX + 18;
  const plotY = y + 20;
  const plotWidth = chartWidth - 36;
  const plotHeight = chartHeight - 38;
  pdf.setDrawColor(...PDF_COLORS.border);
  for (let grid = 0; grid <= 3; grid += 1) {
    const gridY = plotY + (plotHeight / 3) * grid;
    pdf.line(plotX, gridY, plotX + plotWidth, gridY);
  }
  pdf.setDrawColor(...PDF_COLORS.cyan);
  pdf.setLineWidth(1.8);
  values.forEach((value, index) => {
    if (index === 0) return;
    const x1 = plotX + ((index - 1) / Math.max(1, values.length - 1)) * plotWidth;
    const x2 = plotX + (index / Math.max(1, values.length - 1)) * plotWidth;
    const y1 = plotY + plotHeight - ((values[index - 1] - min) / range) * plotHeight;
    const y2 = plotY + plotHeight - ((value - min) / range) * plotHeight;
    pdf.line(x1, y1, x2, y2);
  });
  values.forEach((value, index) => {
    const x = plotX + (index / Math.max(1, values.length - 1)) * plotWidth;
    const pointY = plotY + plotHeight - ((value - min) / range) * plotHeight;
    pdf.setFillColor(...PDF_COLORS.cyan);
    pdf.circle(x, pointY, 2.2, "F");
  });
  y += chartHeight + 22;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(...PDF_COLORS.ink);
  pdf.text("Evidence and provenance", 30, y);
  y += 15;
  input.evidence.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(...PDF_COLORS.surface);
      pdf.rect(30, y - 10, pageWidth - 60, 24, "F");
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.2);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(item.label, 40, y + 5);
    pdf.setTextColor(...PDF_COLORS.ink);
    pdf.text(item.value, pageWidth - 40, y + 5, { align: "right" });
    y += 24;
  });

  drawFooter(pdf, "ArGrid report - simulated demonstration data - source and calculation traceability retained");
  pdf.setProperties({
    title: input.title,
    subject: `${input.scope} energy performance report`,
    author: "ArGrid Energy Management",
    creator: "ArGrid browser PDF engine",
  });
  onProgress({ stage: "saving", percent: 94, message: "Saving report" });
  pdf.save(safeFilename(`${input.reportId}-${input.title}.pdf`));
  onProgress({ stage: "complete", percent: 100, message: "Report PDF ready" });
}
