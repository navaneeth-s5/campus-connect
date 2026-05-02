import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Clock, Calendar, User, BookOpen, History, Timer, CheckCircle2 } from "lucide-react";
import { format, parseISO, isToday, isAfter, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";

export function AssignedWorkload() {
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubstitutions();
  }, []);

  const fetchSubstitutions = async () => {
    try {
      const res = await axios.get('/api/leaves/substitutions', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSubstitutions(res.data);
    } catch (e) {
      toast.error("Failed to fetch assigned workload");
    } finally {
      setLoading(false);
    }
  };

  const categorized = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      today: substitutions.filter(s => isToday(parseISO(s.date))),
      upcoming: substitutions.filter(s => isAfter(startOfDay(parseISO(s.date)), today)),
      finished: substitutions.filter(s => isBefore(startOfDay(parseISO(s.date)), today))
    };
  }, [substitutions]);

  if (loading) return null;
  if (substitutions.length === 0) return null;

  const RenderSubCard = ({ sub, status }: { sub: any, status: 'today' | 'upcoming' | 'finished' }) => (
    <div className={`p-4 border rounded-xl bg-card shadow-sm border-l-4 ${
      status === 'today' ? 'border-l-orange-500 bg-orange-50/30' : 
      status === 'upcoming' ? 'border-l-primary' : 
      'border-l-muted-foreground/30 opacity-75'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {format(parseISO(sub.date), "PPP")}
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${
          status === 'today' ? 'bg-orange-100 text-orange-700' :
          status === 'upcoming' ? 'bg-primary/10 text-primary' :
          'bg-muted text-muted-foreground'
        }`}>
          Hour {sub.hour}
        </div>
      </div>
      <div className="font-semibold text-sm flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Replacing: {sub.facultyName}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{sub.reason}"</div>
      {status === 'finished' && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-success font-medium">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </div>
      )}
    </div>
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <BookOpen className="h-5 w-5" />
        Workload Substitutions
      </div>

      {/* Today's Tasks */}
      {categorized.today.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-sm uppercase tracking-wider">
            <Timer className="h-4 w-4" /> Today's Substitution
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorized.today.map((sub, idx) => (
              <RenderSubCard key={`today-${idx}`} sub={sub} status="today" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {categorized.upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
            <Clock className="h-4 w-4" /> Upcoming
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorized.upcoming.map((sub, idx) => (
              <RenderSubCard key={`upcoming-${idx}`} sub={sub} status="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Finished Tasks (History) */}
      {categorized.finished.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-wider">
            <History className="h-4 w-4" /> History / Finished
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorized.finished.map((sub, idx) => (
              <RenderSubCard key={`finished-${idx}`} sub={sub} status="finished" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

