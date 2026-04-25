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
  const { bookings = [], setStatus, loadingBookings } = useBookings();
  const pendingBookings = (bookings || []).filter((b) => b.status === "pending" || b.facility === "Principal Appointment");

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | "All">("All");
  const [facilities, setFacilities] = useState<IFacility[]>([]);
  const [newFacility, setNewFacility] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['student', 'faculty', 'principal', 'guest']);
  const [hasAssetManagement, setHasAssetManagement] = useState(true);
  const [facultiesList, setFacultiesList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  
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

  const fetchFacultyList = async () => {
     try {
       const res = await axios.get('/api/auth/faculty');
       setFacultiesList(res.data);
     } catch(e) {}
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setAllUsers(res.data);
    } catch(e) {}
  };


  useEffect(() => {
     fetchResets();
     fetchFacilities();
     fetchFacultyList();
     fetchAllUsers();

     const socket = io();
     socket.on('booking_update', () => fetchResets()); // arbitrary re-trigger could be useful
     return () => { socket.disconnect(); };
  }, []);

  const handleAddFacility = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newFacility.trim()) return;
     try {
        await axios.post('/api/facilities', { name: newFacility, allowedRoles: selectedRoles, hasAssetManagement });
        toast.success("Facility added!");
        setNewFacility("");
        setHasAssetManagement(true);
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

  const handleAssignManager = async (facilityId: string, managerId: string) => {
    try {
      const fac = facilities.find(f => typeof f !== 'string' && f._id === facilityId);
      if(!fac || typeof fac === 'string') return;
      const currentManagers = fac.managers?.map(m => typeof m === 'string' ? m : m._id) || [];
      if (currentManagers.includes(managerId)) return toast.error("Already a manager");
      
      await axios.put(`/api/facilities/${facilityId}/managers`, { managers: [...currentManagers, managerId] });
      toast.success("Manager assigned");
      fetchFacilities();
    } catch(e) { toast.error("Failed to assign manager"); }
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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await axios.put('/api/auth/role', { userId, newRole });
      toast.success("User role updated");
      fetchAllUsers();
    } catch(e) { toast.error("Failed to update role"); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/auth/users/${userId}`);
      toast.success("User deleted successfully");
      fetchAllUsers();
    } catch(e) { toast.error("Failed to delete user"); }
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

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedFacilityForAssets) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mappedAssets = data.map((row: any) => ({
          assetTag: row['Asset Tag'] || row['assetTag'] || '',
          serialNo: row['Serial No'] || row['serialNo'] || '',
          type: row['Type'] || row['type'] || '',
          vendorName: row['Vendor'] || row['vendorName'] || '',
          price: row['Price'] || row['price'] || 0,
          warranty: row['Warranty'] || row['warranty'] || ''
        })).filter(a => a.assetTag || a.type);

        await axios.post(`/api/facilities/${selectedFacilityForAssets._id}/assets/bulk`, { assets: mappedAssets });
        toast.success(`${mappedAssets.length} assets uploaded!`);
        fetchFacilities();
        
        const res = await axios.get('/api/facilities');
        const fac = res.data.find((f: IFacility) => f._id === selectedFacilityForAssets._id);
        setSelectedFacilityForAssets(fac);
      } catch(e) {
        toast.error("Failed to parse or upload Excel file");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
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

  const analytics = useMemo(() => {
     const relevant = selectedCollege === "All" ? (bookings || []) : (bookings || []).filter(b => b.userCollege === selectedCollege);
     const total = relevant.length;
     const approved = relevant.filter(b => b.status === "approved").length;
     const rejected = relevant.filter(b => b.status === "rejected").length;
     return { total, approved, rejected };
  }, [(bookings || []), selectedCollege]);

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
          <TabsList className="grid grid-cols-5 max-w-3xl">
            <TabsTrigger value="facilities">Appointments</TabsTrigger>
            <TabsTrigger value="manage_facilities">Facilities</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-t">
                    {pendingBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3">
                           <div className="font-medium">{b.userName}</div>
                           <div className="text-xs text-muted-foreground">{b.userRole}{b.guestPhone ? ` • 📞 ${b.guestPhone}` : ''}</div>
                        </td>
                        <td className="p-3 font-medium text-xs">{b.userCollege}</td>
                        <td className="p-3 font-medium">{b.facility}</td>
                        <td className="p-3">
                           <div>{b.date}</div>
                           <div className="text-xs text-muted-foreground">{b.startTime} - {b.endTime}</div>
                        </td>
                        <td className="p-3 italic">"{b.purpose}"</td>
                        <td className="p-3"><StatusBadge status={b.status} /></td>
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
                   <div className="mt-2">
                     <label className="flex items-center gap-2 text-sm font-medium">
                       <input type="checkbox" checked={hasAssetManagement} onChange={e => setHasAssetManagement(e.target.checked)} />
                       Enable Asset Management for this facility
                     </label>
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
                       {f.hasAssetManagement !== false && (
                         <div className="text-xs text-muted-foreground mt-1">
                           {assets.length} Assets
                         </div>
                       )}
                       {f.hasAssetManagement !== false && (
                         <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                           Managers: {(typeof f !== 'string' && f.managers && f.managers.length > 0) ? f.managers.map(m => typeof m === 'string' ? m : m.name).join(', ') : 'None'}
                           <Select onValueChange={(val) => handleAssignManager(String(facId), val)}>
                             <SelectTrigger className="h-6 w-32 text-[10px] ml-2"><SelectValue placeholder="+ Assign" /></SelectTrigger>
                             <SelectContent>
                               {facultiesList.map(faculty => (
                                 <SelectItem key={faculty._id} value={faculty._id}>{faculty.name}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       )}
                     </div>
                     <div className="flex gap-2 items-center flex-wrap">
                       {f.hasAssetManagement !== false && (
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

                             <div className="flex justify-between items-center mb-4">
                               <div className="flex items-center gap-2">
                                 <Input type="file" accept=".xlsx, .xls" className="max-w-[200px]" onChange={handleBulkUpload} />
                                 <span className="text-xs text-muted-foreground">Bulk Upload (Excel)</span>
                               </div>
                               <Button variant="outline" size="sm" onClick={() => typeof f !== 'string' && exportAssetsExcel(f)}><Download className="h-4 w-4 mr-2"/> Excel</Button>
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
                       )}
                       <Button variant="destructive" size="icon" onClick={() => handleDeleteFacility(String(facId))}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 )})}
               </div>
             </div>
          </TabsContent>

           <TabsContent value="users" className="mt-6">
             <div className="rounded-xl border bg-card shadow-card p-6">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5" /> User Management</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-muted text-xs uppercase text-muted-foreground">
                     <tr>
                       <th className="p-3">User</th>
                       <th className="p-3">Roll Number</th>
                       <th className="p-3">Department</th>
                       <th className="p-3">Role</th>
                       <th className="p-3">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {Array.isArray(allUsers) && allUsers.map(u => (
                       <tr key={u._id}>
                         <td className="p-3">
                           <div className="font-medium">{u.name}</div>
                           <div className="text-xs text-muted-foreground">{u.college}</div>
                         </td>
                         <td className="p-3">{u.rollNumber}</td>
                         <td className="p-3">{u.department}</td>
                         <td className="p-3 uppercase font-bold text-xs">{u.role}</td>
                         <td className="p-3">
                           <div className="flex items-center gap-2">
                             <Select value={u.role} onValueChange={(val) => handleUpdateRole(u._id, val)}>
                               <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="student">Student</SelectItem>
                                 <SelectItem value="faculty">Faculty</SelectItem>
                                 <SelectItem value="admin">Admin</SelectItem>
                                 <SelectItem value="principal">Principal</SelectItem>
                                 <SelectItem value="guest">Guest</SelectItem>
                               </SelectContent>
                             </Select>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u._id)}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
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
