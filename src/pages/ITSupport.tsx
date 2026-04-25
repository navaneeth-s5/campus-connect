import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, TicketPriority } from "@/types";
import axios from "axios";
import { toast } from "sonner";
import { LifeBuoy, MessageSquare, Plus, Clock, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ITSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", description: "", category: "IT", priority: "low" as TicketPriority });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [resolution, setResolution] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets');
      setTickets(res.data);
    } catch(e) {}
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) return toast.error("Please fill required fields");
    try {
      await axios.post('/api/tickets', newTicket);
      toast.success("Ticket created successfully");
      setIsCreating(false);
      setNewTicket({ title: "", description: "", category: "IT", priority: "low" });
      fetchTickets();
    } catch (e) {
      toast.error("Failed to create ticket");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;
    try {
      await axios.post(`/api/tickets/${selectedTicket._id}/responses`, { message: replyMessage });
      toast.success("Response added");
      setReplyMessage("");
      fetchTickets();
      
      const res = await axios.get('/api/tickets');
      setSelectedTicket(res.data.find((t: Ticket) => t._id === selectedTicket._id) || null);
    } catch (e) {
      toast.error("Failed to add response");
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !resolution) return toast.error("Resolution is required to close the ticket");
    try {
      await axios.put(`/api/tickets/${selectedTicket._id}/status`, { status: "closed", resolution });
      toast.success("Ticket closed");
      setIsClosing(false);
      setResolution("");
      fetchTickets();
      const res = await axios.get('/api/tickets');
      setSelectedTicket(res.data.find((t: Ticket) => t._id === selectedTicket._id) || null);
    } catch (e) {
      toast.error("Failed to close ticket");
    }
  };

  // Stats calculation
  const stats = {
    open: tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    escalated: tickets.filter(t => t.escalated).length,
    today: tickets.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Help Desk & Complaints</h1>
            <p className="text-muted-foreground mt-1">Register and track your complaints or support requests.</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2"/> New Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                <Input placeholder="Issue Title" value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} required />
                <Select value={newTicket.category} onValueChange={v => setNewTicket({...newTicket, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT & Network</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Software">Software & Portal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTicket.priority} onValueChange={v => setNewTicket({...newTicket, priority: v as TicketPriority})}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Detailed description of your issue" value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} required className="min-h-[100px]" />
                <Button type="submit" className="w-full">Submit Ticket</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {user?.role === 'admin' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center">
              <span className="text-muted-foreground text-xs font-semibold uppercase">Active Tickets</span>
              <span className="text-2xl font-bold text-primary">{stats.open}</span>
            </div>
            <div className="p-4 border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center">
              <span className="text-muted-foreground text-xs font-semibold uppercase">Resolved</span>
              <span className="text-2xl font-bold text-success">{stats.resolved}</span>
            </div>
            <div className="p-4 border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center">
              <span className="text-muted-foreground text-xs font-semibold uppercase">Closed</span>
              <span className="text-2xl font-bold text-muted-foreground">{stats.closed}</span>
            </div>
            <div className="p-4 border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center">
              <span className="text-muted-foreground text-xs font-semibold uppercase">Escalated SLA</span>
              <span className="text-2xl font-bold text-destructive flex items-center gap-2">
                {stats.escalated > 0 && <AlertTriangle className="h-4 w-4" />} {stats.escalated}
              </span>
            </div>
            <div className="p-4 border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center">
              <span className="text-muted-foreground text-xs font-semibold uppercase">Created Today</span>
              <span className="text-2xl font-bold">{stats.today}</span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border rounded-xl bg-card shadow-card overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-muted/50 border-b font-semibold flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" /> {user?.role === 'admin' ? 'All Tickets' : 'My Tickets'}
            </div>
            <div className="overflow-y-auto flex-1">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No tickets found.</div>
              ) : (
                <div className="divide-y">
                  {tickets.map(t => (
                    <div 
                      key={t._id} 
                      className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${selectedTicket?._id === t._id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                      onClick={() => setSelectedTicket(t)}
                    >
                      <div className="font-medium text-sm truncate">{t.title}</div>
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded capitalize ${t.status === 'resolved' || t.status === 'closed' ? 'bg-success/10 text-success' : t.status === 'in-progress' ? 'bg-warning/10 text-warning-foreground' : 'bg-primary/10 text-primary'}`}>
                            {t.status}
                          </span>
                          {t.escalated && <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> SLA</span>}
                        </div>
                        <span className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 border rounded-xl bg-card shadow-card flex flex-col h-[600px] overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="p-5 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
                      <div className="text-sm text-muted-foreground flex gap-3 mt-2 items-center">
                        <span className={`px-2 py-0.5 rounded capitalize text-xs font-medium ${selectedTicket.status === 'closed' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          Status: {selectedTicket.status}
                        </span>
                        <span className="capitalize">Priority: {selectedTicket.priority}</span>
                        <span>Category: {selectedTicket.category}</span>
                        {selectedTicket.escalated && <span className="text-destructive font-semibold flex items-center gap-1 text-xs"><AlertTriangle className="h-4 w-4"/> SLA BREACHED</span>}
                      </div>
                    </div>
                    {user?.role === 'admin' && selectedTicket.status !== 'closed' && (
                      <Dialog open={isClosing} onOpenChange={setIsClosing}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">Close Ticket</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Close Ticket</DialogTitle></DialogHeader>
                          <div className="space-y-4 mt-4">
                            <Textarea placeholder="Provide a resolution for this issue..." value={resolution} onChange={e => setResolution(e.target.value)} required />
                            <Button onClick={handleCloseTicket} className="w-full">Mark as Closed</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
                      {selectedTicket.createdBy?.name?.[0] || 'U'}
                    </div>
                    <div className="bg-card border rounded-2xl p-4 shadow-sm w-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{selectedTicket.createdBy?.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1"/> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {selectedTicket.responses.map((r, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold ${r.senderRole === 'admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'}`}>
                        {r.senderName?.[0] || 'A'}
                      </div>
                      <div className={`border rounded-2xl p-4 shadow-sm w-full ${r.senderRole === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100' : 'bg-card'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold flex items-center gap-2">
                            {r.senderName} 
                            {r.senderRole === 'admin' && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Support</span>}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1"/> {new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                      </div>
                    </div>
                  ))}

                  {selectedTicket.status === 'closed' && selectedTicket.resolution && (
                    <div className="mt-6 p-4 border border-success/30 bg-success/5 rounded-xl">
                      <div className="flex items-center gap-2 font-semibold text-success mb-2">
                        <CheckCircle className="h-5 w-5" /> Official Resolution
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    </div>
                  )}
                </div>
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t bg-card">
                    <form onSubmit={handleReply} className="flex gap-2">
                      <Textarea placeholder="Type your reply..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)} className="min-h-[60px] resize-none" required />
                      <Button type="submit" className="h-auto px-6"><MessageSquare className="h-4 w-4 mr-2"/> Send</Button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <LifeBuoy className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
