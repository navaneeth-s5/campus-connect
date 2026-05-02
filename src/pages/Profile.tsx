import { useState } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Save, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', 
        { name, password: password || undefined },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (res.data.success) {
        toast.success("Profile updated successfully");
        // Update local auth state if needed, or just refresh
        // Since useAuth might need a token refresh if name is in token, 
        // but here we just update the UI if possible.
        // Actually, let's just trigger a re-sync or tell them to re-login if name changed in JWT
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <User className="h-8 w-8 text-primary" /> User Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and security preferences.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border bg-card shadow-elegant p-8 space-y-6">
            <div className="flex items-center gap-4 border-b pb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-xl font-bold">{user.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <ShieldCheck className="h-3 w-3" /> {user.role.toUpperCase()} • {user.rollNumber}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                     id="name" 
                     value={name} 
                     onChange={e => setName(e.target.value)} 
                     className="pl-10" 
                     required 
                   />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Change Password
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Leave blank to keep current" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Confirm your new password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
                <Save className="h-5 w-5 mr-2" /> {loading ? "Updating..." : "Save Profile Changes"}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
               <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Security Tip</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Use a strong, unique password for your KMCT account. We recommend a mix of letters, numbers, and symbols to ensure your data remains protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
