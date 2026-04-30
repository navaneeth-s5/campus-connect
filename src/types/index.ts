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
  isHOD?: boolean;
  actingHODFor?: string | Partial<User>;
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

export type BookingStatus = "pending" | "approved" | "rejected" | "pending_hod" | "pending_principal" | "revoked";

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

export interface LMSCourse {
  _id: string;
  id?: string;
  title: string;
  code: string;
  description: string;
  department: string;
  faculty?: Partial<User>;
  students: (string | Partial<User>)[];
}

export interface LMSModule {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  isLocked: boolean;
  content: LMSContent[];
}

export interface LMSContent {
  _id?: string;
  type: 'video' | 'pdf' | 'note' | 'quiz';
  title: string;
  url?: string;
  body?: string;
  quizData?: {
    questions: any[];
    timeLimit: number;
  };
}

export interface LMSTask {
  _id: string;
  courseId: string;
  facultyId: string;
  title: string;
  description: string;
  deadline: string;
  materials: string[];
  totalPoints: number;
  createdAt: string;
}

export interface LMSSubmission {
  _id: string;
  taskId: string;
  studentId: Partial<User>;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

