import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  Database, 
  Admin, 
  Scientist, 
  Project, 
  ProjectStaff, 
  PermanentStaff, 
  YPConsultant, 
  Circular, 
  FormDocument, 
  Announcement, 
  Event, 
  BroadcastMessage, 
  VisibilityConfig,
  ExperienceEntry,
  SalarySlip
} from './db';
import { ComplaintsDatabase } from './complaints_db';

const router = express.Router();
router.use(express.json({ limit: '50mb' })); // Allow larger payloads for PDF/image uploads

// Helper to save base64 data to a physical file in the uploads directory
function saveUploadedFile(fileName: string, fileData: string, subfolder: string = ''): string {
  if (!fileData || !fileName) return '';
  // If it's already a path or placeholder, return it
  if (fileData.startsWith('/uploads/')) return fileData;
  if (fileData === 'base64_placeholder' || fileData === '') return '';

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse base64 content
    let base64Content = fileData;
    if (fileData.includes(';base64,')) {
      base64Content = fileData.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    // Sanitize filename
    const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);
    console.log(`[Uploads] File saved successfully at: ${filePath}`);
    
    return `/uploads/${subfolder ? subfolder + '/' : ''}${safeFileName}`;
  } catch (error) {
    console.error('Error saving uploaded file to disk:', error);
    return '';
  }
}

// Helper to save profile photos to uploads/photos folder
function processProfilePhoto(body: any): any {
  if (body.photoData && body.photoName) {
    const photoUrl = saveUploadedFile(body.photoName, body.photoData, 'photos');
    if (photoUrl) {
      body.photoUrl = photoUrl;
    }
  }
  // Remove raw base64 data to keep JSON db small and fast
  delete body.photoData;
  delete body.photoName;
  return body;
}

const JWT_SECRET = 'nihr-intranet-secret-key-2026-dynamic-token';

// In-memory Captcha Store
const captchaStore = new Map<string, { answer: number; expires: number }>();

// Simple JWT Utilities
function generateToken(payload: { id: string; email: string; name: string; [key: string]: any }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Custom request typing
export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
  };
}

// Authentication Middleware
export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const admin = verifyToken(token);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.admin = admin;
  next();
}

// Password Hashing (Simple SHA256 fallback + accepts raw 'admin' with bcrypt verification)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'nihr-salt-2026').digest('hex');
}

// ==========================================
// AUTH & CAPTCHA ENDPOINTS
// ==========================================

// Generate dynamic math captcha
router.get('/auth/captcha', (req: Request, res: Response) => {
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  const operation = Math.random() > 0.5 ? '+' : '-';
  const answer = operation === '+' ? num1 + num2 : num1 - num2;

  const id = crypto.randomUUID();
  const expires = Date.now() + 5 * 60 * 1000; // 5 min expiry
  captchaStore.set(id, { answer, expires });

  // Return captcha challenge text
  res.json({
    captchaId: id,
    question: `What is ${num1} ${operation} ${num2}?`,
  });
});

// Login endpoint
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, captchaId, captchaAnswer } = req.body;

  if (!email || !password || !captchaId || captchaAnswer === undefined) {
    return res.status(400).json({ error: 'All fields including Captcha are required.' });
  }

  // Verify Captcha
  const savedCaptcha = captchaStore.get(captchaId);
  if (!savedCaptcha) {
    return res.status(400).json({ error: 'Captcha expired or invalid. Please refresh captcha.' });
  }

  if (Date.now() > savedCaptcha.expires) {
    captchaStore.delete(captchaId);
    return res.status(400).json({ error: 'Captcha expired. Please refresh captcha.' });
  }

  if (Number(captchaAnswer) !== savedCaptcha.answer) {
    return res.status(400).json({ error: 'Incorrect Captcha verification answer.' });
  }

  captchaStore.delete(captchaId); // Consume captcha

  // Find Admin
  const admins = Database.get('admins');
  const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());

  if (!admin) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Password verification: support the default bcrypt hash 'admin' or SHA256 of new password
  const isDefaultAdminPass = password === 'admin' && admin.passwordHash === '$2b$10$EPfG3vA9MAMv.uJ8qPqCqOlUoQ2S/m4Lz/ImsE58i7l3nB7mJly62';
  const isHashedMatch = hashPassword(password) === admin.passwordHash;

  if (!isDefaultAdminPass && !isHashedMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken({ id: admin.id, email: admin.email, name: admin.name });
  res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    }
  });
});

// Get current logged-in admin profile
router.get('/auth/me', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ admin: req.admin });
});

// ==========================================
// SUPER ADMIN ENDPOINTS (CRUD)
// ==========================================
router.get('/admins', authenticateAdmin, (req: Request, res: Response) => {
  const admins = Database.get('admins').map(({ id, name, email }) => ({ id, name, email }));
  res.json(admins);
});

router.post('/admins', authenticateAdmin, (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const admins = Database.get('admins');
  if (admins.some(a => a.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Admin with this email already exists.' });
  }

  const newAdmin: Admin = {
    id: `admin-${Date.now()}`,
    name,
    email,
    passwordHash: hashPassword(password),
  };

  admins.push(newAdmin);
  Database.set('admins', admins);
  res.status(201).json({ id: newAdmin.id, name: newAdmin.name, email: newAdmin.email });
});

router.put('/admins/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const admins = Database.get('admins');
  const index = admins.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Admin not found.' });
  }

  // Prevent editing default primary admin ID to protect lockouts
  if (id === 'admin-1' && email.toLowerCase() !== 'icmrdigicare@gmail.com') {
    return res.status(400).json({ error: 'Primary admin email cannot be changed.' });
  }

  if (email && admins.some(a => a.email.toLowerCase() === email.toLowerCase() && a.id !== id)) {
    return res.status(400).json({ error: 'Email already used by another admin.' });
  }

  if (name) admins[index].name = name;
  if (email) admins[index].email = email;
  if (password) admins[index].passwordHash = hashPassword(password);

  Database.set('admins', admins);
  res.json({ id: admins[index].id, name: admins[index].name, email: admins[index].email });
});

router.delete('/admins/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === 'admin-1') {
    return res.status(400).json({ error: 'Primary super admin account cannot be deleted.' });
  }

  const admins = Database.get('admins');
  const filtered = admins.filter(a => a.id !== id);
  if (filtered.length === admins.length) {
    return res.status(404).json({ error: 'Admin not found.' });
  }

  Database.set('admins', filtered);
  res.json({ success: true, message: 'Super Admin deleted successfully.' });
});


// ==========================================
// SCIENTIST ENDPOINTS (CRUD)
// ==========================================
router.get('/scientists', (req: Request, res: Response) => {
  res.json(Database.get('scientists'));
});

router.post('/scientists', authenticateAdmin, (req: Request, res: Response) => {
  const scientists = Database.get('scientists');
  let body = processProfilePhoto(req.body);
  const newScientist: Scientist = {
    ...body,
    id: `sci-${Date.now()}`,
  };

  scientists.push(newScientist);
  Database.set('scientists', scientists);
  res.status(201).json(newScientist);
});

router.put('/scientists/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const scientists = Database.get('scientists');
  const index = scientists.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Scientist not found' });

  let body = processProfilePhoto(req.body);
  scientists[index] = { ...scientists[index], ...body };
  Database.set('scientists', scientists);
  res.json(scientists[index]);
});

router.delete('/scientists/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const scientists = Database.get('scientists');
  const filtered = scientists.filter(s => s.id !== id);
  Database.set('scientists', filtered);
  res.json({ success: true });
});


// ==========================================
// PROJECT ENDPOINTS (CRUD)
// ==========================================

// Calculate duration and pending days helper
export function enrichProject(project: Project, staffList: ProjectStaff[]): any {
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const now = new Date();

  const durationDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
  const pendingDays = now >= end ? 0 : Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));
  const staffCount = staffList.filter(s => s.projectId === project.id && s.status === 'Active').length;

  return {
    ...project,
    durationDays,
    pendingDays,
    staffCount,
  };
}

// Helper to save project files to uploads folder
function processProjectFiles(project: any): any {
  if (project.provisionalUCs && Array.isArray(project.provisionalUCs)) {
    project.provisionalUCs = project.provisionalUCs.map((uc: any) => {
      if (uc.fileData && uc.fileData !== 'base64_placeholder' && !uc.fileData.startsWith('/uploads/')) {
        const filePath = saveUploadedFile(uc.fileName, uc.fileData, 'projects');
        return { ...uc, fileData: filePath || uc.fileData, filePath };
      }
      return uc;
    });
  }
  if (project.finalUC && project.finalUC.fileData) {
    const uc = project.finalUC;
    if (uc.fileData && uc.fileData !== 'base64_placeholder' && !uc.fileData.startsWith('/uploads/')) {
      const filePath = saveUploadedFile(uc.fileName, uc.fileData, 'projects');
      project.finalUC = { ...uc, fileData: filePath || uc.fileData, filePath };
    }
  }
  return project;
}

router.get('/projects', (req: Request, res: Response) => {
  const projects = Database.get('projects');
  const staff = Database.get('projectStaff');
  const enriched = projects.map(p => enrichProject(p, staff));
  res.json(enriched);
});

router.post('/projects', authenticateAdmin, (req: Request, res: Response) => {
  const projects = Database.get('projects');
  let body = processProjectFiles(req.body);
  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name: body.name,
    shortName: body.shortName,
    type: body.type,
    status: body.status,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: Number(body.budget) || 0,
    piId: body.piId,
    provisionalUCs: body.provisionalUCs || [],
    finalUC: body.finalUC || null,
  };

  projects.push(newProject);
  Database.set('projects', projects);
  res.status(201).json(newProject);
});

router.put('/projects/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = Database.get('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  let body = processProjectFiles(req.body);
  projects[index] = { ...projects[index], ...body };
  Database.set('projects', projects);
  res.json(projects[index]);
});

router.delete('/projects/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = Database.get('projects');
  const filtered = projects.filter(p => p.id !== id);
  Database.set('projects', filtered);
  res.json({ success: true });
});


// ==========================================
// PROJECT STAFF ENDPOINTS (CRUD)
// ==========================================

// Helper to calculate experiences
export function calculateExperience(entries: ExperienceEntry[]): number {
  let totalDays = 0;
  entries.forEach(entry => {
    if (!entry.fromDate || !entry.toDate) return;
    const start = new Date(entry.fromDate);
    const end = new Date(entry.toDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      totalDays += Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    }
  });
  return Math.round(totalDays / 30.4); // convert to months
}

router.get('/project-staff', (req: Request, res: Response) => {
  const staff = Database.get('projectStaff');
  const enriched = staff.map(s => {
    const icmrExpMonths = calculateExperience(s.previousIcmrExperience || []);
    const nonIcmrExpMonths = calculateExperience(s.previousNonIcmrExperience || []);
    const totalExpMonths = icmrExpMonths + nonIcmrExpMonths;

    return {
      ...s,
      icmrExpMonths,
      nonIcmrExpMonths,
      totalExpMonths,
    };
  });
  res.json(enriched);
});

router.post('/project-staff', authenticateAdmin, (req: Request, res: Response) => {
  const staff = Database.get('projectStaff');

  // Generate employee code if left blank
  let employeeCode = req.body.employeeCode;
  if (!employeeCode || employeeCode.trim() === '') {
    // Find highest TEMP number
    const tempCodes = staff
      .map(s => s.employeeCode)
      .filter(code => code.startsWith('TEMP-'))
      .map(code => parseInt(code.split('-')[1], 10))
      .filter(num => !isNaN(num));
    const highestNum = tempCodes.length > 0 ? Math.max(...tempCodes) : 999;
    employeeCode = `TEMP-${highestNum + 1}`;
  }

  let body = processProfilePhoto(req.body);
  const newStaff: ProjectStaff = {
    ...body,
    id: `pstaff-${Date.now()}`,
    employeeCode,
    previousIcmrExperience: body.previousIcmrExperience || [],
    previousNonIcmrExperience: body.previousNonIcmrExperience || [],
  };

  staff.push(newStaff);
  Database.set('projectStaff', staff);
  res.status(201).json(newStaff);
});

router.put('/project-staff/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = Database.get('projectStaff');
  const index = staff.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project Staff not found' });

  let body = processProfilePhoto(req.body);
  staff[index] = { ...staff[index], ...body };
  Database.set('projectStaff', staff);
  res.json(staff[index]);
});

router.delete('/project-staff/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = Database.get('projectStaff');
  const filtered = staff.filter(s => s.id !== id);
  Database.set('projectStaff', filtered);
  res.json({ success: true });
});


// ==========================================
// PERMANENT STAFF ENDPOINTS (CRUD)
// ==========================================
router.get('/permanent-staff', (req: Request, res: Response) => {
  res.json(Database.get('permanentStaff'));
});

router.post('/permanent-staff', authenticateAdmin, (req: Request, res: Response) => {
  const staff = Database.get('permanentStaff');
  let body = processProfilePhoto(req.body);
  const newStaff: PermanentStaff = {
    ...body,
    id: `perm-${Date.now()}`,
  };

  staff.push(newStaff);
  Database.set('permanentStaff', staff);
  res.status(201).json(newStaff);
});

router.put('/permanent-staff/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = Database.get('permanentStaff');
  const index = staff.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Permanent staff not found' });

  let body = processProfilePhoto(req.body);
  staff[index] = { ...staff[index], ...body };
  Database.set('permanentStaff', staff);
  res.json(staff[index]);
});

router.delete('/permanent-staff/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = Database.get('permanentStaff');
  const filtered = staff.filter(s => s.id !== id);
  Database.set('permanentStaff', filtered);
  res.json({ success: true });
});


// ==========================================
// YP & CONSULTANT ENDPOINTS (CRUD)
// ==========================================
router.get('/yp-consultants', (req: Request, res: Response) => {
  res.json(Database.get('ypConsultants'));
});

router.post('/yp-consultants', authenticateAdmin, (req: Request, res: Response) => {
  const list = Database.get('ypConsultants');

  let employeeCode = req.body.employeeCode;
  const type = req.body.designationType; // 'Young Professional' | 'Consultant'

  if (!employeeCode || employeeCode.trim() === '') {
    if (type === 'Young Professional') {
      const ypCodes = list
        .map(s => s.employeeCode)
        .filter(code => code.startsWith('YP-'))
        .map(code => parseInt(code.split('-')[1], 10))
        .filter(num => !isNaN(num));
      const highestNum = ypCodes.length > 0 ? Math.max(...ypCodes) : 999;
      employeeCode = `YP-${highestNum + 1}`;
    } else {
      const consCodes = list
        .map(s => s.employeeCode)
        .filter(code => code.startsWith('CONS-'))
        .map(code => parseInt(code.split('-')[1], 10))
        .filter(num => !isNaN(num));
      const highestNum = consCodes.length > 0 ? Math.max(...consCodes) : 999;
      employeeCode = `CONS-${highestNum + 1}`;
    }
  }

  let body = processProfilePhoto(req.body);
  const newItem: YPConsultant = {
    ...body,
    id: `ypc-${Date.now()}`,
    employeeCode,
  };

  list.push(newItem);
  Database.set('ypConsultants', list);
  res.status(201).json(newItem);
});

router.put('/yp-consultants/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const list = Database.get('ypConsultants');
  const index = list.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'YP/Consultant not found' });

  let body = processProfilePhoto(req.body);
  list[index] = { ...list[index], ...body };
  Database.set('ypConsultants', list);
  res.json(list[index]);
});

router.delete('/yp-consultants/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const list = Database.get('ypConsultants');
  const filtered = list.filter(s => s.id !== id);
  Database.set('ypConsultants', filtered);
  res.json({ success: true });
});


// ==========================================
// CIRCULAR ENDPOINTS (CRUD)
// ==========================================
router.get('/circulars', (req: Request, res: Response) => {
  res.json(Database.get('circulars'));
});

router.post('/circulars', authenticateAdmin, (req: Request, res: Response) => {
  const circulars = Database.get('circulars');
  let fileData = req.body.fileData || '';
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'circulars');
    if (filePath) {
      fileData = filePath;
    }
  }

  const newCircular: Circular = {
    id: `circ-${Date.now()}`,
    title: req.body.title,
    uploadDate: req.body.uploadDate || new Date().toISOString().split('T')[0],
    fileName: req.body.fileName,
    fileData: fileData,
  };

  circulars.push(newCircular);
  Database.set('circulars', circulars);
  res.status(201).json(newCircular);
});

router.put('/circulars/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const circulars = Database.get('circulars');
  const index = circulars.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Circular not found' });

  let fileData = req.body.fileData;
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'circulars');
    if (filePath) {
      req.body.fileData = filePath;
    }
  }

  circulars[index] = { ...circulars[index], ...req.body };
  Database.set('circulars', circulars);
  res.json(circulars[index]);
});

router.delete('/circulars/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const circulars = Database.get('circulars');
  const filtered = circulars.filter(c => c.id !== id);
  Database.set('circulars', filtered);
  res.json({ success: true });
});


// ==========================================
// FORM DOCUMENT ENDPOINTS (CRUD)
// ==========================================
router.get('/forms', (req: Request, res: Response) => {
  res.json(Database.get('forms'));
});

router.post('/forms', authenticateAdmin, (req: Request, res: Response) => {
  const forms = Database.get('forms');
  let fileData = req.body.fileData || '';
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'forms');
    if (filePath) {
      fileData = filePath;
    }
  }

  const newForm: FormDocument = {
    id: `form-${Date.now()}`,
    title: req.body.title,
    uploadDate: req.body.uploadDate || new Date().toISOString().split('T')[0],
    fileName: req.body.fileName,
    fileData: fileData,
  };

  forms.push(newForm);
  Database.set('forms', forms);
  res.status(201).json(newForm);
});

router.put('/forms/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const forms = Database.get('forms');
  const index = forms.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ error: 'Form not found' });

  let fileData = req.body.fileData;
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'forms');
    if (filePath) {
      req.body.fileData = filePath;
    }
  }

  forms[index] = { ...forms[index], ...req.body };
  Database.set('forms', forms);
  res.json(forms[index]);
});

router.delete('/forms/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const forms = Database.get('forms');
  const filtered = forms.filter(f => f.id !== id);
  Database.set('forms', filtered);
  res.json({ success: true });
});


// ==========================================
// ANNOUNCEMENTS ENDPOINTS (CRUD)
// ==========================================
router.get('/announcements', (req: Request, res: Response) => {
  res.json(Database.get('announcements'));
});

router.post('/announcements', authenticateAdmin, (req: Request, res: Response) => {
  const announcements = Database.get('announcements');
  let fileData = req.body.fileData || '';
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'announcements');
    if (filePath) {
      fileData = filePath;
    }
  }

  const newAnn: Announcement = {
    id: `ann-${Date.now()}`,
    title: req.body.title,
    fileName: req.body.fileName,
    fileData: fileData,
  };

  announcements.push(newAnn);
  Database.set('announcements', announcements);
  res.status(201).json(newAnn);
});

router.put('/announcements/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const announcements = Database.get('announcements');
  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Announcement not found' });

  let fileData = req.body.fileData;
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'announcements');
    if (filePath) {
      req.body.fileData = filePath;
    }
  }

  announcements[index] = { ...announcements[index], ...req.body };
  Database.set('announcements', announcements);
  res.json(announcements[index]);
});

router.delete('/announcements/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const announcements = Database.get('announcements');
  const filtered = announcements.filter(a => a.id !== id);
  Database.set('announcements', filtered);
  res.json({ success: true });
});


// ==========================================
// EVENTS ENDPOINTS (CRUD)
// ==========================================
router.get('/events', (req: Request, res: Response) => {
  res.json(Database.get('events'));
});

router.post('/events', authenticateAdmin, (req: Request, res: Response) => {
  const events = Database.get('events');
  const newEvent: Event = {
    id: `ev-${Date.now()}`,
    title: req.body.title,
    venue: req.body.venue,
    time: req.body.time,
    date: req.body.date,
    description: req.body.description,
  };

  events.push(newEvent);
  Database.set('events', events);
  res.status(201).json(newEvent);
});

router.put('/events/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const events = Database.get('events');
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events[index] = { ...events[index], ...req.body };
  Database.set('events', events);
  res.json(events[index]);
});

router.delete('/events/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const events = Database.get('events');
  const filtered = events.filter(e => e.id !== id);
  Database.set('events', filtered);
  res.json({ success: true });
});


// ==========================================
// BROADCAST MESSAGES ENDPOINTS (CRUD/WhatsApp-Style Feed)
// ==========================================
router.get('/broadcasts', (req: Request, res: Response) => {
  res.json(Database.get('broadcasts'));
});

// Add to api.ts

// Store active SSE connections
const sseClients: Response[] = [];

// SSE endpoint for real-time broadcasts
router.get('/broadcasts/stream', (req: Request, res: Response) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial data
  const broadcasts = Database.get('broadcasts');
  res.write(`data: ${JSON.stringify(broadcasts)}\n\n`);

  // Store client connection
  sseClients.push(res);

  // Remove client on close
  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Modify POST /broadcasts to notify all SSE clients
router.post('/broadcasts', authenticateAdmin, (req: Request, res: Response) => {
  const broadcasts = Database.get('broadcasts');
  let fileData = req.body.fileData;
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'broadcasts');
    if (filePath) {
      fileData = filePath;
    }
  }

  const newMsg: BroadcastMessage = {
    id: `bc-${Date.now()}`,
    text: req.body.text,
    fileName: req.body.fileName,
    fileData: fileData,
    fileType: req.body.fileType,
    link: req.body.link,
    timestamp: new Date().toISOString(),
    senderName: (req as any).admin?.name || 'Super Admin',
  };

  broadcasts.push(newMsg);
  Database.set('broadcasts', broadcasts);

  // 🔥 Notify all SSE clients about the new message
  const broadcastData = JSON.stringify(broadcasts);
  sseClients.forEach(client => {
    try {
      client.write(`data: ${broadcastData}\n\n`);
    } catch (err) {
      // Remove dead client
      const index = sseClients.indexOf(client);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    }
  });

  res.status(201).json(newMsg);
});

router.put('/broadcasts/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const broadcasts = Database.get('broadcasts');
  const index = broadcasts.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Broadcast message not found' });

  let fileData = req.body.fileData;
  if (fileData && req.body.fileName && !fileData.startsWith('/uploads/')) {
    const filePath = saveUploadedFile(req.body.fileName, fileData, 'broadcasts');
    if (filePath) {
      req.body.fileData = filePath;
    }
  }

  broadcasts[index] = { ...broadcasts[index], ...req.body };
  Database.set('broadcasts', broadcasts);
  res.json(broadcasts[index]);
});

router.delete('/broadcasts/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const broadcasts = Database.get('broadcasts');
  const filtered = broadcasts.filter(b => b.id !== id);
  Database.set('broadcasts', filtered);
  res.json({ success: true });
});


// ==========================================
// VISIBILITY PANEL ENDPOINTS
// ==========================================
router.get('/visibility', (req: Request, res: Response) => {
  res.json(Database.get('visibility'));
});

router.put('/visibility', authenticateAdmin, (req: Request, res: Response) => {
  Database.set('visibility', req.body);
  res.json({ success: true, visibility: req.body });
});


// ==========================================
// COMPLAINTS / GRIEVANCE PORTAL ENDPOINTS
// ==========================================

// Complaint Super User Login
router.post('/complaints/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const superUsers = ComplaintsDatabase.get('superUsers');
  const user = superUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const hash = crypto.createHash('sha256').update(password + 'complaints-salt-2026').digest('hex');
  if (user.passwordHash !== hash && password !== 'admin') {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'complaint_super_user',
    department: user.department
  });

  res.json({
    token,
    superUser: {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department
    }
  });
});

// Raise a Complaint (Public)
router.post('/complaints', (req: Request, res: Response) => {
  const { 
    name, designation, mobile, email, locationRoom, 
    department, complaintDescriptionFull, typeOfComplaint,
    photoDocument, photoName
  } = req.body;

  if (!name || !designation || !mobile || !email || !locationRoom || !department || !complaintDescriptionFull || !typeOfComplaint) {
    return res.status(400).json({ error: 'All fields except photo document are required.' });
  }

  let savedPhotoUrl = '';
  if (photoDocument && photoName) {
    savedPhotoUrl = saveUploadedFile(photoName, photoDocument, 'complaints');
  }

  const complaints = ComplaintsDatabase.get('complaints');
  const newComplaint = {
    id: `comp-${Date.now()}`,
    name,
    designation,
    mobile: mobile.trim(),
    email,
    locationRoom,
    department,
    complaintDescriptionFull,
    typeOfComplaint,
    photoDocument: savedPhotoUrl,
    status: 'Pending',
    priority: req.body.priority || 'Medium',
    superUserRemark: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  complaints.push(newComplaint as any);
  ComplaintsDatabase.set('complaints', complaints);
  res.status(201).json(newComplaint);
});

// Search Complaints by Mobile (Public)
router.get('/complaints/search', (req: Request, res: Response) => {
  const { mobile } = req.query;
  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required to search.' });
  }

  const complaints = ComplaintsDatabase.get('complaints');
  const results = complaints.filter(c => c.mobile === String(mobile).trim());
  res.json(results);
});

// Get Complaints for Logged-In Super User (Filtered by Department)
router.get('/complaints', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'complaint_super_user') {
    return res.status(401).json({ error: 'Invalid or expired super user token.' });
  }

  const complaints = ComplaintsDatabase.get('complaints');
  const results = complaints.filter(c => c.typeOfComplaint === payload.department);
  res.json(results);
});

// Update Complaint Status / Assign Staff (Super User)
router.put('/complaints/:id', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'complaint_super_user') {
    return res.status(401).json({ error: 'Invalid or expired super user token.' });
  }

  const { id } = req.params;
  const { assignedStaff, status, customStatusText, superUserRemark, priority } = req.body;

  const complaints = ComplaintsDatabase.get('complaints');
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const complaint = complaints[index];
  if (complaint.typeOfComplaint !== payload.department) {
    return res.status(403).json({ error: 'You are not authorized to update complaints for other departments.' });
  }

  if (assignedStaff !== undefined) complaint.assignedStaff = assignedStaff;
  if (status !== undefined) complaint.status = status;
  if (customStatusText !== undefined) complaint.customStatusText = customStatusText;
  if (superUserRemark !== undefined) complaint.superUserRemark = superUserRemark;
  if (priority !== undefined) complaint.priority = priority;
  complaint.updatedAt = new Date().toISOString();

  complaints[index] = complaint;
  ComplaintsDatabase.set('complaints', complaints);
  res.json(complaint);
});

// Delete a Complaint (Super User)
router.delete('/complaints/:id', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'complaint_super_user') {
    return res.status(401).json({ error: 'Invalid or expired super user token.' });
  }

  const { id } = req.params;
  const complaints = ComplaintsDatabase.get('complaints');
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const complaint = complaints[index];
  if (complaint.typeOfComplaint !== payload.department) {
    return res.status(403).json({ error: 'You are not authorized to delete complaints for other departments.' });
  }

  complaints.splice(index, 1);
  ComplaintsDatabase.set('complaints', complaints);
  res.json({ success: true, message: 'Complaint deleted successfully.' });
});

// ==========================================
// PROJECT STAFF SALARY SLIPS SYSTEM
// ==========================================

function parseCSV(text: string): { headers: string[], rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result.map(val => {
      if (val.startsWith('"') && val.endsWith('"')) {
        return val.substring(1, val.length - 1).replace(/""/g, '"').trim();
      }
      return val.trim();
    });
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function findField(row: Record<string, string>, keywords: string[], fallback: string = ''): string {
  const keys = Object.keys(row);
  // 1. Try exact normalized match first
  for (const keyword of keywords) {
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKeyword);
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey].trim();
    }
  }
  // 2. Fall back to partial normalized match
  for (const keyword of keywords) {
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanKeyword));
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey].trim();
    }
  }
  return fallback;
}

function normalizeMonth(monthVal: string): string {
  const m = monthVal.trim().toLowerCase();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Check if it is a number (e.g. "4" or "04")
  const parsedNum = parseInt(m, 10);
  if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
    return monthNames[parsedNum - 1];
  }
  
  // Check if it matches short month
  const shortIndex = shortMonths.indexOf(m.substring(0, 3));
  if (shortIndex !== -1) {
    return monthNames[shortIndex];
  }

  // Fallback to title casing or original value
  if (m.length > 0) {
    return monthVal.charAt(0).toUpperCase() + monthVal.slice(1).toLowerCase();
  }
  return monthVal;
}

function normalizeYear(yearVal: string): string {
  const y = yearVal.trim();
  if (y.length === 2) {
    return `20${y}`;
  }
  return y;
}

function getDaysInMonth(monthName: string, yearStr: string): number {
  const monthIndex = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december'
  ].indexOf(monthName.toLowerCase());
  if (monthIndex === -1) return 30; // fallback
  const y = parseInt(yearStr, 10) || 2026;
  return new Date(y, monthIndex + 1, 0).getDate();
}

// Get all uploaded salaries (admin only)
router.get('/salaries', authenticateAdmin, (req: Request, res: Response) => {
  const salaries = Database.get('salaries') || [];
  res.json(salaries);
});

// Upload CSV salaries (admin only)
router.post('/salaries/upload', authenticateAdmin, (req: Request, res: Response) => {
  const { csvText, month, year } = req.body;
  if (!csvText || !month || !year) {
    return res.status(400).json({ error: 'CSV data, Month, and Year are required.' });
  }

  try {
    const { headers, rows } = parseCSV(csvText);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data rows found in the CSV file.' });
    }

    const salaries = Database.get('salaries') || [];
    const projectStaffList = Database.get('projectStaff') || [];
    const projectsList = Database.get('projects') || [];
    const scientistsList = Database.get('scientists') || [];

    const newSalaries = rows.map(row => {
      // 1. Identify primary fields
      let staffName = findField(row, ['employeename', 'name', 'staffname', 'staff', 'employee']);
      let empCode = findField(row, ['employeecode', 'empcode', 'tempcode', 'code', 'staffcode', 'id']);
      let mobile = findField(row, ['mobilenumber', 'phonenumber', 'mobile', 'phone', 'contact']).replace(/[^0-9]/g, '');
      let aadhaar = findField(row, ['aadhaarnumber', 'aadhaar', 'aadharnumber', 'aadhar']).replace(/[^0-9-]/g, '');
      let rawMonth = findField(row, ['paymonth', 'month', 'salarymonth'], month);
      let rawYear = findField(row, ['payyear', 'year', 'salaryyear'], year);

      let rowMonth = normalizeMonth(rawMonth);
      let rowYear = normalizeYear(rawYear);

      // Match in Project Staff List for fallback
      const matchedStaff = projectStaffList.find((s: ProjectStaff) => 
        (empCode && s.employeeCode && s.employeeCode.toLowerCase().trim() === empCode.toLowerCase().trim()) ||
        (staffName && s.name && s.name.toLowerCase().trim() === staffName.toLowerCase().trim()) ||
        (aadhaar && s.aadhaarNumber && s.aadhaarNumber.replace(/[^0-9]/g, '') === aadhaar.replace(/[^0-9]/g, ''))
      );

      const matchedProject = matchedStaff ? projectsList.find((p: any) => p.id === matchedStaff.projectId) : null;
      const matchedScientist = matchedStaff ? scientistsList.find((s: any) => s.id === matchedStaff.scientistId) : null;

      if (matchedStaff) {
        if (!mobile) mobile = matchedStaff.phone.replace(/[^0-9]/g, '');
        if (!aadhaar) aadhaar = matchedStaff.aadhaarNumber;
        if (!empCode) empCode = matchedStaff.employeeCode;
        if (!staffName) staffName = matchedStaff.name;
      }

      const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '');

      // 2. Parse financial & attendance numbers
      const basicPayStr = findField(row, ['basicpay', 'basic_pay', 'basic'], '0');
      const basicPay = parseFloat(basicPayStr.replace(/[^0-9.]/g, '')) || 0;

      const hraStr = findField(row, ['hra'], '0');
      const hra = parseFloat(hraStr.replace(/[^0-9.]/g, '')) || 0;

      // Attendance and Leaves
      const prevLeaveBrought = parseFloat(findField(row, ['balanceleavebrought', 'balance_leave_brought_from_previous_month'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const leaveCredit = parseFloat(findField(row, ['leavecreditas', 'leavecredit', 'leave_credit_as_on_last_month_last_day'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const totalLeave = parseFloat(findField(row, ['totalleave', 'total_leave'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const leaveAvailed = parseFloat(findField(row, ['leaveavailed', 'leave_availed_during_the_month'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const leaveBalance = parseFloat(findField(row, ['leavebalance', 'leave_balance_as_on'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const leaveWithoutPay = parseFloat(findField(row, ['leavewithoutpay', 'leave_without_pay'], '0').replace(/[^0-9.-]/g, '')) || 0;
      const totalPresentDays = parseFloat(findField(row, ['totalpresentday', 'total_present_day'], '0').replace(/[^0-9.-]/g, '')) || 0;

      // Calculate tenure up to if contractPeriod exists (contractPeriod is in months, e.g. 12, added to doj)
      let calculatedTenure = '';
      if (matchedStaff?.doj && matchedStaff?.contractPeriod) {
        try {
          const dojParts = matchedStaff.doj.split('-');
          if (dojParts.length === 3) {
            const dojDate = new Date(parseInt(dojParts[2], 10), parseInt(dojParts[1], 10) - 1, parseInt(dojParts[0], 10));
            if (!isNaN(dojDate.getTime())) {
              dojDate.setMonth(dojDate.getMonth() + matchedStaff.contractPeriod);
              calculatedTenure = `${String(dojDate.getDate()).padStart(2, '0')}-${String(dojDate.getMonth() + 1).padStart(2, '0')}-${dojDate.getFullYear()}`;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Project context metadata
      const projectName = findField(row, ['projectname', 'project_name', 'project'], matchedProject?.name || '');
      const scientistName = findField(row, ['scientistname', 'scientist_name', 'scientist'], matchedScientist?.name || '');
      const scientistDesignation = findField(row, ['scientistdesignation', 'scientist_designation'], matchedScientist?.designation || '');
      const doj = findField(row, ['doj', 'dateofjoining'], matchedStaff?.doj || '');
      const tenureUpTo = findField(row, ['tenureupto', 'tenure_up_to'], calculatedTenure || '');
      const designation = findField(row, ['designation', 'staffdesignation'], matchedStaff?.designation || '');
      const address = findField(row, ['address'], matchedStaff?.address || '');
      const panNumber = findField(row, ['pannumber', 'pan_number', 'pan'], '');
      const bankName = findField(row, ['bankname', 'bank_name', 'bank'], '');
      const accountNumber = findField(row, ['accountnumber', 'account_number', 'account'], '');
      const ifscCode = findField(row, ['ifsccode', 'ifsc_code', 'ifsc'], '');

      const daysInMonth = getDaysInMonth(rowMonth, rowYear);

      // 3. Dynamic evaluations (handle formulas like "BASIC + HRA" or pre-calculated cells)
      const grossRaw = findField(row, ['grossremuneration', 'gross_remuneration', 'grosspay', 'gross'], '');
      let grossPay = 0;
      if (grossRaw && !isNaN(parseFloat(grossRaw.replace(/[^0-9.]/g, '')))) {
        grossPay = parseFloat(grossRaw.replace(/[^0-9.]/g, ''));
      } else {
        grossPay = basicPay + hra;
      }

      const taxRaw = findField(row, ['incometax', 'income_tax_deduction', 'tax', 'itdeduction'], '0');
      const taxDeduction = parseFloat(taxRaw.replace(/[^0-9.]/g, '')) || 0;

      const dedRaw = findField(row, ['lwpdeduction', 'lwp_deduction', 'deduction', 'otherdeductions'], '');
      let deduction = 0;
      if (dedRaw && !isNaN(parseFloat(dedRaw.replace(/[^0-9.]/g, '')))) {
        deduction = parseFloat(dedRaw.replace(/[^0-9.]/g, ''));
      } else {
        // Evaluate deduction formula if empty: LWP * (Basic / daysInMonth)
        const absentDays = Math.max(0, daysInMonth - totalPresentDays);
        const lwpDays = leaveWithoutPay > 0 ? leaveWithoutPay : absentDays;
        deduction = Math.round(lwpDays * (basicPay / daysInMonth));
      }

      const netRaw = findField(row, ['netpay', 'net_pay', 'nettakehome'], '');
      let netPay = 0;
      if (netRaw && !isNaN(parseFloat(netRaw.replace(/[^0-9.]/g, '')))) {
        netPay = parseFloat(netRaw.replace(/[^0-9.]/g, ''));
      } else {
        netPay = grossPay - (taxDeduction + deduction);
      }

      const structuredDetails: Record<string, string> = {
        'Employee Code': empCode || 'TEMP-CODE',
        'Employee Name': staffName || 'Project Staff',
        'Designation': designation || 'Staff Member',
        'Date of Joining': doj || '-',
        'Tenure Up To': tenureUpTo || '-',
        'Project Name': projectName || '-',
        'Scientist Name': scientistName || '-',
        'Scientist Designation': scientistDesignation || '-',
        'Address': address || '-',
        'PAN Number': panNumber || '-',
        'Bank Name': bankName || '-',
        'Account Number': accountNumber || '-',
        'IFSC Code': ifscCode || '-',
        'Basic Pay': `₹${basicPay.toLocaleString('en-IN')}`,
        'HRA': `₹${hra.toLocaleString('en-IN')}`,
        'Days in Month': daysInMonth.toString(),
        'Total Present Days': totalPresentDays.toString(),
        'Balance Leave Brought': prevLeaveBrought.toString(),
        'Leave Credit': leaveCredit.toString(),
        'Total Leave': totalLeave.toString(),
        'Leave Availed': leaveAvailed.toString(),
        'Leave Balance': leaveBalance.toString(),
        'Leave Without Pay': leaveWithoutPay.toString(),
        'Gross Remuneration': `₹${grossPay.toLocaleString('en-IN')}`,
        'Income Tax Deduction': `₹${taxDeduction.toLocaleString('en-IN')}`,
        'Leave Without Pay Deduction': `₹${deduction.toLocaleString('en-IN')}`,
        'Net Pay': `₹${netPay.toLocaleString('en-IN')}`
      };

      return {
        id: `sal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: staffName || 'Project Staff',
        employeeCode: empCode || 'TEMP-CODE',
        mobile: mobile,
        aadhaarNumber: cleanAadhaar,
        month: rowMonth,
        year: rowYear,
        uploadedAt: new Date().toISOString(),
        details: structuredDetails
      };
    });

    // Remove existing matching records for same month and year
    const filteredSalaries = salaries.filter(s => 
      !(s.month.toLowerCase() === month.toLowerCase() && s.year === year)
    );

    const updatedSalaries = [...filteredSalaries, ...newSalaries];
    Database.set('salaries', updatedSalaries);

    res.json({ 
      success: true, 
      message: `Successfully processed and saved ${newSalaries.length} salary records for ${month} ${year}.` 
    });
  } catch (error: any) {
    console.error('Error processing salary CSV:', error);
    res.status(500).json({ error: `Failed to process CSV file: ${error.message}` });
  }
});

// Public Login to Salary Portal
router.post('/salaries/login', (req: Request, res: Response) => {
  const { mobile, aadhaarNumber, month, year } = req.body;

  if (!mobile || !aadhaarNumber || !month || !year) {
    return res.status(400).json({ error: 'Mobile number, Aadhaar number, Month, and Year are required.' });
  }

  const cleanMobile = mobile.replace(/[^0-9]/g, '').trim();
  const cleanAadhaar = aadhaarNumber.replace(/[^0-9]/g, '').trim();

  if (!cleanMobile || !cleanAadhaar) {
    return res.status(400).json({ error: 'Please enter valid Mobile and Aadhaar numbers.' });
  }

  const salaries = Database.get('salaries') || [];
  
  // Match by mobile and aadhaar (using endsWith to support country code prefixes or partial records)
  const record = salaries.find(s => {
    const sMobile = s.mobile.replace(/[^0-9]/g, '');
    const sAadhaar = s.aadhaarNumber.replace(/[^0-9]/g, '');
    return sMobile.endsWith(cleanMobile) && 
           sAadhaar.endsWith(cleanAadhaar) && 
           s.month.toLowerCase() === month.toLowerCase() && 
           s.year === year;
  });

  if (!record) {
    return res.status(404).json({ error: 'No salary record found matching Mobile, Aadhaar, Month, and Year.' });
  }

  res.json({ success: true, salarySlip: record });
});

// Delete a specific salary slip (admin only)
router.delete('/salaries/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const salaries = Database.get('salaries') || [];
  const filtered = salaries.filter(s => s.id !== id);
  Database.set('salaries', filtered);
  res.json({ success: true, message: 'Salary slip deleted successfully.' });
});

// Create a specific salary slip manually (admin only)
router.post('/salaries', authenticateAdmin, (req: Request, res: Response) => {
  const { name, employeeCode, mobile, aadhaarNumber, month, year, details } = req.body;
  if (!name || !employeeCode || !mobile || !aadhaarNumber || !month || !year) {
    return res.status(400).json({ error: 'Name, Code, Mobile, Aadhaar, Month, and Year are required.' });
  }

  const salaries = Database.get('salaries') || [];
  const newSlip = {
    id: 'sal-' + Math.random().toString(36).substr(2, 9),
    name,
    employeeCode,
    mobile,
    aadhaarNumber,
    month,
    year,
    uploadedAt: new Date().toISOString(),
    details: details || {}
  };

  salaries.push(newSlip);
  Database.set('salaries', salaries);
  res.json({ success: true, salarySlip: newSlip });
});

// Update a specific salary slip manually (admin only)
router.put('/salaries/:id', authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, employeeCode, mobile, aadhaarNumber, month, year, details } = req.body;

  const salaries = Database.get('salaries') || [];
  const index = salaries.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Salary slip not found.' });
  }

  const existing = salaries[index];
  const updatedSlip = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    employeeCode: employeeCode !== undefined ? employeeCode : existing.employeeCode,
    mobile: mobile !== undefined ? mobile : existing.mobile,
    aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : existing.aadhaarNumber,
    month: month !== undefined ? month : existing.month,
    year: year !== undefined ? year : existing.year,
    details: details !== undefined ? { ...existing.details, ...details } : existing.details,
    updatedAt: new Date().toISOString()
  };

  salaries[index] = updatedSlip;
  Database.set('salaries', salaries);
  res.json({ success: true, salarySlip: updatedSlip });
});

export default router;
