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

export interface Agency {
  id: string;
  agencyName: string;
  agreementNo: string;
  dateOfAgreement: string;
  contractStartDate: string;
  contractEndDate: string;
  contractDuration: string;
  contractValue: number;
  approvedManpower: number;
  contactPerson: string;
  mobileNo: string;
  emailId: string;
  agencyAddress: string;
  performanceSecurityValidity: string;
  status: 'Active' | 'Inactive' | 'Terminated' | 'Expired';
}

export interface OutsourcedEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  agencyId: string;
  agencyName: string;
  departmentSectionLocation: string;
  reportingOfficer: string;
  previousIcmrExperience: ExperienceEntry[];
  previousNonIcmrExperience: ExperienceEntry[];
  doj: string;
  doc: string;
  epfNo: string;
  esicNo: string;
  aadhaarNo: string;
  panNo: string;
  mobileNo: string;
  emailId: string;
  status: 'Active' | 'Left';
}

export interface StoreSuperUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  agencies: Agency[];
  outsourcedEmployees: OutsourcedEmployee[];
  storeSuperUsers: StoreSuperUser[];
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
    {
      id: 'admin-6',
      name: 'Store Dept (Mukesh Panwar)',
      email: 'storenihr@gmail.com',
      passwordHash: '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62', // 'admin'
    },
  ],
  scientists: [
    {
      id: 'sci-1',
      name: 'Dr. Rajesh Verma',
      dob: '1978-05-12',
      doj: '2010-02-15',
      designation: 'Scientist G & Director',
      govtEmail: 'r.verma@nihr.res.in',
      personalEmail: 'rajesh.verma78@gmail.com',
      phone: '+91 98765 43210',
      employeeCode: 'SCI-0102',
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+91 98765 43211',
      address: 'Staff Quarters, NIHR Campus, New Delhi',
      departmentLocation: 'Admin Block, First Floor',
      roomNumber: '101',
      category: 'UR',
      status: 'Active',
    },
    {
      id: 'sci-2',
      name: 'Dr. Sunita Sharma',
      dob: '1984-11-23',
      doj: '2015-08-01',
      designation: 'Scientist E',
      govtEmail: 's.sharma@nihr.res.in',
      personalEmail: 'sunita.sharma.bio@gmail.com',
      phone: '+91 87654 32109',
      employeeCode: 'SCI-0158',
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+91 87654 32100',
      address: 'Pocket C, Vasant Kunj, New Delhi',
      departmentLocation: 'Virology Laboratory',
      roomNumber: '204',
      category: 'UR',
      status: 'Active',
    },
    {
      id: 'sci-3',
      name: 'Dr. Amit Kumar',
      dob: '1989-07-14',
      doj: '2019-03-20',
      designation: 'Scientist C',
      govtEmail: 'a.kumar@nihr.res.in',
      personalEmail: 'amit.biotech@gmail.com',
      phone: '+91 76543 21098',
      employeeCode: 'SCI-0210',
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+91 76543 21000',
      address: 'Sector 4, Dwarka, New Delhi',
      departmentLocation: 'Bioinformatics Lab',
      roomNumber: '312',
      category: 'OBC',
      status: 'Active',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Development of Multi-Valued Diagnostic Kits for Emerging Viral Infections',
      shortName: 'Multi1-Diag-Kits',
      type: 'ICMR',
      status: 'Ongoing',
      startDate: '2025-01-01',
      endDate: '2027-12-31',
      budget: 7500000,
      piId: 'sci-2',
      provisionalUCs: [],
      finalUC: null,
    },
    {
      id: 'proj-2',
      name: 'Intramural Study on Genomic Characterization of Respiratory Pathogens',
      shortName: 'Genomic-Resp-Study',
      type: 'Intramural',
      status: 'Ongoing',
      startDate: '2026-04-01',
      endDate: '2028-03-31',
      budget: 4500000,
      piId: 'sci-3',
      provisionalUCs: [],
      finalUC: null,
    },
  ],
  projectStaff: [
    {
      id: 'pstaff-1',
      projectId: 'proj-1',
      scientistId: 'sci-2',
      name: 'Rohit Deshmukh',
      dob: '1995-09-18',
      doj: '2025-02-01',
      designation: 'Senior Research Fellow (SRF)',
      email: 'rohit.srf@gmail.com',
      phone: '+91 99887 76655',
      gender: 'Male',
      bloodGroup: 'AB+',
      emergencyContact: '+91 99887 76600',
      address: 'Katwaria Sarai, New Delhi',
      aadhaarNumber: '1234 5678 9012',
      panNumber: 'ABCDE1234F',
      bankName: 'State Bank of India',
      accountNumber: '10002345678',
      ifscCode: 'SBIN0001234',
      departmentLocation: 'Virology Lab, Second Floor',
      roomNumber: '205',
      educationalQualification: 'M.Sc. Microbiology, NET Qualified',
      contractPeriod: 24,
      category: 'OBC',
      status: 'Active',
      employeeCode: 'TEMP-1000',
      previousIcmrExperience: [
        {
          id: 'exp-1',
          instituteName: 'ICMR-NIV, Pune',
          designation: 'Junior Research Fellow',
          fromDate: '2023-01-01',
          toDate: '2024-12-31',
        },
      ],
      previousNonIcmrExperience: [],
    },
  ],
  permanentStaff: [
    {
      id: 'perm-1',
      name: 'Sunita Meena',
      dob: '1982-04-05',
      doj: '2012-06-10',
      designation: 'Section Officer (Admin)',
      govtEmail: 's.meena@nihr.res.in',
      personalEmail: 'sunita.meena82@gmail.com',
      phone: '+91 95551 12233',
      employeeCode: 'PERM-054',
      gender: 'Female',
      bloodGroup: 'O+',
      emergencyContact: '+91 95551 12200',
      address: 'R.K. Puram, New Delhi',
      aadhaarNumber: '8888 7777 6666',
      panNumber: 'PMNOP9876Z',
      departmentLocation: 'Administration Wing',
      roomNumber: 'G-03',
      category: 'ST',
      accountNumber: '32001546879',
      ifscCode: 'SBIN0000691',
      bankName: 'State Bank of India',
      status: 'Active',
    },
  ],
  ypConsultants: [
    {
      id: 'ypc-1',
      name: 'Vikas Bansal',
      dob: '1998-03-24',
      doj: '2025-05-15',
      fullDesignation: 'Young Professional II (IT)',
      designationType: 'Young Professional',
      email: 'vikas.it@nihr.res.in',
      phone: '+91 90001 20002',
      gender: 'Male',
      bloodGroup: 'B-',
      employeeCode: 'YP-1000',
      aadhaarNumber: '4444 5555 6666',
      panNumber: 'YPBAN4321A',
      accountNumber: '501004561234',
      ifscCode: 'HDFC0000120',
      bankName: 'HDFC Bank',
      departmentLocation: 'IT Cell, Ground Floor',
      roomNumber: 'G-12',
      address: 'Munirka, New Delhi',
      emergencyContact: '+91 90001 20000',
      category: 'UR',
      status: 'Active',
    },
  ],
  circulars: [
    {
      id: 'circ-1',
      title: 'Implementation of Biometric Attendance and Working Hours Protocol',
      uploadDate: '2026-06-15',
      fileName: 'Biometric_Guidelines_2026.pdf',
      fileData: 'base64_placeholder',
    },
    {
      id: 'circ-2',
      title: 'Allocation of General Administration Funds for Intramural Projects',
      uploadDate: '2026-07-01',
      fileName: 'Fund_Allocation_Circular.docx',
      fileData: 'base64_placeholder',
    },
  ],
  forms: [
    {
      id: 'form-1',
      title: 'Annual Performance Appraisal Report (APAR) Form - Scientist Category',
      uploadDate: '2026-04-10',
      fileName: 'APAR_Scientist_Form.pdf',
      fileData: 'base64_placeholder',
    },
    {
      id: 'form-2',
      title: 'No Objection Certificate (NOC) and Clearance Template',
      uploadDate: '2026-05-02',
      fileName: 'NOC_Template.pdf',
      fileData: 'base64_placeholder',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'NIHR Annual Foundation Day and Scientific Symposium scheduled for August 15th, 2026.',
    },
    {
      id: 'ann-2',
      title: 'Important: All Project Investigators are requested to submit the Provisional Utilization Certificates by July 15th.',
    },
  ],
  events: [
    {
      id: 'ev-1',
      title: 'Monthly Review Meeting with Principal Investigators',
      venue: 'Main Conference Room, Admin Block',
      time: '11:00 AM - 01:00 PM',
      date: '2026-07-09',
      description: 'Progress review of ongoing ICMR and Extramural projects with Scientific Advisory Group.',
    },
    {
      id: 'ev-2',
      title: 'Workshop on Bioinformatics Analysis & PCR Assays',
      venue: 'Computational Lab, Third Floor',
      time: '02:00 PM - 05:00 PM',
      date: '2026-07-09',
      description: 'Hands-on laboratory training sessions for Young Professionals and Research Fellows.',
    },
  ],
  broadcasts: [
    {
      id: 'bc-1',
      senderName: 'Super Admin',
      text: 'Good morning colleagues! Please note that the main server maintenance is scheduled for today from 6 PM to 8 PM. Please save all your ongoing genomic data runs.',
      timestamp: '2026-07-08T09:30:00Z',
    },
    {
      id: 'bc-2',
      senderName: 'Super Admin',
      text: 'Happy to announce that Dr. Sunita Sharma has been awarded the prestigious ICMR Best Scientist Award for Virology research! Congratulations Dr. Sunita! 👏🌟',
      timestamp: '2026-07-08T11:45:00Z',
    },
  ],
  visibility: DEFAULT_VISIBILITY,
  salaries: [],
  pendingProjectStaff: [],
  agencies: [
    {
      id: 'agency-1',
      agencyName: 'Security & Manpower Solutions Pvt Ltd',
      agreementNo: 'SMS/ICMR/2026/04',
      dateOfAgreement: '2026-01-10',
      contractStartDate: '2026-01-15',
      contractEndDate: '2027-01-14',
      contractDuration: '12 Months',
      contractValue: 1500000,
      approvedManpower: 10,
      contactPerson: 'Mr. Rajesh Kumar',
      mobileNo: '9876543210',
      emailId: 'rajesh@smssolutions.com',
      agencyAddress: 'Sector 62, Noida, UP, India',
      performanceSecurityValidity: '2027-03-14',
      status: 'Active'
    },
    {
      id: 'agency-2',
      agencyName: 'Apex Outsourcing Services',
      agreementNo: 'AOS/ICMR/2025/11',
      dateOfAgreement: '2025-11-01',
      contractStartDate: '2025-11-05',
      contractEndDate: '2026-11-04',
      contractDuration: '12 Months',
      contractValue: 2400000,
      approvedManpower: 15,
      contactPerson: 'Ms. Priya Sharma',
      mobileNo: '9812345678',
      emailId: 'priya@apexoutsourcing.com',
      agencyAddress: 'Connaught Place, New Delhi, India',
      performanceSecurityValidity: '2027-01-04',
      status: 'Active'
    }
  ],
  outsourcedEmployees: [
    {
      id: 'oe-1',
      employeeId: 'OUT-1001',
      employeeName: 'Anil Yadav',
      designation: 'Multi Tasking Staff (MTS)',
      agencyId: 'agency-1',
      agencyName: 'Security & Manpower Solutions Pvt Ltd',
      departmentSectionLocation: 'Administration',
      reportingOfficer: 'Dr. Sunita Sharma',
      previousIcmrExperience: [],
      previousNonIcmrExperience: [],
      doj: '2026-02-01',
      doc: '2027-01-14',
      epfNo: 'EPF/100293/92',
      esicNo: 'ESIC/993041/44',
      aadhaarNo: '123456789012',
      panNo: 'ABCDE1234F',
      mobileNo: '9988776655',
      emailId: 'anil.yadav@example.com',
      status: 'Active'
    },
    {
      id: 'oe-2',
      employeeId: 'OUT-1002',
      employeeName: 'Geeta Devi',
      designation: 'Data Entry Operator (DEO)',
      agencyId: 'agency-2',
      agencyName: 'Apex Outsourcing Services',
      departmentSectionLocation: 'Finance & Accounts',
      reportingOfficer: 'Mr. Rajesh Varma',
      previousIcmrExperience: [
        {
          id: 'prev-1',
          instituteName: 'NIV Pune',
          designation: 'DEO',
          fromDate: '2024-01-01',
          toDate: '2024-12-31'
        }
      ],
      previousNonIcmrExperience: [],
      doj: '2025-11-05',
      doc: '2026-11-04',
      epfNo: 'EPF/998273/11',
      esicNo: 'ESIC/221394/09',
      aadhaarNo: '987654321098',
      panNo: 'XYZAB5678D',
      mobileNo: '9876543222',
      emailId: 'geeta.deo@example.com',
      status: 'Active'
    }
  ],
  storeSuperUsers: [
    {
      id: 'ssu-1',
      name: 'Store Dept (Mukesh Panwar)',
      email: 'storenihr@gmail.com',
      passwordHash: 'c7c2299886f3b060d40fae41846b412bf087b7a8dcb974fbf30cf611be247854'
    }
  ]
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
        if (!this.data.agencies) this.data.agencies = INITIAL_DATA.agencies;
        if (!this.data.outsourcedEmployees) this.data.outsourcedEmployees = INITIAL_DATA.outsourcedEmployees;
        if (!this.data.storeSuperUsers) this.data.storeSuperUsers = INITIAL_DATA.storeSuperUsers;
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
