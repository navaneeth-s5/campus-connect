import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { BookingStatus } from "@/types";

const AdminPanel = () => {
  const { bookings, setStatus } = useBookings();
  const [tab, setTab] = useState<BookingStatus | "all">("pending");

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => b.createdAt - a.createdAt);
    if (tab === "all") return sorted;
    return sorted.filter((b) => b.status === tab);
  }, [bookings, tab]);

  const counts = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
      all: bookings.length,
    }),
    [bookings]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Review and moderate every facility request.</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: counts.pending, color: "text-warning-foreground" },
            { label: "Approved", value: counts.approved, color: "text-success" },
            { label: "Rejected", value: counts.rejected, color: "text-destructive" },
            { label: "Total", value: counts.all, color: "text-primary" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
                No bookings in this view.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3">Requester</th>
                      <th className="p-3">Facility</th>
                      <th className="p-3">When</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((b) => (
                      <tr key={b.id} className="align-top">
                        <td className="p-3">
                          <div className="font-medium">{b.userName}</div>
                          <div className="text-xs text-muted-foreground capitalize">{b.userRole}</div>
                        </td>
                        <td className="p-3 font-medium">{b.facility}</td>
                        <td className="p-3">
                          <div>{b.date}</div>
                          <div className="text-xs text-muted-foreground">{b.startTime} – {b.endTime}</div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-sm">{b.purpose}</div>
                          {b.reason && (
                            <div className="text-xs italic text-muted-foreground mt-0.5">
                              Reason: {b.reason}
                            </div>
                          )}
                        </td>
                        <td className="p-3"><StatusBadge status={b.status} /></td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            {b.status !== "approved" && (
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => {
                                  setStatus(b.id, "approved");
                                  toast.success("Booking approved");
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                            )}
                            {b.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setStatus(b.id, "rejected");
                                  toast.success("Booking rejected");
                                }}
                              >
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminPanel;
