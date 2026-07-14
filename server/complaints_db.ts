import fs from 'fs';
import path from 'path';

const COMPLAINTS_DB_FILE = path.join(process.cwd(), 'data', 'complaints.json');

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
  photoDocument?: string; // Saved path or Base64
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
  passwordHash: string; // SHA256 of password
  department: 'IT' | 'Maintenance';
}

export interface ComplaintsDatabaseSchema {
  superUsers: ComplaintSuperUser[];
  complaints: Complaint[];
}

// Simple SHA256 hashing for passwords to secure logins
import crypto from 'crypto';
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'complaints-salt-2026').digest('hex');
}

const INITIAL_COMPLAINTS_DATA: ComplaintsDatabaseSchema = {
  superUsers: [
    // IT Department Super Users (3)
    {
      id: 'it-su-1',
      name: 'IT Cell (Manish Prajapati)',
      email: 'itcellcomplaint@gmail.com',
      passwordHash: hashPassword('itcellcomplaint@2026'),
      department: 'IT',
    },
    // Maintenance Department Super Users (3)
    {
      id: 'maint-su-1',
      name: 'Maintenance (Anil Purohit)',
      email: 'maintenancomplaint@gmail.com',
      passwordHash: hashPassword('maintenancomplaint@2026'),
      department: 'Maintenance',
    }
  ],
  complaints: [],
};

export class ComplaintsDatabase {
  private static data: ComplaintsDatabaseSchema | null = null;

  private static ensureDirExists() {
    const dir = path.dirname(COMPLAINTS_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static load(): ComplaintsDatabaseSchema {
    if (this.data) {
      return this.data;
    }

    this.ensureDirExists();

    if (!fs.existsSync(COMPLAINTS_DB_FILE)) {
      fs.writeFileSync(COMPLAINTS_DB_FILE, JSON.stringify(INITIAL_COMPLAINTS_DATA, null, 2), 'utf8');
      this.data = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS_DATA));
      return this.data!;
    }

    try {
      const content = fs.readFileSync(COMPLAINTS_DB_FILE, 'utf8');
      this.data = JSON.parse(content);
      
      // Ensure data schema elements are initialized
      if (this.data) {
        if (!this.data.superUsers || this.data.superUsers.length === 0) {
          this.data.superUsers = INITIAL_COMPLAINTS_DATA.superUsers;
        }
        if (!this.data.complaints) {
          this.data.complaints = INITIAL_COMPLAINTS_DATA.complaints;
        }
      }
      return this.data!;
    } catch (e) {
      console.error('Error loading complaints DB file. Reverting to initial.', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS_DATA));
      return this.data!;
    }
  }

  public static save(): void {
    if (!this.data) return;
    this.ensureDirExists();
    fs.writeFileSync(COMPLAINTS_DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  public static get<K extends keyof ComplaintsDatabaseSchema>(collection: K): ComplaintsDatabaseSchema[K] {
    const db = this.load();
    return db[collection];
  }

  public static set<K extends keyof ComplaintsDatabaseSchema>(collection: K, data: ComplaintsDatabaseSchema[K]): void {
    const db = this.load();
    db[collection] = data;
    this.save();
  }
}
