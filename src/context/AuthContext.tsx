import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Role, User } from "@/types";
import axios from "axios";

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
  login: (email: string, password: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
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
        setUser({ id: res.data._id || res.data.id, name: res.data.name, email: res.data.email, role: res.data.role });
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login: AuthContextValue["login"] = async (email, password, role) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password, role });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || "Login failed" };
    }
  };

  const signup: AuthContextValue["signup"] = async (name, email, password, role) => {
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || "Signup failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
