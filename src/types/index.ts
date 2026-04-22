export type Role = "student" | "faculty" | "admin" | "principal" | "guest";

export const COLLEGES = [
  "KMCT Institute of Emerging Technology and Management",
  "KMCT College of Allied Health Sciences",
  "KMCT School of Design"
] as const;

export type College = typeof COLLEGES[number];

export interface User {
  id: string;
  name: string;
  rollNumber: string;
  college: College;
  department?: string;
  course?: string;
  role: Role;
}

export type Facility = string;

export interface IFacility {
  _id: string;
  name: string;
  allowedRoles: Role[];
  assets: any[];
}

export type BookingStatus = "pending" | "approved" | "rejected";

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  userCollege: College;
  facility: Facility;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  reason?: string; // for principal appointment
  status: BookingStatus;
  approvedRoom?: string;
  approvedTime?: string;
  declineReason?: string;
  createdAt: number;
}
