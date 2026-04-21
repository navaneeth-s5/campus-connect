import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
                  <ProtectedRoute roles={["student", "faculty"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute roles={["student", "faculty"]}>
                    <BookFacility />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute roles={["student", "faculty"]}>
                    <MyBookings />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BookingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
