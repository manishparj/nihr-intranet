import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  LabEquipmentDatabase,
  Equipment,
  EquipmentDocument,
  EquipmentPhoto,
  LabApplicant,
  EquipmentBooking,
  LabActivityLog,
  LabSuperUser,
  hashPassword,
  hashSecretCode
} from './lab_equipment_db';

const router = express.Router();
router.use(express.json({ limit: '50mb' }));

const LAB_JWT_SECRET = 'nihr-lab-equipment-super-key-2026';

// In-memory Captcha Store for Lab Equipment Portal
const labCaptchaStore = new Map<string, { answer: number; expires: number }>();

// Ensure runtime upload subdirectories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const eqPhotosDir = path.join(uploadsDir, 'equipment_photos');
const eqDocsDir = path.join(uploadsDir, 'equipment_docs');

[uploadsDir, eqPhotosDir, eqDocsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to save base64 files directly to uploads subfolders
function saveLabFile(fileName: string, fileData: string, subfolder: string = 'equipment_photos'): string {
  if (!fileData || !fileName) return '';
  // If it's already an uploaded file path or external web URL, return it
  if (fileData.startsWith('/uploads/') || fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }
  if (fileData === 'base64_placeholder' || fileData.trim() === '') return '';

  try {
    const targetDir = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let base64Content = fileData;
    let detectedExt = '';

    if (fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      const header = parts[0];
      base64Content = parts[1];

      if (header.includes('image/png')) detectedExt = '.png';
      else if (header.includes('image/jpeg') || header.includes('image/jpg')) detectedExt = '.jpg';
      else if (header.includes('image/webp')) detectedExt = '.webp';
      else if (header.includes('image/gif')) detectedExt = '.gif';
      else if (header.includes('application/pdf')) detectedExt = '.pdf';
      else if (header.includes('word') || header.includes('docx')) detectedExt = '.docx';
      else if (header.includes('excel') || header.includes('xlsx')) detectedExt = '.xlsx';
    }

    const buffer = Buffer.from(base64Content, 'base64');
    let ext = path.extname(fileName) || detectedExt || (subfolder === 'equipment_photos' ? '.jpg' : '.pdf');
    if (!ext.startsWith('.')) ext = '.' + ext;
    
    const baseName = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9.\-_]/g, '_') || 'file';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${baseName}${ext}`;
    const filePath = path.join(targetDir, safeFileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${subfolder}/${safeFileName}`;
  } catch (error) {
    console.error('Error saving lab file to disk:', error);
    return '';
  }
}

// On startup: Migrate any existing base64 strings in database to physical files in uploads subfolders
function sanitizeAndMigrateLabFiles() {
  try {
    const equipments = LabEquipmentDatabase.get('equipments');
    let modified = false;

    equipments.forEach(eq => {
      // Migrate photos
      if (Array.isArray(eq.photos)) {
        eq.photos.forEach((p, i) => {
          if (p.url && (p.url.startsWith('data:') || p.url.length > 500)) {
            const diskUrl = saveLabFile(p.name || `photo_${i + 1}.jpg`, p.url, 'equipment_photos');
            if (diskUrl) {
              p.url = diskUrl;
              modified = true;
            }
          }
        });
      }

      // Migrate documents
      if (Array.isArray(eq.documents)) {
        eq.documents.forEach((d, i) => {
          if (d.fileData && (d.fileData.startsWith('data:') || d.fileData.length > 500)) {
            const diskUrl = saveLabFile(d.fileName || `doc_${i + 1}.pdf`, d.fileData, 'equipment_docs');
            if (diskUrl) {
              d.fileData = diskUrl;
              modified = true;
            }
          }
        });
      }
    });

    if (modified) {
      LabEquipmentDatabase.set('equipments', equipments);
      console.log('[NIHR Intranet] Successfully migrated legacy base64 files to disk in uploads subfolders.');
    }
  } catch (err) {
    console.error('[NIHR Intranet] Error migrating lab files:', err);
  }
}

// Run file sanitization migration
sanitizeAndMigrateLabFiles();

// Generate JWT for Lab Super User
function generateLabToken(payload: { id: string; email: string; name: string; role: string; department?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', LAB_JWT_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

// Verify JWT middleware for Lab Super User
function requireLabSuperUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Lab Equipment Super Admin authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return res.status(401).json({ error: 'Invalid token structure' });
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', LAB_JWT_SECRET).update(`${header}.${data}`).digest('base64url');
    if (signature !== expectedSig) return res.status(401).json({ error: 'Invalid token signature' });
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return res.status(401).json({ error: 'Lab Super Admin session expired' });

    (req as any).labSuperUser = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Authentication failed for Lab Equipment Super Admin' });
  }
}

// =========================================================================
// 1. OFFLINE INTRANET CAPTCHA ENGINE
// =========================================================================
router.get('/captcha', (req: Request, res: Response) => {
  const num1 = Math.floor(Math.random() * 12) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const isAdd = Math.random() > 0.3;
  const question = isAdd ? `${num1} + ${num2} = ?` : `${num1 + num2} - ${num1} = ?`;
  const answer = isAdd ? num1 + num2 : num2;

  const captchaId = 'lab-cap-' + crypto.randomBytes(8).toString('hex');
  labCaptchaStore.set(captchaId, {
    answer,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  // Clean old expired entries
  const now = Date.now();
  for (const [key, val] of labCaptchaStore.entries()) {
    if (val.expires < now) {
      labCaptchaStore.delete(key);
    }
  }

  res.json({ captchaId, question });
});

// =========================================================================
// 2. SUPER ADMIN AUTHENTICATION
// =========================================================================
router.post('/admin/login', (req: Request, res: Response) => {
  const { email, password, captchaId, captchaAnswer } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Validate Captcha
  if (!captchaId || captchaAnswer === undefined) {
    return res.status(400).json({ error: 'Please enter the security captcha answer.' });
  }
  const captcha = labCaptchaStore.get(captchaId);
  if (!captcha || captcha.expires < Date.now()) {
    return res.status(400).json({ error: 'Captcha has expired. Please refresh the captcha.' });
  }
  if (parseInt(captchaAnswer, 10) !== captcha.answer) {
    return res.status(400).json({ error: 'Incorrect security captcha calculation.' });
  }
  labCaptchaStore.delete(captchaId);

  const superUsers = LabEquipmentDatabase.get('superUsers');
  const user = superUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid Super Admin credentials.' });
  }

  const token = generateLabToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department
  });

  // Log login activity
  LabEquipmentDatabase.addActivityLog({
    actionType: 'Equipment Updated',
    description: `Super Admin "${user.name}" logged into Central Lab Equipment Portal.`,
    actor: user.name
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});

router.get('/admin/me', requireLabSuperUser, (req: Request, res: Response) => {
  res.json({ user: (req as any).labSuperUser });
});

// =========================================================================
// 3. PUBLIC EQUIPMENT DIRECTORY (VIEW-ONLY)
// =========================================================================
router.get('/equipments', (req: Request, res: Response) => {
  const equipments = LabEquipmentDatabase.get('equipments');
  const bookings = LabEquipmentDatabase.get('bookings');
  
  // Strip sensitive internal fields for public view & attach active booking details if booked
  const publicEquipments = equipments.map(eq => {
    // Check if equipment is currently booked by an approved booking
    const activeBooking = bookings.find(b => 
      b.status === 'Approved' && 
      Array.isArray(b.equipmentIds) && 
      b.equipmentIds.includes(eq.id)
    );

    return {
      id: eq.id,
      name: eq.name,
      approvedAbbreviation: eq.approvedAbbreviation,
      location: eq.location,
      currentLocation: eq.currentLocation,
      make: eq.make,
      model: eq.model,
      category: eq.category,
      departmentName: eq.departmentName,
      facilityName: eq.facilityName,
      prismServiceCategory: eq.prismServiceCategory,
      yearOfPurchase: eq.yearOfPurchase,
      purposeApplication: eq.purposeApplication,
      description: eq.description,
      operationalStatus: eq.operationalStatus,
      photos: eq.photos || [],
      publicDocCount: eq.documents ? eq.documents.length : 0,
      publicDocuments: (eq.documents || []).map(d => ({
        id: d.id,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        fileData: d.fileData
      })),
      activeBooking: activeBooking ? {
        id: activeBooking.id,
        bookedBy: activeBooking.applicantName,
        applicantEmail: activeBooking.applicantEmail,
        applicantMobile: activeBooking.applicantMobile,
        fromDateTime: activeBooking.fromDateTime,
        toDateTime: activeBooking.toDateTime,
        purposeRemark: activeBooking.purposeRemark,
        durationHours: activeBooking.durationHours
      } : null
    };
  });

  res.json(publicEquipments);
});

// =========================================================================
// 4. SUPER ADMIN EQUIPMENT MASTER CRUD
// =========================================================================
router.get('/admin/equipments', requireLabSuperUser, (req: Request, res: Response) => {
  const equipments = LabEquipmentDatabase.get('equipments');
  const bookings = LabEquipmentDatabase.get('bookings');

  const equipmentsWithBookings = equipments.map(eq => {
    const activeBooking = bookings.find(b => 
      b.status === 'Approved' && 
      Array.isArray(b.equipmentIds) && 
      b.equipmentIds.includes(eq.id)
    );

    return {
      ...eq,
      activeBooking: activeBooking ? {
        id: activeBooking.id,
        bookedBy: activeBooking.applicantName,
        applicantEmail: activeBooking.applicantEmail,
        applicantMobile: activeBooking.applicantMobile,
        fromDateTime: activeBooking.fromDateTime,
        toDateTime: activeBooking.toDateTime,
        purposeRemark: activeBooking.purposeRemark,
        durationHours: activeBooking.durationHours
      } : null
    };
  });

  res.json(equipmentsWithBookings);
});

// Direct file upload endpoint (saves file directly into uploads subfolder)
router.post('/admin/upload-file', requireLabSuperUser, (req: Request, res: Response) => {
  const { fileName, fileData, subfolder } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'fileName and fileData are required for upload.' });
  }

  const targetSubfolder = subfolder === 'equipment_docs' ? 'equipment_docs' : 'equipment_photos';
  const diskUrl = saveLabFile(fileName, fileData, targetSubfolder);

  if (!diskUrl) {
    return res.status(500).json({ error: 'Failed to save file to server storage.' });
  }

  // Calculate approximate file size
  let sizeStr = '1.0 MB';
  try {
    const rawData = fileData.includes(';base64,') ? fileData.split(';base64,')[1] : fileData;
    const bytes = Buffer.byteLength(rawData, 'base64');
    if (bytes < 1024 * 1024) {
      sizeStr = `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      sizeStr = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (e) {
    // default size
  }

  res.json({
    success: true,
    url: diskUrl,
    fileName,
    fileSize: sizeStr
  });
});

router.post('/admin/equipments', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const body = req.body;

  if (!body.name || !body.category || !body.operationalStatus || !body.yearOfPurchase) {
    return res.status(400).json({ error: 'Equipment Name, Category, Operational Status, and Year of Purchase are required.' });
  }

  // Parse alert emails
  let alertEmails: string[] = [];
  if (Array.isArray(body.alertEmails)) {
    alertEmails = body.alertEmails;
  } else if (typeof body.alertEmails === 'string') {
    alertEmails = body.alertEmails.split(',').map(e => e.trim()).filter(Boolean);
  }
  if (alertEmails.length === 0) {
    alertEmails = ['harvinders.hq@icmr.gov.in'];
  }

  // Process photos (max 4) -> write any base64 to uploads/equipment_photos
  const processedPhotos: EquipmentPhoto[] = [];
  if (Array.isArray(body.photos)) {
    for (let i = 0; i < Math.min(body.photos.length, 4); i++) {
      const p = body.photos[i];
      if (p) {
        const rawContent = p.data || p.url || '';
        let finalUrl = '';
        if (typeof rawContent === 'string' && (rawContent.startsWith('data:') || rawContent.length > 500)) {
          finalUrl = saveLabFile(p.name || `photo_${i + 1}.jpg`, rawContent, 'equipment_photos');
        } else if (typeof rawContent === 'string' && (rawContent.startsWith('/uploads/') || rawContent.startsWith('http'))) {
          finalUrl = rawContent;
        }

        if (finalUrl) {
          processedPhotos.push({
            id: p.id || 'p-' + Date.now() + '-' + i,
            url: finalUrl,
            name: p.name || `Equipment_Photo_${i + 1}`,
            uploadedAt: p.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)
          });
        }
      }
    }
  }

  // Process documents checklist -> write any base64 to uploads/equipment_docs
  const processedDocs: EquipmentDocument[] = [];
  if (Array.isArray(body.documents)) {
    for (const d of body.documents) {
      if (d && (d.fileName || d.name)) {
        const rawContent = d.data || d.fileData || d.url || '';
        let finalUrl = '';
        if (typeof rawContent === 'string' && (rawContent.startsWith('data:') || rawContent.length > 500)) {
          finalUrl = saveLabFile(d.fileName || d.name || 'Document.pdf', rawContent, 'equipment_docs');
        } else if (typeof rawContent === 'string' && (rawContent.startsWith('/uploads/') || rawContent.startsWith('http'))) {
          finalUrl = rawContent;
        }

        processedDocs.push({
          id: d.id || 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          fileName: d.fileName || d.name || 'Document.pdf',
          fileType: d.fileType || 'Manual',
          fileData: finalUrl,
          fileSize: d.fileSize || '1.0 MB',
          uploadedBy: d.uploadedBy || actor,
          uploadedAt: d.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }
    }
  }

  const equipments = LabEquipmentDatabase.get('equipments');
  const count = equipments.length + 1;
  const newId = `EQ-2026-${count.toString().padStart(3, '0')}`;

  const newEquipment: Equipment = {
    id: newId,
    name: body.name.trim(),
    approvedAbbreviation: body.approvedAbbreviation?.trim() || '',
    location: body.location?.trim() || '',
    currentLocation: body.currentLocation?.trim() || body.location?.trim() || '',
    make: body.make?.trim() || '',
    model: body.model?.trim() || '',
    serialNo: body.serialNo?.trim() || '',
    fundingAgencyType: body.fundingAgencyType || 'Institute',
    fundingAgencyDetails: body.fundingAgencyDetails?.trim() || '',
    description: body.description?.trim() || '',
    departmentName: body.departmentName?.trim() || 'Central Instrumentation Facility',
    facilityName: body.facilityName?.trim() || '',
    basicCost: body.basicCost !== undefined ? (typeof body.basicCost === 'string' ? (isNaN(Number(body.basicCost.replace(/[^0-9.]/g, ''))) ? body.basicCost : Number(body.basicCost.replace(/[^0-9.]/g, ''))) : body.basicCost) : undefined,
    warrantyEndDate: body.warrantyEndDate || '',
    category: body.category,
    alertEmails,
    prismServiceCategory: body.prismServiceCategory || '',
    yearOfPurchase: body.yearOfPurchase,
    purposeApplication: body.purposeApplication?.trim() || '',
    operationalStatus: body.operationalStatus || 'Working',
    amcEndDate: body.amcEndDate || '',
    photos: processedPhotos,
    documents: processedDocs,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  equipments.unshift(newEquipment);
  LabEquipmentDatabase.set('equipments', equipments);

  LabEquipmentDatabase.addActivityLog({
    equipmentId: newEquipment.id,
    equipmentName: newEquipment.name,
    actionType: 'Equipment Created',
    description: `Added new equipment "${newEquipment.name}" (${newEquipment.category}, Status: ${newEquipment.operationalStatus}).`,
    actor
  });

  res.status(201).json(newEquipment);
});

router.put('/admin/equipments/:id', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;
  const body = req.body;

  const equipments = LabEquipmentDatabase.get('equipments');
  const idx = equipments.findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const existing = equipments[idx];
  const statusChanged = body.operationalStatus && body.operationalStatus !== existing.operationalStatus;
  const locationChanged = body.currentLocation && body.currentLocation !== existing.currentLocation;

  // Process photos (max 4) -> write any base64 to uploads/equipment_photos
  let processedPhotos = existing.photos || [];
  if (Array.isArray(body.photos)) {
    processedPhotos = [];
    for (let i = 0; i < Math.min(body.photos.length, 4); i++) {
      const p = body.photos[i];
      if (p) {
        const rawContent = p.data || p.url || '';
        let finalUrl = '';
        if (typeof rawContent === 'string' && (rawContent.startsWith('data:') || rawContent.length > 500)) {
          finalUrl = saveLabFile(p.name || `photo_${i + 1}.jpg`, rawContent, 'equipment_photos');
        } else if (typeof rawContent === 'string' && (rawContent.startsWith('/uploads/') || rawContent.startsWith('http'))) {
          finalUrl = rawContent;
        }

        if (finalUrl) {
          processedPhotos.push({
            id: p.id || 'p-' + Date.now() + '-' + i,
            url: finalUrl,
            name: p.name || `Equipment_Photo_${i + 1}`,
            uploadedAt: p.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)
          });
        }
      }
    }
  }

  // Process documents checklist -> write any base64 to uploads/equipment_docs
  let processedDocs = existing.documents || [];
  if (Array.isArray(body.documents)) {
    processedDocs = [];
    for (const d of body.documents) {
      if (d && (d.fileName || d.name)) {
        const rawContent = d.data || d.fileData || d.url || '';
        let finalUrl = '';
        if (typeof rawContent === 'string' && (rawContent.startsWith('data:') || rawContent.length > 500)) {
          finalUrl = saveLabFile(d.fileName || d.name || 'Document.pdf', rawContent, 'equipment_docs');
        } else if (typeof rawContent === 'string' && (rawContent.startsWith('/uploads/') || rawContent.startsWith('http'))) {
          finalUrl = rawContent;
        }

        processedDocs.push({
          id: d.id || 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          fileName: d.fileName || d.name || 'Document.pdf',
          fileType: d.fileType || 'Manual',
          fileData: finalUrl,
          fileSize: d.fileSize || '1.0 MB',
          uploadedBy: d.uploadedBy || actor,
          uploadedAt: d.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }
    }
  }

  // Parse alert emails
  let alertEmails = existing.alertEmails;
  if (Array.isArray(body.alertEmails)) {
    alertEmails = body.alertEmails;
  } else if (typeof body.alertEmails === 'string') {
    alertEmails = body.alertEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
  }

  const updated: Equipment = {
    ...existing,
    name: body.name !== undefined ? body.name.trim() : existing.name,
    approvedAbbreviation: body.approvedAbbreviation !== undefined ? body.approvedAbbreviation.trim() : existing.approvedAbbreviation,
    location: body.location !== undefined ? body.location.trim() : existing.location,
    currentLocation: body.currentLocation !== undefined ? body.currentLocation.trim() : existing.currentLocation,
    make: body.make !== undefined ? body.make.trim() : existing.make,
    model: body.model !== undefined ? body.model.trim() : existing.model,
    serialNo: body.serialNo !== undefined ? body.serialNo.trim() : existing.serialNo,
    fundingAgencyType: body.fundingAgencyType || existing.fundingAgencyType,
    fundingAgencyDetails: body.fundingAgencyDetails !== undefined ? body.fundingAgencyDetails.trim() : existing.fundingAgencyDetails,
    description: body.description !== undefined ? body.description.trim() : existing.description,
    departmentName: body.departmentName !== undefined ? body.departmentName.trim() : existing.departmentName,
    facilityName: body.facilityName !== undefined ? body.facilityName.trim() : existing.facilityName,
    basicCost: body.basicCost !== undefined ? (typeof body.basicCost === 'string' ? (isNaN(Number(body.basicCost.replace(/[^0-9.]/g, ''))) ? body.basicCost : Number(body.basicCost.replace(/[^0-9.]/g, ''))) : body.basicCost) : existing.basicCost,
    warrantyEndDate: body.warrantyEndDate !== undefined ? body.warrantyEndDate : existing.warrantyEndDate,
    category: body.category || existing.category,
    alertEmails: alertEmails || existing.alertEmails,
    prismServiceCategory: body.prismServiceCategory !== undefined ? body.prismServiceCategory : existing.prismServiceCategory,
    yearOfPurchase: body.yearOfPurchase || existing.yearOfPurchase,
    purposeApplication: body.purposeApplication !== undefined ? body.purposeApplication.trim() : existing.purposeApplication,
    operationalStatus: body.operationalStatus || existing.operationalStatus,
    amcEndDate: body.amcEndDate !== undefined ? body.amcEndDate : existing.amcEndDate,
    photos: processedPhotos,
    documents: processedDocs,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  equipments[idx] = updated;
  LabEquipmentDatabase.set('equipments', equipments);

  if (statusChanged) {
    LabEquipmentDatabase.addActivityLog({
      equipmentId: updated.id,
      equipmentName: updated.name,
      actionType: 'Status Changed',
      description: `Status changed from "${existing.operationalStatus}" to "${updated.operationalStatus}".`,
      actor
    });
  }

  if (locationChanged) {
    LabEquipmentDatabase.addActivityLog({
      equipmentId: updated.id,
      equipmentName: updated.name,
      actionType: 'Location Changed',
      description: `Location moved from "${existing.currentLocation || existing.location}" to "${updated.currentLocation}".`,
      actor
    });
  }

  LabEquipmentDatabase.addActivityLog({
    equipmentId: updated.id,
    equipmentName: updated.name,
    actionType: 'Equipment Updated',
    description: `Updated record details for "${updated.name}".`,
    actor
  });

  res.json(updated);
});

router.delete('/admin/equipments/:id', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;

  const equipments = LabEquipmentDatabase.get('equipments');
  const eq = equipments.find(e => e.id === id);
  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const filtered = equipments.filter(e => e.id !== id);
  LabEquipmentDatabase.set('equipments', filtered);

  LabEquipmentDatabase.addActivityLog({
    equipmentId: id,
    equipmentName: eq.name,
    actionType: 'Equipment Deleted',
    description: `Deleted equipment record "${eq.name}" (${id}).`,
    actor
  });

  res.json({ message: 'Equipment deleted successfully.' });
});

// Bulk Import Equipments from CSV / Excel Array
router.post('/admin/equipments/bulk-import', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { equipments: incomingList } = req.body;

  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return res.status(400).json({ error: 'Equipments array is required for bulk import.' });
  }

  const existingEquipments = LabEquipmentDatabase.get('equipments');
  let currentMaxNum = 0;
  existingEquipments.forEach(e => {
    const match = e.id.match(/EQ-2026-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > currentMaxNum) currentMaxNum = num;
    }
  });

  const inserted: Equipment[] = [];
  const errors: string[] = [];

  incomingList.forEach((item, index) => {
    if (!item.name || !String(item.name).trim()) {
      errors.push(`Row #${index + 1}: Equipment Name is required.`);
      return;
    }

    currentMaxNum++;
    const newId = item.id && !existingEquipments.some(e => e.id === item.id) 
      ? item.id 
      : `EQ-2026-${currentMaxNum.toString().padStart(3, '0')}`;

    let alertEmails: string[] = [];
    if (Array.isArray(item.alertEmails)) {
      alertEmails = item.alertEmails;
    } else if (typeof item.alertEmails === 'string' && item.alertEmails.trim()) {
      alertEmails = item.alertEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
    }
    if (alertEmails.length === 0) {
      alertEmails = ['harvinders.hq@icmr.gov.in'];
    }

    let parsedCost: number | string | undefined = undefined;
    if (item.basicCost !== undefined && item.basicCost !== null && String(item.basicCost).trim() !== '') {
      const numericVal = Number(String(item.basicCost).replace(/[^0-9.]/g, ''));
      parsedCost = isNaN(numericVal) ? String(item.basicCost).trim() : numericVal;
    }

    const newEq: Equipment = {
      id: newId,
      name: String(item.name).trim(),
      approvedAbbreviation: item.approvedAbbreviation ? String(item.approvedAbbreviation).trim() : '',
      location: item.location ? String(item.location).trim() : 'Central Laboratory',
      currentLocation: item.currentLocation ? String(item.currentLocation).trim() : (item.location ? String(item.location).trim() : 'Central Laboratory'),
      make: item.make ? String(item.make).trim() : '',
      model: item.model ? String(item.model).trim() : '',
      serialNo: item.serialNo ? String(item.serialNo).trim() : '',
      fundingAgencyType: item.fundingAgencyType ? String(item.fundingAgencyType).trim() : 'Govt',
      fundingAgencyDetails: item.fundingAgencyDetails ? String(item.fundingAgencyDetails).trim() : '',
      description: item.description ? String(item.description).trim() : '',
      departmentName: item.departmentName ? String(item.departmentName).trim() : 'Central Instrumentation Facility (CIF)',
      facilityName: item.facilityName ? String(item.facilityName).trim() : '',
      basicCost: parsedCost,
      warrantyEndDate: item.warrantyEndDate ? String(item.warrantyEndDate).trim() : '',
      category: item.category ? String(item.category).trim() : 'Research Infrastructure',
      alertEmails,
      prismServiceCategory: item.prismServiceCategory ? String(item.prismServiceCategory).trim() : '',
      yearOfPurchase: item.yearOfPurchase ? String(item.yearOfPurchase).trim() : String(new Date().getFullYear()),
      purposeApplication: item.purposeApplication ? String(item.purposeApplication).trim() : '',
      operationalStatus: (item.operationalStatus ? String(item.operationalStatus).trim() : 'Working') as any,
      amcEndDate: item.amcEndDate ? String(item.amcEndDate).trim() : '',
      photos: Array.isArray(item.photos) ? item.photos : [],
      documents: Array.isArray(item.documents) ? item.documents : [],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    inserted.push(newEq);
  });

  if (inserted.length === 0) {
    return res.status(400).json({ error: 'No valid equipment records could be imported.', details: errors });
  }

  // Prepend inserted equipments
  const updatedEquipments = [...inserted, ...existingEquipments];
  LabEquipmentDatabase.set('equipments', updatedEquipments);

  LabEquipmentDatabase.addActivityLog({
    actionType: 'Equipment Created',
    description: `Bulk imported ${inserted.length} equipment records into master directory from CSV/Batch upload.`,
    actor
  });

  res.status(201).json({
    success: true,
    count: inserted.length,
    equipments: inserted,
    errors: errors.length > 0 ? errors : undefined
  });
});

// =========================================================================
// 5. APPLICANT MASTER CRUD & PUBLIC LOOKUP
// =========================================================================

// Public applicant list for auto-populate in booking form
router.get('/applicants/public-list', (req: Request, res: Response) => {
  const applicants = LabEquipmentDatabase.get('applicants');
  const activeList = applicants
    .filter(a => a.status === 'Active')
    .map(a => ({
      id: a.id,
      name: a.name,
      mobile: a.mobile,
      email: a.email,
      department: a.department,
      designation: a.designation
    }));
  res.json(activeList);
});

// Admin applicant full list
router.get('/admin/applicants', requireLabSuperUser, (req: Request, res: Response) => {
  const applicants = LabEquipmentDatabase.get('applicants');
  // Return applicant data; secret code hash is not plaintext, but we provide last updated/status
  res.json(applicants);
});

router.post('/admin/applicants', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { name, mobile, email, designation, department, customCode, secretCode } = req.body;

  if (!name || !mobile || !email) {
    return res.status(400).json({ error: 'Applicant Name, Mobile Number, and Email are required.' });
  }

  const cleanMobile = mobile.trim();
  if (!/^\d{10}$/.test(cleanMobile)) {
    return res.status(400).json({ error: 'Mobile number must be a valid 10-digit number.' });
  }

  const applicants = LabEquipmentDatabase.get('applicants');
  if (applicants.some(a => a.mobile === cleanMobile)) {
    return res.status(400).json({ error: 'An applicant with this mobile number already exists.' });
  }

  // Generate 8-digit secret code if not provided or invalid
  const inputCode = (secretCode || customCode || '').toString().trim();
  let rawCode = inputCode;
  if (!/^\d{8}$/.test(rawCode)) {
    // Generate random 8-digit numeric code
    rawCode = Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  const newId = 'app-' + (applicants.length + 1);
  const newApplicant: LabApplicant = {
    id: newId,
    name: name.trim(),
    mobile: cleanMobile,
    email: email.trim().toLowerCase(),
    designation: designation?.trim() || '',
    department: department?.trim() || '',
    secretCode: rawCode,
    secretCodeHash: hashSecretCode(rawCode),
    secretCodeHint: `Issued on ${new Date().toISOString().split('T')[0]}`,
    status: 'Active',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  applicants.unshift(newApplicant);
  LabEquipmentDatabase.set('applicants', applicants);

  LabEquipmentDatabase.addActivityLog({
    actionType: 'Applicant Created',
    description: `Added new pre-approved applicant "${newApplicant.name}" (Mobile: ${newApplicant.mobile}, Passcode: ${rawCode}).`,
    actor
  });

  // Return the newly created raw 8-digit code so admin can view/copy and hand over to applicant
  res.status(201).json({
    applicant: newApplicant,
    generatedSecretCode: rawCode,
    message: `Applicant registered successfully. 8-digit Secret Code: ${rawCode}`
  });
});

router.put('/admin/applicants/:id', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;
  const { name, email, designation, department, status, mobile, secretCode, customCode } = req.body;

  const applicants = LabEquipmentDatabase.get('applicants');
  const idx = applicants.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Applicant not found.' });
  }

  const existing = applicants[idx];
  if (mobile && mobile.trim() !== existing.mobile) {
    if (!/^\d{10}$/.test(mobile.trim())) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number.' });
    }
    if (applicants.some(a => a.id !== id && a.mobile === mobile.trim())) {
      return res.status(400).json({ error: 'Another applicant with this mobile number already exists.' });
    }
    existing.mobile = mobile.trim();
  }

  // Update secret code if provided
  const inputCode = (secretCode || customCode || '').toString().trim();
  if (inputCode) {
    if (!/^\d{8}$/.test(inputCode)) {
      return res.status(400).json({ error: 'Applicant secret passcode must be exactly 8 numeric digits.' });
    }
    if (inputCode !== existing.secretCode) {
      existing.secretCode = inputCode;
      existing.secretCodeHash = hashSecretCode(inputCode);
      existing.secretCodeHint = `Updated by Admin on ${new Date().toISOString().split('T')[0]}`;
      LabEquipmentDatabase.addActivityLog({
        actionType: 'Applicant Code Reset',
        description: `Updated 8-digit secret passcode for applicant "${existing.name}" (${existing.mobile}).`,
        actor
      });
    }
  }

  existing.name = name ? name.trim() : existing.name;
  existing.email = email ? email.trim().toLowerCase() : existing.email;
  existing.designation = designation !== undefined ? designation.trim() : existing.designation;
  existing.department = department !== undefined ? department.trim() : existing.department;
  existing.status = status || existing.status;
  existing.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  applicants[idx] = existing;
  LabEquipmentDatabase.set('applicants', applicants);

  res.json(existing);
});

// Admin reset / regenerate 8-digit Secret Code for an applicant
router.post('/admin/applicants/:id/reset-code', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;
  const { customCode, secretCode } = req.body;

  const applicants = LabEquipmentDatabase.get('applicants');
  const idx = applicants.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Applicant not found.' });
  }

  const inputCode = (secretCode || customCode || '').toString().trim();
  let newRawCode = inputCode;
  if (!/^\d{8}$/.test(newRawCode)) {
    newRawCode = Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  const applicant = applicants[idx];
  applicant.secretCode = newRawCode;
  applicant.secretCodeHash = hashSecretCode(newRawCode);
  applicant.secretCodeHint = `Reset on ${new Date().toISOString().split('T')[0]}`;
  applicant.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  applicants[idx] = applicant;
  LabEquipmentDatabase.set('applicants', applicants);

  LabEquipmentDatabase.addActivityLog({
    actionType: 'Applicant Code Reset',
    description: `Reset 8-digit secret code for applicant "${applicant.name}" (${applicant.mobile}) to ${newRawCode}.`,
    actor
  });

  res.json({
    applicant,
    newSecretCode: newRawCode,
    message: `Secret code reset successfully for ${applicant.name}. New 8-digit Secret Code: ${newRawCode}`
  });
});

router.delete('/admin/applicants/:id', requireLabSuperUser, (req: Request, res: Response) => {
  const { id } = req.params;
  const applicants = LabEquipmentDatabase.get('applicants');
  const app = applicants.find(a => a.id === id);
  if (!app) {
    return res.status(404).json({ error: 'Applicant not found.' });
  }

  const filtered = applicants.filter(a => a.id !== id);
  LabEquipmentDatabase.set('applicants', filtered);

  res.json({ message: 'Applicant removed successfully.' });
});

// =========================================================================
// 6. APPLICANT BOOKING SUBMISSION & STATUS CHECK
// =========================================================================

// Submit new booking
router.post('/bookings', (req: Request, res: Response) => {
  const {
    applicantName,
    mobile,
    secretCode,
    equipmentIds,
    fromDateTime,
    toDateTime,
    purposeRemark,
    captchaId,
    captchaAnswer
  } = req.body;

  if (!mobile || !secretCode || !equipmentIds || equipmentIds.length === 0 || !fromDateTime || !toDateTime || !purposeRemark) {
    return res.status(400).json({ error: 'All fields (Applicant, Secret Code, Equipments, Dates, and Purpose) are mandatory.' });
  }

  // Validate Captcha
  if (!captchaId || captchaAnswer === undefined) {
    return res.status(400).json({ error: 'Please enter the security captcha answer.' });
  }
  const captcha = labCaptchaStore.get(captchaId);
  if (!captcha || captcha.expires < Date.now()) {
    return res.status(400).json({ error: 'Captcha has expired. Please refresh the captcha.' });
  }
  if (parseInt(captchaAnswer, 10) !== captcha.answer) {
    return res.status(400).json({ error: 'Incorrect security captcha answer.' });
  }
  labCaptchaStore.delete(captchaId);

  // Validate Secret Code against Applicant
  const applicants = LabEquipmentDatabase.get('applicants');
  const applicant = applicants.find(a => a.mobile === mobile.trim() && a.status === 'Active');
  if (!applicant) {
    return res.status(400).json({ error: 'Applicant mobile number not found in approved active registry.' });
  }

  const inputHash = hashSecretCode(secretCode.trim());
  if (applicant.secretCodeHash !== inputHash) {
    return res.status(401).json({ error: 'Invalid 8-digit Secret Code. Please enter the correct code issued by Super Admin.' });
  }

  // Get selected equipment names
  const allEquipments = LabEquipmentDatabase.get('equipments');
  const selectedEquipments = allEquipments.filter(e => equipmentIds.includes(e.id));
  if (selectedEquipments.length === 0) {
    return res.status(400).json({ error: 'Please select at least one valid equipment from the live directory.' });
  }

  const equipmentNames = selectedEquipments.map(e => e.name);

  // Calculate duration
  let durationHours = 0;
  try {
    const start = new Date(fromDateTime).getTime();
    const end = new Date(toDateTime).getTime();
    if (end <= start) {
      return res.status(400).json({ error: 'Booking "To Date & Time" must be after "From Date & Time".' });
    }
    durationHours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  } catch (e) {
    durationHours = 0;
  }

  const bookings = LabEquipmentDatabase.get('bookings');
  const newBookingId = `BK-2026-${(1001 + bookings.length).toString()}`;

  const newBooking: EquipmentBooking = {
    id: newBookingId,
    applicantId: applicant.id,
    applicantName: applicant.name,
    applicantMobile: applicant.mobile,
    applicantEmail: applicant.email,
    equipmentIds,
    equipmentNames,
    fromDateTime,
    toDateTime,
    durationHours,
    purposeRemark: purposeRemark.trim(),
    status: 'Pending',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  bookings.unshift(newBooking);
  LabEquipmentDatabase.set('bookings', bookings);

  // Log activity
  LabEquipmentDatabase.addActivityLog({
    actionType: 'Booking Submitted',
    description: `New booking request ${newBookingId} submitted by ${applicant.name} for ${equipmentNames.join(', ')}.`,
    actor: `${applicant.name} (Applicant)`
  });

  res.status(201).json({
    booking: newBooking,
    message: `Booking request ${newBookingId} submitted successfully! It is now in the Super Admin review queue.`
  });
});

// Check booking status by mobile (+ optional secret code)
router.get('/bookings/check-status', (req: Request, res: Response) => {
  const { mobile, secretCode } = req.query;

  if (!mobile || typeof mobile !== 'string') {
    return res.status(400).json({ error: 'Mobile number is required to search booking status.' });
  }

  const cleanMobile = mobile.trim();
  const applicants = LabEquipmentDatabase.get('applicants');
  const applicant = applicants.find(a => a.mobile === cleanMobile);

  // If secret code provided, verify it
  if (secretCode && typeof secretCode === 'string' && applicant) {
    const inputHash = hashSecretCode(secretCode.trim());
    if (applicant.secretCodeHash !== inputHash) {
      return res.status(401).json({ error: 'Invalid 8-digit Secret Code for this mobile number.' });
    }
  }

  const bookings = LabEquipmentDatabase.get('bookings');
  const applicantBookings = bookings.filter(b => b.applicantMobile === cleanMobile);

  res.json({
    applicantName: applicant ? applicant.name : null,
    bookings: applicantBookings
  });
});

// =========================================================================
// 7. SUPER ADMIN BOOKING QUEUE & APPROVAL/REJECTION
// =========================================================================
router.get('/admin/bookings', requireLabSuperUser, (req: Request, res: Response) => {
  const bookings = LabEquipmentDatabase.get('bookings');
  res.json(bookings);
});

router.put('/admin/bookings/:id/status', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;
  const { status, adminRemark } = req.body;

  if (!status || !['Approved', 'Rejected', 'Pending', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (Approved, Rejected, Pending, Completed).' });
  }

  if ((status === 'Approved' || status === 'Rejected') && (!adminRemark || adminRemark.trim() === '')) {
    return res.status(400).json({ error: 'Mandatory Admin Remark is required when approving or rejecting a booking.' });
  }

  const bookings = LabEquipmentDatabase.get('bookings');
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Booking request not found.' });
  }

  const booking = bookings[idx];
  booking.status = status;
  booking.adminRemark = adminRemark ? adminRemark.trim() : booking.adminRemark;
  booking.reviewedBy = actor;
  booking.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  booking.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  bookings[idx] = booking;
  LabEquipmentDatabase.set('bookings', bookings);

  // Log activity
  LabEquipmentDatabase.addActivityLog({
    actionType: status === 'Approved' ? 'Booking Approved' : (status === 'Rejected' ? 'Booking Rejected' : 'Equipment Updated'),
    description: `Booking #${booking.id} (${booking.applicantName}) ${status.toLowerCase()} by ${actor}. Remark: "${booking.adminRemark}"`,
    actor
  });

  res.json(booking);
});

// Admin explicit Release Booking endpoint (frees up instrument and removes booking from public directory)
router.post('/admin/bookings/:id/release', requireLabSuperUser, (req: Request, res: Response) => {
  const actor = (req as any).labSuperUser?.name || 'Super Admin';
  const { id } = req.params;
  const { remark } = req.body;

  const bookings = LabEquipmentDatabase.get('bookings');
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Booking request not found.' });
  }

  const booking = bookings[idx];
  booking.status = 'Completed';
  booking.adminRemark = remark ? remark.trim() : (booking.adminRemark ? `${booking.adminRemark} [Released by ${actor}]` : `Booking completed and slot released by ${actor}.`);
  booking.reviewedBy = actor;
  booking.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  booking.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  bookings[idx] = booking;
  LabEquipmentDatabase.set('bookings', bookings);

  // Log activity
  LabEquipmentDatabase.addActivityLog({
    actionType: 'Equipment Updated',
    description: `Booking #${booking.id} (${booking.applicantName}) released by ${actor}. Instrument(s) ${booking.equipmentNames.join(', ')} are now available in Public Directory.`,
    actor
  });

  res.json({
    message: `Booking #${booking.id} released successfully. Equipment returned to available status.`,
    booking
  });
});

// =========================================================================
// 8. ACTIVITY & MOVEMENT AUDIT TRAIL LOGS
// =========================================================================
router.get('/admin/activity-logs', requireLabSuperUser, (req: Request, res: Response) => {
  const logs = LabEquipmentDatabase.get('activityLogs');
  res.json(logs);
});

export default router;
