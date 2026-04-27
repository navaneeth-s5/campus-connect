import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Role, College, COLLEGES } from "@/types";
import axios from "axios";

const Signup = () => {
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [college, setCollege] = useState<College | "">("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [availableCourses, setAvailableCourses] = useState<{_id: string, title: string, department: string, code: string}[]>([]);
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('/api/lms/public/courses');
        if (Array.isArray(res.data)) {
          setAvailableCourses(res.data);
        } else {
          setAvailableCourses([]);
        }
      } catch (err) {
        console.error("Failed to fetch courses");
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college) return toast.error("Please select a college");
    const { ok, error } = await signup(name, college as College, rollNumber, department, course, password, role);
    if (ok) {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } else {
      toast.error(error || "Signup failed");
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-cover bg-center bg-fixed relative w-full" style={{ backgroundImage: `url('/kmct-campus-bg.jpg')` }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-none" />
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 w-full">
        <div className="mx-auto w-full max-w-md bg-white/95 dark:bg-slate-950/95 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 my-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="KMCT Logo" className="h-16 mb-4 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create account</h2>
            <p className="mt-2 text-sm text-muted-foreground">KMCT Campus Thoongampuram</p>
          </div>

          <div className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="college">College Selection <span className="text-destructive">*</span></Label>
                <Select value={college} onValueChange={(v) => setCollege(v as College)} required>
                  <SelectTrigger><SelectValue placeholder="Select your college" /></SelectTrigger>
                  <SelectContent>
                     {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="name" required placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="rollNumber">{role === 'student' ? 'Roll Number' : 'Username / Faculty ID'} <span className="text-destructive">*</span></Label>
                    <Input id="rollNumber" required placeholder={role === 'student' ? "Ex: CS2021" : "Ex: FAC001"} value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                 </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                    <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                    <Select value={department} onValueChange={(v) => { setDepartment(v); setCourse(""); }} required>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(availableCourses.map(c => c.department))).map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="course">Course <span className="text-destructive">*</span></Label>
                    <Select value={course} onValueChange={(v) => setCourse(v)} required disabled={!department}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {availableCourses.filter(c => c.department === department).map(c => (
                          <SelectItem key={c.title} value={c.title}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full mt-2">Sign up</Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:underline">
               Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
