import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay,
  isWithinInterval, startOfDay, endOfDay, parseISO
} from "date-fns";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Ticket as TicketIcon, Clock, MapPin, User, FileText,
  AlertCircle, CheckCircle2, Info
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function CampusCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, lRes] = await Promise.all([
          axios.get('/api/bookings'),
          axios.get('/api/leaves')
        ]);
        
        setBookings(bRes.data);
        setLeaves(lRes.data);
        
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

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayStart = startOfDay(day);
    
    const dayBookings = bookings.filter(b => b.date === dayStr && !b.facility.toLowerCase().includes('leave'));
    const dayTickets = tickets.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr);
    
    const dayLeaves = leaves.filter(l => {
        const start = startOfDay(parseISO(l.startDate));
        const end = endOfDay(parseISO(l.endDate));
        return isWithinInterval(dayStart, { start, end }) && l.status === 'approved';
    });

    return { dayBookings, dayTickets, dayLeaves };
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" /> Academic Calendar
            </h1>
            <p className="text-muted-foreground mt-1">View campus schedule, facility bookings, and important dates.</p>
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
              const { dayBookings, dayTickets, dayLeaves } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={i} 
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[140px] p-2 border-r border-b transition-all cursor-pointer hover:bg-muted/30 group ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground opacity-50' : 'bg-card'} ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className={`flex justify-end mb-2`}>
                    <span className={`text-sm h-7 w-7 flex items-center justify-center rounded-full transition-colors group-hover:bg-muted ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'font-medium'}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayBookings.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary px-1">
                        <MapPin className="h-3 w-3" /> {dayBookings.length} Bookings
                      </div>
                    )}
                    {dayLeaves.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 px-1">
                        <AlertCircle className="h-3 w-3" /> {dayLeaves.length} Faculty on Leave
                      </div>
                    )}
                    {dayTickets.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 px-1">
                        <TicketIcon className="h-3 w-3" /> {dayTickets.length} Support Tickets
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                {selectedDate && format(selectedDate, "EEEE, MMMM do, yyyy")}
              </DialogTitle>
              <DialogDescription>
                Summary of all activities and statuses for this day.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6 pt-2">
              <div className="space-y-8 pb-4">
                {/* Bookings Section */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Facility Bookings ({selectedEvents?.dayBookings.length})
                  </h3>
                  {selectedEvents?.dayBookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-lg border border-dashed">
                      No facility bookings scheduled for today.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {selectedEvents?.dayBookings.map((b: any) => (
                        <div key={b._id} className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                          <div className="space-y-1">
                            <div className="font-bold flex items-center gap-2 text-primary">
                              {b.facility}
                              <Badge variant={b.status === 'approved' ? 'default' : 'outline'} className={b.status === 'approved' ? 'bg-success hover:bg-success text-white' : ''}>
                                {b.status}
                              </Badge>
                            </div>
                            <div className="text-sm flex items-center gap-4 text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {b.startTime} - {b.endTime}</span>
                              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {b.userName}</span>
                            </div>
                          </div>
                          <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Faculty Leaves Section */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Faculty Away on Leave ({selectedEvents?.dayLeaves.length})
                  </h3>
                  {selectedEvents?.dayLeaves.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-lg border border-dashed">
                      All faculty members are scheduled to be present.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {selectedEvents?.dayLeaves.map((l: any) => (
                        <div key={l._id} className="p-4 rounded-xl border border-orange-100 bg-orange-50/20 shadow-sm flex items-start gap-3">
                          <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="font-bold text-orange-900">{l.userName}</div>
                            <div className="text-xs text-orange-700/70 font-medium">{l.department} Department</div>
                          </div>
                          <Badge className="bg-orange-600 text-white border-none">On Leave</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <>
                    <Separator />
                    {/* Admin Specific: Tickets */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <TicketIcon className="h-4 w-4" /> IT Support Activity ({selectedEvents?.dayTickets.length})
                      </h3>
                      {selectedEvents?.dayTickets.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-lg border border-dashed">
                          No ticket activity recorded for this date.
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {selectedEvents?.dayTickets.map((t: any) => (
                            <div key={t._id} className="p-4 rounded-xl border bg-card shadow-sm flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-bold flex items-center gap-2">
                                  {t.title}
                                  <Badge variant="outline" className="capitalize">{t.status}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <User className="h-3.5 w-3.5" /> {t.createdBy?.name || 'Anonymous'}
                                  <span className="text-xs opacity-50">•</span>
                                  <span className="text-xs uppercase font-bold">{t.priority} priority</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
