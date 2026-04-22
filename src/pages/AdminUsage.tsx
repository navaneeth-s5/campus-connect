import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import axios from "axios";

const AdminUsage = () => {
  const { bookings } = useBookings();
  const [facilities, setFacilities] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/facilities').then(res => setFacilities(res.data)).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    return facilities.map((f) => {
      const facName = typeof f === 'string' ? f : f.name;
      const all = bookings.filter((b) => b.facility === facName);
      const approved = all.filter((b) => b.status === "approved").length;
      const pending = all.filter((b) => b.status === "pending").length;
      const rejected = all.filter((b) => b.status === "rejected").length;
      return { facility: facName, total: all.length, approved, pending, rejected };
    });
  }, [bookings, facilities]);

  const max = Math.max(1, ...stats.map((s) => s.total));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facility Usage</h1>
          <p className="text-muted-foreground mt-1">Monitor request volume across every facility.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
          {stats.map((s) => (
            <div key={s.facility}>
              <div className="flex justify-between text-sm font-medium">
                <span>{s.facility}</span>
                <span className="text-muted-foreground">{s.total} requests</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${(s.total / max) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
                <span><span className="font-semibold text-success">{s.approved}</span> approved</span>
                <span><span className="font-semibold text-warning-foreground">{s.pending}</span> pending</span>
                <span><span className="font-semibold text-destructive">{s.rejected}</span> rejected</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default AdminUsage;
