import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, Lock, Activity } from "lucide-react";
import { Booking, COLLEGES, College } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "sonner";
import { io } from "socket.io-client";

const AdminPanel = () => {
  const { bookings, setStatus, loadingBookings } = useBookings();
  const pendingBookings = bookings.filter((b) => b.status === "pending" && b.facility !== "Principal Appointment");

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | "All">("All");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState("");

  const fetchResets = async () => {
     try {
       const res = await axios.get('/api/auth/reset-requests');
       setResetRequests(res.data);
     } catch(e) {}
  };

  const fetchFacilities = async () => {
     try {
       const res = await axios.get('/api/facilities');
       setFacilities(res.data);
     } catch(e) {}
  };

  useEffect(() => {
     fetchResets();
     fetchFacilities();
     const socket = io();
     socket.on('booking_update', () => fetchResets()); // arbitrary re-trigger could be useful
     return () => { socket.disconnect(); };
  }, []);

  const handleAddFacility = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newFacility.trim()) return;
     try {
        await axios.post('/api/facilities', { name: newFacility });
        toast.success("Facility added!");
        setNewFacility("");
        fetchFacilities();
     } catch(err: any) {
        toast.error(err.response?.data?.error || "Failed to add facility");
     }
  };

  const handleApproveReset = async (userId: string) => {
     const newPass = prompt("Enter a new temporary password for this user:");
     if (!newPass) return;
     try {
        await axios.post('/api/auth/approve-reset', { userId, newPassword: newPass });
        toast.success("Password reset securely");
        fetchResets();
     } catch(e) { toast.error("Reset failed"); }
  };

  const analytics = useMemo(() => {
     const relevant = selectedCollege === "All" ? bookings : bookings.filter(b => b.userCollege === selectedCollege);
     const total = relevant.length;
     const approved = relevant.filter(b => b.status === "approved").length;
     const rejected = relevant.filter(b => b.status === "rejected").length;
     return { total, approved, rejected };
  }, [bookings, selectedCollege]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage global facilities and security.</p>
        </div>

        <Tabs defaultValue="facilities" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-2xl">
            <TabsTrigger value="facilities">Approvals</TabsTrigger>
            <TabsTrigger value="manage_facilities">Manage Facilities</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="facilities" className="mt-6">
            <div className="rounded-xl border bg-card shadow-card overflow-hidden">
              {pendingBookings.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  No facility bookings require approval at this time.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Facility</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-t">
                    {pendingBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3">
                           <div className="font-medium">{b.userName}</div>
                           <div className="text-xs text-muted-foreground">{b.userRole}</div>
                        </td>
                        <td className="p-3 font-medium text-xs">{b.userCollege}</td>
                        <td className="p-3 font-medium">{b.facility}</td>
                        <td className="p-3">
                           <div>{b.date}</div>
                           <div className="text-xs text-muted-foreground">{b.startTime} - {b.endTime}</div>
                        </td>
                        <td className="p-3 italic">"{b.purpose}"</td>
                        <td className="p-3">
                           <div className="flex justify-end gap-2">
                             <Button size="icon" variant="outline" className="text-success hover:text-success hover:bg-success/10" onClick={() => setStatus(b.id, "approved")}>
                               <Check className="h-4 w-4" />
                             </Button>
                             <Button size="icon" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setStatus(b.id, "rejected")}>
                               <X className="h-4 w-4" />
                             </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manage_facilities" className="mt-6">
             <div className="rounded-xl border bg-card shadow-card p-6">
               <h3 className="text-lg font-bold mb-4">Manage Campus Facilities</h3>
               <form onSubmit={handleAddFacility} className="flex gap-4 mb-6 max-w-md">
                 <Input placeholder="New Facility Name" value={newFacility} onChange={e => setNewFacility(e.target.value)} />
                 <Button type="submit">Add Facility</Button>
               </form>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {facilities.map(f => (
                   <div key={f} className="p-3 border rounded-lg bg-muted/20 font-medium text-center">{f}</div>
                 ))}
               </div>
             </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
             <div className="rounded-xl border bg-card shadow-card p-6">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="h-5 w-5" /> Password Reset Requests</h3>
               {resetRequests.length === 0 ? (
                 <p className="text-muted-foreground">No active password reset requests from campus network.</p>
               ) : (
                 <div className="space-y-4">
                    {resetRequests.map(r => (
                       <div key={r._id} className="flex flex-col md:flex-row items-center justify-between border rounded-lg p-4 bg-muted/20">
                          <div>
                            <div className="font-semibold text-lg">{r.name}</div>
                            <div className="text-sm font-medium">{r.college} • {r.rollNumber} • {r.department}</div>
                          </div>
                          <Button onClick={() => handleApproveReset(r._id)} className="mt-2 md:mt-0">
                             Issue Temporary Password
                          </Button>
                       </div>
                    ))}
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
             <div className="rounded-xl border bg-card shadow-card p-6">
               <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5" /> Cross-Campus Usage Metrics</h3>
                  <Select value={selectedCollege} onValueChange={(v) => setSelectedCollege(v as College | "All")}>
                    <SelectTrigger className="w-[300px]"><SelectValue placeholder="Filter by College" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="All">All Colleges</SelectItem>
                       {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
               
               <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                     <p className="text-sm font-medium text-primary">Total Bookings</p>
                     <p className="mt-2 text-3xl font-bold">{analytics.total}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                     <p className="text-sm font-medium text-success">Approved Uses</p>
                     <p className="mt-2 text-3xl font-bold">{analytics.approved}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                     <p className="text-sm font-medium text-destructive">Rejected / Conflicts</p>
                     <p className="mt-2 text-3xl font-bold">{analytics.rejected}</p>
                  </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminPanel;
