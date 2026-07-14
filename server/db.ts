import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Interface definitions
export interface Admin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  fileData: string; // Base64 string
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
  scientistId: string; // Principal Investigator
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
  fileType?: string; // pdf, image, etc.
  link?: string;
  timestamp: string;
  senderName: string;
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

export interface DatabaseSchema {
  admins: Admin[];
  scientists: Scientist[];
  projects: Project[];
  projectStaff: ProjectStaff[];
  permanentStaff: PermanentStaff[];
  ypConsultants: YPConsultant[];
  circulars: Circular[];
  forms: FormDocument[];
  announcements: Announcement[];
  events: Event[];
  broadcasts: BroadcastMessage[];
  visibility: VisibilityConfig;
  salaries: SalarySlip[];
  pendingProjectStaff: ProjectStaff[];
}

const DEFAULT_VISIBILITY: VisibilityConfig = {
  modules: {
    scientists: true,
    projects: true,
    projectStaff: true,
    permanentStaff: true,
    ypConsultants: true,
    circulars: true,
    forms: true,
    announcements: true,
    events: true,
    birthdays: true,
    workAnniversaries: true,
    broadcast: true,
  },
  fields: {
    phone: false,
    email: true,
    aadhaar: false,
    pan: false,
    bankDetails: false,
    dob: false,
    address: true,
  },
};

// Seed Data
// NOTE: The original default password for all default super admin accounts is: "admin"
// It corresponds to the bcrypt-compatible password hash value below.
const INITIAL_DATA: DatabaseSchema = {
  admins: [
    {
      id: 'admin-1',
      name: 'IT Cell (Manish Prajapati)',
      email: 'itcellnihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
    {
      id: 'admin-2',
      name: 'Adminisitrative Offcier (Paras Tyagi)',
      email: 'aonihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
    {
      id: 'admin-3',
      name: 'Director Desk (Pankaj Sharma)',
      email: 'directordesknihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
    {
      id: 'admin-4',
      name: 'Director (Prof. (Dr.) Pankaj Bhardwaj)',
      email: 'directornihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
    {
      id: 'admin-5',
      name: 'Section Offcier (Sunil Bishnoi)',
      email: 'sonihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
  ],
  scientists: [],
  projects: [],
  projectStaff: [],
  permanentStaff: [],
  ypConsultants: [],
  circulars: [],
  forms: [],
  announcements: [],
  events: [],
  broadcasts: [],
  visibility: DEFAULT_VISIBILITY,
  salaries: [],
  pendingProjectStaff: [],
};

export class Database {
  private static data: DatabaseSchema | null = null;

  private static ensureDirExists() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static load(): DatabaseSchema {
    if (this.data) {
      return this.data;
    }

    this.ensureDirExists();

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      return this.data!;
    }

    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      this.data = JSON.parse(content);
      // Double check any missing sections
      if (this.data) {
        if (!this.data.admins) {
          this.data.admins = INITIAL_DATA.admins;
        } else {
          // Merge missing seeded admins
          for (const seeded of INITIAL_DATA.admins) {
            if (!this.data.admins.some(a => a.email.toLowerCase() === seeded.email.toLowerCase())) {
              this.data.admins.push(seeded);
            }
          }
        }
        if (!this.data.scientists) this.data.scientists = INITIAL_DATA.scientists;
        if (!this.data.projects) this.data.projects = INITIAL_DATA.projects;
        if (!this.data.projectStaff) this.data.projectStaff = INITIAL_DATA.projectStaff;
        if (!this.data.permanentStaff) this.data.permanentStaff = INITIAL_DATA.permanentStaff;
        if (!this.data.ypConsultants) this.data.ypConsultants = INITIAL_DATA.ypConsultants;
        if (!this.data.circulars) this.data.circulars = INITIAL_DATA.circulars;
        if (!this.data.forms) this.data.forms = INITIAL_DATA.forms;
        if (!this.data.announcements) this.data.announcements = INITIAL_DATA.announcements;
        if (!this.data.events) this.data.events = INITIAL_DATA.events;
        if (!this.data.broadcasts) this.data.broadcasts = INITIAL_DATA.broadcasts;
        if (!this.data.visibility) this.data.visibility = INITIAL_DATA.visibility;
        if (!this.data.salaries) this.data.salaries = [];
        if (!this.data.pendingProjectStaff) this.data.pendingProjectStaff = [];
      }
      return this.data!;
    } catch (e) {
      console.error('Error loading DB file. Reverting to initial data.', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      return this.data!;
    }
  }

  public static save(): void {
    if (!this.data) return;
    this.ensureDirExists();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // Generic helpers
  public static get<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    const db = this.load();
    return db[collection];
  }

  public static set<K extends keyof DatabaseSchema>(collection: K, data: DatabaseSchema[K]): void {
    const db = this.load();
    db[collection] = data;
    this.save();
  }
}
