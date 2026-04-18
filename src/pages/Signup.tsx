import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Role } from "@/types";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Exclude<Role, "admin">>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = signup(name, email, password, role);
    if (!res.ok) {
      toast.error(res.error || "Signup failed");
      return;
    }
    toast.success("Account created!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary p-6">
      <div className="w-full max-w-md bg-card rounded-xl shadow-elegant border p-8 space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">Campus FMS</div>
            <div className="text-xs text-muted-foreground">Create your account</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["student", "faculty"] as const).map((r) => {
            const Icon = r === "student" ? BookOpen : Users;
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition-all ${
                  active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary shadow-elegant">
            Create account
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
