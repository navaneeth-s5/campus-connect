import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const MyBookings = () => {
  const { user } = useAuth();
  const { bookings, deleteBooking } = useBookings();
  if (!user) return null;

  const mine = useMemo(
    () => bookings.filter((b) => b.userId === user.id).sort((a, b) => b.createdAt - a.createdAt),
    [bookings, user.id]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My bookings</h1>
          <p className="text-muted-foreground mt-1">Your personal booking history.</p>
        </div>

        {mine.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            You have no bookings yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Facility</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mine.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-medium">{b.facility}</td>
                    <td className="p-3">{b.date}</td>
                    <td className="p-3">{b.startTime} – {b.endTime}</td>
                    <td className="p-3 max-w-xs truncate" title={b.purpose}>
                      {b.purpose}
                      {b.reason && <div className="text-xs text-muted-foreground italic">Reason: {b.reason}</div>}
                    </td>
                    <td className="p-3"><StatusBadge status={b.status} /></td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          deleteBooking(b.id);
                          toast.success("Booking removed");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default MyBookings;
