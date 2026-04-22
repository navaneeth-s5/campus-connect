import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CalendarPlus, ClipboardList, FlaskConical, MapPin, UserCog } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [facilities, setFacilities] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/facilities').then(res => setFacilities(res.data)).catch(() => {});
  }, []);

  const myBookings = useMemo(
    () => bookings.filter((b) => b.userId === user?.id).sort((a, b) => b.createdAt - a.createdAt),
    [bookings, user?.id]
  );

  const stats = useMemo(() => {
    const mine = bookings.filter((b) => b.userId === user?.id);
    return {
      total: mine.length,
      pending: mine.filter((b) => b.status === "pending").length,
      approved: mine.filter((b) => b.status === "approved").length,
    };
  }, [bookings, user?.id]);

  if (!user) return null;
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
            {facilities.filter(f => {
              if (typeof f === 'string') return true;
              return !f.allowedRoles || (Array.isArray(f.allowedRoles) && f.allowedRoles.includes(user?.role));
            }).map((f, i) => {
              const facName = typeof f === 'string' ? f : (f.name || 'Unknown Facility');
              const Icon = facName === "Principal Appointment" ? UserCog : facName === "Seminar Hall" ? MapPin : FlaskConical;
              const todayCount = todayActive.filter((b) => b.facility === facName).length;
              return (
                <Link
                  key={typeof f === 'string' ? f : (f._id || i)}
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
                  <div className="mt-4 font-semibold">{facName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {facName === "Principal Appointment" ? "Schedule a meeting" : "Reserve a time slot"}
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

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Academic Resources</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
             <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Opening E-Library Portal..."); }} className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2">
               <div className="p-3 rounded-full bg-blue-500/10 text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
               <span className="font-semibold text-sm">E-Library</span>
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Opening Learning Management System..."); }} className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2">
               <div className="p-3 rounded-full bg-purple-500/10 text-purple-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg></div>
               <span className="font-semibold text-sm">Moodle LMS</span>
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Downloading Academic Calendar..."); }} className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2">
               <div className="p-3 rounded-full bg-orange-500/10 text-orange-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg></div>
               <span className="font-semibold text-sm">Calendar</span>
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Opening Grievance Redressal Portal..."); }} className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2">
               <div className="p-3 rounded-full bg-red-500/10 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
               <span className="font-semibold text-sm">Help Desk</span>
             </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;
