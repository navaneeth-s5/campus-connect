import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import BookFacility from "./pages/BookFacility.tsx";
import MyBookings from "./pages/MyBookings.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import AdminUsage from "./pages/AdminUsage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrincipalPanel from "./pages/PrincipalPanel.tsx";
import Submissions from "./pages/Submissions.tsx";
import ITSupport from "./pages/ITSupport.tsx";
import FacultyAssets from "./pages/FacultyAssets.tsx";
import CampusCalendar from "./pages/CampusCalendar.tsx";
import LMSPortal from "./pages/LMSPortal.tsx";
import LMSCourseView from "./pages/LMSCourseView.tsx";
import LMSAdmin from "./pages/LMSAdmin.tsx";
import KioskBrowser from "./pages/KioskBrowser.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BookingProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["student", "faculty", "guest"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute roles={["student", "faculty", "guest"]}>
                    <BookFacility />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute roles={["student", "faculty", "guest"]}>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute roles={["student", "faculty"]}>
                    <Submissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty-assets"
                element={
                  <ProtectedRoute roles={["faculty"]}>
                    <FacultyAssets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute roles={["student", "faculty", "admin", "principal"]}>
                    <ITSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usage"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/principal"
                element={
                  <ProtectedRoute roles={["principal"]}>
                    <PrincipalPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute roles={["student", "faculty", "admin", "principal", "guest"]}>
                    <CampusCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lms"
                element={
                  <ProtectedRoute roles={["student", "faculty", "admin"]}>
                    <LMSPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lms/course/:id"
                element={
                  <ProtectedRoute roles={["student", "faculty", "admin"]}>
                    <LMSCourseView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lms/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <LMSAdmin />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/kiosk-view"
                element={<KioskBrowser />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BookingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
