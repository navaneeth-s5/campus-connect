import { useMemo, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Shield, Search, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
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

  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [leaveOverrideDialog, setLeaveOverrideDialog] = useState(false);
  const [overrideStart, setOverrideStart] = useState("");
  const [overrideEnd, setOverrideEnd] = useState("");
  const [overrideDelegate, setOverrideDelegate] = useState("");
  const [searchFaculty, setSearchFaculty] = useState("");
  const [facultyList, setFacultyList] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaves();
    fetchFaculty();

    const socket = io();
    socket.on('connect', () => {
       socket.emit('join_role', 'principal');
    });

    socket.on('new_leave_request', (data: any) => {
       toast(`New Leave Request from ${data.leave.userName}`);
       fetchLeaves();
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLeaves(res.data);
    } catch (err) {}
  };

  const fetchFaculty = async () => {
    try {
      // Create a temporary route or use a known one. We can also fetch the directory.
      const res = await axios.get('/api/auth/directory', {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setFacultyList(res.data.filter((u: any) => u.role === 'faculty'));
    } catch(e) {}
  };

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

  const handleLeaveAction = async (id: string, act: "hod-approve" | "principal-approve" | "reject") => {
    try {
      await axios.put(`/api/leaves/${id}/${act}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success(`Leave action ${act} completed.`);
      fetchLeaves();
    } catch (err) {
      toast.error(`Action failed.`);
    }
  };

  const assignHOD = async (userId: string, isHOD: boolean, department?: string) => {
    const targetDept = department || facultyList.find(f => f._id === userId)?.department;
    
    if (isHOD) {
      const existingHOD = facultyList.find(f => f.isHOD && f.department.toLowerCase().trim() === targetDept?.toLowerCase().trim() && f._id !== userId);
      if (existingHOD) {
        const confirmReplace = window.confirm(`${existingHOD.name} is already the HOD for ${targetDept}. Promoting this faculty will remove HOD status from ${existingHOD.name}. Continue?`);
        if (!confirmReplace) return;
      }
    }

    try {
      await axios.put('/api/auth/assign-hod', { userId, isHOD, department: targetDept }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success(isHOD ? "Faculty promoted to HOD" : "HOD status removed");
      fetchFaculty();
    } catch(e) {
      toast.error("Failed to update HOD status");
    }
  };

  const handleLeaveOverride = async () => {
    if (!selectedLeave) return;
    try {
      await axios.put(`/api/leaves/${selectedLeave._id}/override`, {
        startDate: overrideStart || undefined,
        endDate: overrideEnd || undefined,
        newActingHODId: overrideDelegate || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Leave overridden successfully.");
      setLeaveOverrideDialog(false);
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to override leave.");
    }
  };

  const pendingPrincipalLeaves = useMemo(() => leaves.filter(l => l.status === "pending_principal"), [leaves]);
  const activeLeaves = useMemo(() => leaves.filter(l => l.status === "approved"), [leaves]);

  const filteredFaculty = useMemo(() => {
    return facultyList.filter(f => 
      f.name.toLowerCase().includes(searchFaculty.toLowerCase()) || 
      f.department?.toLowerCase().includes(searchFaculty.toLowerCase())
    );
  }, [facultyList, searchFaculty]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage high-priority campus appointments and faculty leaves.</p>
        </div>

        {/* --- DEPARTMENTAL LEADERSHIP --- */}
        <section className="bg-card p-6 rounded-xl border shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <h2 className="text-xl font-bold flex items-center text-primary">
               <Shield className="mr-2 h-6 w-6" /> Faculty Leadership Management
             </h2>
             <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Search faculty..." 
                 className="pl-9 h-9"
                 value={searchFaculty}
                 onChange={(e) => setSearchFaculty(e.target.value)}
               />
             </div>
           </div>

           <div className="overflow-x-auto rounded-lg border">
             <table className="w-full text-sm text-left">
               <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                 <tr>
                   <th className="p-3">Faculty Member</th>
                   <th className="p-3">Department</th>
                   <th className="p-3">Leadership Role</th>
                   <th className="p-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {filteredFaculty.map(faculty => (
                   <tr key={faculty._id} className="hover:bg-muted/20 transition-colors">
                     <td className="p-3">
                       <div className="font-semibold">{faculty.name}</div>
                       <div className="text-[10px] text-muted-foreground uppercase">{faculty.department}</div>
                     </td>
                     <td className="p-3">
                        <select 
                          className="border p-1 rounded text-xs bg-muted/20 w-full max-w-[200px]"
                          defaultValue={faculty.department}
                          id={`dept-${faculty._id}`}
                        >
                          {Array.from(new Set(facultyList.map(f => f.department))).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                     </td>
                     <td className="p-3">
                        <StatusBadge status={faculty.isHOD ? "approved" : "pending"} />
                        {faculty.isHOD && <span className="ml-2 text-[10px] font-bold text-primary">HOD</span>}
                     </td>
                     <td className="p-3 text-right">
                        <Button 
                          size="sm" 
                          variant={faculty.isHOD ? "destructive" : "default"}
                          className="h-8"
                          onClick={() => {
                            const dept = (document.getElementById(`dept-${faculty._id}`) as HTMLSelectElement).value;
                            assignHOD(faculty._id, !faculty.isHOD, dept);
                          }}
                        >
                          {faculty.isHOD ? "Remove Role" : "Assign HOD"}
                        </Button>
                     </td>
                   </tr>
                 ))}
                 {filteredFaculty.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                       No faculty members found matching your search.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </section>

        {/* --- LEAVE MANAGEMENT --- */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Faculty Leaves Review (Principal Level)</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card shadow-sm p-6">
              <h3 className="font-medium text-lg mb-4 text-orange-600">Pending Principal Review ({pendingPrincipalLeaves.length})</h3>
              {pendingPrincipalLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No requests awaiting your review.</p>
              ) : (
                <div className="space-y-4">
                  {pendingPrincipalLeaves.map(leave => (
                        <div key={leave._id} className="p-4 border rounded-lg bg-muted/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold">{leave.userName}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(leave.startDate), "PP")} - {format(new Date(leave.endDate), "PP")}</p>
                            </div>
                            <StatusBadge status={leave.status} />
                          </div>
                          <p className="text-sm mt-1"><strong>Reason:</strong> {leave.reason}</p>
                          
                          {leave.status === 'pending_principal' && (
                            <div className="mt-2 text-[10px] uppercase font-bold text-green-600 flex items-center gap-1">
                               <Check className="h-3 w-3" /> HOD Cleared
                            </div>
                          )}
                          
                          <div className="mt-3 border-t pt-3 space-y-2">
                             <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Workload Reassignment:</p>
                             {leave.schedule.map((day: any) => (
                               <div key={day.date} className="bg-muted/30 p-2 rounded">
                                 <p className="text-[10px] font-bold opacity-60 mb-1 underline">{new Date(day.date).toLocaleDateString()}</p>
                                 {day.slots && day.slots.length > 0 ? (
                                    day.slots.map((s: any) => (
                                      <div key={s.hour} className="text-[10px] flex justify-between">
                                        <span>H{s.hour}</span>
                                        <span className="font-medium">{s.replacementName}</span>
                                      </div>
                                    ))
                                 ) : (
                                    <p className="text-[10px] italic text-muted-foreground">No classes (Sunday/Holiday)</p>
                                 )}
                               </div>
                             ))}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleLeaveAction(leave._id, 'principal-approve')}>
                              Approve Leave
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200" onClick={() => handleLeaveAction(leave._id, 'reject')}>
                              Reject
                            </Button>
                          </div>
                        </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card shadow-sm p-6">
              <h3 className="font-medium text-lg mb-4 text-green-600">Active Approved Leaves</h3>
              {activeLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active leaves.</p>
              ) : (
                <div className="space-y-4">
                  {activeLeaves.map(leave => (
                    <div key={leave._id} className="border p-4 rounded-lg bg-green-50/50">
                      <p className="font-semibold">{leave.userName} <span className="text-xs text-muted-foreground">({leave.department})</span></p>
                      <p className="text-sm text-muted-foreground">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</p>
                      {leave.actingHODName && (
                         <div className="mt-2 text-sm bg-blue-100/50 p-2 rounded text-blue-800">
                            <strong>Acting HOD:</strong> {leave.actingHODName}
                         </div>
                      )}
                      <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => {
                        setSelectedLeave(leave);
                        setOverrideStart(leave.startDate.split('T')[0]);
                        setOverrideEnd(leave.endDate.split('T')[0]);
                        setOverrideDelegate(leave.actingHODId || "");
                        setLeaveOverrideDialog(true);
                      }}>
                        Override / Reassign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Override Dialog */}
        <Dialog open={leaveOverrideDialog} onOpenChange={setLeaveOverrideDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Leave Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label>Modify Start Date</Label>
                 <Input type="date" value={overrideStart} onChange={e => setOverrideStart(e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Modify End Date</Label>
                 <Input type="date" value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} />
               </div>
               {selectedLeave?.isHOD && (
                 <div className="space-y-2">
                   <Label>Reassign Acting HOD</Label>
                   <select className="w-full border p-2 rounded" value={overrideDelegate} onChange={e => setOverrideDelegate(e.target.value)}>
                     <option value="">Select new delegate...</option>
                     {facultyList.filter(f => f.department === selectedLeave.department && f._id !== selectedLeave.userId).map(f => (
                       <option key={f._id} value={f._id}>{f.name}</option>
                     ))}
                   </select>
                 </div>
               )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeaveOverrideDialog(false)}>Cancel</Button>
              <Button onClick={handleLeaveOverride}>Apply Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- EXISTING APPOINTMENTS --- */}
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
