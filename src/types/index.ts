export type Role = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface StoredUser extends User {
  password: string;
}

export type Facility = "Lab 1" | "Lab 2" | "Lab 3" | "Seminar Hall" | "Principal Appointment";

export const FACILITIES: Facility[] = ["Lab 1", "Lab 2", "Lab 3", "Seminar Hall", "Principal Appointment"];

export type BookingStatus = "pending" | "approved" | "rejected";

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  facility: Facility;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  reason?: string; // for principal appointment
  status: BookingStatus;
  createdAt: number;
}
