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
  Briefcase,
  FileText,
  LifeBuoy,
  CalendarDays,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import { toast } from "sonner";

const navByRole = {
  student: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/lms", label: "Campus LMS", icon: BookOpen },
    { to: "/book", label: "Book Facility", icon: CalendarPlus },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/my-bookings", label: "My Bookings", icon: ListChecks },
    { to: "/submissions", label: "Submissions", icon: FileText },
    { to: "/support", label: "IT Helpdesk", icon: LifeBuoy },
  ],
  faculty: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/lms", label: "Campus LMS", icon: BookOpen },
    { to: "/book", label: "Book Facility", icon: CalendarPlus },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/my-bookings", label: "My Bookings", icon: ListChecks },
    { to: "/submissions", label: "Submissions", icon: FileText },
    { to: "/faculty-assets", label: "Manage Assets", icon: Building },
    { to: "/support", label: "IT Helpdesk", icon: LifeBuoy },
  ],
  admin: [
    { to: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { to: "/lms", label: "Campus LMS", icon: BookOpen },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/admin/usage", label: "Usage Stats", icon: BarChart3 },
    { to: "/support", label: "IT Helpdesk", icon: LifeBuoy },
  ],
  principal: [
    { to: "/principal", label: "Executive Dashboard", icon: Briefcase },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/support", label: "IT Helpdesk", icon: LifeBuoy },
  ],
  guest: [
    { to: "/dashboard", label: "Visitor Home", icon: LayoutDashboard },
    { to: "/book", label: "Register Enquiry", icon: CalendarPlus },
  ],
} as const;

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasNotification, setHasNotification] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const socket = io();
    const handleNotification = (msg: string) => {
      setHasNotification(true);
      toast.info(msg);
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    };
    socket.on("booking_update", () =>
      handleNotification("A booking status was updated.")
    );
    socket.on("new_appointment", () =>
      handleNotification("New principal appointment request received.")
    );
    return () => {
      socket.disconnect();
    };
  }, []);

  if (!user) return null;
  const items = navByRole[user.role];
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  // Bottom tab items (first 4 for mobile quick access)
  const bottomTabItems = items.slice(0, 4);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      style={{
        backgroundImage: "url('/kmct-campus-bg.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="flex min-h-screen w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">

        {/* ── Desktop Sidebar ─────────────────────────────────── */}
        <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-elegant shrink-0">
          <div className="px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center justify-center px-2">
              <img
                src="/logo.png"
                alt="KMCT Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
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
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-sidebar-border space-y-3 shrink-0">
            <NavLink 
              to="/profile" 
              className="block group hover:bg-sidebar-accent/50 p-3 rounded-xl transition-all border border-transparent hover:border-sidebar-border"
            >
              <div className="text-sm font-bold truncate group-hover:text-sidebar-primary-foreground transition-colors">{user.name}</div>
              <div className="text-[10px] opacity-75 uppercase tracking-wider font-bold">
                {roleLabel} • {user.college}
              </div>
            </NavLink>
            <Button
              variant="secondary"
              size="sm"
              className="w-full shadow-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </aside>

        {/* ── Mobile Slide-Out Drawer ──────────────────────────── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer panel */}
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
                <img
                  src="/logo.png"
                  alt="KMCT Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-sidebar-accent/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info */}
              <div className="px-5 py-4 border-b border-sidebar-border">
                <NavLink 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 -m-2 rounded-xl active:bg-sidebar-accent transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user.name}</div>
                    <div className="text-xs opacity-70">
                      {roleLabel} • {user.rollNumber}
                    </div>
                  </div>
                </NavLink>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "hover:bg-sidebar-accent/70"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              <div className="px-4 py-4 border-t border-sidebar-border">
                <Button
                  variant="secondary"
                  className="w-full rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main content area ────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="flex w-full items-center justify-between border-b bg-card/95 backdrop-blur-sm px-4 py-3 sticky top-0 z-40">
            {/* Mobile: Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile: Logo */}
            <div className="md:hidden">
              <img
                src="/logo.png"
                alt="KMCT Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            {/* Desktop: spacer to push bell to right */}
            <div className="hidden md:block flex-1" />

            {/* Notification bell (both) */}
            <button
              onClick={() => setHasNotification(false)}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasNotification && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
          </header>

          {/* Page content — extra bottom padding on mobile for bottom nav */}
          <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t flex items-stretch">
            {bottomTabItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold transition-colors",
                    isActive
                      ? "text-primary border-t-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[60px] text-center leading-tight">
                  {label}
                </span>
              </NavLink>
            ))}
            {/* "More" button to open full menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
