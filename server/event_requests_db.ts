import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const EVENT_REQUESTS_DB_FILE = path.join(process.cwd(), 'data', 'event_requests.json');

export interface RequirementItem {
  srNo: number;
  itemName: string;
  quantity: number;
  pricePerItem: number;
  estimateTotal: number;
  remarkJustification: string;
}

export interface EventRequirementRequest {
  id: string; // e.g. EVT-2026-1001
  name: string;
  designation: string;
  email: string;
  mobile: string;
  eventTitle: string;
  budgetHead: 'Institutional' | 'Project' | 'Other';
  otherBudgetHead?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  advanceDays: number;
  submissionDate: string; // YYYY-MM-DD
  lateJustification?: string;
  additionalRemark?: string;
  budgetStatementPdf?: string; // base64 or file path
  budgetStatementFileName?: string;
  supportingDocPdf?: string; // base64 or file path
  supportingDocFileName?: string;
  items: RequirementItem[];
  totalEstimateBudget: number;
  status: 'Approved' | 'Recommended' | 'In Discussion' | 'Rejected' | 'Custom Status' | 'Pending';
  customStatusText?: string;
  superUserRemarks?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventManagerSuperUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface EventRequestsDatabaseSchema {
  superUsers: EventManagerSuperUser[];
  requests: EventRequirementRequest[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'event-mgr-salt-2026').digest('hex');
}

const INITIAL_EVENT_REQUESTS_DATA: EventRequestsDatabaseSchema = {
  superUsers: [
     {
      id: 'evt-su-1',
      name: 'Adminisitrative Offcier (Paras Tyagi)',
      email: 'aonihr@gmail.com',
      passwordHash: hashPassword('aonihr@2026'),
      role: 'Event Manager Super User'
    },
  ],
  requests: [
  ]
};

export class EventRequestsDatabase {
  private static data: EventRequestsDatabaseSchema | null = null;

  private static ensureDirExists() {
    const dir = path.dirname(EVENT_REQUESTS_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static load(): EventRequestsDatabaseSchema {
    if (this.data) {
      return this.data;
    }

    this.ensureDirExists();

    if (!fs.existsSync(EVENT_REQUESTS_DB_FILE)) {
      fs.writeFileSync(EVENT_REQUESTS_DB_FILE, JSON.stringify(INITIAL_EVENT_REQUESTS_DATA, null, 2), 'utf8');
      this.data = JSON.parse(JSON.stringify(INITIAL_EVENT_REQUESTS_DATA));
      return this.data!;
    }

    try {
      const content = fs.readFileSync(EVENT_REQUESTS_DB_FILE, 'utf8');
      this.data = JSON.parse(content);
      if (this.data) {
        if (!this.data.superUsers || this.data.superUsers.length === 0) {
          this.data.superUsers = INITIAL_EVENT_REQUESTS_DATA.superUsers;
        }
        if (!this.data.requests) {
          this.data.requests = INITIAL_EVENT_REQUESTS_DATA.requests;
        }
      }
      return this.data!;
    } catch (e) {
      console.error('Error loading event requests DB file. Reverting to initial.', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_EVENT_REQUESTS_DATA));
      return this.data!;
    }
  }

  public static save(): void {
    if (!this.data) return;
    this.ensureDirExists();
    fs.writeFileSync(EVENT_REQUESTS_DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  public static get<K extends keyof EventRequestsDatabaseSchema>(collection: K): EventRequestsDatabaseSchema[K] {
    const db = this.load();
    return db[collection];
  }

  public static set<K extends keyof EventRequestsDatabaseSchema>(collection: K, data: EventRequestsDatabaseSchema[K]): void {
    const db = this.load();
    db[collection] = data;
    this.save();
  }
}
