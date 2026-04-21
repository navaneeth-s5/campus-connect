import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Facility, FACILITIES } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingContext";
import { hasConflict } from "@/lib/storage";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

const BookFacility = () => {
  const { user } = useAuth();
  const { bookings, createBooking } = useBookings();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [facility, setFacility] = useState<Facility>("Lab 1");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [reason, setReason] = useState("");

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.facility === facility && b.date === date && b.status !== "rejected")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [bookings, facility, date]
  );

  const conflict = useMemo(
    () => hasConflict(bookings, facility, date, startTime, endTime),
    [bookings, facility, date, startTime, endTime]
  );

  if (!user) return null;
  const isPrincipal = facility === "Principal Appointment";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return toast.error("Please describe the purpose");
    if (isPrincipal && !reason.trim()) return toast.error("Reason for visit is required");

    const result = await createBooking({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      facility,
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      reason: isPrincipal ? reason.trim() : undefined,
    });
    if (!result.ok) {
      toast.error(result.error || "Could not create booking");
      return;
    }
    toast.success("Booking submitted — awaiting admin approval");
    navigate("/my-bookings");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Book a facility</h1>
          <p className="text-muted-foreground mt-1">Check live availability and submit your request.</p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-5 shadow-card">
            <div className="space-y-1.5">
              <Label>Facility</Label>
              <Select value={facility} onValueChange={(v) => setFacility(v as Facility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACILITIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="E.g. Database lab session for CSE-3B"
                maxLength={400}
                required
              />
            </div>

            {isPrincipal && (
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason for visit</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe the reason for meeting the Principal"
                  maxLength={400}
                  required
                />
              </div>
            )}

            {conflict && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                This time slot conflicts with an existing booking. Please pick another.
              </div>
            )}

            <Button type="submit" disabled={conflict} className="w-full bg-gradient-primary shadow-elegant">
              Submit booking request
            </Button>
          </form>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold">{facility} — {date}</h2>
            <p className="text-sm text-muted-foreground mb-4">Currently reserved slots</p>
            {dayBookings.length === 0 ? (
              <div className="rounded-md bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No bookings yet for this day. The slot is wide open.
              </div>
            ) : (
              <ul className="space-y-2">
                {dayBookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-md border bg-background p-3">
                    <div>
                      <div className="font-medium text-sm">{b.startTime} – {b.endTime}</div>
                      <div className="text-xs text-muted-foreground">{b.userName} • {b.userRole}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default BookFacility;
