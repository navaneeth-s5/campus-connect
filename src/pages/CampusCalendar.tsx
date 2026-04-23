import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Ticket as TicketIcon } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";

export default function CampusCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bRes = await axios.get('/api/bookings');
        // Let's filter out rejected ones if we don't want them cluttering, or leave them.
        setBookings(bRes.data);
        
        if (user?.role === 'admin') {
          const tRes = await axios.get('/api/tickets');
          setTickets(tRes.data);
        }
      } catch(e) { console.error(e); }
    };
    fetchData();
  }, [user]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // All bookings matching this day
    const dayBookings = bookings.filter(b => b.date === dayStr);
    
    // Tickets (only visible if fetched, which is only for admins)
    const dayTickets = tickets.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr);

    return { dayBookings, dayTickets };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" /> Campus Calendar
            </h1>
            <p className="text-muted-foreground mt-1">View campus facility bookings and scheduled events.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-card border rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="w-32 text-center font-bold text-lg">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="border bg-card rounded-xl shadow-card overflow-hidden">
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-3 text-center font-semibold text-sm text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => {
              const { dayBookings, dayTickets } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[140px] p-2 border-r border-b transition-colors hover:bg-muted/10 ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground opacity-50' : 'bg-card'} ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className={`flex justify-end mb-2`}>
                    <span className={`text-sm h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'font-medium'}`}>
                      {format(day, dateFormat)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    {dayBookings.map(b => (
                      <div key={b.id || b._id} className={`text-[10px] leading-tight p-1.5 rounded border ${b.status === 'approved' ? 'bg-success/10 border-success/20 text-success' : b.status === 'rejected' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-warning/10 border-warning/20 text-warning-foreground'}`}>
                        <div className="font-semibold truncate">{b.facility}</div>
                        <div className="truncate opacity-90">{b.startTime} - {b.endTime}</div>
                        <div className="truncate font-medium opacity-80">{b.userName}</div>
                      </div>
                    ))}
                    {dayTickets.map(t => (
                      <div key={t._id} className="text-[10px] leading-tight p-1.5 rounded border bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-start gap-1">
                        <TicketIcon className="h-3 w-3 shrink-0 mt-0.5" />
                        <div className="truncate flex-1">
                          <span className="font-semibold block truncate">{t.title}</span>
                          <span className="opacity-80">{t.createdBy?.name || 'User'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
