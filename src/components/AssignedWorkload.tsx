import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Calendar, User, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";
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

  if (loading) return null;
  if (substitutions.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 text-primary font-bold text-lg mb-4">
        <BookOpen className="h-5 w-5" />
        Your Assigned Workload Substitutions
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {substitutions.map((sub, idx) => (
          <div key={`${sub.leaveId}-${idx}`} className="p-4 border rounded-xl bg-card shadow-sm border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {format(parseISO(sub.date), "PPP")}
              </div>
              <div className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                Hour {sub.hour}
              </div>
            </div>
            <div className="font-semibold text-sm">Replacing: {sub.facultyName}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{sub.reason}"</div>
          </div>
        ))}
      </div>
    </section>
  );
}
