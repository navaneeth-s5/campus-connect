import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Check, X, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";

export function HODApprovalPanel() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentLeaves();
  }, []);

  const fetchDepartmentLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves/department', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLeaves(res.data);
    } catch (e) {
      toast.error("Failed to fetch department leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, act: "hod-approve" | "reject") => {
    try {
      await axios.put(`/api/leaves/${id}/${act}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success(act === "hod-approve" ? "Departmental Clearance Granted" : "Request Rejected");
      fetchDepartmentLeaves();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const pendingHOD = useMemo(() => leaves.filter(l => l.status === "pending_hod"), [leaves]);

  if (loading) return <div>Loading departmental requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary font-bold text-lg mb-2">
        <ClipboardList className="h-5 w-5" />
        Departmental Leave Clearance ({pendingHOD.length})
      </div>

      {pendingHOD.length === 0 ? (
        <div className="p-8 text-center border rounded-xl bg-muted/5 text-muted-foreground">
          No pending departmental leave requests.
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingHOD.map(leave => (
            <div key={leave._id} className="p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-lg">{leave.userName}</div>
                  <div className="text-sm text-muted-foreground">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={leave.status} />
              </div>

              <div className="bg-muted/30 p-3 rounded-lg mb-4 text-sm italic">
                "{leave.reason}"
              </div>

              <div className="space-y-4 mb-6">
                <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Proposed Workload Distribution</div>
                {leave.schedule.map((day: any) => (
                  <div key={day.date} className="p-3 border rounded bg-muted/20">
                    <div className="text-[10px] font-bold mb-1">{new Date(day.date).toDateString()}</div>
                    {day.slots.map((slot: any) => (
                      <div key={slot.hour} className="flex justify-between text-xs py-1 border-b last:border-0 border-dashed opacity-80">
                        <span>Hour {slot.hour}</span>
                        <span className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> {slot.replacementName}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(leave._id, 'hod-approve')}>
                  Grant Clearance
                </Button>
                <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(leave._id, 'reject')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
