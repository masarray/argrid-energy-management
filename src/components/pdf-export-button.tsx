import { useState } from "react";
import { Check, FileDown, LoaderCircle } from "lucide-react";
import type { PdfProgress, PdfProgressHandler } from "@/lib/pdf-engine";

export function PdfExportButton({
  onExport,
  label = "Export PDF",
  className = "btn-secondary",
  onSuccess,
  title,
}: {
  onExport: (onProgress: PdfProgressHandler) => Promise<void>;
  label?: string;
  className?: string;
  onSuccess?: () => void;
  title?: string;
}) {
  const [progress, setProgress] = useState<PdfProgress | null>(null);
  const [complete, setComplete] = useState(false);

  const handleExport = async () => {
    if (progress && progress.stage !== "complete") return;
    setComplete(false);
    try {
      await onExport(setProgress);
      setComplete(true);
      onSuccess?.();
      window.setTimeout(() => {
        setProgress(null);
        setComplete(false);
      }, 1_800);
    } catch (error) {
      console.error("ArGrid PDF export failed", error);
      setProgress({ stage: "complete", percent: 0, message: "PDF export failed" });
      window.setTimeout(() => setProgress(null), 2_800);
    }
  };

  const busy = Boolean(progress && progress.stage !== "complete");
  const buttonText = busy
    ? `${progress?.percent ?? 0}%`
    : complete
      ? "PDF ready"
      : progress?.percent === 0
        ? "Export failed"
        : label;

  return (
    <button
      type="button"
      className={className}
      onClick={() => void handleExport()}
      disabled={busy}
      title={progress?.message ?? title ?? label}
      data-pdf-hide="true"
    >
      {busy ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : complete ? (
        <Check className="size-3.5 text-green" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      {buttonText}
    </button>
  );
}
