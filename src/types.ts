export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Scientist {
  id: string;
  name: string;
  dob: string;
  doj: string;
  designation: string;
  govtEmail: string;
  personalEmail: string;
  phone: string;
  employeeCode: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  address: string;
  departmentLocation: string;
  roomNumber: string;
  category: string; // SC, ST, OBC, PWD, EWS, UR
  status: 'Active' | 'Left';
  lastWorkingDate?: string;
  noDuesCleared?: boolean;
}

export interface UtilizationCertificate {
  id: string;
  period: string; // MM-YYYY to MM-YYYY
  fileName: string;
  fileData: string; // Base64
}

export interface Project {
  id: string;
  name: string;
  shortName: string;
  type: 'Intramural' | 'Extramural' | 'ICMR' | 'Other' | 'NHRP';
  status: 'Yet to Start' | 'Ongoing' | 'Completed';
  startDate: string;
  endDate: string;
  budget: number;
  piId: string; // Scientist ID
  provisionalUCs: { id: string; period: string; fileName: string; fileData: string }[];
  finalUC?: { period: string; fileName: string; fileData: string } | null;
  finalReport?: { title: string; fileName: string; fileData: string } | null;
  // Enriched
  durationDays?: number;
  pendingDays?: number;
  staffCount?: number;
}

export interface ExperienceEntry {
  id: string;
  instituteName: string;
  designation: string;
  fromDate: string;
  toDate: string;
}

export interface ProjectStaff {
  id: string;
  projectId: string;
  scientistId: string; // Principal Investigator reference
  name: string;
  dob: string;
  doj: string;
  designation: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  address: string;
  aadhaarNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  departmentLocation: string;
  roomNumber: string;
  educationalQualification: string;
  contractPeriod: number; // in months
  category: string;
  status: 'Active' | 'Left';
  lastWorkingDate?: string;
  leavingReason?: string;
  noDuesCleared?: boolean;
  employeeCode: string; // TEMP-1000, etc.
  previousIcmrExperience: ExperienceEntry[];
  previousNonIcmrExperience: ExperienceEntry[];
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  spouseName?: string;
  spousePhone?: string;
  // Enriched
  icmrExpMonths?: number;
  nonIcmrExpMonths?: number;
  totalExpMonths?: number;
}

export interface PermanentStaff {
  id: string;
  name: string;
  dob: string;
  doj: string;
  designation: string;
  govtEmail: string;
  personalEmail: string;
  phone: string;
  employeeCode: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  address: string;
  aadhaarNumber: string;
  panNumber: string;
  departmentLocation: string;
  roomNumber: string;
  category: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  status: 'Active' | 'Left';
  lastWorkingDate?: string;
  leavingReason?: string;
  noDuesCleared?: boolean;
}

export interface YPConsultant {
  id: string;
  name: string;
  dob: string;
  doj: string;
  fullDesignation: string;
  designationType: 'Young Professional' | 'Consultant';
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  employeeCode: string; // YP-1000+, CONS-1000+
  aadhaarNumber: string;
  panNumber: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  departmentLocation: string;
  roomNumber: string;
  address: string;
  emergencyContact: string;
  category: string;
  status: 'Active' | 'Left';
  lastWorkingDate?: string;
  leavingReason?: string;
  noDuesCleared?: boolean;
}

export interface Circular {
  id: string;
  title: string;
  uploadDate: string;
  fileName: string;
  fileData: string; // Base64
}

export interface FormDocument {
  id: string;
  title: string;
  uploadDate: string;
  fileName: string;
  fileData: string; // Base64
}

export interface Announcement {
  id: string;
  title: string;
  fileName?: string;
  fileData?: string; // Base64
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  time: string;
  date?: string;
  description?: string;
}

export interface BroadcastMessage {
  id: string;
  text?: string;
  fileName?: string;
  fileData?: string; // Base64
  fileType?: string; // pdf, image, word, other
  link?: string;
  timestamp: string;
  senderName: string;
}

export interface VisibilityConfig {
  modules: {
    scientists: boolean;
    projects: boolean;
    projectStaff: boolean;
    permanentStaff: boolean;
    ypConsultants: boolean;
    circulars: boolean;
    forms: boolean;
    announcements: boolean;
    events: boolean;
    birthdays: boolean;
    workAnniversaries: boolean;
    broadcast: boolean;
  };
  fields: {
    phone: boolean;
    email: boolean;
    aadhaar: boolean;
    pan: boolean;
    bankDetails: boolean;
    dob: boolean;
    address: boolean;
  };
}

export interface Complaint {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  locationRoom: string;
  department: string;
  complaintDescriptionFull: string;
  typeOfComplaint: 'IT' | 'Maintenance';
  photoDocument?: string; // Base64 or saved path
  photoName?: string;
  assignedStaff?: string;
  status: 'Draft' | 'Staff Assigned' | 'Resolved' | 'Closed' | 'Pending' | 'Custom Status' | 'Dependency' | 'Staff Action Needed';
  customStatusText?: string;
  superUserRemark?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintSuperUser {
  id: string;
  name: string;
  email: string;
  department: 'IT' | 'Maintenance';
}

export interface SalarySlip {
  id: string;
  name: string;
  employeeCode: string;
  mobile: string;
  aadhaarNumber: string;
  month: string;
  year: string;
  uploadedAt: string;
  details: Record<string, string>;
}
