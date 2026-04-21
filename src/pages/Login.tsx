import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building, ShieldCheck, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Role } from "@/types";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password, role);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error || "Login failed");
      return;
    }
    toast.success("Welcome back!");
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  const roles: { id: Role; label: string; icon: typeof BookOpen }[] = [
    { id: "student", label: "Student", icon: BookOpen },
    { id: "faculty", label: "Faculty", icon: Users },
    { id: "admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/80" />
      <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-slate-950/50 text-white p-12 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg">KMCT IETM CAMPUS</div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/70">Facility Management</div>
          </div>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Streamline your college facility bookings.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Reserve labs, the seminar hall, or schedule a Principal appointment — all from a single, modern dashboard.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4 max-w-md">
            {["Lab 1", "Lab 2", "Lab 3", "Seminar Hall", "Principal"].map((f) => (
              <div key={f} className="rounded-md bg-white/10 backdrop-blur px-3 py-2 text-xs font-medium text-center text-white/90">
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/60">© KMCT IETM CAMPUS</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <span className="font-bold">KMCT IETM CAMPUS</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="text-muted-foreground mt-1.5">Access your facility booking dashboard</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary/5 text-primary shadow-card"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {r.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{role === "admin" ? "Username" : "Email"}</Label>
              <Input
                id="email"
                type={role === "admin" ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "admin" ? "admin" : "you@college.edu"}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={submitting}>
              Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          </form>

          {role !== "admin" && (
            <p className="text-sm text-center text-muted-foreground">
              No account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Create one
              </Link>
            </p>
          )}
          {role === "admin" && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Demo admin: <span className="font-mono font-semibold">admin / admin123</span>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
