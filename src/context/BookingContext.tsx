import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/types";
import axios from "axios";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface BookingContextValue {
  bookings: Booking[];
  loadingBookings: boolean;
  createBooking: (b: Omit<Booking, "id" | "status" | "createdAt" | "approvedRoom" | "approvedTime" | "declineReason"> & { guestName?: string }) => Promise<{ ok: boolean; error?: string }>;
  setStatus: (id: string, status: BookingStatus, extra?: { approvedRoom?: string; approvedTime?: string; declineReason?: string; }) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const { user } = useAuth();

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

    const socket = io();
    socket.on('connect', () => {
       if (user?.role === 'principal') socket.emit('join_role', 'principal');
    });
    
    socket.on('booking_update', () => {
       fetchBookings();
    });
    
    socket.on('new_appointment', (data: any) => {
       if (user?.role === 'principal') {
          toast(`New Appointment Request from ${data.userName}`);
       }
    });

    return () => { socket.disconnect(); };
  }, [user]);

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

  const setStatus: BookingContextValue["setStatus"] = async (id, status, extra) => {
    try {
      const res = await axios.patch(`/api/bookings/${id}/status`, { status, ...extra });
      setBookings(current => current.map(b => b.id === id ? res.data : b));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
      throw err;
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
