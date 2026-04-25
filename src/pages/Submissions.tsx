import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Download, Trash2 } from "lucide-react";

export default function Submissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  const [facultyId, setFacultyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get('/api/submissions');
      setSubmissions(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchFaculties = async () => {
    if (user?.role === 'student') {
      try {
        const res = await axios.get('/api/auth/faculty');
        setFaculties(res.data);
      } catch(e) { console.error(e); }
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchFaculties();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyId || !title || !file) {
      toast.error("Please fill all required fields and attach a document");
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('facultyId', facultyId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    try {
      await axios.post('/api/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Assignment submitted successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
      setFacultyId("");
      fetchSubmissions();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return toast.error("Submission ID is missing");
    if (!window.confirm("Are you sure you want to delete this submission?")) return;

    const promise = async () => {
      // Optimistic update: remove from UI immediately
      setSubmissions(prev => prev.filter(s => (s._id || s.id) !== id));
      
      try {
        const res = await axios.delete(`/api/submissions/${id}`);
        return res.data;
      } catch (err: any) {
        // If it fails, we need to refetch to restore the item
        fetchSubmissions();
        throw err;
      }
    };

    toast.promise(promise(), {
      loading: 'Deleting submission...',
      success: 'Submission deleted successfully',
      error: (err) => err.response?.data?.error || "Failed to delete submission"
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Academic Submissions</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'student' ? 'Submit your assignments and project reports.' : 'Review student submissions.'}
          </p>
        </div>

        {user?.role === 'student' && (
          <div className="rounded-xl border bg-card p-6 shadow-card max-w-2xl">
            <h2 className="text-xl font-bold mb-4">New Submission</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Faculty *</label>
                <Select value={facultyId} onValueChange={setFacultyId}>
                  <SelectTrigger><SelectValue placeholder="Choose a faculty member" /></SelectTrigger>
                  <SelectContent>
                    {faculties.map((f: any) => (
                      <SelectItem key={f._id} value={f._id}>{f.name} ({f.department})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CS101 Final Project Report" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the submission" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Document *</label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Document"}
              </Button>
            </form>
          </div>
        )}

        <div className="rounded-xl border bg-card shadow-card p-6">
          <h2 className="text-xl font-bold mb-4">
            {user?.role === 'student' ? 'My Past Submissions' : 'Received Submissions'}
          </h2>
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No submissions found.
            </div>
          ) : (
            <div className="divide-y border rounded-lg">
              {submissions.map((sub: any) => {
                const submissionId = sub._id || sub.id;
                const studentId = sub.student?._id || sub.student;
                const isOwner = user?.id === studentId;
                
                return (
                  <div key={submissionId} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> {sub.title}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        {user?.role === 'faculty' ? (
                          <>From: <span className="font-medium text-foreground">{sub.student?.name}</span> ({sub.student?.rollNumber}) • {sub.student?.department}</>
                        ) : (
                          <>To: <span className="font-medium text-foreground">{sub.faculty?.name}</span></>
                        )}
                      </div>
                      {sub.description && <p className="text-sm mt-2 italic">"{sub.description}"</p>}
                      <div className="text-xs text-muted-foreground mt-2">
                        Submitted on: {new Date(sub.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild size="sm">
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </a>
                      </Button>
                      {(isOwner || user?.role === 'admin') && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(submissionId)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
