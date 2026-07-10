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
  typeOfComplaint: 'IT' | 'Maintenance' | 'Admin';
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
  department: 'IT' | 'Maintenance' | 'Admin';
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
      name: 'Amit Kumar (IT Head)',
      email: 'it_super1@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'IT',
    },
    {
      id: 'it-su-2',
      name: 'Rahul Sharma (Senior IT Engineer)',
      email: 'it_super2@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'IT',
    },
    {
      id: 'it-su-3',
      name: 'Sneha Patel (IT Support Desk)',
      email: 'it_super3@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'IT',
    },
    // Maintenance Department Super Users (3)
    {
      id: 'maint-su-1',
      name: 'Rajesh Nair (Estate Manager)',
      email: 'maint_super1@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Maintenance',
    },
    {
      id: 'maint-su-2',
      name: 'Anil Gupta (Electrical Supervisor)',
      email: 'maint_super2@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Maintenance',
    },
    {
      id: 'maint-su-3',
      name: 'Kavita Joshi (Civil & Maintenance coordinator)',
      email: 'maint_super3@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Maintenance',
    },
    // Administration Department Super Users (3)
    {
      id: 'admin-su-1',
      name: 'Sanjay Saxena (Admin Officer)',
      email: 'admin_super1@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Admin',
    },
    {
      id: 'admin-su-2',
      name: 'Meena Kumari (Assistant Admin Registrar)',
      email: 'admin_super2@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Admin',
    },
    {
      id: 'admin-su-3',
      name: 'Gopal Subramanian (Administration Coordinator)',
      email: 'admin_super3@nihr.res.in',
      passwordHash: hashPassword('admin'),
      department: 'Admin',
    },
  ],
  complaints: [
    {
      id: 'comp-1',
      name: 'Dr. Sunita Sharma',
      designation: 'Scientist E',
      mobile: '9876543210',
      email: 's.sharma@nihr.res.in',
      locationRoom: '204',
      department: 'Virology Laboratory',
      complaintDescriptionFull: 'The main local area network (LAN) ethernet port is not working. The internet disconnects frequently.',
      typeOfComplaint: 'IT',
      status: 'Staff Assigned',
      assignedStaff: 'Vikas Bansal',
      priority: 'High',
      superUserRemark: 'Assigned to senior hardware technician Vikas Bansal for on-site diagnosis and patch cable replacement.',
      createdAt: '2026-07-09T10:00:00Z',
      updatedAt: '2026-07-09T11:30:00Z',
    },
    {
      id: 'comp-2',
      name: 'Sunita Meena',
      designation: 'Section Officer',
      mobile: '9555112233',
      email: 's.meena@nihr.res.in',
      locationRoom: 'G-03',
      department: 'Administration Wing',
      complaintDescriptionFull: 'AC unit in room G-03 is leaking water and not cooling. Please attend urgently.',
      typeOfComplaint: 'Maintenance',
      status: 'Pending',
      priority: 'Medium',
      superUserRemark: 'Complaint registered. Waiting for electrical & HVAC team to inspect water drainage line.',
      createdAt: '2026-07-09T12:00:00Z',
      updatedAt: '2026-07-09T12:00:00Z',
    }
  ],
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
