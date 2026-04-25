import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  PlayCircle, FileText, CheckCircle2, Lock, 
  ChevronLeft, MessageSquare, BarChart3, Clock,
  FileDown, HelpCircle, Plus, Layout, ClipboardList, Users, Send
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LMSCourse, LMSModule, LMSTask } from "@/types";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const LMSCourseView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [tasks, setTasks] = useState<LMSTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'tasks' | 'students' | 'forum'>('curriculum');
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [enrollRollNumber, setEnrollRollNumber] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: ""
  });

  useEffect(() => {
    fetchCourseDetails();
    fetchTasks();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        axios.get(`/api/lms/courses/${id}`), 
        axios.get(`/api/lms/courses/${id}/modules`)
      ]);
      setCourse(courseRes.data);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);
    } catch (err) {
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/api/lms/courses/${id}/tasks`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load tasks");
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/lms/courses/${id}/enroll`, { studentRollNumber: enrollRollNumber });
      toast.success("Student enrolled successfully");
      setEnrollRollNumber("");
      fetchCourseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to enroll student");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/lms/courses/${id}/tasks`, newTask);
      toast.success("Assignment created");
      setIsAddingTask(false);
      setNewTask({ title: "", description: "", deadline: "" });
      fetchTasks();
    } catch (err) { toast.error("Failed to create task"); }
  };

  const handleTaskSubmission = async (taskId: string) => {
    const fileUrl = prompt("Enter File URL (Simulated Upload):");
    if (!fileUrl) return;
    try {
      await axios.post(`/api/lms/tasks/${taskId}/submit`, { 
        fileUrl, 
        fileName: fileUrl.split('/').pop() || "submission.pdf" 
      });
      toast.success("Task submitted successfully!");
    } catch (err) { toast.error("Submission failed"); }
  };

  const handleAddModule = async () => {
    const title = prompt("Enter Module Title (e.g. Chapter 1: Introduction):");
    if (!title) return;
    try {
      await axios.post(`/api/lms/courses/${id}/modules`, { title, order: modules.length + 1 });
      toast.success("Module added");
      fetchCourseDetails();
    } catch (err) { toast.error("Failed to add module"); }
  };

  const handleAddContent = async (moduleId: string) => {
    const title = prompt("Material Title (e.g. Lecture PPT, Video Link):");
    const type = prompt("Select Type: \n1. video \n2. pdf (PPT/PDF) \n3. note (Lab Notes) \n4. quiz") as any;
    
    let typeValue = "note";
    if (type === "1") typeValue = "video";
    else if (type === "2") typeValue = "pdf";
    else if (type === "3") typeValue = "note";
    else if (type === "4") typeValue = "quiz";
    else typeValue = type; // fallback

    if (!title || !typeValue) return;
    try {
      await axios.post(`/api/lms/modules/${moduleId}/content`, { title, type: typeValue });
      toast.success("Material added successfully");
      fetchCourseDetails();
    } catch (err) { toast.error("Failed to add material"); }
  };

  if (loading) return <AppShell><div className="flex items-center justify-center h-64">Loading course...</div></AppShell>;
  if (!course) return <AppShell>Course not found</AppShell>;

  const canEdit = user?.role === 'admin' || (user?.role === 'faculty' && (typeof course.faculty === 'string' ? course.faculty === user.id : (course.faculty as any)?._id === user.id));

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" className="-ml-2 text-muted-foreground hover:bg-transparent">
          <Link to="/lms"><ChevronLeft className="h-4 w-4 mr-1" /> Back to LMS</Link>
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleAddModule}><Plus className="h-4 w-4 mr-2" /> Add Module</Button>
            <Button size="sm" variant="outline"><BarChart3 className="h-4 w-4 mr-2" /> Analytics</Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Course Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm overflow-hidden sticky top-24">
            <div className="mb-6">
              <h1 className="text-xl font-black leading-tight mb-2">{course.title}</h1>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>
            
            <nav className="space-y-1">
              {[
                { id: 'curriculum', label: 'Curriculum', icon: Layout },
                { id: 'tasks', label: 'Tasks & Assignments', icon: ClipboardList },
                { id: 'students', label: 'Student Roster', icon: Users, facultyOnly: true },
                { id: 'forum', label: 'Discussion', icon: MessageSquare },
              ].map((tab: any) => {
                if (tab.facultyOnly && !canEdit) return null;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-elegant' : 'hover:bg-muted'}`}
                  >
                    <tab.icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t">
               <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Course Progress</div>
               <div className="space-y-2">
                  <Progress value={24} className="h-2" />
                  <div className="flex justify-between text-xs font-bold">
                    <span className="opacity-60">Complete</span>
                    <span className="text-primary">24%</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeContent ? (
            <div className="rounded-3xl border bg-card p-8 shadow-elegant animate-in zoom-in-95 duration-300">
               <div className="flex items-center justify-between mb-8 pb-4 border-b">
                 <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{activeContent.type}</div>
                    <h2 className="text-2xl font-black">{activeContent.title}</h2>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setActiveContent(null)} className="rounded-full px-6">Exit Viewer</Button>
               </div>
               
               <div className="min-h-[400px]">
                 {activeContent.type === 'video' && (
                   <div className="aspect-video bg-muted rounded-3xl flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-primary/20">
                     <PlayCircle className="h-20 w-20 opacity-20 mb-4 animate-pulse" />
                     <p className="font-bold">Streaming Material...</p>
                     <p className="text-xs opacity-60 mt-2 italic">Video CDN initialized for {course.code}</p>
                   </div>
                 )}
                 {activeContent.type === 'note' && (
                   <div className="prose dark:prose-invert max-w-none p-6 bg-muted/20 rounded-3xl border">
                     <p className="leading-relaxed text-lg italic opacity-90">{activeContent.body || "No lecture notes attached to this section yet."}</p>
                   </div>
                 )}
                 {activeContent.type === 'pdf' && (
                   <div className="flex flex-col items-center justify-center py-24 bg-primary/5 rounded-3xl border border-primary/10">
                      <FileText className="h-16 w-16 text-primary mb-6" />
                      <h3 className="text-xl font-bold mb-2">Resource Document</h3>
                      <p className="text-muted-foreground max-w-xs text-center mb-8">This PDF contains essential reading materials for the module.</p>
                      <Button className="rounded-full px-10 shadow-elegant">Download Full PDF</Button>
                   </div>
                 )}
                 {activeContent.type === 'quiz' && (
                   <div className="max-w-2xl mx-auto py-12 text-center bg-purple-500/5 rounded-3xl border border-purple-500/20">
                     <HelpCircle className="h-16 w-16 text-purple-500 mx-auto mb-6" />
                     <h3 className="text-2xl font-black mb-4">Knowledge Assessment</h3>
                     <Button className="bg-purple-600 hover:bg-purple-700 rounded-full px-12 py-6 text-lg font-bold shadow-elegant">Begin Test</Button>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <>
              {activeTab === 'curriculum' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black">Course Curriculum</h2>
                  </div>
                  {modules.map((mod, idx) => (
                    <div key={mod._id} className="group rounded-3xl border bg-card hover:border-primary/20 transition-all duration-300">
                      <div className="p-6 flex items-center justify-between border-b bg-muted/10">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-md">{idx + 1}</div>
                          <div>
                            <h3 className="font-black text-lg">{mod.title}</h3>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{mod.content.length} Lessons</div>
                          </div>
                        </div>
                        {canEdit && (
                          <Button variant="ghost" size="sm" className="rounded-full px-4 text-xs font-bold" onClick={() => handleAddContent(mod._id)}>
                            <Plus className="h-3 w-3 mr-2" /> Content
                          </Button>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        {mod.content.map((item, i) => (
                          <button key={i} onClick={() => setActiveContent(item)} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-xl bg-muted"><FileText className="h-4 w-4" /></div>
                              <span className="text-sm font-bold">{item.title}</span>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-muted hover:text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black">Tasks & Assignments</h2>
                     {canEdit && (
                       <Button size="sm" className="rounded-full px-6" onClick={() => setIsAddingTask(true)}>
                         <Plus className="h-4 w-4 mr-2" /> New Assignment
                       </Button>
                     )}
                   </div>

                   {isAddingTask && (
                     <div className="p-6 rounded-3xl border bg-card shadow-elegant mb-6">
                        <h3 className="text-xl font-bold mb-4">Create Assignment</h3>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                          <Input placeholder="Assignment Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                          <textarea className="w-full rounded-2xl border bg-background p-4 text-sm" placeholder="Description/Instructions" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                            <Input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} required />
                            <Button type="submit" className="w-full rounded-full">Post Assignment</Button>
                          </div>
                        </form>
                     </div>
                   )}

                   <div className="grid gap-4">
                      {tasks.map(task => (
                        <div key={task._id} className="p-6 rounded-3xl border bg-card hover:shadow-md transition-all flex flex-wrap items-center justify-between gap-6">
                           <div className="flex gap-4">
                              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><ClipboardList className="h-6 w-6" /></div>
                              <div>
                                 <h3 className="font-bold text-lg">{task.title}</h3>
                                 <p className="text-sm text-muted-foreground mt-1 italic">{task.description}</p>
                                 <div className="flex items-center gap-4 mt-3">
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Due: {new Date(task.deadline).toLocaleDateString()}</div>
                                 </div>
                              </div>
                           </div>
                           {!canEdit && (
                             <Button className="rounded-full px-8 text-xs font-bold shadow-elegant" onClick={() => handleTaskSubmission(task._id)}>Upload Submission</Button>
                           )}
                        </div>
                      ))}
                      {tasks.length === 0 && <div className="p-12 text-center text-muted-foreground italic bg-muted/20 rounded-3xl border border-dashed">No assignments posted yet.</div>}
                   </div>
                </div>
              )}

              {activeTab === 'students' && canEdit && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black">Enrolled Students</h2>
                  </div>
                  <div className="p-6 rounded-3xl border bg-card shadow-sm">
                    <form onSubmit={handleEnrollStudent} className="flex gap-4">
                      <Input placeholder="Enter Student Roll Number" value={enrollRollNumber} onChange={e => setEnrollRollNumber(e.target.value)} required />
                      <Button type="submit" className="rounded-full px-8"><Plus className="h-4 w-4 mr-2" /> Enroll Student</Button>
                    </form>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Array.isArray(course.students) && course.students.map((student: any) => (
                      <div key={student._id} className="p-4 rounded-2xl border bg-card flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{student.name?.charAt(0)}</div>
                        <div>
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.rollNumber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'forum' && (
                 <div className="p-12 text-center bg-card rounded-3xl border-2 border-dashed">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold">Discussion Space</h3>
                    <Button variant="outline" className="rounded-full px-10 mt-6">Start a Thread</Button>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default LMSCourseView;
