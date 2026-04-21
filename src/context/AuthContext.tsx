import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { College, Role, User } from "@/types";
import axios from "axios";
import { toast } from "sonner";

// Interceptor to add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string, user?: User }>;
  signup: (name: string, college: College, rollNumber: string, department: string, course: string, password: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
  requestReset: (username: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser({ id: res.data._id || res.data.id, name: res.data.name, rollNumber: res.data.rollNumber, college: res.data.college, role: res.data.role, department: res.data.department, course: res.data.course });
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login: AuthContextValue["login"] = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { ok: true, user: res.data.user };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || "Login failed" };
    }
  };

  const signup: AuthContextValue["signup"] = async (name, college, rollNumber, department, course, password, role) => {
    try {
      const res = await axios.post('/api/auth/signup', { name, college, rollNumber, department, course, password, role });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || "Signup failed" };
    }
  };

  const requestReset: AuthContextValue["requestReset"] = async (username) => {
    try {
      await axios.post('/api/auth/request-reset', { username });
      return { ok: true };
    } catch (err: any) {
       return { ok: false, error: err.response?.data?.error || "Failed to request reset" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, requestReset, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
