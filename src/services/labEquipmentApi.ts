import {
  Equipment,
  PublicEquipment,
  LabApplicant,
  PublicApplicantSummary,
  EquipmentBooking,
  LabActivityLog,
  LabSuperUser
} from '../types/labEquipment';

const BASE_URL = '/api/lab-equipment';

export const LabEquipmentApi = {
  // Captcha
  async getCaptcha(): Promise<{ captchaId: string; question: string }> {
    const res = await fetch(`${BASE_URL}/captcha`);
    if (!res.ok) throw new Error('Failed to fetch security captcha');
    return res.json();
  },

  // Super Admin Auth
  async adminLogin(email: string, password: string, captchaId: string, captchaAnswer: string): Promise<{ token: string; user: LabSuperUser }> {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaId, captchaAnswer })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login as Super Admin');
    return data;
  },

  async getAdminMe(token: string): Promise<{ user: LabSuperUser }> {
    const res = await fetch(`${BASE_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session expired');
    return data;
  },

  // Equipments
  async getPublicEquipments(): Promise<PublicEquipment[]> {
    const res = await fetch(`${BASE_URL}/equipments`);
    if (!res.ok) throw new Error('Failed to load public equipments directory');
    return res.json();
  },

  async getAdminEquipments(token: string): Promise<Equipment[]> {
    const res = await fetch(`${BASE_URL}/admin/equipments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load admin equipment master');
    return data;
  },

  async createEquipment(payload: any, token: string): Promise<Equipment> {
    const res = await fetch(`${BASE_URL}/admin/equipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create equipment');
    return data;
  },

  async updateEquipment(id: string, payload: any, token: string): Promise<Equipment> {
    const res = await fetch(`${BASE_URL}/admin/equipments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update equipment');
    return data;
  },

  async deleteEquipment(id: string, token: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/equipments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete equipment');
    return data;
  },

  async bulkImportEquipments(equipments: any[], token: string): Promise<{ success: boolean; count: number; equipments: Equipment[]; errors?: string[] }> {
    const res = await fetch(`${BASE_URL}/admin/equipments/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ equipments })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk import equipments');
    return data;
  },

  async uploadFile(fileData: string, fileName: string, subfolder: 'equipment_photos' | 'equipment_docs', token: string): Promise<{ url: string; fileName: string; fileSize?: string }> {
    const res = await fetch(`${BASE_URL}/admin/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fileData, fileName, subfolder })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload file');
    return data;
  },

  // Applicants
  async getPublicApplicants(): Promise<PublicApplicantSummary[]> {
    const res = await fetch(`${BASE_URL}/applicants/public-list`);
    if (!res.ok) throw new Error('Failed to fetch applicant list');
    return res.json();
  },

  async getAdminApplicants(token: string): Promise<LabApplicant[]> {
    const res = await fetch(`${BASE_URL}/admin/applicants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch applicant master');
    return data;
  },

  async createApplicant(payload: { name: string; mobile: string; email: string; designation?: string; department?: string; customCode?: string; secretCode?: string }, token: string): Promise<{ applicant: LabApplicant; generatedSecretCode: string; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/applicants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register applicant');
    return data;
  },

  async updateApplicant(id: string, payload: any, token: string): Promise<LabApplicant> {
    const res = await fetch(`${BASE_URL}/admin/applicants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update applicant');
    return data;
  },

  async resetApplicantCode(id: string, customCode: string | undefined, token: string, secretCode?: string): Promise<{ applicant: LabApplicant; newSecretCode: string; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/applicants/${id}/reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ customCode: secretCode || customCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset secret code');
    return data;
  },

  async deleteApplicant(id: string, token: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/applicants/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete applicant');
    return data;
  },

  // Bookings
  async submitBooking(payload: {
    applicantName: string;
    mobile: string;
    secretCode: string;
    equipmentIds: string[];
    fromDateTime: string;
    toDateTime: string;
    purposeRemark: string;
    captchaId: string;
    captchaAnswer: string;
  }): Promise<{ booking: EquipmentBooking; message: string }> {
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit booking request');
    return data;
  },

  async checkBookingStatus(mobile: string, secretCode?: string): Promise<{ applicantName: string | null; bookings: EquipmentBooking[] }> {
    const params = new URLSearchParams({ mobile });
    if (secretCode) params.append('secretCode', secretCode);
    const res = await fetch(`${BASE_URL}/bookings/check-status?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check booking status');
    return data;
  },

  async getAdminBookings(token: string): Promise<EquipmentBooking[]> {
    const res = await fetch(`${BASE_URL}/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch booking requests queue');
    return data;
  },

  async updateBookingStatus(id: string, status: string, adminRemark: string, token: string): Promise<EquipmentBooking> {
    const res = await fetch(`${BASE_URL}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, adminRemark })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update booking status');
    return data;
  },

  async releaseBooking(id: string, remark: string | undefined, token: string): Promise<{ message: string; booking: EquipmentBooking }> {
    const res = await fetch(`${BASE_URL}/admin/bookings/${id}/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ remark })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to release booking');
    return data;
  },

  // Activity Logs
  async getAdminActivityLogs(token: string): Promise<LabActivityLog[]> {
    const res = await fetch(`${BASE_URL}/admin/activity-logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch activity logs');
    return data;
  }
};
