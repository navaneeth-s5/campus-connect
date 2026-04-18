import { Booking, StoredUser, User } from "@/types";

const USERS_KEY = "cfms_users";
const SESSION_KEY = "cfms_session";
const BOOKINGS_KEY = "cfms_bookings";

export const storage = {
  getUsers(): StoredUser[] {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  saveUsers(users: StoredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession(user: User | null) {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  },
  getBookings(): Booking[] {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  saveBookings(bookings: Booking[]) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },
};

export const hasConflict = (
  bookings: Booking[],
  facility: string,
  date: string,
  start: string,
  end: string,
  ignoreId?: string
) => {
  return bookings.some((b) => {
    if (b.id === ignoreId) return false;
    if (b.status === "rejected") return false;
    if (b.facility !== facility || b.date !== date) return false;
    return start < b.endTime && end > b.startTime;
  });
};
