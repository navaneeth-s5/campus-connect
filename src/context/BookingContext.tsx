import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/types";
import axios from "axios";
import { toast } from "sonner";

interface BookingContextValue {
  bookings: Booking[];
  loadingBookings: boolean;
  createBooking: (b: Omit<Booking, "id" | "status" | "createdAt">) => Promise<{ ok: boolean; error?: string }>;
  setStatus: (id: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await axios.get('/api/bookings');
      setBookings(res.data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error("Failed to load bookings");
      }
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const createBooking: BookingContextValue["createBooking"] = async (data) => {
    if (data.startTime >= data.endTime) return { ok: false, error: "End time must be after start time" };
    try {
      const res = await axios.post('/api/bookings', data);
      setBookings([res.data, ...bookings]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error || "Failed to create booking" };
    }
  };

  const setStatus: BookingContextValue["setStatus"] = async (id, status) => {
    try {
      const res = await axios.patch(`/api/bookings/${id}/status`, { status });
      setBookings(current => current.map(b => b.id === id ? res.data : b));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const deleteBooking: BookingContextValue["deleteBooking"] = async (id) => {
    try {
      await axios.delete(`/api/bookings/${id}`);
      setBookings(current => current.filter(b => b.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete booking");
    }
  };

  return (
    <BookingContext.Provider value={{ bookings, loadingBookings, createBooking, setStatus, deleteBooking, refreshBookings: fetchBookings }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used within BookingProvider");
  return ctx;
};
