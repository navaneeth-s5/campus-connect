import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, BookOpen, Layers, User, Trash2, Edit } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LMSCourse, User as UserType } from "@/types";
import { PaginatedSection } from "@/components/PaginatedSection";

const LMSAdmin = () => {
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [faculties, setFaculties] = useState<UserType[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LMSCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<LMSCourse | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    code: "",
    description: "",
    department: "",
    facultyId: ""
  });

  useEffect(() => {
    fetchCourses();
    fetchFaculties();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/lms/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      toast.error("Failed to load courses"); 
      setCourses([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await axios.get('/api/auth/faculty');
      setFaculties(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      toast.error("Failed to load faculty"); 
      setFaculties([]);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = {
      ...newCourse,
      facultyId: newCourse.facultyId || null
    };
    try {
      if (editingCourse) {
        await axios.put(`/api/lms/courses/${editingCourse._id || editingCourse.id}`, courseData);
        toast.success("Course updated successfully");
      } else {
        await axios.post('/api/lms/courses', courseData);
        toast.success("Course created successfully");
      }
      setIsAddingCourse(false);
      setEditingCourse(null);
      setNewCourse({ title: "", code: "", description: "", department: "", facultyId: "" });
      fetchCourses();
    } catch (err) { toast.error("Failed to save course"); }
  };

  const handleEdit = (course: LMSCourse) => {
    setEditingCourse(course);
    setNewCourse({
      title: course.title,
      code: course.code,
      description: course.description || "",
      department: course.department,
      facultyId: typeof course.faculty === 'string' ? course.faculty : (course.faculty as any)?._id || (course.faculty as any)?.id || ""
    });
    setIsAddingCourse(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    const id = courseToDelete._id || courseToDelete.id;
    try {
      await axios.delete(`/api/lms/courses/${id}`);
      toast.success("Course deleted successfully");
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) { 
      toast.error("Failed to delete course"); 
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">LMS Administration</h1>
            <p className="text-muted-foreground mt-1">Manage global courses and faculty assignments.</p>
          </div>
          <Button onClick={() => {
            setIsAddingCourse(!isAddingCourse);
            setEditingCourse(null);
            if (!isAddingCourse) setNewCourse({ title: "", code: "", description: "", department: "", facultyId: "" });
          }}>
            {isAddingCourse ? "Cancel" : <><Plus className="h-4 w-4 mr-2" /> Add New Course</>}
          </Button>
        </div>

        {isAddingCourse && (
          <div className="rounded-2xl border bg-card p-6 shadow-elegant animate-in slide-in-from-top duration-300">
            <h2 className="text-xl font-bold mb-6">{editingCourse ? "Edit Course" : "Create New Course"}</h2>
            <form onSubmit={handleCreateCourse} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Title</label>
                <Input 
                  placeholder="e.g. Advanced Data Structures" 
                  value={newCourse.title} 
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Code</label>
                <Input 
                  placeholder="e.g. CS301" 
                  value={newCourse.code} 
                  onChange={e => setNewCourse({...newCourse, code: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input 
                  placeholder="e.g. Computer Science" 
                  value={newCourse.department} 
                  onChange={e => setNewCourse({...newCourse, department: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Faculty</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newCourse.facultyId}
                  onChange={e => setNewCourse({...newCourse, facultyId: e.target.value})}
                >
                  <option value="">Select Faculty</option>
                  {Array.isArray(faculties) && faculties.map(f => (
                    <option key={f.id || f._id} value={f.id || f._id}>{f.name} ({f.department})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Course description..."
                  value={newCourse.description}
                  onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                />
              </div>
              <Button type="submit" className="md:col-span-2 shadow-elegant">
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </form>
          </div>
        )}

        <PaginatedSection
          items={courses}
          searchPlaceholder="Search courses by title, code, department, faculty..."
          renderItem={(paginatedCourses) => (
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm border-b-0 rounded-b-none">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 font-bold border-b">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Faculty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedCourses.map(course => (
                    <tr key={course._id || course.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.code}</div>
                      </td>
                      <td className="p-4">{course.department}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {course.faculty?.name?.charAt(0) || 'F'}
                          </div>
                          <span>{course.faculty?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(course)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setCourseToDelete(course)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        />
      </div>

      {/* Custom Deletion Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-2xl border animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
              <Trash2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black mb-2">Confirm Deletion</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">"{courseToDelete.title}"</span>? 
              This action will permanently remove all modules, lectures, and resources associated with this course.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 rounded-full py-6 font-bold" onClick={() => setCourseToDelete(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 rounded-full py-6 font-bold shadow-lg shadow-destructive/20" onClick={confirmDelete}>Delete Forever</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default LMSAdmin;
