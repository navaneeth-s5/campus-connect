import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useBookings } from "@/context/BookingContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, Lock, Activity, Plus, Trash2, Download } from "lucide-react";
import { Booking, COLLEGES, College, IFacility, Role } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminPanel = () => {
  const { bookings, setStatus, loadingBookings } = useBookings();
  const pendingBookings = bookings.filter((b) => b.status === "pending" && b.facility !== "Principal Appointment");

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | "All">("All");
  const [facilities, setFacilities] = useState<IFacility[]>([]);
  const [newFacility, setNewFacility] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['student', 'faculty', 'principal', 'guest']);
  
  const [selectedFacilityForAssets, setSelectedFacilityForAssets] = useState<IFacility | null>(null);
  const [newAsset, setNewAsset] = useState({
    purchaseDate: '',
    vendorName: '',
    type: '',
    price: '',
    warranty: '',
    assetTag: '',
    serialNo: ''
  });

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
        await axios.post('/api/facilities', { name: newFacility, allowedRoles: selectedRoles });
        toast.success("Facility added!");
        setNewFacility("");
        fetchFacilities();
     } catch(err: any) {
        toast.error(err.response?.data?.error || "Failed to add facility");
     }
  };

  const handleDeleteFacility = async (id: string) => {
    if(!confirm("Are you sure you want to delete this facility?")) return;
    try {
      await axios.delete(`/api/facilities/${id}`);
      toast.success("Facility deleted");
      fetchFacilities();
    } catch(e) { toast.error("Failed to delete facility"); }
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

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForAssets) return;
    try {
      await axios.post(`/api/facilities/${selectedFacilityForAssets._id}/assets`, newAsset);
      toast.success("Asset added!");
      setNewAsset({ purchaseDate: '', vendorName: '', type: '', price: '', warranty: '', assetTag: '', serialNo: '' });
      fetchFacilities();
      // Update selected facility
      const updated = facilities.find(f => f._id === selectedFacilityForAssets._id);
      if(updated) {
        const res = await axios.get('/api/facilities');
        const fac = res.data.find((f: IFacility) => f._id === selectedFacilityForAssets._id);
        setSelectedFacilityForAssets(fac);
      }
    } catch(err: any) {
      toast.error(err.response?.data?.error || "Failed to add asset");
    }
  };

  const exportAssetsExcel = (facility: IFacility) => {
    const ws = XLSX.utils.json_to_sheet(facility.assets.map(a => ({
      "Asset Tag": a.assetTag,
      "Serial No": a.serialNo,
      "Type": a.type,
      "Vendor": a.vendorName,
      "Purchase Date": a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '',
      "Price": a.price,
      "Warranty": a.warranty
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, `${facility.name}_Assets.xlsx`);
  };

  const exportAssetsPDF = (facility: IFacility) => {
    const doc = new jsPDF();
    doc.text(`${facility.name} - Asset Details`, 14, 15);
    const tableColumn = ["Tag", "Serial No", "Type", "Vendor", "Purchase Date", "Price", "Warranty"];
    const tableRows = facility.assets.map(a => [
      a.assetTag, a.serialNo, a.type, a.vendorName, 
      a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '', 
      a.price, a.warranty
    ]);
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });
    doc.save(`${facility.name}_Assets.pdf`);
  };

  const analytics = useMemo(() => {
     const relevant = selectedCollege === "All" ? bookings : bookings.filter(b => b.userCollege === selectedCollege);
     const total = relevant.length;
     const approved = relevant.filter(b => b.status === "approved").length;
     const rejected = relevant.filter(b => b.status === "rejected").length;
     return { total, approved, rejected };
  }, [bookings, selectedCollege]);

  const toggleRole = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage global facilities, assets, and security.</p>
        </div>

        <Tabs defaultValue="facilities" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-2xl">
            <TabsTrigger value="facilities">Approvals</TabsTrigger>
            <TabsTrigger value="manage_facilities">Facilities & Assets</TabsTrigger>
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
               <h3 className="text-lg font-bold mb-4">Manage Campus Facilities & Assets</h3>
               <form onSubmit={handleAddFacility} className="flex flex-col gap-4 mb-8 p-4 border rounded-lg bg-muted/10">
                 <div className="flex gap-4">
                   <Input placeholder="New Facility Name" value={newFacility} onChange={e => setNewFacility(e.target.value)} className="max-w-md" />
                   <Button type="submit">Add Facility</Button>
                 </div>
                 <div className="flex flex-col gap-2">
                   <span className="text-sm font-medium">Allowed Roles:</span>
                   <div className="flex gap-4">
                     {['student', 'faculty', 'principal', 'guest'].map((r: any) => (
                       <label key={r} className="flex items-center gap-2 text-sm capitalize">
                         <input type="checkbox" checked={selectedRoles.includes(r)} onChange={() => toggleRole(r)} />
                         {r}
                       </label>
                     ))}
                   </div>
                 </div>
               </form>
               
               <div className="space-y-4">
                 {facilities.map((f, i) => {
                   const facName = typeof f === 'string' ? f : (f.name || 'Unknown');
                   const facId = typeof f === 'string' ? f : (f._id || i);
                   const allowedRoles = (typeof f !== 'string' && Array.isArray(f.allowedRoles)) ? f.allowedRoles : [];
                   const assets = (typeof f !== 'string' && Array.isArray(f.assets)) ? f.assets : [];
                   
                   return (
                   <div key={facId} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between md:items-center gap-4">
                     <div>
                       <div className="font-semibold text-lg">{facName}</div>
                       <div className="text-xs text-muted-foreground flex gap-1 mt-1">
                         Roles: {allowedRoles.map(r => <span key={r} className="bg-primary/10 px-2 py-0.5 rounded capitalize">{r}</span>)}
                       </div>
                       <div className="text-xs text-muted-foreground mt-1">
                         {assets.length} Assets
                       </div>
                     </div>
                     <div className="flex gap-2 items-center flex-wrap">
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => setSelectedFacilityForAssets(typeof f === 'string' ? null : f)}>Manage Assets</Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-3xl">
                           <DialogHeader>
                             <DialogTitle>{facName} - Asset Management</DialogTitle>
                           </DialogHeader>
                           <div className="mt-4">
                             <form onSubmit={handleAddAsset} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 border rounded-lg">
                               <Input placeholder="Asset Tag" required value={newAsset.assetTag} onChange={e => setNewAsset({...newAsset, assetTag: e.target.value})} />
                               <Input placeholder="Type (e.g. PC, Desk)" required value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} />
                               <Input placeholder="Serial No" value={newAsset.serialNo} onChange={e => setNewAsset({...newAsset, serialNo: e.target.value})} />
                               <Input placeholder="Vendor Name" value={newAsset.vendorName} onChange={e => setNewAsset({...newAsset, vendorName: e.target.value})} />
                               <Input type="date" placeholder="Purchase Date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} />
                               <Input type="number" placeholder="Price" value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: e.target.value})} />
                               <Input placeholder="Warranty" value={newAsset.warranty} onChange={e => setNewAsset({...newAsset, warranty: e.target.value})} />
                               <Button type="submit" className="col-span-1"><Plus className="h-4 w-4 mr-2"/> Add Asset</Button>
                             </form>

                             <div className="flex justify-end gap-2 mb-4">
                               <Button variant="outline" size="sm" onClick={() => typeof f !== 'string' && exportAssetsExcel(f)}><Download className="h-4 w-4 mr-2"/> Excel</Button>
                               <Button variant="outline" size="sm" onClick={() => typeof f !== 'string' && exportAssetsPDF(f)}><Download className="h-4 w-4 mr-2"/> PDF</Button>
                             </div>

                             <div className="max-h-[300px] overflow-y-auto">
                               <table className="w-full text-sm text-left">
                                 <thead className="bg-muted sticky top-0">
                                   <tr>
                                     <th className="p-2">Tag</th>
                                     <th className="p-2">Type</th>
                                     <th className="p-2">Vendor</th>
                                     <th className="p-2">Date</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {assets.map((a: any, idx) => (
                                     <tr key={idx} className="border-t">
                                       <td className="p-2">{a.assetTag}</td>
                                       <td className="p-2">{a.type}</td>
                                       <td className="p-2">{a.vendorName}</td>
                                       <td className="p-2">{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : ''}</td>
                                     </tr>
                                   ))}
                                   {assets.length === 0 && (
                                     <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No assets added.</td></tr>
                                   )}
                                 </tbody>
                               </table>
                             </div>
                           </div>
                         </DialogContent>
                       </Dialog>
                       <Button variant="destructive" size="icon" onClick={() => handleDeleteFacility(facId)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 )})}
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
