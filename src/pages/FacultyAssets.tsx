import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Plus } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import 'jspdf-autotable';
import { IFacility } from "@/types";

export default function FacultyAssets() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<IFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<IFacility | null>(null);
  
  const [newAsset, setNewAsset] = useState({
    purchaseDate: '',
    vendorName: '',
    type: '',
    price: '',
    warranty: '',
    assetTag: '',
    serialNo: ''
  });

  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/api/facilities');
      const managed = res.data.filter((f: any) => 
        f.managers && f.managers.some((m: any) => m._id === user?.id || m === user?.id)
      );
      setFacilities(managed);
    } catch(e) {}
  };

  useEffect(() => { fetchFacilities(); }, [user]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    try {
      await axios.post(`/api/facilities/${selectedFacility._id}/assets`, newAsset);
      toast.success("Asset added!");
      setNewAsset({ purchaseDate: '', vendorName: '', type: '', price: '', warranty: '', assetTag: '', serialNo: '' });
      fetchFacilities();
      
      const res = await axios.get('/api/facilities');
      const updated = res.data.find((f: IFacility) => f._id === selectedFacility._id);
      setSelectedFacility(updated);
    } catch(err: any) {
      toast.error(err.response?.data?.error || "Failed to add asset");
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedFacility) return;
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

        await axios.post(`/api/facilities/${selectedFacility._id}/assets/bulk`, { assets: mappedAssets });
        toast.success(`${mappedAssets.length} assets uploaded!`);
        fetchFacilities();
        
        const res = await axios.get('/api/facilities');
        const fac = res.data.find((f: IFacility) => f._id === selectedFacility._id);
        setSelectedFacility(fac);
      } catch(err) {
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facility Assets</h1>
          <p className="text-muted-foreground mt-1">Manage assets for the facilities assigned to you.</p>
        </div>

        {facilities.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground shadow-card">
            You have not been assigned to manage any facilities yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map(f => (
              <div key={f._id} className="rounded-xl border bg-card shadow-card p-6 flex flex-col justify-between h-[200px]">
                <div>
                  <h3 className="text-xl font-bold">{f.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.assets.length} total assets registered.</p>
                </div>
                <div className="mt-6 flex justify-between gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedFacility(f)} className="w-full">Manage Records</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{f.name} - Asset Records</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <form onSubmit={handleAddAsset} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 border rounded-lg bg-muted/20">
                          <Input placeholder="Asset Tag" required value={newAsset.assetTag} onChange={e => setNewAsset({...newAsset, assetTag: e.target.value})} />
                          <Input placeholder="Type (e.g. PC, Desk)" required value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} />
                          <Input placeholder="Serial No" value={newAsset.serialNo} onChange={e => setNewAsset({...newAsset, serialNo: e.target.value})} />
                          <Input placeholder="Vendor Name" value={newAsset.vendorName} onChange={e => setNewAsset({...newAsset, vendorName: e.target.value})} />
                          <Input type="date" placeholder="Purchase Date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} />
                          <Input type="number" placeholder="Price" value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: e.target.value})} />
                          <Input placeholder="Warranty" value={newAsset.warranty} onChange={e => setNewAsset({...newAsset, warranty: e.target.value})} />
                          <Button type="submit" className="col-span-1"><Plus className="h-4 w-4 mr-2"/> Add</Button>
                        </form>

                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Input type="file" accept=".xlsx, .xls" className="max-w-[200px]" onChange={handleBulkUpload} />
                            <span className="text-xs text-muted-foreground">Bulk Upload (Excel)</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => exportAssetsExcel(f)}><Download className="h-4 w-4 mr-2"/> Export Excel</Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-3">Tag</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Vendor</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {f.assets.map((a: any, idx) => (
                                <tr key={idx} className="hover:bg-muted/10">
                                  <td className="p-3 font-medium">{a.assetTag}</td>
                                  <td className="p-3">{a.type}</td>
                                  <td className="p-3">{a.vendorName}</td>
                                  <td className="p-3">{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : ''}</td>
                                </tr>
                              ))}
                              {f.assets.length === 0 && (
                                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No assets found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
