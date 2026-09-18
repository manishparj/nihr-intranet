export interface EquipmentDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileData?: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface EquipmentPhoto {
  id: string;
  url: string;
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
  id: string;
  name: string;
  approvedAbbreviation?: string;
  location?: string;
  currentLocation?: string;
  make?: string;
  model?: string;
  serialNo?: string;
  fundingAgencyType?: string;
  fundingAgencyDetails?: string;
  description?: string;
  departmentName?: string;
  facilityName?: string;
  basicCost?: number | string;
  warrantyEndDate?: string;
  category: string;
  alertEmails: string[];
  prismServiceCategory?: string;
  yearOfPurchase: string | number;
  purposeApplication?: string;
  operationalStatus: 'Working' | 'Under Maintenance' | 'Out of Order' | 'Decommissioned' | 'Other' | string;
  amcEndDate?: string;
  photos: EquipmentPhoto[];
  documents: EquipmentDocument[];
  activeBooking?: EquipmentActiveBooking | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicEquipment {
  id: string;
  name: string;
  approvedAbbreviation?: string;
  location?: string;
  currentLocation?: string;
  make?: string;
  model?: string;
  category: string;
  departmentName?: string;
  facilityName?: string;
  prismServiceCategory?: string;
  yearOfPurchase: string | number;
  purposeApplication?: string;
  description?: string;
  operationalStatus: 'Working' | 'Under Maintenance' | 'Out of Order' | 'Decommissioned' | 'Other' | string;
  photos: EquipmentPhoto[];
  publicDocCount?: number;
  publicDocuments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize?: string;
  }[];
  activeBooking?: EquipmentActiveBooking | null;
}

export interface LabApplicant {
  id: string;
  name: string;
  mobile: string;
  email: string;
  designation?: string;
  department?: string;
  secretCode?: string; // 8-digit numeric secret passcode visible and editable by Super Admin
  secretCodeHint?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicApplicantSummary {
  id: string;
  name: string;
  mobile: string;
  email: string;
  department?: string;
  designation?: string;
}

export interface EquipmentBooking {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  equipmentIds: string[];
  equipmentNames: string[];
  fromDateTime: string;
  toDateTime: string;
  durationHours?: number;
  purposeRemark: string;
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
  actionType: string;
  description: string;
  actor: string;
  timestamp: string;
}

export interface LabSuperUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}
