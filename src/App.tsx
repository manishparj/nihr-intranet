import { useState, useEffect, useRef } from 'react';
import { 
  Layout, Menu, Button, Card, Table, Modal, Input, Row, Col, Space, Badge, 
  Switch, Tag, Spin, Popconfirm, Avatar, Divider, message, ConfigProvider, theme, Empty,
  App as AntdApp, Tabs, Breadcrumb, Pagination
} from 'antd';
import { 
  UserOutlined, ProjectOutlined, SolutionOutlined, FilePdfOutlined, 
  NotificationOutlined, CalendarOutlined, MessageOutlined, SettingOutlined, 
  LogoutOutlined, LoginOutlined, SearchOutlined, PlusOutlined, EditOutlined, 
  DeleteOutlined, BulbOutlined, BulbFilled, TeamOutlined, KeyOutlined, 
  UnlockOutlined, InfoCircleOutlined, DownloadOutlined, StarOutlined, LockOutlined,
  AppstoreOutlined, CustomerServiceOutlined, PrinterOutlined
} from '@ant-design/icons';
import { Formik, Form, Field } from 'formik';
import { apiService } from './services/api';
import { 
  Admin, Scientist, Project, ProjectStaff, PermanentStaff, 
  YPConsultant, Circular, FormDocument, Announcement, Event, 
  BroadcastMessage, VisibilityConfig, SalarySlip
} from './types';
import { BroadcastFeed } from './components/BroadcastFeed';
import { VisibilityPanel } from './components/VisibilityPanel';
import { DashboardOverview } from './components/DashboardOverview';
import { ScientistForm, ProjectForm } from './components/AdminForms';
import { ProjectStaffForm, PermanentStaffForm, YPConsultantForm } from './components/StaffForms';
import { ComplaintPortal } from './components/ComplaintPortal';
import { SalaryPortalView, AdminSalariesManager } from './components/SalaryPortal';

const { Header, Content, Footer, Sider } = Layout;

export const playBroadcastNotification = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);
      
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
          gain2.gain.setValueAtTime(0.15, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.5);
        } catch (e) {
          console.error('Inner chime error:', e);
        }
      }, 120);
    }
  } catch (audioContextError) {
    console.error('Web Audio not supported or blocked:', audioContextError);
  }

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Message from Intranet");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  } catch (ttsError) {
    console.error('SpeechSynthesis error:', ttsError);
  }
};

interface InnerAppProps {
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
}

function InnerApp({ themeMode, setThemeMode }: InnerAppProps) {
  const { message } = AntdApp.useApp();

  // Authentication & Profile State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // App Theme & Navigation State
  const [currentKey, setCurrentKey] = useState<string>('public-dashboard');
  const [dashboardTab, setDashboardTab] = useState<string>('scientists');
  const [selectedScientist, setSelectedScientist] = useState<Scientist | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Search & Pagination states for Circulars and Forms (styled like celebrations)
  const [circularSearchText, setCircularSearchText] = useState('');
  const [circularPage, setCircularPage] = useState(1);
  const [formSearchText, setFormSearchText] = useState('');
  const [formPage, setFormPage] = useState(1);

  // Core Data States
  const [scientists, setScientists] = useState<Scientist[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStaff, setProjectStaff] = useState<ProjectStaff[]>([]);
  const [permanentStaff, setPermanentStaff] = useState<PermanentStaff[]>([]);
  const [ypConsultants, setYPConsultant] = useState<YPConsultant[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [forms, setForms] = useState<FormDocument[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [visibility, setVisibility] = useState<VisibilityConfig | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Global search filters
  const [searchText, setSearchText] = useState('');

  // Editing Modals state
  const [activeModal, setActiveModal] = useState<'scientist' | 'project' | 'pstaff' | 'perm' | 'ypc' | 'circular' | 'form' | 'announcement' | 'event' | 'admin' | null>(null);
  const [editRecord, setEditRecord] = useState<any | null>(null);

  // Scientist/Staff Details Modal state
  const [viewDetailRecord, setViewDetailRecord] = useState<any | null>(null);
  const [viewDetailType, setViewDetailType] = useState<'scientist' | 'pstaff' | 'perm' | 'ypc' | null>(null);
  const [viewDetailModalVisible, setViewDetailModalVisible] = useState(false);

  const openStaffDetailsModal = (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => {
    setViewDetailRecord(record);
    setViewDetailType(type);
    setViewDetailModalVisible(true);
  };

  // No salary slip modal state needed anymore

  const lastProcessedBroadcastId = useRef<string | null>(null);

  const formatExperience = (exp: any[]) => {
    if (!exp || exp.length === 0) return 'None';
    return exp.map(e => `${e.instituteName} (${e.designation}): ${e.fromDate} to ${e.toDate}`).join(' | ');
  };

  const parseDateFlexible = (dateStr: string): Date => {
    if (!dateStr) return new Date(NaN);
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // Support DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.trim().split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(NaN);
  };

  const getPeriodYMD = (fromDateStr: string, toDateStr: string) => {
    const start = parseDateFlexible(fromDateStr);
    const end = parseDateFlexible(toDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return { y: 0, m: 0, d: 0 };
    }
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate() + 1; // inclusive of end date
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { y: years, m: months, d: days };
  };

  const formatYMD = (ymd: { y: number; m: number; d: number }): string => {
    return `${ymd.y}-${ymd.m}-${ymd.d}`;
  };

  const calculateStaffExperienceYMD = (staff: any) => {
    let icmrY = 0, icmrM = 0, icmrD = 0;
    if (staff && staff.previousIcmrExperience && Array.isArray(staff.previousIcmrExperience)) {
      staff.previousIcmrExperience.forEach((entry: any) => {
        const ymd = getPeriodYMD(entry.fromDate, entry.toDate);
        icmrY += ymd.y;
        icmrM += ymd.m;
        icmrD += ymd.d;
      });
    }
    
    let nonIcmrY = 0, nonIcmrM = 0, nonIcmrD = 0;
    if (staff && staff.previousNonIcmrExperience && Array.isArray(staff.previousNonIcmrExperience)) {
      staff.previousNonIcmrExperience.forEach((entry: any) => {
        const ymd = getPeriodYMD(entry.fromDate, entry.toDate);
        nonIcmrY += ymd.y;
        nonIcmrM += ymd.m;
        nonIcmrD += ymd.d;
      });
    }
    
    // Current Experience: DOJ to Today (or lastWorkingDate if they left)
    let currentY = 0, currentM = 0, currentD = 0;
    if (staff && staff.doj) {
      const fromDate = staff.doj;
      const toDate = staff.status === 'Left' && staff.lastWorkingDate
        ? staff.lastWorkingDate
        : new Date().toISOString().split('T')[0];
        
      const ymd = getPeriodYMD(fromDate, toDate);
      currentY = ymd.y;
      currentM = ymd.m;
      currentD = ymd.d;
    }
    
    // Sum and Carry over
    // ICMR
    icmrM += Math.floor(icmrD / 30);
    icmrD = icmrD % 30;
    icmrY += Math.floor(icmrM / 12);
    icmrM = icmrM % 12;
    
    // Non-ICMR
    nonIcmrM += Math.floor(nonIcmrD / 30);
    nonIcmrD = nonIcmrD % 30;
    nonIcmrY += Math.floor(nonIcmrM / 12);
    nonIcmrM = nonIcmrM % 12;
    
    // Current
    currentM += Math.floor(currentD / 30);
    currentD = currentD % 30;
    currentY += Math.floor(currentM / 12);
    currentM = currentM % 12;
    
    // Total combined
    let totalY = icmrY + nonIcmrY + currentY;
    let totalM = icmrM + nonIcmrM + currentM;
    let totalD = icmrD + nonIcmrD + currentD;
    
    totalM += Math.floor(totalD / 30);
    totalD = totalD % 30;
    totalY += Math.floor(totalM / 12);
    totalM = totalM % 12;
    
    return {
      icmr: { y: icmrY, m: icmrM, d: icmrD },
      nonIcmr: { y: nonIcmrY, m: nonIcmrM, d: nonIcmrD },
      current: { y: currentY, m: currentM, d: currentD },
      total: { y: totalY, m: totalM, d: totalD }
    };
  };

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    let str = String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const downloadCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportScientistsCSV = () => {
    const headers = [
      "ID", "Name", "Date of Birth", "Date of Joining", "Designation",
      "Govt Email", "Personal Email", "Phone", "Employee Code", "Gender",
      "Blood Group", "Emergency Contact", "Address", "Department Location",
      "Room Number", "Category", "Status", "Last Working Date", "No Dues Cleared"
    ];
    const rows = scientists.map(s => [
      s.id, s.name, s.dob, s.doj, s.designation,
      s.govtEmail, s.personalEmail, s.phone, s.employeeCode, s.gender,
      s.bloodGroup, s.emergencyContact, s.address, s.departmentLocation,
      s.roomNumber, s.category, s.status, s.lastWorkingDate || '', s.noDuesCleared ? 'Yes' : 'No'
    ]);
    downloadCSV(headers, rows, "All_Scientists_Details.csv");
  };

  const exportPermanentStaffCSV = () => {
    const headers = [
      "ID", "Name", "Date of Birth", "Date of Joining", "Designation",
      "Govt Email", "Personal Email", "Phone", "Employee Code", "Gender",
      "Blood Group", "Emergency Contact", "Address", "Aadhaar Number", "PAN Number",
      "Department Location", "Room Number", "Category", "Account Number", "IFSC Code",
      "Bank Name", "Status", "Last Working Date", "Leaving Reason", "No Dues Cleared"
    ];
    const rows = permanentStaff.map(p => [
      p.id, p.name, p.dob, p.doj, p.designation,
      p.govtEmail, p.personalEmail, p.phone, p.employeeCode, p.gender,
      p.bloodGroup, p.emergencyContact, p.address, p.aadhaarNumber, p.panNumber,
      p.departmentLocation, p.roomNumber, p.category, p.accountNumber, p.ifscCode,
      p.bankName, p.status, p.lastWorkingDate || '', p.leavingReason || '', p.noDuesCleared ? 'Yes' : 'No'
    ]);
    downloadCSV(headers, rows, "All_Permanent_Staff_Details.csv");
  };

  const exportProjectStaffCSV = () => {
    const headers = [
      "ID", "Project ID", "PI Scientist ID", "Name", "Date of Birth",
      "Date of Joining", "Designation", "Email", "Phone", "Gender",
      "Blood Group", "Emergency Contact", "Address", "Aadhaar Number", "PAN Number",
      "Bank Name", "Account Number", "IFSC Code", "Department Location", "Room Number",
      "Educational Qualification", "Contract Period (Months)", "Category", "Status",
      "Last Working Date", "Leaving Reason", "No Dues Cleared", "Employee Code",
      "Previous ICMR Experience", "Previous Non-ICMR Experience", "ICMR Exp Months", "Non-ICMR Exp Months", "Total Exp Months"
    ];
    const rows = projectStaff.map(p => [
      p.id, p.projectId, p.scientistId, p.name, p.dob,
      p.doj, p.designation, p.email, p.phone, p.gender,
      p.bloodGroup, p.emergencyContact, p.address, p.aadhaarNumber, p.panNumber,
      p.bankName, p.accountNumber, p.ifscCode, p.departmentLocation, p.roomNumber,
      p.educationalQualification, p.contractPeriod, p.category, p.status,
      p.lastWorkingDate || '', p.leavingReason || '', p.noDuesCleared ? 'Yes' : 'No', p.employeeCode,
      formatExperience(p.previousIcmrExperience), formatExperience(p.previousNonIcmrExperience),
      p.icmrExpMonths ?? 0, p.nonIcmrExpMonths ?? 0, p.totalExpMonths ?? 0
    ]);
    downloadCSV(headers, rows, "All_Project_Staff_Details.csv");
  };

  const exportYPConsultantCSV = () => {
    const headers = [
      "ID", "Name", "Date of Birth", "Date of Joining", "Full Designation",
      "Designation Type", "Email", "Phone", "Gender", "Blood Group",
      "Employee Code", "Aadhaar Number", "PAN Number", "Account Number", "IFSC Code",
      "Bank Name", "Department Location", "Room Number", "Address", "Emergency Contact",
      "Category", "Status", "Last Working Date", "Leaving Reason", "No Dues Cleared"
    ];
    const rows = ypConsultants.map(y => [
      y.id, y.name, y.dob, y.doj, y.fullDesignation,
      y.designationType, y.email, y.phone, y.gender, y.bloodGroup,
      y.employeeCode, y.aadhaarNumber, y.panNumber, y.accountNumber, y.ifscCode,
      y.bankName, y.departmentLocation, y.roomNumber, y.address, y.emergencyContact,
      y.category, y.status, y.lastWorkingDate || '', y.leavingReason || '', y.noDuesCleared ? 'Yes' : 'No'
    ]);
    downloadCSV(headers, rows, "All_YP_and_Consultants_Details.csv");
  };

  const exportAllStaffIndividually = () => {
    exportScientistsCSV();
    setTimeout(() => exportPermanentStaffCSV(), 250);
    setTimeout(() => exportProjectStaffCSV(), 500);
    setTimeout(() => exportYPConsultantCSV(), 750);
  };

  const exportConsolidatedCategoryWiseCSV = () => {
    const headers = [
      "Staff Category", "ID", "Name", "Employee Code", "Date of Birth", "Date of Joining",
      "Designation", "Designation Type", "Gender", "Blood Group", "Phone", "Email",
      "Government Email", "Personal Email", "Address", "Emergency Contact", "Department Location",
      "Room Number", "Social Category", "Status", "Last Working Date", "Leaving Reason",
      "No Dues Cleared", "Project ID", "PI Scientist ID", "Aadhaar Number", "PAN Number",
      "Bank Name", "Account Number", "IFSC Code", "Educational Qualification", "Contract Period (Months)",
      "ICMR Exp Months", "Non-ICMR Exp Months", "Total Exp Months", "Previous ICMR Experience", "Previous Non-ICMR Experience"
    ];

    const rows: any[][] = [];

    // Add Scientists
    scientists.forEach(s => {
      rows.push([
        "Scientist", s.id, s.name, s.employeeCode, s.dob, s.doj,
        s.designation, "Scientist", s.gender, s.bloodGroup, s.phone, "",
        s.govtEmail, s.personalEmail, s.address, s.emergencyContact, s.departmentLocation,
        s.roomNumber, s.category, s.status, s.lastWorkingDate || '', '',
        s.noDuesCleared ? 'Yes' : 'No', "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);
    });

    // Add Permanent Staff
    permanentStaff.forEach(p => {
      rows.push([
        "Permanent Staff", p.id, p.name, p.employeeCode, p.dob, p.doj,
        p.designation, "Permanent Staff", p.gender, p.bloodGroup, p.phone, "",
        p.govtEmail, p.personalEmail, p.address, p.emergencyContact, p.departmentLocation,
        p.roomNumber, p.category, p.status, p.lastWorkingDate || '', p.leavingReason || '',
        p.noDuesCleared ? 'Yes' : 'No', "", "", p.aadhaarNumber, p.panNumber,
        p.bankName, p.accountNumber, p.ifscCode, "", "", "", "", "", "", ""
      ]);
    });

    // Add Project Staff
    projectStaff.forEach(p => {
      rows.push([
        "Project Staff", p.id, p.name, p.employeeCode, p.dob, p.doj,
        p.designation, "Project Staff", p.gender, p.bloodGroup, p.phone, p.email,
        "", "", p.address, p.emergencyContact, p.departmentLocation,
        p.roomNumber, p.category, p.status, p.lastWorkingDate || '', p.leavingReason || '',
        p.noDuesCleared ? 'Yes' : 'No', p.projectId, p.scientistId, p.aadhaarNumber, p.panNumber,
        p.bankName, p.accountNumber, p.ifscCode, p.educationalQualification, p.contractPeriod,
        p.icmrExpMonths ?? 0, p.nonIcmrExpMonths ?? 0, p.totalExpMonths ?? 0,
        formatExperience(p.previousIcmrExperience), formatExperience(p.previousNonIcmrExperience)
      ]);
    });

    // Add YP & Consultants
    ypConsultants.forEach(y => {
      rows.push([
        "YP / Consultant", y.id, y.name, y.employeeCode, y.dob, y.doj,
        y.fullDesignation, y.designationType, y.gender, y.bloodGroup, y.phone, y.email,
        "", "", y.address, y.emergencyContact, y.departmentLocation,
        y.roomNumber, y.category, y.status, y.lastWorkingDate || '', y.leavingReason || '',
        y.noDuesCleared ? 'Yes' : 'No', "", "", y.aadhaarNumber, y.panNumber,
        y.bankName, y.accountNumber, y.ifscCode, "", "", "", "", "", "", ""
      ]);
    });

    downloadCSV(headers, rows, "Consolidated_Staff_Category_Wise.csv");
  };

  // Initial Fetching
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [sci, proj, pS, perm, ypc, circ, f, ann, ev, bc, vis] = await Promise.all([
        apiService.getScientists(),
        apiService.getProjects(),
        apiService.getProjectStaff(),
        apiService.getPermanentStaff(),
        apiService.getYPConsultants(),
        apiService.getCirculars(),
        apiService.getForms(),
        apiService.getAnnouncements(),
        apiService.getEvents(),
        apiService.getBroadcasts(),
        apiService.getVisibility(),
      ]);

      setScientists(sci);
      setProjects(proj);
      setProjectStaff(pS);
      setPermanentStaff(perm);
      setYPConsultant(ypc);
      
      // Sort circulars by uploadDate descending (newest first), falling back to id descending
      const sortedCirc = [...circ].sort((a, b) => {
        const tA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const tB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        if (!isNaN(tA) && !isNaN(tB) && tA !== tB) {
          return tB - tA;
        }
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numB - numA || b.id.localeCompare(a.id);
      });
      setCirculars(sortedCirc);

      // Sort forms by uploadDate descending (newest first), falling back to id descending
      const sortedForms = [...f].sort((a, b) => {
        const tA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const tB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        if (!isNaN(tA) && !isNaN(tB) && tA !== tB) {
          return tB - tA;
        }
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numB - numA || b.id.localeCompare(a.id);
      });
      setForms(sortedForms);

      // Sort announcements by id descending (newest first)
      const sortedAnn = [...ann].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numB - numA || b.id.localeCompare(a.id);
      });
      setAnnouncements(sortedAnn);

      // Sort events by date descending (newest first), falling back to id descending
      const sortedEvents = [...ev].sort((a, b) => {
        const tA = a.date ? new Date(a.date).getTime() : 0;
        const tB = b.date ? new Date(b.date).getTime() : 0;
        if (!isNaN(tA) && !isNaN(tB) && tA !== tB) {
          return tB - tA;
        }
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numB - numA || b.id.localeCompare(a.id);
      });
      setEvents(sortedEvents);

      // Sort broadcasts chronologically
      const sortedBc = bc.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setBroadcasts(sortedBc);
      if (sortedBc.length > 0 && lastProcessedBroadcastId.current === null) {
        lastProcessedBroadcastId.current = sortedBc[0].id;
      }
      setVisibility(vis);

      // If authenticated, also fetch admins list
      if (localStorage.getItem('nihr_token')) {
        const adminProfiles = await apiService.getAdmins();
        setAdmins(adminProfiles);
      }
    } catch (e) {
      console.error('Error loading data', e);
      message.error('Failed to load intranet data resources.');
    } finally {
      setLoadingData(false);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('nihr_token');
    if (token) {
      try {
        const admin = await apiService.getCurrentAdmin();
        setCurrentAdmin(admin);
        setIsAuthenticated(true);
        setCurrentKey('admin-dashboard'); // Redirect to admin panel
        const adminProfiles = await apiService.getAdmins();
        setAdmins(adminProfiles);
      } catch (e) {
        localStorage.removeItem('nihr_token');
        setIsAuthenticated(false);
      }
    }
  };

  const loadCaptcha = async () => {
    try {
      const challenge = await apiService.getCaptcha();
      setCaptchaId(challenge.captchaId);
      setCaptchaQuestion(challenge.question);
      setCaptchaAnswer('');
    } catch (e) {
      message.error('Failed to connect to captcha engine.');
    }
  };

  useEffect(() => {
    checkAuth();
    fetchAllData();
  }, []);

  // Unlock browser audio restriction on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, ctx.currentTime); // silent signal
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch (e) {
        console.warn("Could not unlock audio context", e);
      }
      
      // Remove listeners once unlocked
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Poll for new broadcasts every 5 seconds and play alert sound
  useEffect(() => {
    let intervalId: any;
    
    const pollBroadcasts = async () => {
      try {
        const bc = await apiService.getBroadcasts();
        const sorted = bc.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (sorted.length > 0) {
          const newest = sorted[0];
          
          if (lastProcessedBroadcastId.current === null) {
            lastProcessedBroadcastId.current = newest.id;
          } else if (lastProcessedBroadcastId.current !== newest.id) {
            lastProcessedBroadcastId.current = newest.id;
            // Play notification tone and speak "Message from Intranet"
            playBroadcastNotification();
          }
        }
        setBroadcasts(sorted);
      } catch (e) {
        console.error("Failed to poll broadcasts", e);
      }
    };

    // Run poll immediately on mount (or shortly after first fetchAllData)
    const timeoutId = setTimeout(() => {
      pollBroadcasts();
      intervalId = setInterval(pollBroadcasts, 5000);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword || !captchaAnswer) {
      message.warning('Please input email, password and verify captcha.');
      return;
    }
    setSubmittingLogin(true);
    try {
      const credentials = {
        email: loginEmail,
        password: loginPassword,
        captchaId,
        captchaAnswer: parseInt(captchaAnswer, 10),
      };
      const response = await apiService.login(credentials);
      setCurrentAdmin(response.admin);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setCurrentKey('admin-dashboard');
      message.success(`Welcome back, ${response.admin.name}!`);
      // Reload admin details
      const adminProfiles = await apiService.getAdmins();
      setAdmins(adminProfiles);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Invalid credentials or incorrect Captcha.');
      loadCaptcha();
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setCurrentKey('public-dashboard');
    message.success('Logged out successfully.');
  };

  // Helper: Mask sensitive personal fields for public views
  const renderMaskedField = (value: string | undefined, show: boolean, placeholder = '🔒 Restricted') => {
    if (!value) return '-';
    return show ? value : placeholder;
  };

  // ==========================================
  // ACTION DISPATCHERS (CRUD OPERATIONS)
  // ==========================================

  const handleCreateOrUpdate = async (type: string, values: any) => {
    try {
      if (type === 'scientist') {
        if (editRecord) {
          await apiService.updateScientist(editRecord.id, values);
          message.success('Scientist updated successfully.');
        } else {
          await apiService.createScientist(values);
          message.success('Scientist registered successfully.');
        }
      } else if (type === 'project') {
        if (editRecord) {
          await apiService.updateProject(editRecord.id, values);
          message.success('Project details modified.');
        } else {
          await apiService.createProject(values);
          message.success('New extramural project initialized.');
        }
      } else if (type === 'pstaff') {
        if (editRecord) {
          await apiService.updateProjectStaff(editRecord.id, values);
          message.success('Project staff modified.');
        } else {
          await apiService.createProjectStaff(values);
          message.success('New project staff assigned.');
        }
      } else if (type === 'perm') {
        if (editRecord) {
          await apiService.updatePermanentStaff(editRecord.id, values);
          message.success('Permanent staff profile updated.');
        } else {
          await apiService.createPermanentStaff(values);
          message.success('Permanent staff member registered.');
        }
      } else if (type === 'ypc') {
        if (editRecord) {
          await apiService.updateYPConsultant(editRecord.id, values);
          message.success('YP/Consultant profile updated.');
        } else {
          await apiService.createYPConsultant(values);
          message.success('YP/Consultant registered.');
        }
      } else if (type === 'admin') {
        if (editRecord) {
          await apiService.updateAdmin(editRecord.id, values);
          message.success('Super admin account updated.');
        } else {
          await apiService.createAdmin(values);
          message.success('New Super admin created.');
        }
      } else if (type === 'circular') {
        if (editRecord) {
          await apiService.updateCircular(editRecord.id, values);
        } else {
          await apiService.createCircular(values);
        }
        message.success('Office circular updated.');
      } else if (type === 'form') {
        if (editRecord) {
          await apiService.updateForm(editRecord.id, values);
        } else {
          await apiService.createForm(values);
        }
        message.success('Office Form Document modified.');
      } else if (type === 'announcement') {
        if (editRecord) {
          await apiService.updateAnnouncement(editRecord.id, values);
        } else {
          await apiService.createAnnouncement(values);
        }
        message.success('Announcement broadcast completed.');
      } else if (type === 'event') {
        if (editRecord) {
          await apiService.updateEvent(editRecord.id, values);
        } else {
          await apiService.createEvent(values);
        }
        message.success('Institution meeting schedule modified.');
      }

      setActiveModal(null);
      setEditRecord(null);
      fetchAllData();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Validation or database submission error.');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    try {
      if (type === 'scientist') await apiService.deleteScientist(id);
      else if (type === 'project') await apiService.deleteProject(id);
      else if (type === 'pstaff') await apiService.deleteProjectStaff(id);
      else if (type === 'perm') await apiService.deletePermanentStaff(id);
      else if (type === 'ypc') await apiService.deleteYPConsultant(id);
      else if (type === 'admin') await apiService.deleteAdmin(id);
      else if (type === 'circular') await apiService.deleteCircular(id);
      else if (type === 'form') await apiService.deleteForm(id);
      else if (type === 'announcement') await apiService.deleteAnnouncement(id);
      else if (type === 'event') await apiService.deleteEvent(id);
      else if (type === 'broadcast') await apiService.deleteBroadcast(id);

      message.success('Record successfully removed from registry.');
      fetchAllData();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to remove requested entry.');
    }
  };

  const handleBroadcastMessage = async (text: string, file?: any, link?: string) => {
    await apiService.createBroadcast({ text, fileName: file?.name, fileData: file?.data, fileType: file?.type, link });
    fetchAllData();
  };

  // Physical file or Base64 file download trigger
  const handleDownloadBase64File = (fileName: string, urlOrBase64: string) => {
    if (!urlOrBase64 || urlOrBase64 === 'base64_placeholder' || urlOrBase64 === '') {
      message.warning('This is a simulated reference statement.');
      return;
    }
    // If it's a server uploaded path or a standard URL, open/download it directly
    if (urlOrBase64.startsWith('/uploads') || urlOrBase64.startsWith('http')) {
      window.open(urlOrBase64, '_blank');
      return;
    }
    const a = document.createElement('a');
    a.href = urlOrBase64;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ==========================================
  // TABLE COLUMN REPRESENTATIONS
  // ==========================================

  const getScientistColumns = () => [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Scientist Name', dataIndex: 'name', key: 'name', font: 'bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
    { title: 'Personal Email', dataIndex: 'personalEmail', key: 'personalEmail', render: (val: string) => renderMaskedField(val, isAuthenticated, '🔒 masked') },
    { title: 'Phone Number', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => <Tag color="blue">{cat}</Tag> },
    { title: 'DOB', dataIndex: 'dob', key: 'dob', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.dob, '🔒 masked') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: Scientist) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('scientist'); }} />
          <Popconfirm title="Delete profile?" onConfirm={() => handleDelete('scientist', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const getProjectColumns = () => [
    { title: 'Short Code', dataIndex: 'shortName', key: 'shortName', sorter: (a: any, b: any) => a.shortName.localeCompare(b.shortName) },
    { title: 'Full Scientific Name', dataIndex: 'name', key: 'name', width: 300 },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="orange">{t}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Completed' ? 'green' : s === 'Ongoing' ? 'blue' : 'gray'}>{s}</Tag> },
    { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (b: number) => `₹${b.toLocaleString()}`, sorter: (a: any, b: any) => a.budget - b.budget },
    { title: 'PI Name', dataIndex: 'piId', key: 'piId', render: (id: string) => scientists.find(s => s.id === id)?.name || 'Unknown' },
    { title: 'Duration', dataIndex: 'durationDays', key: 'durationDays', render: (val: number) => `${val || 0} days` },
    { title: 'Days Left', dataIndex: 'pendingDays', key: 'pendingDays', render: (val: number) => <Tag color={val === 0 ? 'red' : 'green'}>{val || 0} days</Tag> },
    { title: 'Active Staff', dataIndex: 'staffCount', key: 'staffCount', render: (val: number) => <Badge count={val || 0} showZero className="bg-slate-400" /> },
    {
      title: 'Utilization Certificates',
      key: 'uc',
      render: (_: any, p: Project) => (
        <Space orientation="vertical" size="small" className="text-xs">
          {p.provisionalUCs && p.provisionalUCs.length > 0 && (
            <div>
              <span className="font-bold block">Prov UCs:</span>
              {p.provisionalUCs.map((uc, i) => (
                <Button key={uc.id || i} type="link" size="small" className="p-0 h-auto text-xs flex items-center gap-1" onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}>
                  <DownloadOutlined /> {uc.period}
                </Button>
              ))}
            </div>
          )}
          {p.finalUC && (
            <div>
              <span className="font-bold block">Final UC:</span>
              <Button type="link" size="small" className="p-0 h-auto text-xs flex items-center gap-1" onClick={() => handleDownloadBase64File(p.finalUC?.fileName || 'final', p.finalUC?.fileData || '')}>
                <DownloadOutlined /> {p.finalUC.period}
              </Button>
            </div>
          )}
        </Space>
      )
    },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: Project) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('project'); }} />
          <Popconfirm title="Delete project?" onConfirm={() => handleDelete('project', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const getProjectStaffColumns = () => [
    { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || '') },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Linked Project', dataIndex: 'projectId', key: 'projectId', render: (id: string) => projects.find(p => p.id === id)?.shortName || 'None' },
    { title: 'Principal Investigator', dataIndex: 'scientistId', key: 'scientistId', render: (id: string) => scientists.find(s => s.id === id)?.name || '-' },
    { title: 'Email Address', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
    { title: 'Phone Number', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
    { title: 'Date of Birth', dataIndex: 'dob', key: 'dob', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.dob, '🔒 masked') },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Aadhaar Number', dataIndex: 'aadhaarNumber', key: 'aadhaarNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 masked') },
    { title: 'PAN Card', dataIndex: 'panNumber', key: 'panNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.pan, '🔒 masked') },
    { title: 'Bank Name', dataIndex: 'bankName', key: 'bankName', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') },
    { title: 'Account Number', dataIndex: 'accountNumber', key: 'accountNumber', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') },
    { title: 'IFSC Code', dataIndex: 'ifscCode', key: 'ifscCode', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked') },
    { title: 'Total Exp (Y-M-D)', key: 'totalExpYMD', render: (_: any, rec: ProjectStaff) => {
      const expYMD = calculateStaffExperienceYMD(rec);
      return <Tag color="blue" title={`${rec.totalExpMonths || 0} Months cumulative`}>{formatYMD(expYMD.total)}</Tag>;
    }, sorter: (a: any, b: any) => (a.totalExpMonths || 0) - (b.totalExpMonths || 0) },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: ProjectStaff) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('pstaff'); }} />
          <Popconfirm title="Delete staff profile?" onConfirm={() => handleDelete('pstaff', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const getPermanentStaffColumns = () => [
    { title: 'Perm Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold' },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
    { title: 'Aadhaar / PAN', key: 'idDocs', render: (_: any, s: PermanentStaff) => (
      <div className="text-[10px]">
        <div>Aadhaar: {renderMaskedField(s.aadhaarNumber, isAuthenticated || !!visibility?.fields.aadhaar, '🔒')}</div>
        <div>PAN: {renderMaskedField(s.panNumber, isAuthenticated || !!visibility?.fields.pan, '🔒')}</div>
      </div>
    )},
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: PermanentStaff) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('perm'); }} />
          <Popconfirm title="Delete staff profile?" onConfirm={() => handleDelete('perm', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const getYPConsultantColumns = () => [
    { title: 'Temp/CONS Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold' },
    { title: 'Designation Type', dataIndex: 'designationType', key: 'designationType', render: (val: string) => <Tag color={val === 'Consultant' ? 'magenta' : 'cyan'}>{val}</Tag> },
    { title: 'Full Designation', dataIndex: 'fullDesignation', key: 'fullDesignation' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: YPConsultant) => (
        <Space size="middle">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('ypc'); }} />
          <Popconfirm title="Delete profile?" onConfirm={() => handleDelete('ypc', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const getCircularColumns = () => [
    { title: 'Circular Title', dataIndex: 'title', key: 'title', width: 450 },
    { title: 'Upload Date', dataIndex: 'uploadDate', key: 'uploadDate', sorter: (a: any, b: any) => a.uploadDate.localeCompare(b.uploadDate) },
    {
      title: 'Document Source',
      key: 'document',
      render: (_: any, rec: Circular) => (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />} 
          onClick={() => handleDownloadBase64File(rec.fileName, rec.fileData)}
        >
          {rec.fileName}
        </Button>
      )
    },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: Circular) => (
        <Popconfirm title="Delete Circular?" onConfirm={() => handleDelete('circular', rec.id)}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }] : [])
  ];

  const getFormColumns = () => [
    { title: 'Form Title', dataIndex: 'title', key: 'title', width: 450 },
    { title: 'Upload Date', dataIndex: 'uploadDate', key: 'uploadDate', sorter: (a: any, b: any) => a.uploadDate.localeCompare(b.uploadDate) },
    {
      title: 'Form File',
      key: 'document',
      render: (_: any, rec: FormDocument) => (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />} 
          onClick={() => handleDownloadBase64File(rec.fileName, rec.fileData)}
        >
          {rec.fileName}
        </Button>
      )
    },
    ...(isAuthenticated ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, rec: FormDocument) => (
        <Popconfirm title="Delete Form?" onConfirm={() => handleDelete('form', rec.id)}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }] : [])
  ];

  // Generic Search Filter
  const filterDataset = (data: any[]) => {
    if (!searchText) return data;
    return data.filter(item => 
      Object.values(item).some(val => 
        val && val.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  // ==========================================
  // VIEW RENDERER DISPATCHER
  // ==========================================
  const renderContentView = () => {
    if (loadingData) {
      return (
        <div className="h-[400px] flex justify-center items-center">
          <Spin size="large" description="Loading NIHR Intranet resources..." />
        </div>
      );
    }

    if (currentKey === 'complaints') {
      return <ComplaintPortal />;
    }

    // A. Public Dashboard View
    if (currentKey === 'public-dashboard') {
      const isDateInCurrentWeekLocal = (dateStr?: string): boolean => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const eventThisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
        return eventThisYear >= startOfWeek && eventThisYear <= endOfWeek;
      };

      const getWeeklyBirthdaysLocal = () => {
        const list: { name: string; designation: string; category: string; date: string }[] = [];
        scientists.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
          list.push({ name: s.name, designation: s.designation, category: 'Scientist', date: s.dob });
        });
        projectStaff.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
          list.push({ name: s.name, designation: s.designation, category: 'Project Research Staff', date: s.dob });
        });
        permanentStaff.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
          list.push({ name: s.name, designation: s.designation, category: 'Permanent Staff', date: s.dob });
        });
        ypConsultants.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
          list.push({ name: s.name, designation: s.fullDesignation, category: s.designationType, date: s.dob });
        });
        return list;
      };

      const getWeeklyAnniversariesLocal = () => {
        const list: { name: string; designation: string; category: string; date: string; years: number }[] = [];
        const currentYear = new Date().getFullYear();
        const addAnniversary = (emp: { name: string; doj: string; designation: string; category: string }) => {
          if (isDateInCurrentWeekLocal(emp.doj)) {
            const joinYear = new Date(emp.doj).getFullYear();
            const years = currentYear - joinYear;
            if (years > 0) {
              list.push({ name: emp.name, designation: emp.designation, category: emp.category, date: emp.doj, years });
            }
          }
        };
        scientists.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Scientist' }));
        projectStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Project Research Staff' }));
        permanentStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Permanent Staff' }));
        ypConsultants.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.fullDesignation, category: s.designationType }));
        return list;
      };

      const localBirthdays = getWeeklyBirthdaysLocal();
      const localAnniversaries = getWeeklyAnniversariesLocal();

      const tabItems = [
        ...(visibility?.modules.scientists ? [{
          key: 'scientists',
          label: (
            <span>
              <UserOutlined />
              Scientists
            </span>
          ),
          children: (
            <div className="space-y-6">
              <Card 
                title={
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-1">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">SCIENTISTS DIRECTORY & DEPARTMENTS</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">🎓 Scientists Registry (Click row to view led projects)</span>
                    </div>
                  </div>
                } 
                variant="borderless" 
                className="shadow-sm rounded-xl overflow-hidden"
              >
                <Table 
                  columns={getScientistColumns()} 
                  dataSource={scientists} 
                  pagination={{ pageSize: 8 }} 
                  size="middle" 
                  rowKey="id" 
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    onClick: (e: any) => {
                      if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                      setSelectedScientist(selectedScientist?.id === record.id ? null : record);
                      setSelectedProject(null);
                    },
                    className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedScientist?.id === record.id ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 font-semibold' : ''}`
                  })}
                />
              </Card>

              {/* Drill Down Level 1: Projects led by selected scientist */}
              {selectedScientist && (
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Drill-Down Level 1: Scientific Leadership</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                        🔬 Projects led by Dr. {selectedScientist.name} 
                        <Tag color="blue" className="ml-1 text-[10px] uppercase font-bold">{selectedScientist.employeeCode}</Tag>
                      </h4>
                    </div>
                    <Button size="small" danger onClick={() => { setSelectedScientist(null); setSelectedProject(null); }}>Clear Selection</Button>
                  </div>

                  {(() => {
                    const scientistProjects = projects.filter(p => p.piId === selectedScientist.id);
                    if (scientistProjects.length === 0) {
                      return (
                        <Empty 
                          description="This scientist is not leading any extramural research projects currently." 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        />
                      );
                    }

                    return (
                      <Table
                        columns={getProjectColumns().filter(col => col.key !== 'piId')}
                        dataSource={scientistProjects}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        rowKey="id"
                        scroll={{ x: 'max-content' }}
                        onRow={(projectRecord) => ({
                          onClick: (e: any) => {
                            if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                            setSelectedProject(selectedProject?.id === projectRecord.id ? null : projectRecord);
                          },
                          className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedProject?.id === projectRecord.id ? 'bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500 font-semibold' : ''}`
                        })}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Drill Down Level 2: Project details & staff list */}
              {selectedScientist && selectedProject && (
                <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block">Drill-Down Level 2: Administrative Details & Team Appointed</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                        📂 Scheme Ledger: {selectedProject.name} ({selectedProject.shortName})
                      </h4>
                    </div>
                    <Button size="small" onClick={() => setSelectedProject(null)}>Close Project View</Button>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" title="Project Specifications" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="space-y-2 text-xs">
                          <div><strong className="text-slate-400">Type:</strong> <Tag color="orange" className="ml-1">{selectedProject.type}</Tag></div>
                          <div><strong className="text-slate-400">Status:</strong> <Tag color={selectedProject.status === 'Completed' ? 'green' : 'blue'} className="ml-1">{selectedProject.status}</Tag></div>
                          <div><strong className="text-slate-400">Budget Limit:</strong> <span className="font-semibold text-green-600">₹{selectedProject.budget.toLocaleString()}</span></div>
                          <div><strong className="text-slate-400">Duration Scheduled:</strong> {selectedProject.durationDays} days</div>
                          <div><strong className="text-slate-400">Pending Days Left:</strong> {selectedProject.pendingDays} days</div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={16}>
                      <Card size="small" title="👥 Appointed Research Project Staff (Click row for full profile)" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        {(() => {
                          const associatedStaff = projectStaff.filter(s => s.projectId === selectedProject.id);
                          if (associatedStaff.length === 0) {
                            return <Empty description="No research staff registered or appointed to this project." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                          }

                          return (
                            <Table
                              columns={getProjectStaffColumns().filter(col => col.key !== 'projectId')}
                              dataSource={associatedStaff}
                              pagination={{ pageSize: 5 }}
                              size="small"
                              rowKey="id"
                              scroll={{ x: 'max-content' }}
                              onRow={(staffRecord) => ({
                                onClick: (e: any) => {
                                  if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                                  openStaffDetailsModal(staffRecord, 'pstaff');
                                },
                                className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                              })}
                            />
                          );
                        })()}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )
        }] : []),
        ...(visibility?.modules.projects ? [{
          key: 'projects',
          label: (
            <span>
              <ProjectOutlined />
              Projects Ledger
            </span>
          ),
          children: (
            <div className="space-y-6">
              <Card 
                title={
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">EXTRAMURAL RESEARCH SCHEMES</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">🔬 Research Projects Ledger (Click row to drill-down)</span>
                  </div>
                } 
                variant="borderless" 
                className="shadow-sm rounded-xl overflow-hidden"
              >
                <Table 
                  columns={getProjectColumns()} 
                  dataSource={projects} 
                  pagination={{ pageSize: 8 }} 
                  size="middle" 
                  rowKey="id" 
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    onClick: (e: any) => {
                      if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                      setSelectedProject(selectedProject?.id === record.id ? null : record);
                    },
                    className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedProject?.id === record.id ? 'bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500 font-semibold' : ''}`
                  })}
                />
              </Card>

              {/* Project details and staff list drill-down */}
              {selectedProject && (
                <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block">Drill-Down Project Level: Administrative Details & Team Appointed</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                        📂 Scheme Ledger: {selectedProject.name} ({selectedProject.shortName})
                      </h4>
                    </div>
                    <Button size="small" onClick={() => setSelectedProject(null)}>Close Project View</Button>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" title="Project Specifications" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="space-y-2 text-xs">
                          <div><strong className="text-slate-400">PI / Scientist:</strong> <span className="font-semibold">{scientists.find(s => s.id === selectedProject.piId)?.name || 'Unknown'}</span></div>
                          <div><strong className="text-slate-400">Type:</strong> <Tag color="orange" className="ml-1">{selectedProject.type}</Tag></div>
                          <div><strong className="text-slate-400">Status:</strong> <Tag color={selectedProject.status === 'Completed' ? 'green' : 'blue'} className="ml-1">{selectedProject.status}</Tag></div>
                          <div><strong className="text-slate-400">Budget Limit:</strong> <span className="font-semibold text-green-600">₹{selectedProject.budget.toLocaleString()}</span></div>
                          <div><strong className="text-slate-400">Duration Scheduled:</strong> {selectedProject.durationDays} days</div>
                          <div><strong className="text-slate-400">Pending Days Left:</strong> {selectedProject.pendingDays} days</div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={16}>
                      <Card size="small" title="👥 Appointed Research Project Staff (Click row for full profile)" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        {(() => {
                          const associatedStaff = projectStaff.filter(s => s.projectId === selectedProject.id);
                          if (associatedStaff.length === 0) {
                            return <Empty description="No research staff registered or appointed to this project." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                          }

                          return (
                            <Table
                              columns={getProjectStaffColumns().filter(col => col.key !== 'projectId')}
                              dataSource={associatedStaff}
                              pagination={{ pageSize: 5 }}
                              size="small"
                              rowKey="id"
                              scroll={{ x: 'max-content' }}
                              onRow={(staffRecord) => ({
                                onClick: (e: any) => {
                                  if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                                  openStaffDetailsModal(staffRecord, 'pstaff');
                                },
                                className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                              })}
                            />
                          );
                        })()}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )
        }] : []),
        ...(visibility?.modules.projectStaff ? [{
          key: 'pstaff',
          label: (
            <span>
              <SolutionOutlined />
              Project Research Staff
            </span>
          ),
          children: (
            <Card title="👥 Project Research Staff Profiles (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getProjectStaffColumns()} 
                dataSource={projectStaff} 
                pagination={{ pageSize: 8 }} 
                size="middle" 
                rowKey="id" 
                scroll={{ x: 1200 }}
                onRow={(record) => ({
                  onClick: (e: any) => {
                    if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                    openStaffDetailsModal(record, 'pstaff');
                  },
                  className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                })}
              />
            </Card>
          )
        }] : []),
        ...(visibility?.modules.permanentStaff ? [{
          key: 'permanent',
          label: (
            <span>
              <TeamOutlined />
              Permanent Staff
            </span>
          ),
          children: (
            <Card title="💼 Permanent Staff Directory (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getPermanentStaffColumns()} 
                dataSource={permanentStaff} 
                pagination={{ pageSize: 8 }} 
                size="middle" 
                rowKey="id" 
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                  onClick: (e: any) => {
                    if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                    openStaffDetailsModal(record, 'perm');
                  },
                  className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                })}
              />
            </Card>
          )
        }] : []),
        ...(visibility?.modules.ypConsultants ? [{
          key: 'ypc',
          label: (
            <span>
              <StarOutlined />
              YP & Consultants
            </span>
          ),
          children: (
            <Card title="🌟 Young Professional & Consultant Staff (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getYPConsultantColumns()} 
                dataSource={ypConsultants} 
                pagination={{ pageSize: 8 }} 
                size="middle" 
                rowKey="id" 
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                  onClick: (e: any) => {
                    if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                    openStaffDetailsModal(record, 'ypc');
                  },
                  className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                })}
              />
            </Card>
          )
        }] : []),
        {
          key: 'salary-portal',
          label: (
            <span>
              <PrinterOutlined />
              Project Staff Salary Portal
            </span>
          ),
          children: (
            <SalaryPortalView />
          )
        }
      ];

      return (
        <div className="space-y-6">
          {/* 1. Latest Announcements left to right marquee */}
          {visibility?.modules.announcements && (
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-2.5 flex items-center gap-3 overflow-hidden shadow-sm">
              <div className="flex-shrink-0 flex items-center gap-2 bg-[#075E54] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
                <NotificationOutlined /> Official Board Ticker
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-marquee-rtl hover:[animation-play-state:paused] whitespace-nowrap inline-flex gap-12">
                  {announcements.map((ann, idx) => (
                    <span key={ann.id || idx} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      {ann.title}
                      {ann.fileName && (
                        <a href={ann.fileData} target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-extrabold ml-1">
                          <FilePdfOutlined /> View Doc
                        </a>
                      )}
                    </span>
                  ))}
                  {announcements.length === 0 && (
                    <span className="text-xs text-slate-400 font-medium">No active institutional announcements listed today.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Top-Level Layout Grid (Broadcast, Today's Seminars, Birthdays/Milestones) */}
          <Row gutter={[16, 16]} className="items-stretch">
            {/* Left: WhatsApp-theme Broadcast Bulletin Channel */}
            {visibility?.modules.broadcast && (
              <Col xs={24} lg={12} className="flex flex-col">
                <BroadcastFeed
                  messages={broadcasts}
                  isAdmin={false}
                  onSendMessage={async () => {}}
                  onDeleteMessage={async () => {}}
                  isWhatsAppTheme={true}
                />
              </Col>
            )}

            {/* Middle: Today's Events (Scientific Events & Seminars) */}
            {visibility?.modules.events && (
              <Col xs={24} md={12} lg={6} className="flex flex-col">
                <Card 
                  title={<span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> TODAY'S SEMINARS & EVENTS</span>}
                  variant="outlined"
                  className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
                  styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px', maxHeight: '520px' } }}
                >
                  {events.length === 0 ? (
                    <Empty description="No events scheduled today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <div className="space-y-4 pr-1">
                      {events.map((ev, index) => (
                        <div key={ev.id || index} className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col gap-1.5 transition-all hover:bg-white dark:hover:bg-zinc-850 hover:shadow-sm">
                          <div className="flex items-center gap-2 w-full justify-between">
                            <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 line-clamp-1">{ev.title}</span>
                            <Tag color="blue" className="m-0 text-[8px] font-extrabold border-0 px-1 py-0.5">{ev.time}</Tag>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-zinc-400">
                              {ev.date ? new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarOutlined className="text-slate-400 text-[9px]" /> <span className="font-semibold truncate">{ev.venue}</span>
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-[10px] text-slate-400 leading-relaxed m-0 italic line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            )}

            {/* Right: Birthdays & Celebrations & Service Milestones */}
            {(visibility?.modules.birthdays || visibility?.modules.workAnniversaries) && (
              <Col xs={24} md={12} lg={6} className="flex flex-col">
                <Card 
                  title={<span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span> CELEBRATIONS & MILESTONES</span>}
                  variant="outlined"
                  className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
                  styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px', maxHeight: '520px' } }}
                >
                  <div className="space-y-4 pr-1">
                    {/* Birthdays Section */}
                    {visibility?.modules.birthdays && (
                      <div>
                        <div className="text-[9px] font-bold text-pink-500 uppercase tracking-widest mb-2 border-b border-pink-100 dark:border-pink-950/40 pb-1 flex items-center gap-1.5">
                          <span>🎈 Active Birthdays This Week</span>
                          <span className="px-1.5 py-0.5 bg-pink-50 dark:bg-pink-950 text-pink-600 rounded text-[8px] font-bold">{localBirthdays.length}</span>
                        </div>
                        {localBirthdays.length === 0 ? (
                          <div className="text-center py-4 text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No birthdays this week</div>
                        ) : (
                          <div className="space-y-2">
                            {localBirthdays.map((item, index) => (
                              <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar icon={<UserOutlined />} size="small" className="bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-bold text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                                    <div className="text-[9px] text-slate-400 truncate">{item.designation}</div>
                                  </div>
                                </div>
                                <span className="text-[9px] font-extrabold text-pink-600 flex-shrink-0">
                                  {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Milestones Section */}
                    {visibility?.modules.workAnniversaries && (
                      <div>
                        <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2 border-b border-amber-100 dark:border-amber-950/40 pb-1 flex items-center gap-1.5">
                          <span>🌟 Service Milestones</span>
                          <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded text-[8px] font-bold">{localAnniversaries.length}</span>
                        </div>
                        {localAnniversaries.length === 0 ? (
                          <div className="text-center py-4 text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No milestones this week</div>
                        ) : (
                          <div className="space-y-2">
                            {localAnniversaries.map((item, index) => (
                              <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar icon={<StarOutlined />} size="small" className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-bold text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                                    <div className="text-[9px] text-slate-400 truncate">{item.designation}</div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <Tag color="orange" className="font-extrabold border-0 text-[8px] m-0 px-1 py-0">{item.years} Yrs</Tag>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          {/* 3. Standalone Institutional Office Circulars & Office Forms & Templates Card Row */}
          {(visibility?.modules.circulars || visibility?.modules.forms) && (
            (() => {
              const filteredCirculars = circulars.filter(c => 
                c.title.toLowerCase().includes(circularSearchText.toLowerCase()) ||
                (c.fileName && c.fileName.toLowerCase().includes(circularSearchText.toLowerCase()))
              );
              const paginatedCirculars = filteredCirculars.slice((circularPage - 1) * 5, circularPage * 5);

              const filteredForms = forms.filter(f => 
                f.title.toLowerCase().includes(formSearchText.toLowerCase()) ||
                (f.fileName && f.fileName.toLowerCase().includes(formSearchText.toLowerCase()))
              );
              const paginatedForms = filteredForms.slice((formPage - 1) * 5, formPage * 5);

              return (
                <Row gutter={[16, 16]} className="items-stretch">
                  {visibility?.modules.circulars && (
                    <Col xs={24} lg={12} className="flex flex-col">
                      <Card 
                        title={
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-1">
                            <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                              📄 INSTITUTIONAL OFFICE CIRCULARS
                            </span>
                            <Input
                              placeholder="Search circulars..."
                              size="small"
                              prefix={<SearchOutlined className="text-slate-400" />}
                              value={circularSearchText}
                              onChange={(e) => { setCircularSearchText(e.target.value); setCircularPage(1); }}
                              style={{ width: '180px' }}
                              className="rounded-lg text-xs"
                              allowClear
                            />
                          </div>
                        }
                        variant="outlined"
                        className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-fadeIn"
                        styles={{ body: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' } }}
                      >
                        <div className="flex-1 space-y-3 min-h-[300px]">
                          {paginatedCirculars.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                              <Empty description="No matching circulars found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            </div>
                          ) : (
                            paginatedCirculars.map((item, index) => (
                              <div key={item.id || index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg gap-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar icon={<FilePdfOutlined />} size="small" className="bg-red-50 dark:bg-red-950/40 text-red-500 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.title}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">Published: {item.uploadDate}</div>
                                  </div>
                                </div>
                                <Button 
                                  type="primary" 
                                  size="small"
                                  className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md"
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
                                >
                                  View Doc
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                        {filteredCirculars.length > 5 && (
                          <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                            <Pagination 
                              size="small" 
                              current={circularPage} 
                              total={filteredCirculars.length} 
                              pageSize={5} 
                              onChange={(page) => setCircularPage(page)}
                              showSizeChanger={false}
                            />
                          </div>
                        )}
                      </Card>
                    </Col>
                  )}
                  {visibility?.modules.forms && (
                    <Col xs={24} lg={12} className="flex flex-col">
                      <Card 
                        title={
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-1">
                            <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                              📝 OFFICE FORMS & TEMPLATES
                            </span>
                            <Input
                              placeholder="Search forms..."
                              size="small"
                              prefix={<SearchOutlined className="text-slate-400" />}
                              value={formSearchText}
                              onChange={(e) => { setFormSearchText(e.target.value); setFormPage(1); }}
                              style={{ width: '180px' }}
                              className="rounded-lg text-xs"
                              allowClear
                            />
                          </div>
                        }
                        variant="outlined"
                        className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-fadeIn"
                        styles={{ body: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' } }}
                      >
                        <div className="flex-1 space-y-3 min-h-[300px]">
                          {paginatedForms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                              <Empty description="No matching forms found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            </div>
                          ) : (
                            paginatedForms.map((item, index) => (
                              <div key={item.id || index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg gap-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar icon={<SolutionOutlined />} size="small" className="bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-bold text-[11px] text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.title}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">Published: {item.uploadDate}</div>
                                  </div>
                                </div>
                                <Button 
                                  type="primary" 
                                  size="small"
                                  className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md"
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
                                >
                                  Download
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                        {filteredForms.length > 5 && (
                          <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                            <Pagination 
                              size="small" 
                              current={formPage} 
                              total={filteredForms.length} 
                              pageSize={5} 
                              onChange={(page) => setFormPage(page)}
                              showSizeChanger={false}
                            />
                          </div>
                        )}
                      </Card>
                    </Col>
                  )}
                </Row>
              );
            })()
          )}

          {/* 4. Below Grid: Beautiful Tabbed Navigation */}
          <Tabs 
            activeKey={dashboardTab} 
            onChange={(key) => {
              setDashboardTab(key);
              setSelectedScientist(null);
              setSelectedProject(null);
            }} 
            items={tabItems} 
            className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
      );
    }

    // B. Super Admin Dashboard (Stats overview)
    if (currentKey === 'admin-dashboard') {
      return (
        <div className="space-y-6">
          <DashboardOverview
            scientists={scientists}
            projects={projects}
            projectStaff={projectStaff}
            permanentStaff={permanentStaff}
            ypConsultants={ypConsultants}
            events={events}
            visibility={visibility!}
            isAdmin={true}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <BroadcastFeed
                messages={broadcasts}
                isAdmin={true}
                onSendMessage={handleBroadcastMessage}
                onDeleteMessage={(id) => handleDelete('broadcast', id)}
              />
            </Col>
            <Col xs={24} lg={8}>
              <Space direction="vertical" className="w-full animate-fadeIn" size="middle">
                <Card 
                  title={<span className="font-extrabold text-xs sm:text-sm text-[#005EB8] dark:text-blue-400">⚙️ QUICK ADMIN PANEL</span>} 
                  variant="borderless" 
                  className="shadow-sm rounded-xl"
                >
                  <div className="space-y-3">
                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('scientist'); }}>Register New Scientist</Button>
                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('project'); }}>Initialize New Project</Button>
                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('pstaff'); }}>Add Project Staff</Button>
                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('perm'); }}>Add Permanent Staff</Button>
                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('ypc'); }}>Add YP/Consultant</Button>
                    <Divider className="my-2" />
                    <Button block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('circular'); }}>Upload Office Circular</Button>
                    <Button block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('form'); }}>Upload Form Template</Button>
                    <Button block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('announcement'); }}>Add Announcement Bulletin</Button>
                    <Button block icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setActiveModal('event'); }}>Schedule New Event</Button>
                  </div>
                </Card>

                <Card 
                  title={
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-extrabold text-xs sm:text-sm text-green-700 dark:text-green-400">📥 STAFF LEDGER DATA EXPORT</span>
                    </div>
                  }
                  variant="borderless" 
                  className="shadow-sm rounded-xl border border-green-100/50 dark:border-green-950/20"
                >
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider mb-2">
                        Option 1: Complete Separate Registries (All Fields)
                      </div>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Button size="small" block className="text-[10px] rounded-lg text-slate-700 dark:text-zinc-300 font-bold" icon={<DownloadOutlined />} onClick={exportScientistsCSV}>Scientists</Button>
                        </Col>
                        <Col span={12}>
                          <Button size="small" block className="text-[10px] rounded-lg text-slate-700 dark:text-zinc-300 font-bold" icon={<DownloadOutlined />} onClick={exportPermanentStaffCSV}>Permanent Staff</Button>
                        </Col>
                        <Col span={12}>
                          <Button size="small" block className="text-[10px] rounded-lg text-slate-700 dark:text-zinc-300 font-bold" icon={<DownloadOutlined />} onClick={exportProjectStaffCSV}>Project Staff</Button>
                        </Col>
                        <Col span={12}>
                          <Button size="small" block className="text-[10px] rounded-lg text-slate-700 dark:text-zinc-300 font-bold" icon={<DownloadOutlined />} onClick={exportYPConsultantCSV}>YP & Consultants</Button>
                        </Col>
                      </Row>
                    </div>

                    <Button 
                      type="dashed" 
                      block 
                      icon={<DownloadOutlined />} 
                      className="text-[11px] rounded-lg font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50" 
                      onClick={exportAllStaffIndividually}
                    >
                      Download All 4 CSVs (Separate Files)
                    </Button>

                    <Divider className="my-1.5" />

                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider mb-2">
                        Option 2: Combined Ledger (Category-Wise)
                      </div>
                      <Button 
                        type="primary" 
                        block 
                        icon={<DownloadOutlined />} 
                        className="text-xs rounded-lg font-extrabold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 border-0 flex items-center justify-center gap-1.5" 
                        onClick={exportConsolidatedCategoryWiseCSV}
                      >
                        Export All Staff in 1 CSV (Grouped)
                      </Button>
                    </div>

                    <p className="text-[9px] text-slate-400 dark:text-zinc-500 m-0 leading-relaxed italic bg-slate-50 dark:bg-zinc-950 p-2 rounded-lg border border-slate-100 dark:border-zinc-900">
                      * This master sheet groups all personnel by category (Scientists, Permanent, Project, and YPs) and exports 100% of fields, skipping none.
                    </p>
                  </div>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      );
    }

    // C. Super Admin Visibility Config Panel
    if (currentKey === 'admin-visibility') {
      return (
        <VisibilityPanel
          initialConfig={visibility!}
          onSave={async (newConfig) => {
            const updated = await apiService.updateVisibility(newConfig);
            setVisibility(updated);
          }}
        />
      );
    }

    // C2. Super Admin Salaries Manager (CSV upload & logs)
    if (currentKey === 'admin-salaries') {
      return (
        <AdminSalariesManager projectStaff={projectStaff} />
      );
    }

    // D. CRUD Listings Views (Scientists, Projects, Staff types, Circulars, Forms, Events)
    let title = '';
    let columns: any[] = [];
    let dataSource: any[] = [];
    let modalType: any = null;

    if (currentKey === 'admin-scientists') {
      title = '🎓 Registered Scientists Registry';
      columns = getScientistColumns();
      dataSource = scientists;
      modalType = 'scientist';
    } else if (currentKey === 'admin-projects') {
      title = '🔬 Extramural Projects Ledger';
      columns = getProjectColumns();
      dataSource = projects;
      modalType = 'project';
    } else if (currentKey === 'admin-project-staff') {
      title = '👥 Project Research Staff';
      columns = getProjectStaffColumns();
      dataSource = projectStaff;
      modalType = 'pstaff';
    } else if (currentKey === 'admin-permanent-staff') {
      title = '💼 Permanent Staff Registry';
      columns = getPermanentStaffColumns();
      dataSource = permanentStaff;
      modalType = 'perm';
    } else if (currentKey === 'admin-yp-consultants') {
      title = '🌟 Young Professionals & Consultants';
      columns = getYPConsultantColumns();
      dataSource = ypConsultants;
      modalType = 'ypc';
    } else if (currentKey === 'admin-circulars') {
      title = '📄 Institutional Office Circulars';
      columns = getCircularColumns();
      dataSource = circulars;
      modalType = 'circular';
    } else if (currentKey === 'admin-forms') {
      title = '📝 Office Forms & Templates';
      columns = getFormColumns();
      dataSource = forms;
      modalType = 'form';
    } else if (currentKey === 'admin-events') {
      title = 'Today’s Scientific Events Schedules';
      columns = [
        { title: 'Event Title', dataIndex: 'title', key: 'title', width: 350 },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (val: string) => val ? new Date(val).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Today' },
        { title: 'Venue', dataIndex: 'venue', key: 'venue' },
        { title: 'Time Slot', dataIndex: 'time', key: 'time' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
          title: 'Actions',
          key: 'actions',
          render: (_: any, rec: Event) => (
            <Space size="middle">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('event'); }} />
              <Popconfirm title="Delete event?" onConfirm={() => handleDelete('event', rec.id)}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )
        }
      ];
      dataSource = events;
      modalType = 'event';
    } else if (currentKey === 'admin-accounts') {
      title = '🔐 Super Admin Accounts Management';
      columns = [
        { title: 'Admin ID', dataIndex: 'id', key: 'id' },
        { title: 'Name', dataIndex: 'name', key: 'name', font: 'bold' },
        { title: 'Email Address', dataIndex: 'email', key: 'email' },
        {
          title: 'Actions',
          key: 'actions',
          render: (_: any, rec: Admin) => (
            <Space size="middle">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('admin'); }} />
              {rec.id !== 'admin-1' && (
                <Popconfirm title="Delete account?" onConfirm={() => handleDelete('admin', rec.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </Space>
          )
        }
      ];
      dataSource = admins;
      modalType = 'admin';
    }

    return (
      <Card 
        title={
          <div className="flex justify-between items-center flex-wrap gap-2 py-1">
            <span className="font-bold text-base text-slate-800 dark:text-zinc-100">{title}</span>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search resources..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 220 }}
                className="rounded-lg text-xs"
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="rounded-lg text-xs font-semibold"
                onClick={() => { setEditRecord(null); setActiveModal(modalType); }}
              >
                Add New Record
              </Button>
            </div>
          </div>
        }
        variant="borderless"
        className="shadow-sm rounded-xl overflow-hidden"
      >
        <Table 
          columns={columns} 
          dataSource={filterDataset(dataSource)} 
          pagination={{ pageSize: 10 }}
          size="middle"
          rowKey="id"
          scroll={{ x: 'max-content' }}
          onRow={(record) => {
            let rowType: 'scientist' | 'pstaff' | 'perm' | 'ypc' | null = null;
            if (currentKey === 'admin-scientists') rowType = 'scientist';
            else if (currentKey === 'admin-project-staff') rowType = 'pstaff';
            else if (currentKey === 'admin-permanent-staff') rowType = 'perm';
            else if (currentKey === 'admin-yp-consultants') rowType = 'ypc';

            if (rowType) {
              return {
                onClick: (e: any) => {
                  if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                  openStaffDetailsModal(record, rowType!);
                },
                className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
              };
            }
            return {};
          }}
        />
      </Card>
    );
  };

  // Safe file loader helper for Circulars / Forms
  const handleDocFileUpload = (file: File, setFieldValue: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFieldValue('fileName', file.name);
      setFieldValue('fileData', reader.result as string);
      message.success(`${file.name} uploaded successfully.`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Layout className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-300">
        {/* Responsive Header */}
        <Header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-6 flex justify-between items-center sticky top-0 z-50 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#005EB8] rounded flex items-center justify-center overflow-hidden font-bold text-white text-xs">
              <img src="https://icmr.gov.in/images/icmr_logo.png" alt="Logo" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span className="italic">NIHR</span>
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-sm md:text-base font-semibold tracking-tight text-[#005EB8] dark:text-blue-400 m-0">
                Intranet <span className="hidden sm:inline text-slate-400 dark:text-zinc-500 font-normal ml-1">| Project & Staff Ledger</span>
              </h1>
            </div>
          </div>

          <Space size="middle">
            {/* Theme Toggle Button */}
            <Button 
              type="text" 
              icon={themeMode === 'dark' ? <BulbFilled className="text-yellow-500" /> : <BulbOutlined />} 
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              className="text-slate-600 dark:text-zinc-300"
            />

            <Button 
              type={currentKey === 'complaints' ? 'primary' : 'default'} 
              icon={<CustomerServiceOutlined />} 
              className="rounded-lg text-xs font-semibold"
              onClick={() => {
                if (currentKey === 'complaints') {
                  setCurrentKey(isAuthenticated ? 'admin-dashboard' : 'public-dashboard');
                } else {
                  setCurrentKey('complaints');
                }
              }}
            >
              {currentKey === 'complaints' ? 'Back to Intranet' : 'Complaints Desk'}
            </Button>

            {/* Public/Admin Mode toggler */}
            {!isAuthenticated ? (
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                className="rounded-lg text-xs font-semibold"
                onClick={() => { setShowLoginModal(true); loadCaptcha(); }}
              >
                Super Admin Login
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Tag color="blue" className="m-0 border-0 text-xs px-2.5 py-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
                  <UserOutlined /> {currentAdmin?.name} (Admin)
                </Tag>
                <Button 
                  danger 
                  icon={<LogoutOutlined />} 
                  className="rounded-lg text-xs font-semibold"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </Space>
        </Header>

        {/* Core Layout Grid */}
        <Layout>
          {/* Centered Main Area */}
          <Layout className="p-4 md:p-6 overflow-x-hidden bg-[#F8FAFC] dark:bg-zinc-950">
            <Content className="w-full min-h-[500px]">
              {isAuthenticated && (
                <div className="mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-3">
                    <span className="w-2.5 h-2.5 bg-[#005EB8] rounded-full animate-pulse"></span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Super Admin Console</span>
                  </div>
                  <Menu
                    mode="horizontal"
                    selectedKeys={[currentKey]}
                    onClick={({ key }) => {
                      if (key === 'public-overview') {
                        setCurrentKey('public-dashboard');
                        setDashboardTab('scientists');
                        setSelectedScientist(null);
                        setSelectedProject(null);
                      } else {
                        setCurrentKey(key);
                      }
                    }}
                    className="border-b-0 flex-1 justify-end font-semibold text-xs text-slate-600 dark:text-zinc-300 bg-transparent dark:bg-transparent"
                    style={{ borderBottom: 'none' }}
                    items={[
                      { key: 'admin-dashboard', icon: <AppstoreOutlined />, label: 'Admin Dashboard' },
                      {
                        key: 'registries',
                        icon: <TeamOutlined />,
                        label: 'Administrative Registries',
                        children: [
                          { key: 'admin-scientists', icon: <UserOutlined />, label: 'Scientists Registry' },
                          { key: 'admin-projects', icon: <ProjectOutlined />, label: 'Projects Ledger' },
                          { key: 'admin-project-staff', icon: <SolutionOutlined />, label: 'Project Staff' },
                          { key: 'admin-permanent-staff', icon: <TeamOutlined />, label: 'Permanent Staff' },
                          { key: 'admin-yp-consultants', icon: <StarOutlined />, label: 'YP & Consultants' },
                          { key: 'admin-salaries', icon: <PrinterOutlined />, label: 'Staff Salaries (CSV)' },
                        ]
                      },
                      {
                        key: 'library',
                        icon: <FilePdfOutlined />,
                        label: 'Institutional Library',
                        children: [
                          { key: 'admin-circulars', icon: <FilePdfOutlined />, label: 'Office Circulars' },
                          { key: 'admin-forms', icon: <FilePdfOutlined />, label: 'Office Forms Templates' },
                          { key: 'admin-events', icon: <CalendarOutlined />, label: 'Institutional Events' },
                        ]
                      },
                      { key: 'admin-visibility', icon: <SettingOutlined />, label: 'Visibility Control' },
                      { key: 'complaints', icon: <CustomerServiceOutlined />, label: 'Grievance / Complaint Desk' },
                      { key: 'admin-accounts', icon: <KeyOutlined />, label: 'Super Admin Accounts' },
                      { key: 'public-overview', icon: <TeamOutlined />, label: 'View Public Dashboard' }
                    ]}
                  />
                </div>
              )}
              {renderContentView()}
            </Content>
            
            <Footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-6 py-3 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-tight mt-8 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-2 md:mb-0">
                <span>System v1.4.2</span>
                <span>Environment: Production</span>
                <span>Last Data Sync: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div>National Institute for Health Research © 2026</div>
            </Footer>
          </Layout>
        </Layout>

        {/* Login Modal with Captcha verification */}
        <Modal
          title={<Space><LockOutlined className="text-blue-500" /><span>Super User Authentication Panel</span></Space>}
          open={showLoginModal}
          onOk={handleLogin}
          onCancel={() => setShowLoginModal(false)}
          okText="Authenticate & Login"
          confirmLoading={submittingLogin}
          className="rounded-xl overflow-hidden"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Official Email Address</label>
              <Input 
                placeholder="icmrdigicare@gmail.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                className="rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Security Password</label>
              <Input.Password 
                placeholder="Password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                onPressEnter={handleLogin}
                className="rounded-md"
              />
            </div>

            {/* Math CAPTCHA verification */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-2">🛡️ Human Verification (Shield Engine)</span>
              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-blue-700 tracking-wide select-none">{captchaQuestion}</span>
                <Button size="small" type="dashed" className="text-xs" onClick={loadCaptcha}>Refresh CAPTCHA</Button>
              </div>
              <Input 
                placeholder="Enter computed answer" 
                value={captchaAnswer} 
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="mt-2 rounded-md"
              />
            </div>
          </div>
        </Modal>

        {/* Dynamic Forms Modals */}
        <Modal
          title={<Space><SettingOutlined /><span>{editRecord ? 'Modify Record Details' : 'Register New Institutional Entry'}</span></Space>}
          open={activeModal !== null}
          footer={null}
          onCancel={() => { setActiveModal(null); setEditRecord(null); }}
          width={800}
          destroyOnHidden
          className="rounded-xl"
        >
          {activeModal === 'scientist' && (
            <ScientistForm 
              initialValues={editRecord} 
              onSubmit={(v) => handleCreateOrUpdate('scientist', v)} 
              onCancel={() => { setActiveModal(null); setEditRecord(null); }} 
            />
          )}

          {activeModal === 'project' && (
            <ProjectForm 
              initialValues={editRecord} 
              scientists={scientists} 
              onSubmit={(v) => handleCreateOrUpdate('project', v)} 
              onCancel={() => { setActiveModal(null); setEditRecord(null); }} 
            />
          )}

          {activeModal === 'pstaff' && (
            <ProjectStaffForm 
              initialValues={editRecord} 
              projects={projects} 
              scientists={scientists} 
              onSubmit={(v) => handleCreateOrUpdate('pstaff', v)} 
              onCancel={() => { setActiveModal(null); setEditRecord(null); }} 
            />
          )}

          {activeModal === 'perm' && (
            <PermanentStaffForm 
              initialValues={editRecord} 
              onSubmit={(v) => handleCreateOrUpdate('perm', v)} 
              onCancel={() => { setActiveModal(null); setEditRecord(null); }} 
            />
          )}

          {activeModal === 'ypc' && (
            <YPConsultantForm 
              initialValues={editRecord} 
              onSubmit={(v) => handleCreateOrUpdate('ypc', v)} 
              onCancel={() => { setActiveModal(null); setEditRecord(null); }} 
            />
          )}

          {activeModal === 'admin' && (
            <Formik
              initialValues={{ name: '', email: '', password: '', ...editRecord }}
              onSubmit={(v) => handleCreateOrUpdate('admin', v)}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <Row gutter={12}>
                    <Col xs={24}>
                      <label className="text-xs font-semibold block mb-1">Full Name</label>
                      <Field as={Input} name="name" required />
                    </Col>
                    <Col xs={24} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">Email</label>
                      <Field as={Input} name="email" required />
                    </Col>
                    <Col xs={24} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">{editRecord ? 'New Password (Optional)' : 'Password'}</label>
                      <Field as={Input.Password} name="password" required={!editRecord} />
                    </Col>
                  </Row>
                  <Divider className="my-2" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setActiveModal(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Admin</Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {/* Simple Library items (Circular / Form / Announcement / Event) */}
          {activeModal === 'circular' && (
            <Formik
              initialValues={{ title: '', fileName: '', fileData: '', ...editRecord }}
              onSubmit={(v) => handleCreateOrUpdate('circular', v)}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Circular Title</label>
                    <Field as={Input} name="title" required placeholder="e.g. Mandatory Biometric Attendance Guidelines" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Upload Document (PDF, Word, Image)</label>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.png" 
                      required={!editRecord} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocFileUpload(file, setFieldValue);
                      }} 
                    />
                    {values.fileName && <div className="text-xs text-green-600 mt-2 font-bold">✔️ Loaded: {values.fileName}</div>}
                  </div>
                  <Divider className="my-2" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setActiveModal(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Circular</Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {activeModal === 'form' && (
            <Formik
              initialValues={{ title: '', fileName: '', fileData: '', ...editRecord }}
              onSubmit={(v) => handleCreateOrUpdate('form', v)}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Form Document Title</label>
                    <Field as={Input} name="title" required placeholder="e.g. Travel Allowance (TA) Claim Voucher" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Upload File (PDF/Word/Image)</label>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.png" 
                      required={!editRecord} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocFileUpload(file, setFieldValue);
                      }} 
                    />
                    {values.fileName && <div className="text-xs text-green-600 mt-2 font-bold">✔️ Loaded: {values.fileName}</div>}
                  </div>
                  <Divider className="my-2" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setActiveModal(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Form Template</Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {activeModal === 'announcement' && (
            <Formik
              initialValues={{ title: '', ...editRecord }}
              onSubmit={(v) => handleCreateOrUpdate('announcement', v)}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Announcement Title / Bulletin</label>
                    <Field as={Input.TextArea} rows={3} name="title" required placeholder="Type the announcement bulletin details..." />
                  </div>
                  <Divider className="my-2" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setActiveModal(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>Publish Announcement</Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {activeModal === 'event' && (
            <Formik
              initialValues={{ title: '', venue: '', time: '', date: new Date().toISOString().split('T')[0], description: '', ...editRecord }}
              onSubmit={(v) => handleCreateOrUpdate('event', v)}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <Row gutter={12}>
                    <Col xs={24}>
                      <label className="text-xs font-semibold block mb-1">Event/Meeting Title</label>
                      <Field as={Input} name="title" required />
                    </Col>
                    <Col xs={24} sm={12} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">Event Date</label>
                      <Field as={Input} type="date" name="date" required />
                    </Col>
                    <Col xs={24} sm={12} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">Time Slot</label>
                      <Field as={Input} name="time" required placeholder="10:00 AM - 12:00 PM" />
                    </Col>
                    <Col xs={24} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">Venue Room</label>
                      <Field as={Input} name="venue" required placeholder="Conference Room A" />
                    </Col>
                    <Col xs={24} className="mt-3">
                      <label className="text-xs font-semibold block mb-1">Event Description (Optional)</label>
                      <Field as={Input.TextArea} rows={2} name="description" />
                    </Col>
                  </Row>
                  <Divider className="my-2" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setActiveModal(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>Schedule Event</Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </Modal>

        {/* Scientist & Staff Details Profile View Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
              <div>
                <span className="font-bold text-base text-slate-800 dark:text-zinc-100">
                  {viewDetailRecord?.name || 'Staff Member Profile'}
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  {viewDetailType === 'scientist' ? 'Scientist Registry' : 
                   viewDetailType === 'pstaff' ? 'Project Research Staff Registry' :
                   viewDetailType === 'perm' ? 'Permanent Staff Directory' :
                   'Young Professional / Consultant'}
                </span>
              </div>
            </div>
          }
          open={viewDetailModalVisible}
          onCancel={() => setViewDetailModalVisible(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setViewDetailModalVisible(false)}>
              Close Profile View
            </Button>
          ].filter(Boolean)}
          width={700}
          className="rounded-xl overflow-hidden"
        >
          {viewDetailRecord && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Profile Header Block */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                {viewDetailRecord.photoUrl ? (
                  <img 
                    src={viewDetailRecord.photoUrl} 
                    alt={viewDetailRecord.name} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(viewDetailRecord.name);
                    }}
                  />
                ) : (
                  <Avatar 
                    size={80} 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewDetailRecord.name)}`}
                    className="border-2 border-blue-500 shadow-sm"
                  />
                )}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 m-0">{viewDetailRecord.name}</h3>
                  <p className="text-xs font-semibold text-blue-600 m-0">{viewDetailRecord.designation || viewDetailRecord.fullDesignation || 'Officer'}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color="blue" className="m-0 text-[10px] uppercase font-bold">{viewDetailRecord.employeeCode || 'TEMP-CODE'}</Tag>
                    <Tag color={viewDetailRecord.status === 'Active' ? 'green' : 'red'} className="m-0 text-[10px] uppercase font-bold">
                      {viewDetailRecord.status || 'Active'}
                    </Tag>
                    {viewDetailRecord.category && (
                      <Tag color="purple" className="m-0 text-[10px] uppercase font-bold">Category: {viewDetailRecord.category}</Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Categorized Fields Grid */}
              <Row gutter={[16, 16]}>
                {/* Section 1: Professional & Academic */}
                <Col xs={24}>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    💼 Professional & Placement Details
                  </h4>
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Date of Joining</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.doj || 'Not Registered'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Room Number</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.roomNumber || 'Not Assigned'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Department Location</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.departmentLocation || 'Main Campus Block'}
                      </span>
                    </Col>
                    {viewDetailRecord.projectId && (
                      <Col xs={24} sm={12}>
                        <span className="block text-[10px] text-slate-400 font-medium">Linked Research Project</span>
                        <span className="text-xs font-semibold text-blue-600">
                          {projects.find(p => p.id === viewDetailRecord.projectId)?.name || 'Research Scheme'}
                        </span>
                      </Col>
                    )}
                  </Row>
                </Col>

                {/* Section 2: Contact Details */}
                <Col xs={24}>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    ✉️ Contact & Communications
                  </h4>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                      <span className="block text-[10px] text-slate-400 font-medium">Primary Email</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.govtEmail || viewDetailRecord.email, isAuthenticated || !!visibility?.fields.email)}
                      </span>
                    </Col>
                    {viewDetailRecord.personalEmail && (
                      <Col xs={24} sm={12}>
                        <span className="block text-[10px] text-slate-400 font-medium">Personal Email</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.personalEmail, isAuthenticated)}
                        </span>
                      </Col>
                    )}
                    <Col xs={12} sm={12}>
                      <span className="block text-[10px] text-slate-400 font-medium">Phone / Mobile</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.phone, isAuthenticated || !!visibility?.fields.phone)}
                      </span>
                    </Col>
                    <Col xs={12} sm={12}>
                      <span className="block text-[10px] text-slate-400 font-medium">Emergency Contact</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.emergencyContact, isAuthenticated || !!visibility?.fields.phone, '🔒 Masked')}
                      </span>
                    </Col>
                  </Row>
                </Col>

                {/* Section 3: Personal & Identification Verification */}
                <Col xs={24}>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    👤 Personal Identity & Security IDs
                  </h4>
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Date of Birth</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.dob, isAuthenticated || !!visibility?.fields.dob)}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Gender</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.gender || '-'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Blood Group</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.bloodGroup || '-'}
                      </span>
                    </Col>
                    <Col xs={24} sm={12}>
                      <span className="block text-[10px] text-slate-400 font-medium">Aadhaar Card Number</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.aadhaarNumber, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                    <Col xs={24} sm={12}>
                      <span className="block text-[10px] text-slate-400 font-medium">Permanent Account Number (PAN)</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.panNumber, isAuthenticated || !!visibility?.fields.pan, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                    <Col xs={24}>
                      <span className="block text-[10px] text-slate-400 font-medium">Residential Home Address</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.address, isAuthenticated || !!visibility?.fields.address, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                  </Row>
                </Col>

                {/* Section 4: Bank Details */}
                {viewDetailRecord.accountNumber && (
                  <Col xs={24}>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                      🏦 Official Salary Disbursement Bank Account
                    </h4>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} sm={8}>
                        <span className="block text-[10px] text-slate-400 font-medium">Bank Name</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.bankName, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                      <Col xs={24} sm={8}>
                        <span className="block text-[10px] text-slate-400 font-medium">Account Number</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.accountNumber, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                      <Col xs={24} sm={8}>
                        <span className="block text-[10px] text-slate-400 font-medium">IFSC Routing Code</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.ifscCode, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                    </Row>
                  </Col>
                )}

                {/* Section 5: Experience Entries (For Project Staff) */}
                {viewDetailType === 'pstaff' && (
                  <Col xs={24}>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                      🎓 Historical Service Experience Records & Tenure Analysis
                    </h4>

                    {/* Year-Months-Days Breakdown Grid */}
                    {(() => {
                      const expYMD = calculateStaffExperienceYMD(viewDetailRecord);
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                          <div className="bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ICMR Exp</div>
                            <div className="text-sm font-black text-slate-700 dark:text-zinc-200 mt-1 font-mono">
                              {formatYMD(expYMD.icmr)}
                            </div>
                            <div className="text-[9px] text-slate-400 italic">Years-Months-Days</div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Non-ICMR Exp</div>
                            <div className="text-sm font-black text-slate-700 dark:text-zinc-200 mt-1 font-mono">
                              {formatYMD(expYMD.nonIcmr)}
                            </div>
                            <div className="text-[9px] text-slate-400 italic">Years-Months-Days</div>
                          </div>

                          <div className="bg-blue-50/40 dark:bg-blue-950/10 p-2.5 rounded-lg border border-blue-100/30 dark:border-blue-900/20 text-center">
                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Current Exp</div>
                            <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                              {formatYMD(expYMD.current)}
                            </div>
                            <div className="text-[9px] text-blue-400 italic">DOJ to Today</div>
                          </div>

                          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/40 dark:border-indigo-900/30 text-center">
                            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Total Experience</div>
                            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                              {formatYMD(expYMD.total)}
                            </div>
                            <div className="text-[9px] text-indigo-400 italic">Combined Y-M-D</div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/30 mb-3 text-xs flex justify-between items-center">
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Cumulative Experience Month Totals:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {viewDetailRecord.totalExpMonths || 0} Months (ICMR: {viewDetailRecord.icmrExpMonths || 0} | Non-ICMR: {viewDetailRecord.nonIcmrExpMonths || 0})
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Previous ICMR Experience */}
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">ICMR Experience</span>
                        {viewDetailRecord.previousIcmrExperience && viewDetailRecord.previousIcmrExperience.length > 0 ? (
                          <div className="space-y-2">
                            {viewDetailRecord.previousIcmrExperience.map((exp: any, i: number) => (
                              <div key={exp.id || i} className="bg-slate-50/75 dark:bg-zinc-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-xs">
                                <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-300">
                                  <span>{exp.instituteName}</span>
                                  <span className="text-blue-600">{exp.designation}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  From: {exp.fromDate || '-'} To: {exp.toDate || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400 block pl-1">No previous ICMR service logged.</span>
                        )}
                      </div>

                      {/* Previous Non-ICMR Experience */}
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Non-ICMR Experience</span>
                        {viewDetailRecord.previousNonIcmrExperience && viewDetailRecord.previousNonIcmrExperience.length > 0 ? (
                          <div className="space-y-2">
                            {viewDetailRecord.previousNonIcmrExperience.map((exp: any, i: number) => (
                              <div key={exp.id || i} className="bg-slate-50/75 dark:bg-zinc-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-xs">
                                <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-300">
                                  <span>{exp.instituteName}</span>
                                  <span className="text-blue-600">{exp.designation}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  From: {exp.fromDate || '-'} To: {exp.toDate || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400 block pl-1">No previous non-ICMR service logged.</span>
                        )}
                      </div>
                    </div>
                  </Col>
                )}

                {/* Section 6: Leave Clearance Information */}
                {viewDetailRecord.status === 'Left' && (
                  <Col xs={24} className="bg-red-50/50 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <h4 className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2">
                      ⚠️ Separation & Exit Clearance Guidelines
                    </h4>
                    <Row gutter={[12, 12]}>
                      <Col xs={12}>
                        <span className="block text-[10px] text-red-500 font-medium">Last Working Date</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {viewDetailRecord.lastWorkingDate || '-'}
                        </span>
                      </Col>
                      <Col xs={12}>
                        <span className="block text-[10px] text-red-500 font-medium">No Dues Certificate Status</span>
                        <Tag color={viewDetailRecord.noDuesCleared ? 'green' : 'orange'}>
                          {viewDetailRecord.noDuesCleared ? '✔️ CLEARED & ARCHIVED' : '❌ PENDING SUBMISSION'}
                        </Tag>
                      </Col>
                      <Col xs={24}>
                        <span className="block text-[10px] text-red-500 font-medium">Leaving Reason</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                          {viewDetailRecord.leavingReason || 'Not stated'}
                        </span>
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Modal>
      </Layout>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#005EB8', // Premium Clean Minimalism Royal Blue
          borderRadius: 8,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <AntdApp>
        <InnerApp themeMode={themeMode} setThemeMode={setThemeMode} />
      </AntdApp>
    </ConfigProvider>
  );
}
