import { BookingStatus } from "@/types";
import { cn } from "@/lib/utils";

const styles: Record<BookingStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40 [&]:text-[hsl(38_92%_30%)]",
  approved: "bg-success/15 border-success/40 [&]:text-[hsl(142_70%_25%)]",
  rejected: "bg-destructive/10 border-destructive/40 [&]:text-destructive",
};

const labels: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const StatusBadge = ({ status }: { status: BookingStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
      styles[status]
    )}
  >
    <span className={cn(
      "h-1.5 w-1.5 rounded-full",
      status === "pending" && "bg-warning",
      status === "approved" && "bg-success",
      status === "rejected" && "bg-destructive"
    )} />
    {labels[status]}
  </span>
);
