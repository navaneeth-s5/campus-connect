import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BookOpen, Plus, Users, Layout, ChevronRight, Award, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LMSCourse } from "@/types";
import { toast } from "sonner";

const LMSPortal = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/lms/courses');
      const fetchedCourses = Array.isArray(res.data) ? res.data : [];
      setCourses(fetchedCourses);
      
      if (user?.role === 'student' && fetchedCourses.length > 0) {
        // Fetch analytics for the first course or overall
        // We will just fetch for the first course for now to get some real data
        const analyticsRes = await axios.get(`/api/lms/analytics/${fetchedCourses[0]._id}`);
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      toast.error("Failed to load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const totalStudents = courses.reduce((acc, course) => acc + (course.students?.length || 0), 0);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {isFaculty ? "Instructor Dashboard" : "Student Learning Portal"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFaculty 
                ? "Manage your curriculum, assignments, and student performance." 
                : "Your personalized learning environment and course materials."}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button asChild className="shadow-elegant bg-primary hover:bg-primary/90">
              <Link to="/lms/admin"><Plus className="h-4 w-4 mr-2" /> Global Administration</Link>
            </Button>
          )}
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary"><BookOpen className="h-6 w-6" /></div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{isFaculty ? "Active Courses" : "My Enrollment"}</div>
                <div className="text-2xl font-bold">{courses?.length || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Users className="h-6 w-6" /></div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{isFaculty ? "Total Students" : "Course Rank"}</div>
                <div className="text-2xl font-bold">{isFaculty ? totalStudents : "Top 10%"}</div>
              </div>
            </div>
          </div>

          {!isFaculty && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500"><AlertCircle className="h-6 w-6" /></div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Due Soon</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </div>
          )}

          {!isFaculty && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-500"><Award className="h-6 w-6" /></div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Performance / Attendance</div>
                  <div className="text-2xl font-bold">{analytics ? `${analytics.attendancePercentage || 0}%` : "N/A"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{isFaculty ? "Teaching Schedule" : "Learning Journey"}</h2>
          </div>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-muted" />)}
            </div>
          ) : (courses?.length || 0) === 0 ? (
            <div className="rounded-3xl border-2 border-dashed p-16 text-center bg-muted/20">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Nothing here yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {isFaculty 
                  ? "You haven't been assigned to any courses. Contact the Admin to get started." 
                  : "You are not enrolled in any programs. Check with your department office."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Link
                  key={course._id}
                  to={`/lms/course/${course._id}`}
                  className="group relative flex flex-col rounded-3xl border bg-card hover:shadow-elegant transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 flex flex-col justify-end border-b">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 mb-1">{course.code}</div>
                    <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 leading-relaxed italic opacity-80">
                        {course.description || "Comprehensive curriculum exploring core principles and advanced applications."}
                      </p>
                      
                      {!isFaculty && (
                        <div className="space-y-2 mb-6">
                           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                             <span>Progress</span>
                             <span>35%</span>
                           </div>
                           <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                             <div className="h-full bg-primary w-[35%] rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary shadow-inner">
                          {course.faculty?.name?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instructor</div>
                          <div className="text-xs font-bold">{course.faculty?.name || 'Faculty Assigned'}</div>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default LMSPortal;
