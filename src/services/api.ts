import axios from 'axios';
import { 
  Admin, Scientist, Project, ProjectStaff, PermanentStaff, 
  YPConsultant, Circular, FormDocument, Announcement, Event, 
  BroadcastMessage, VisibilityConfig, SalarySlip,
  Agency, OutsourcedEmployee, StoreSuperUser
} from '../types';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject JWT token into requests if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('nihr_token');
  if (token && config.headers) {
    const hasAuth = config.headers.Authorization || config.headers.authorization;
    if (!hasAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const apiService = {
  // Auth
  getCaptcha: async () => {
    const res = await client.get<{ captchaId: string; question: string }>('/auth/captcha');
    return res.data;
  },

  login: async (data: any) => {
    const res = await client.post<{ token: string; admin: Admin }>('/auth/login', data);
    localStorage.setItem('nihr_token', res.data.token);
    return res.data;
  },

  getCurrentAdmin: async () => {
    const res = await client.get<{ admin: Admin }>('/auth/me');
    return res.data.admin;
  },

  logout: () => {
    localStorage.removeItem('nihr_token');
  },

  // Admins CRUD
  getAdmins: async () => {
    const res = await client.get<Admin[]>('/admins');
    return res.data;
  },
  createAdmin: async (data: any) => {
    const res = await client.post<Admin>('/admins', data);
    return res.data;
  },
  updateAdmin: async (id: string, data: any) => {
    const res = await client.put<Admin>(`/admins/${id}`, data);
    return res.data;
  },
  deleteAdmin: async (id: string) => {
    const res = await client.delete<{ success: boolean }>(`/admins/${id}`);
    return res.data;
  },

  // Scientists CRUD
  getScientists: async () => {
    const res = await client.get<Scientist[]>('/scientists');
    return res.data;
  },
  createScientist: async (data: any) => {
    const res = await client.post<Scientist>('/scientists', data);
    return res.data;
  },
  updateScientist: async (id: string, data: any) => {
    const res = await client.put<Scientist>(`/scientists/${id}`, data);
    return res.data;
  },
  deleteScientist: async (id: string) => {
    const res = await client.delete(`/scientists/${id}`);
    return res.data;
  },

  // Projects CRUD
  getProjects: async () => {
    const res = await client.get<Project[]>('/projects');
    return res.data;
  },
  createProject: async (data: any) => {
    const res = await client.post<Project>('/projects', data);
    return res.data;
  },
  updateProject: async (id: string, data: any) => {
    const res = await client.put<Project>(`/projects/${id}`, data);
    return res.data;
  },
  deleteProject: async (id: string) => {
    const res = await client.delete(`/projects/${id}`);
    return res.data;
  },

  // Project Staff CRUD
  getProjectStaff: async () => {
    const res = await client.get<ProjectStaff[]>('/project-staff');
    return res.data;
  },
  createProjectStaff: async (data: any) => {
    const res = await client.post<ProjectStaff>('/project-staff', data);
    return res.data;
  },
  updateProjectStaff: async (id: string, data: any) => {
    const res = await client.put<ProjectStaff>(`/project-staff/${id}`, data);
    return res.data;
  },
  deleteProjectStaff: async (id: string) => {
    const res = await client.delete(`/project-staff/${id}`);
    return res.data;
  },

  // Permanent Staff CRUD
  getPermanentStaff: async () => {
    const res = await client.get<PermanentStaff[]>('/permanent-staff');
    return res.data;
  },
  createPermanentStaff: async (data: any) => {
    const res = await client.post<PermanentStaff>('/permanent-staff', data);
    return res.data;
  },
  updatePermanentStaff: async (id: string, data: any) => {
    const res = await client.put<PermanentStaff>(`/permanent-staff/${id}`, data);
    return res.data;
  },
  deletePermanentStaff: async (id: string) => {
    const res = await client.delete(`/permanent-staff/${id}`);
    return res.data;
  },

  // YP & Consultant CRUD
  getYPConsultants: async () => {
    const res = await client.get<YPConsultant[]>('/yp-consultants');
    return res.data;
  },
  createYPConsultant: async (data: any) => {
    const res = await client.post<YPConsultant>('/yp-consultants', data);
    return res.data;
  },
  updateYPConsultant: async (id: string, data: any) => {
    const res = await client.put<YPConsultant>(`/yp-consultants/${id}`, data);
    return res.data;
  },
  deleteYPConsultant: async (id: string) => {
    const res = await client.delete(`/yp-consultants/${id}`);
    return res.data;
  },

  // Circulars CRUD
  getCirculars: async () => {
    const res = await client.get<Circular[]>('/circulars');
    return res.data;
  },
  createCircular: async (data: any) => {
    const res = await client.post<Circular>('/circulars', data);
    return res.data;
  },
  updateCircular: async (id: string, data: any) => {
    const res = await client.put<Circular>(`/circulars/${id}`, data);
    return res.data;
  },
  deleteCircular: async (id: string) => {
    const res = await client.delete(`/circulars/${id}`);
    return res.data;
  },

  // Forms CRUD
  getForms: async () => {
    const res = await client.get<FormDocument[]>('/forms');
    return res.data;
  },
  createForm: async (data: any) => {
    const res = await client.post<FormDocument>('/forms', data);
    return res.data;
  },
  updateForm: async (id: string, data: any) => {
    const res = await client.put<FormDocument>(`/forms/${id}`, data);
    return res.data;
  },
  deleteForm: async (id: string) => {
    const res = await client.delete(`/forms/${id}`);
    return res.data;
  },

  // Announcements CRUD
  getAnnouncements: async () => {
    const res = await client.get<Announcement[]>('/announcements');
    return res.data;
  },
  createAnnouncement: async (data: any) => {
    const res = await client.post<Announcement>('/announcements', data);
    return res.data;
  },
  updateAnnouncement: async (id: string, data: any) => {
    const res = await client.put<Announcement>(`/announcements/${id}`, data);
    return res.data;
  },
  deleteAnnouncement: async (id: string) => {
    const res = await client.delete(`/announcements/${id}`);
    return res.data;
  },

  // Events CRUD
  getEvents: async () => {
    const res = await client.get<Event[]>('/events');
    return res.data;
  },
  createEvent: async (data: any) => {
    const res = await client.post<Event>('/events', data);
    return res.data;
  },
  updateEvent: async (id: string, data: any) => {
    const res = await client.put<Event>(`/events/${id}`, data);
    return res.data;
  },
  deleteEvent: async (id: string) => {
    const res = await client.delete(`/events/${id}`);
    return res.data;
  },

  // Broadcast CRUD
  getBroadcasts: async () => {
    const res = await client.get<BroadcastMessage[]>('/broadcasts');
    return res.data;
  },
  createBroadcast: async (data: any) => {
    const res = await client.post<BroadcastMessage>('/broadcasts', data);
    return res.data;
  },
  updateBroadcast: async (id: string, data: any) => {
    const res = await client.put<BroadcastMessage>(`/broadcasts/${id}`, data);
    return res.data;
  },
  deleteBroadcast: async (id: string) => {
    const res = await client.delete(`/broadcasts/${id}`);
    return res.data;
  },

  // Visibility Config
  getVisibility: async () => {
    const res = await client.get<VisibilityConfig>('/visibility');
    return res.data;
  },
  updateVisibility: async (data: VisibilityConfig) => {
    const res = await client.put<{ success: boolean; visibility: VisibilityConfig }>('/visibility', data);
    return res.data.visibility;
  },

  // Complaints / Task tracking Portal API
  loginComplaintSuperUser: async (data: any) => {
    const res = await client.post<{ token: string; superUser: any }>('/complaints/auth/login', data);
    // Save separate token for complaint superuser
    localStorage.setItem('complaint_su_token', res.data.token);
    return res.data;
  },
  logoutComplaintSuperUser: () => {
    localStorage.removeItem('complaint_su_token');
  },
  raiseComplaint: async (data: any) => {
    const res = await client.post('/complaints', data);
    return res.data;
  },
  searchComplaintsByMobile: async (mobile: string) => {
    const res = await client.get(`/complaints/search?mobile=${encodeURIComponent(mobile)}`);
    return res.data;
  },
  getComplaints: async () => {
    const token = localStorage.getItem('complaint_su_token');
    const res = await client.get('/complaints', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  },
  updateComplaint: async (id: string, data: any) => {
    const token = localStorage.getItem('complaint_su_token');
    const res = await client.put(`/complaints/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  },
  deleteComplaint: async (id: string) => {
    const token = localStorage.getItem('complaint_su_token');
    const res = await client.delete(`/complaints/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  },

  // Salary Slips System
  getSalaries: async () => {
    const res = await client.get<SalarySlip[]>('/salaries');
    return res.data;
  },
  uploadSalaryCSV: async (data: { csvText: string; month: string; year: string }) => {
    const res = await client.post<{ success: boolean; message: string }>('/salaries/upload', data);
    return res.data;
  },
  loginSalaryPortal: async (data: { mobile: string; aadhaarNumber: string; month: string; year: string }) => {
    const res = await client.post<{ success: boolean; salarySlip: SalarySlip }>('/salaries/login', data);
    return res.data;
  },
  deleteSalarySlip: async (id: string) => {
    const res = await client.delete<{ success: boolean; message: string }>(`/salaries/${id}`);
    return res.data;
  },
  createSalarySlip: async (data: any) => {
    const res = await client.post<{ success: boolean; salarySlip: SalarySlip }>('/salaries', data);
    return res.data;
  },
  updateSalarySlip: async (id: string, data: any) => {
    const res = await client.put<{ success: boolean; salarySlip: SalarySlip }>(`/salaries/${id}`, data);
    return res.data;
  },
  
  // Pending Project Staff Self-Registration
  getPendingProjectStaff: async () => {
    const res = await client.get<any[]>('/pending-project-staff');
    return res.data;
  },
  submitPendingProjectStaff: async (data: any) => {
    const res = await client.post<any>('/pending-project-staff', data);
    return res.data;
  },
  approvePendingProjectStaff: async (id: string) => {
    const res = await client.post<{ success: boolean; approvedRecord: any }>(`/pending-project-staff/${id}/approve`);
    return res.data;
  },
  rejectPendingProjectStaff: async (id: string) => {
    const res = await client.post<{ success: boolean }>(`/pending-project-staff/${id}/reject`);
    return res.data;
  },
  // Security Backup
  getDatabaseBackup: async () => {
    const res = await client.get<any>('/backup');
    return res.data;
  },

  // Store Super User Auth
  loginStoreSuperUser: async (data: { email: string; password: string }) => {
    const res = await client.post<{ token: string; storeUser: StoreSuperUser }>('/store/auth/login', data);
    localStorage.setItem('nihr_token', res.data.token);
    return res.data;
  },
  getStoreSuperUser: async () => {
    const res = await client.get<{ storeUser: StoreSuperUser }>('/store/auth/me');
    return res.data.storeUser;
  },

  // Agencies CRUD
  getAgencies: async () => {
    const res = await client.get<Agency[]>('/agencies');
    return res.data;
  },
  createAgency: async (data: any) => {
    const res = await client.post<Agency>('/agencies', data);
    return res.data;
  },
  updateAgency: async (id: string, data: any) => {
    const res = await client.put<Agency>(`/agencies/${id}`, data);
    return res.data;
  },
  deleteAgency: async (id: string) => {
    const res = await client.delete(`/agencies/${id}`);
    return res.data;
  },

  // Outsourced Employees CRUD
  getOutsourcedEmployees: async () => {
    const res = await client.get<OutsourcedEmployee[]>('/outsourced-employees');
    return res.data;
  },
  createOutsourcedEmployee: async (data: any) => {
    const res = await client.post<OutsourcedEmployee>('/outsourced-employees', data);
    return res.data;
  },
  updateOutsourcedEmployee: async (id: string, data: any) => {
    const res = await client.put<OutsourcedEmployee>(`/outsourced-employees/${id}`, data);
    return res.data;
  },
  deleteOutsourcedEmployee: async (id: string) => {
    const res = await client.delete(`/outsourced-employees/${id}`);
    return res.data;
  },

   // Pending YP & Consultants Self-Registration
  getPendingYPConsultants: async () => {
    const res = await client.get<any[]>('/pending-yp-consultants');
    return res.data;
  },
  submitPendingYPConsultant: async (data: any) => {
    const res = await client.post<any>('/pending-yp-consultants', data);
    return res.data;
  },
  approvePendingYPConsultant: async (id: string) => {
    const res = await client.post<{ success: boolean; approvedRecord: any }>(`/pending-yp-consultants/${id}/approve`);
    return res.data;
  },
  rejectPendingYPConsultant: async (id: string) => {
    const res = await client.post<{ success: boolean }>(`/pending-yp-consultants/${id}/reject`);
    return res.data;
  },
};
