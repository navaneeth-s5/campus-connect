import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Booking } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PrincipalPanel = () => {
  const { bookings, setStatus } = useBookings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  
  const [approvedRoom, setApprovedRoom] = useState("");
  const [approvedTime, setApprovedTime] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  const pendingVisits = useMemo(() => {
    return bookings
      .filter((b) => b.facility === "Principal Appointment" && b.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [bookings]);

  const handleAction = async () => {
     if (!selectedBooking || !action) return;
     if (action === "approve" && (!approvedRoom || !approvedTime)) {
       return toast.error("Please provide both room and exact time for approval.");
     }
     if (action === "reject" && !declineReason) {
       return toast.error("Please provide a decline reason.");
     }

     try {
       await setStatus(selectedBooking.id, action === "approve" ? "approved" : "rejected", {
          approvedRoom: action === "approve" ? approvedRoom : undefined,
          approvedTime: action === "approve" ? approvedTime : undefined,
          declineReason: action === "reject" ? declineReason : undefined
       });
       toast.success(`Visit ${action}d successfully`);
       setSelectedBooking(null);
       setAction(null);
       setApprovedRoom(""); setApprovedTime(""); setDeclineReason("");
     } catch(e) {}
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage pending Principal visits and appointments.</p>
        </div>

        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          {pendingVisits.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No pending visit requests.
            </div>
          ) : (
             <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">Requester</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Requested Date</th>
                    <th className="p-3">Reason for Visit</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                   {pendingVisits.map((b) => (
                      <tr key={b.id} className="align-top relative">
                         <td className="p-3">
                           <div className="font-medium">{b.userName}</div>
                           <div className="text-xs text-muted-foreground">{b.userRole}{b.guestPhone ? ` • 📞 ${b.guestPhone}` : ''}</div>
                         </td>
                         <td className="p-3 font-medium text-xs">{b.userCollege}</td>
                         <td className="p-3 font-medium">{b.date}</td>
                         <td className="p-3">
                           <div className="italic">"{b.reason}"</div>
                         </td>
                         <td className="p-3">
                           <div className="flex justify-end gap-2">
                             <Button
                                size="sm"
                                className="bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => { setSelectedBooking(b); setAction("approve"); }}
                             >
                                <Check className="h-4 w-4 mr-1" /> Approve
                             </Button>
                             <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => { setSelectedBooking(b); setAction("reject"); }}
                             >
                                <X className="h-4 w-4 mr-1" /> Decline
                             </Button>
                           </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(v) => !v && setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? "Schedule Visit" : "Decline Visit"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             {action === "approve" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Assign Room / Office</Label>
                    <Input value={approvedRoom} onChange={e => setApprovedRoom(e.target.value)} placeholder="e.g. Principal's Office" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Exact Time</Label>
                    <Input type="time" value={approvedTime} onChange={e => setApprovedTime(e.target.value)} />
                  </div>
                </>
             ) : (
                <div className="space-y-1.5">
                    <Label>Reason for Declining</Label>
                    <Input value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="e.g. Busy with board meeting" />
                  </div>
             )}
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setSelectedBooking(null)}>Cancel</Button>
             <Button onClick={handleAction} className={action === "approve" ? "bg-success hover:bg-success/90 text-white" : ""}>
               Confirm
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default PrincipalPanel;
