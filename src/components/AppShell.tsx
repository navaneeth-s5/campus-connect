import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building,
  LayoutDashboard,
  CalendarPlus,
  ListChecks,
  ShieldCheck,
  LogOut,
  BarChart3,
  Bell,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import { toast } from "sonner";

const navByRole = {
  student: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/book", label: "Book Facility", icon: CalendarPlus },
    { to: "/my-bookings", label: "My Bookings", icon: ListChecks },
  ],
  faculty: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/book", label: "Book Facility", icon: CalendarPlus },
    { to: "/my-bookings", label: "My Bookings", icon: ListChecks },
  ],
  admin: [
    { to: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { to: "/admin/usage", label: "Usage Stats", icon: BarChart3 },
  ],
  principal: [
    { to: "/principal", label: "Executive Dashboard", icon: Briefcase },
  ]
} as const;

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
     const socket = io();
     const handleNotification = (msg: string) => {
       setHasNotification(true);
       toast.info(msg);
       const audio = new Audio('/notification.mp3');
       audio.play().catch(() => {}); // ignore autoplay errors
     };
     socket.on('booking_update', () => handleNotification("A booking status was updated."));
     socket.on('new_appointment', () => handleNotification("New principal appointment request received."));
     return () => { socket.disconnect(); };
  }, []);

  if (!user) return null;
  const items = navByRole[user.role];
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <div className="flex min-h-screen w-full bg-background" style={{ backgroundImage: "url('/kmct-campus-bg.jpg')", backgroundSize: "cover", backgroundAttachment: "fixed" }}>
      <div className="flex min-h-screen w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-elegant">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center justify-center px-2">
            <img src="/logo.png" alt="KMCT Logo" className="h-12 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-card"
                    : "hover:bg-sidebar-accent/70"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div>
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs opacity-75">{roleLabel} • {user.college}</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex w-full items-center justify-between border-b bg-card px-4 py-3 sticky top-0 z-50">
          <div className="md:hidden flex items-center">
            <img src="/logo.png" alt="KMCT Logo" className="h-8 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
          <div className="hidden md:flex ml-auto items-center gap-4">
             <button onClick={() => setHasNotification(false)} className="relative p-2 rounded-full hover:bg-muted transition-colors">
               <Bell className="h-5 w-5 text-muted-foreground" />
               {hasNotification && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
             </button>
          </div>
          <div className="md:hidden flex items-center gap-4">
             <button onClick={() => setHasNotification(false)} className="relative p-2 rounded-full hover:bg-muted transition-colors">
               <Bell className="h-5 w-5 text-muted-foreground" />
               {hasNotification && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
             </button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
      </div>
    </div>
  );
};
