import type { ElementType, ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  className = "",
  padded = true,
  tone = "default",
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "default" | "accent" | "critical" | "quiet";
}) {
  return (
    <section className={`panel panel--${tone} flex flex-col ${className}`}>
      {(title || eyebrow || actions) && (
        <div className="panel-heading flex items-center justify-between gap-4 px-4">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[9px] uppercase tracking-[0.18em] text-primary/80">
                {eyebrow}
              </div>
            )}
            {title && (
              <div className="panel-title text-[12.5px] font-medium tracking-tight text-foreground/95">
                {title}
              </div>
            )}
            {subtitle && <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{subtitle}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 ${padded ? "p-4" : ""}`}>{children}</div>
    </section>
  );
}

export function KpiTile({
  label,
  value,
  unit,
  trend,
  trendLabel,
  hint,
  context,
  icon: Icon,
  sparkline,
  progress,
  tone = "neutral",
  className = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  hint?: string;
  context?: string;
  icon?: ElementType;
  sparkline?: number[];
  progress?: number;
  tone?: "neutral" | "warning" | "critical" | "good";
  className?: string;
}) {
  const trendTone =
    typeof trend === "number"
      ? trend < 0
        ? "text-green"
        : trend > 0
          ? "text-amber"
          : "text-muted-foreground"
      : "text-muted-foreground";

  return (
    <article className={`metric-card metric-card--${tone} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
          {context && <div className="mt-1 truncate text-[10px] text-muted-foreground/70">{context}</div>}
        </div>
        {Icon && (
          <div className="metric-icon grid size-8 shrink-0 place-items-center rounded-md border border-border/80 bg-surface-2/75">
            <Icon className="size-4" strokeWidth={1.7} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[26px] font-medium tabular leading-none tracking-[-0.035em]">
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>

      <div className="mt-2.5 flex min-h-4 items-center gap-2 text-[10.5px] text-muted-foreground">
        {typeof trend === "number" && (
          <span className={`tabular ${trendTone}`}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {trendLabel && <span className="truncate text-muted-foreground/70">{trendLabel}</span>}
        {hint && <span className="truncate">{hint}</span>}
      </div>

      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3/75">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              tone === "critical" ? "bg-red" : tone === "warning" ? "bg-amber" : tone === "good" ? "bg-green" : "bg-primary"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="metric-spark mt-3 flex h-5 items-end gap-[3px]" aria-hidden="true">
          {sparkline.map((point, index) => (
            <span
              key={`${point}-${index}`}
              className="flex-1 rounded-[2px] bg-current"
              style={{ height: `${Math.max(18, Math.min(100, point))}%`, opacity: 0.24 + index / sparkline.length / 2.2 }}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export function SeverityDot({ level }: { level: "Critical" | "Warning" | "Info" | string }) {
  const c = level === "Critical" ? "bg-red" : level === "Warning" ? "bg-amber" : "bg-primary";
  return <span className={`mt-1 inline-block size-2 rounded-full ${c}`} />;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal: "bg-green/12 text-green border-green/25",
    warning: "bg-amber/12 text-amber border-amber/30",
    critical: "bg-red/12 text-red border-red/30",
    Open: "bg-primary/12 text-primary border-primary/25",
    Assigned: "bg-violet/12 text-violet border-violet/25",
    Converted: "bg-green/12 text-green border-green/25",
    "In review": "bg-amber/12 text-amber border-amber/25",
  };
  const cls = map[status] || "bg-surface-2 text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em] ${cls}`}>
      {status}
    </span>
  );
}

export function DemoToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[90] flex max-w-[min(420px,calc(100vw-32px))] items-start gap-3 rounded-lg border border-primary/30 bg-surface/98 px-3.5 py-3 text-[11px] shadow-2xl backdrop-blur"
    >
      <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="leading-relaxed text-foreground/90">{message}</span>
      <button
        type="button"
        className="ml-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
