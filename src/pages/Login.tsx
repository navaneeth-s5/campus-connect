import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, requestReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return toast.error("Please enter your username");
    const { ok, error, user } = await login(username, password);
    
    if (ok && user) {
      toast.success("Welcome back!");
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "principal") navigate("/principal");
      else navigate("/dashboard");
    } else {
      toast.error(error || "Login failed");
    }
  };

  const handleReset = async () => {
    if (!username) {
       return toast.error("Enter your username to request password reset.");
    }
    const { ok, error } = await requestReset(username);
    if (ok) toast.success("Password reset requested. Contact your admin for new password.");
    else toast.error(error);
  };

  return (
    <div className="flex min-h-[100dvh] bg-cover bg-center bg-fixed relative w-full" style={{ backgroundImage: `url('/kmct-campus-bg.jpg')` }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px] pointer-events-none" />
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 w-full">
        <div className="mx-auto w-full max-w-md bg-white/95 dark:bg-slate-950/95 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 my-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="KMCT Logo" className="h-16 mb-4 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to KMCT Campus Thoongampuram</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username / Roll Number</Label>
                <Input id="username" required placeholder="Enter username or roll number" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" onClick={handleReset} className="text-xs font-semibold text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full mt-4">Sign in</Button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm">
            <Link to="/signup" className="font-medium text-primary hover:underline">
               Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
