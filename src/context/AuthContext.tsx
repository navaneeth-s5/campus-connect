import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Role, StoredUser, User } from "@/types";
import { storage } from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => { ok: boolean; error?: string };
  signup: (name: string, email: string, password: string, role: Role) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_USER: User = {
  id: "admin",
  name: "Administrator",
  email: "admin",
  role: "admin",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(storage.getSession());
    setLoading(false);
  }, []);

  const login: AuthContextValue["login"] = (email, password, role) => {
    const trimmed = email.trim();
    if (role === "admin" || trimmed === "admin") {
      if (trimmed === "admin" && password === "admin123") {
        setUser(ADMIN_USER);
        storage.setSession(ADMIN_USER);
        return { ok: true };
      }
      return { ok: false, error: "Invalid admin credentials" };
    }
    const users = storage.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === trimmed.toLowerCase() && u.password === password && u.role === role
    );
    if (!found) return { ok: false, error: "Invalid email, password, or role" };
    const session: User = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(session);
    storage.setSession(session);
    return { ok: true };
  };

  const signup: AuthContextValue["signup"] = (name, email, password, role) => {
    if (role === "admin") return { ok: false, error: "Cannot register as admin" };
    const trimmed = email.trim();
    if (!name.trim() || !trimmed || !password) return { ok: false, error: "All fields required" };
    if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters" };
    const users = storage.getUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmed.toLowerCase()))
      return { ok: false, error: "Email already registered" };
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: trimmed,
      password,
      role,
    };
    storage.saveUsers([...users, newUser]);
    const session: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    setUser(session);
    storage.setSession(session);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    storage.setSession(null);
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
