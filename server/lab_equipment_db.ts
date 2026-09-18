import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LAB_EQUIPMENT_DB_FILE = path.join(process.cwd(), 'data', 'lab_equipment_db.json');

export interface EquipmentDocument {
  id: string;
  fileName: string;
  fileType: string; // 'Manual' | 'Calibration Certificate' | 'SOP' | 'Label' | 'Warranty Card' | 'Other'
  fileData?: string; // base64 data or url
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface EquipmentPhoto {
  id: string;
  url: string; // base64 or file path
  name: string;
  uploadedAt: string;
}

export interface EquipmentActiveBooking {
  id: string;
  bookedBy: string;
  applicantEmail?: string;
  applicantMobile?: string;
  fromDateTime: string;
  toDateTime: string;
  purposeRemark?: string;
  durationHours?: number;
}

export interface Equipment {
  id: string; // e.g. "EQ-2026-001"
  name: string;
  approvedAbbreviation?: string;
  location?: string;
  currentLocation?: string;
  make?: string; // Manufacturer
  model?: string;
  serialNo?: string;
  fundingAgencyType?: string;
  fundingAgencyDetails?: string;
  description?: string;
  departmentName?: string;
  facilityName?: string;
  basicCost?: number | string; // in INR
  warrantyEndDate?: string; // YYYY-MM-DD
  category: string;
  alertEmails: string[]; // multi-entry
  prismServiceCategory?: string;
  yearOfPurchase: string | number; // YYYY
  purposeApplication?: string;
  operationalStatus: 'Working' | 'Under Maintenance' | 'Out of Order' | 'Decommissioned' | 'Other' | string;
  amcEndDate?: string; // YYYY-MM-DD
  photos: EquipmentPhoto[]; // Max 4 photos
  documents: EquipmentDocument[]; // Checklist of docs
  activeBooking?: EquipmentActiveBooking | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabApplicant {
  id: string;
  name: string;
  mobile: string; // unique
  email: string;
  designation?: string;
  department?: string;
  secretCode?: string; // 8-digit numeric secret passcode visible and editable by Super Admin
  secretCodeHash: string; // hashed 8-digit numeric secret code
  secretCodeHint?: string; // e.g. "Last 4 digits: 5678" or created timestamp
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentBooking {
  id: string; // e.g. "BK-2026-1001"
  applicantId: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  equipmentIds: string[]; // multi-select equipment IDs
  equipmentNames: string[]; // cached equipment names
  fromDateTime: string; // YYYY-MM-DD HH:mm
  toDateTime: string; // YYYY-MM-DD HH:mm
  durationHours?: number;
  purposeRemark: string; // justification / protocol details
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  adminRemark?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabActivityLog {
  id: string;
  equipmentId?: string;
  equipmentName?: string;
  actionType: 'Equipment Created' | 'Equipment Updated' | 'Equipment Deleted' | 'Status Changed' | 'Location Changed' | 'Document Added' | 'Document Removed' | 'Photo Updated' | 'Booking Submitted' | 'Booking Approved' | 'Booking Rejected' | 'Applicant Created' | 'Applicant Code Reset';
  description: string;
  actor: string; // Admin or Applicant name
  timestamp: string;
  metadata?: any;
}

export interface LabSuperUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  department?: string;
}

export interface LabEquipmentDatabaseSchema {
  superUsers: LabSuperUser[];
  equipments: Equipment[];
  applicants: LabApplicant[];
  bookings: EquipmentBooking[];
  activityLogs: LabActivityLog[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'lab-eq-salt-2026').digest('hex');
}

export function hashSecretCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim() + 'applicant-secret-salt-2026').digest('hex');
}

const INITIAL_LAB_EQUIPMENT_DATA: LabEquipmentDatabaseSchema = {
  superUsers: [
    {
      id: 'lab-su-1',
      name: 'Dr Harvinder Singh',
      email: 'harvinders.hq@icmr.gov.in',
      passwordHash: hashPassword('harvinders$1106'),
      role: 'Super Admin',
      department: 'Central Instrumentation & Core Lab Facility'
    }
  ],
  equipments: [
 
  ],
  applicants: [
   
  ],
  bookings: [
  
  ],
  activityLogs: [
   
  ]
};

export class LabEquipmentDatabase {
  private static data: LabEquipmentDatabaseSchema | null = null;

  private static ensureDirExists() {
    const dir = path.dirname(LAB_EQUIPMENT_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static load(): LabEquipmentDatabaseSchema {
    if (this.data) {
      return this.data;
    }

    this.ensureDirExists();

    if (!fs.existsSync(LAB_EQUIPMENT_DB_FILE)) {
      fs.writeFileSync(LAB_EQUIPMENT_DB_FILE, JSON.stringify(INITIAL_LAB_EQUIPMENT_DATA, null, 2), 'utf8');
      this.data = JSON.parse(JSON.stringify(INITIAL_LAB_EQUIPMENT_DATA));
      return this.data!;
    }

    try {
      const content = fs.readFileSync(LAB_EQUIPMENT_DB_FILE, 'utf8');
      this.data = JSON.parse(content);
      if (!this.data) {
        this.data = JSON.parse(JSON.stringify(INITIAL_LAB_EQUIPMENT_DATA));
      }
      // Ensure all arrays exist
      if (!this.data.superUsers || this.data.superUsers.length === 0) {
        this.data.superUsers = INITIAL_LAB_EQUIPMENT_DATA.superUsers;
      }
      if (!this.data.equipments) this.data.equipments = INITIAL_LAB_EQUIPMENT_DATA.equipments;
      if (!this.data.applicants) {
        this.data.applicants = INITIAL_LAB_EQUIPMENT_DATA.applicants;
      } else {
        const seedCodes: Record<string, string> = {
          'app-1': '12345678',
          'app-2': '87654321',
          'app-3': '45678901',
          'app-4': '11223344'
        };
        this.data.applicants.forEach(app => {
          if (!app.secretCode) {
            app.secretCode = seedCodes[app.id] || Math.floor(10000000 + Math.random() * 90000000).toString();
            app.secretCodeHash = hashSecretCode(app.secretCode);
          }
        });
      }
      if (!this.data.bookings) this.data.bookings = INITIAL_LAB_EQUIPMENT_DATA.bookings;
      if (!this.data.activityLogs) this.data.activityLogs = INITIAL_LAB_EQUIPMENT_DATA.activityLogs;

      return this.data!;
    } catch (e) {
      console.error('Error loading Lab Equipment DB. Reverting to initial seed data.', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_LAB_EQUIPMENT_DATA));
      return this.data!;
    }
  }

  public static save(): void {
    if (!this.data) return;
    this.ensureDirExists();
    fs.writeFileSync(LAB_EQUIPMENT_DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  public static get<K extends keyof LabEquipmentDatabaseSchema>(collection: K): LabEquipmentDatabaseSchema[K] {
    const db = this.load();
    return db[collection];
  }

  public static set<K extends keyof LabEquipmentDatabaseSchema>(collection: K, data: LabEquipmentDatabaseSchema[K]): void {
    const db = this.load();
    db[collection] = data;
    this.save();
  }

  public static addActivityLog(entry: Omit<LabActivityLog, 'id' | 'timestamp'> & { timestamp?: string }): void {
    const db = this.load();
    const log: LabActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...entry
    };
    db.activityLogs.unshift(log);
    // Keep max 500 logs
    if (db.activityLogs.length > 500) {
      db.activityLogs = db.activityLogs.slice(0, 500);
    }
    this.save();
  }
}
