export type Role = "student" | "faculty" | "admin" | "principal" | "guest";

export const COLLEGES = [
  "KMCT Institute of Emerging Technology and Management",
  "KMCT College of Allied Health Sciences",
  "KMCT School of Design"
] as const;

export type College = typeof COLLEGES[number];

export interface User {
  id: string;
  _id?: string;
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
  managers?: Partial<User>[];
  hasAssetManagement?: boolean;
}

export type BookingStatus = "pending" | "approved" | "rejected";

export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface TicketResponse {
  _id: string;
  message: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Partial<User>;
  responses: TicketResponse[];
  resolution?: string;
  escalated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  userCollege: College;
  guestPhone?: string;
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
