import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/types";
import { hasConflict, storage } from "@/lib/storage";

interface BookingContextValue {
  bookings: Booking[];
  createBooking: (b: Omit<Booking, "id" | "status" | "createdAt">) => { ok: boolean; error?: string };
  setStatus: (id: string, status: BookingStatus) => void;
  deleteBooking: (id: string) => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(storage.getBookings());
  }, []);

  const persist = (next: Booking[]) => {
    setBookings(next);
    storage.saveBookings(next);
  };

  const createBooking: BookingContextValue["createBooking"] = (data) => {
    if (data.startTime >= data.endTime) return { ok: false, error: "End time must be after start time" };
    if (hasConflict(bookings, data.facility, data.date, data.startTime, data.endTime)) {
      return { ok: false, error: "This slot conflicts with an existing booking" };
    }
    const newBooking: Booking = {
      ...data,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: Date.now(),
    };
    persist([newBooking, ...bookings]);
    return { ok: true };
  };

  const setStatus = useCallback(
    (id: string, status: BookingStatus) => {
      const current = storage.getBookings();
      const next = current.map((b) => (b.id === id ? { ...b, status } : b));
      persist(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteBooking = (id: string) => {
    const next = bookings.filter((b) => b.id !== id);
    persist(next);
  };

  return (
    <BookingContext.Provider value={{ bookings, createBooking, setStatus, deleteBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used within BookingProvider");
  return ctx;
};
