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
  ExperienceEntry
} from './db';

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
function generateToken(payload: { id: string; email: string; name: string }): string {
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

export default router;
