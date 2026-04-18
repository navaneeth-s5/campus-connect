import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardList, FlaskConical, MapPin, UserCog } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FACILITIES } from "@/types";

const Dashboard = () => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  if (!user) return null;

  const myBookings = useMemo(
    () => bookings.filter((b) => b.userId === user.id).sort((a, b) => b.createdAt - a.createdAt),
    [bookings, user.id]
  );

  const stats = useMemo(() => {
    const mine = bookings.filter((b) => b.userId === user.id);
    return {
      total: mine.length,
      pending: mine.filter((b) => b.status === "pending").length,
      approved: mine.filter((b) => b.status === "approved").length,
    };
  }, [bookings, user.id]);

  const today = new Date().toISOString().slice(0, 10);
  const todayActive = bookings.filter((b) => b.date === today && b.status !== "rejected");

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-hero text-primary-foreground p-7 shadow-elegant">
          <div className="text-sm uppercase tracking-wider opacity-80">{user.role}</div>
          <h1 className="text-3xl font-bold mt-1">Welcome, {user.name}</h1>
          <p className="opacity-80 mt-1">Reserve facilities and track your bookings in real time.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="text-primary font-semibold">
              <Link to="/book"><CalendarPlus className="h-4 w-4 mr-2" /> New booking</Link>
            </Button>
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/15">
              <Link to="/my-bookings"><ClipboardList className="h-4 w-4 mr-2" /> My bookings</Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Total bookings", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Approved", value: stats.approved },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-3xl font-bold mt-1 text-primary">{s.value}</div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">Facilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FACILITIES.map((f) => {
              const Icon = f === "Principal Appointment" ? UserCog : f === "Seminar Hall" ? MapPin : FlaskConical;
              const todayCount = todayActive.filter((b) => b.facility === f).length;
              return (
                <Link
                  key={f}
                  to="/book"
                  className="group rounded-xl border bg-card p-5 shadow-card hover:shadow-elegant hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {todayCount} today
                    </span>
                  </div>
                  <div className="mt-4 font-semibold">{f}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f === "Principal Appointment" ? "Schedule a meeting" : "Reserve a time slot"}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent bookings</h2>
            <Link to="/my-bookings" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          {myBookings.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              You have no bookings yet. <Link to="/book" className="text-primary font-medium">Create one</Link>.
            </div>
          ) : (
            <div className="rounded-xl border bg-card divide-y shadow-card">
              {myBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="font-semibold">{b.facility}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.date} • {b.startTime} – {b.endTime}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;
