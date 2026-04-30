import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Calendar, PlusCircle, Search, Clock, ClipboardList, UserCog } from "lucide-react";
import { eachDayOfInterval, format, parseISO } from "date-fns";

export default function LeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [multiDaySchedule, setMultiDaySchedule] = useState<any>({}); // { "2024-04-29": [slots...] }
  const [facultyList, setFacultyList] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaves();
    fetchFaculty();
  }, []);

  // Update schedule when dates change
  useEffect(() => {
    if (startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (start <= end) {
          const days = eachDayOfInterval({ start, end });
          const newSchedule: any = {};
          days.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            // Skip Sunday (0)
            if (day.getDay() !== 0) {
              newSchedule[dateStr] = Array.from({ length: 7 }, (_, i) => ({ hour: i + 1, replacementId: "", replacementName: "" }));
            } else {
              newSchedule[dateStr] = []; // Empty array for Sunday
            }
          });
          setMultiDaySchedule(newSchedule);
        }
      } catch (e) {}
    }
  }, [startDate, endDate]);

  const fetchFaculty = async () => {
    try {
      const res = await axios.get('/api/auth/faculty', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      // Show all faculty from same college, excluding self
      setFacultyList(res.data.filter((u: any) => u._id !== user?.id));
    } catch(e) {}
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLeaves(res.data);
    } catch (err) {
      toast.error("Failed to load leaves.");
    } finally {
      setLoading(false);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return toast.error("Please fill all fields");

    // Transform multiDaySchedule to backend format
    const scheduleArray = Object.keys(multiDaySchedule).map(date => {
      const isSunday = parseISO(date).getDay() === 0;
      return {
        date,
        slots: multiDaySchedule[date].filter((s: any) => s.replacementId),
        isSunday
      };
    });

    // Validation: Workdays must have at least one replacement if there are classes
    const workdaysMissingReplacements = scheduleArray.filter(d => !d.isSunday && d.slots.length === 0);
    if (workdaysMissingReplacements.length > 0 && reason.toLowerCase() !== 'holiday') {
        // We can be more lenient or strict here. For now, let's just allow it but warn.
        // Or just filter out empty workdays if the user didn't fill them.
    }

    try {
      await axios.post('/api/leaves', { startDate, endDate, reason, schedule: scheduleArray }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Leave & Multi-day Workload Reassignment submitted.");
      setStartDate("");
      setEndDate("");
      setReason("");
      setMultiDaySchedule({});
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to apply for leave");
    }
  };

  const updateSlot = (date: string, hourIndex: number, facultyId: string) => {
    const faculty = facultyList.find(f => f._id === facultyId);
    const newSchedule = { ...multiDaySchedule };
    newSchedule[date][hourIndex] = { 
      ...newSchedule[date][hourIndex], 
      replacementId: facultyId, 
      replacementName: faculty?.name || "" 
    };
    setMultiDaySchedule(newSchedule);
  };

  const revokeLeave = async (id: string) => {
    try {
      await axios.put(`/api/leaves/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Leave application revoked.");
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to revoke leave.");
    }
  };

  if (!user || user.role !== "faculty") {
    return <AppShell><div className="p-8 text-center">Faculty access only</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave & Workload Management</h1>
          <p className="text-muted-foreground mt-2">
            Submit leave requests and assign hourly workload for each day of your absence.
          </p>
        </div>

        {/* Application Form */}
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <h2 className="text-xl font-semibold flex items-center mb-6">
            <PlusCircle className="mr-2 h-5 w-5 text-primary" /> New Leave Request
          </h2>
          <form onSubmit={submitLeave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input placeholder="Personal / Medical / Emergency" value={reason} onChange={e => setReason(e.target.value)} required />
            </div>

            {Object.keys(multiDaySchedule).length > 0 && (
              <div className="space-y-6">
                <Label className="text-lg font-bold block border-b pb-2">Multi-Day Workload Reassignment</Label>
                {Object.keys(multiDaySchedule).map(date => (
                  <div key={date} className="space-y-3 p-4 rounded-xl border bg-muted/5">
                    <div className="font-bold text-primary flex items-center gap-2">
                       <Calendar className="h-4 w-4" /> {format(parseISO(date), "PPP")}
                    </div>
                    <div className="grid gap-2">
                      {multiDaySchedule[date].length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground bg-background rounded-lg border border-dashed">
                          No Classes (Sunday)
                        </div>
                      ) : (
                        multiDaySchedule[date].map((slot: any, idx: number) => (
                          <div key={slot.hour} className="flex items-center gap-3 p-2 border rounded-lg bg-background">
                            <span className="text-xs font-bold w-12">H{slot.hour}</span>
                            <div className="relative flex-1 group">
                              <Input 
                                 placeholder="Search and select faculty..."
                                 className="h-8 text-sm"
                                 value={slot.replacementName}
                                 onChange={(e) => {
                                    const val = e.target.value;
                                    const newSchedule = { ...multiDaySchedule };
                                    newSchedule[date][idx] = { ...slot, replacementName: val, replacementId: "" };
                                    setMultiDaySchedule(newSchedule);
                                 }}
                              />
                              
                              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto hidden group-focus-within:block">
                                {(() => {
                                  const filtered = facultyList.filter(f =>
                                    slot.replacementName && !slot.replacementId
                                      ? f.name.toLowerCase().includes(slot.replacementName.toLowerCase())
                                      : true
                                  );
                                  return filtered.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center italic">No matches found.</div>
                                  ) : filtered.map(f => (
                                    <div
                                      key={f._id}
                                      className="p-2 text-sm hover:bg-muted cursor-pointer flex flex-col"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateSlot(date, idx, f._id);
                                      }}
                                    >
                                      <span>{f.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{f.department}</span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full py-6 text-lg font-bold shadow-elegant hover:scale-[1.02] transition-transform">
              Submit Leave Request
            </Button>
          </form>
        </div>

        {/* Leave History */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-primary" /> Application Workflow
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No leaves applied yet.</div>
          ) : (
            <div className="divide-y">
              {leaves.map((leave) => (
                <div key={leave._id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{format(new Date(leave.startDate), "PP")} – {format(new Date(leave.endDate), "PP")}</div>
                      <div className="text-sm text-muted-foreground italic mt-1">Reason: {leave.reason}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <StatusBadge status={leave.status} />
                       {leave.userId === user.id && ['pending_hod', 'pending_principal'].includes(leave.status) && (
                         <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7" onClick={() => revokeLeave(leave._id)}>
                           Revoke
                         </Button>
                       )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {leave.schedule.map((day: any) => (
                      <div key={day.date} className="p-3 border rounded-lg bg-muted/20 text-xs">
                        <div className="font-bold mb-2 border-b pb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(parseISO(day.date), "MMM d, eee")}
                        </div>
                        <div className="space-y-1">
                          {day.slots.map((s: any) => (
                            <div key={s.hour} className="flex justify-between">
                              <span className="text-muted-foreground">Hour {s.hour}:</span>
                              <span className="font-medium">{s.replacementName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {leave.actingHODName && (
                    <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 flex items-center gap-2">
                       <UserCog className="h-4 w-4" /> <strong>Charge Transfer:</strong> {leave.actingHODName} is Acting HOD for this period.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

