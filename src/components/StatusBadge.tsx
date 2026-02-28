import { cn } from "@/lib/utils";
import type { HealthStatus, AlertSeverity } from "@/data/types";

const healthColors: Record<HealthStatus, string> = {
  healthy: "bg-status-healthy text-status-healthy-foreground",
  warning: "bg-status-warning text-status-warning-foreground",
  critical: "bg-status-critical text-status-critical-foreground",
};

const severityColors: Record<AlertSeverity, string> = {
  low: "bg-chart-1/20 text-chart-1",
  medium: "bg-status-warning/20 text-status-warning",
  high: "bg-status-warning text-status-warning-foreground",
  critical: "bg-status-critical text-status-critical-foreground",
};

export function HealthBadge({ status, className }: { status: HealthStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide", healthColors[status], className)}>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: AlertSeverity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide", severityColors[severity], className)}>
      {severity}
    </span>
  );
}
