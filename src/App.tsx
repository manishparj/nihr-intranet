import { useState, useEffect } from 'react';
import { 
  Layout, Menu, Button, Card, Table, Modal, Input, Row, Col, Space, Badge, 
  Switch, Tag, Spin, Popconfirm, Avatar, Divider, message, ConfigProvider, theme, Empty,
  App as AntdApp, Tabs, Breadcrumb, Pagination, Drawer, Grid
} from 'antd';
import { 
  UserOutlined, ProjectOutlined, SolutionOutlined, FilePdfOutlined, 
  NotificationOutlined, CalendarOutlined, MessageOutlined, SettingOutlined, 
  LogoutOutlined, LoginOutlined, SearchOutlined, PlusOutlined, EditOutlined, 
  DeleteOutlined, BulbOutlined, BulbFilled, TeamOutlined, KeyOutlined, 
  UnlockOutlined, InfoCircleOutlined, DownloadOutlined, StarOutlined, LockOutlined,
  AppstoreOutlined, MenuOutlined, CloseOutlined, GiftOutlined
} from '@ant-design/icons';
import { Formik, Form, Field } from 'formik';
import { apiService } from './services/api';
import { 
  Admin, Scientist, Project, ProjectStaff, PermanentStaff, 
  YPConsultant, Circular, FormDocument, Announcement, Event, 
  BroadcastMessage, VisibilityConfig 
} from './types';
import { BroadcastFeed } from './components/BroadcastFeed';
import { VisibilityPanel } from './components/VisibilityPanel';
import { DashboardOverview } from './components/DashboardOverview';
import { ScientistForm, ProjectForm } from './components/AdminForms';
import { ProjectStaffForm, PermanentStaffForm, YPConsultantForm } from './components/StaffForms';

const { Header, Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;

interface InnerAppProps {
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
}

function InnerApp({ themeMode, setThemeMode }: InnerAppProps) {
  const { message } = AntdApp.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Search & Pagination states for Circulars and Forms (tabs approach)
  const [circularSearchText, setCircularSearchText] = useState('');
  const [circularPage, setCircularPage] = useState(1);
  const [formSearchText, setFormSearchText] = useState('');
  const [formPage, setFormPage] = useState(1);
  const [libraryActiveTab, setLibraryActiveTab] = useState<string>('circulars');

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

  // Pagination sizes based on device
  const getPageSize = () => {
    if (isMobile) return 5;
    if (isTablet) return 8;
    return 10;
  };

  const getTableScroll = () => {
    if (isMobile) return { x: 600 };
    if (isTablet) return { x: 800 };
    return { x: 'max-content' };
  };

  const openStaffDetailsModal = (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => {
    setViewDetailRecord(record);
    setViewDetailType(type);
    setViewDetailModalVisible(true);
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
      setBroadcasts(bc.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
        setCurrentKey('admin-dashboard');
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

  const getScientistColumns = () => {
    const baseColumns = [
      { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
      { title: 'Scientist Name', dataIndex: 'name', key: 'name', font: 'bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
      { title: 'Designation', dataIndex: 'designation', key: 'designation' },
      { title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
      { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => <Tag color="blue">{cat}</Tag> },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> },
    ];

    if (isAuthenticated) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, rec: Scientist) => (
          <Space size="middle">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('scientist'); }} />
            <Popconfirm title="Delete profile?" onConfirm={() => handleDelete('scientist', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        )
      });
    }
    return baseColumns;
  };

  const getProjectColumns = () => {
    const baseColumns = [
      { title: 'Short Code', dataIndex: 'shortName', key: 'shortName', sorter: (a: any, b: any) => a.shortName.localeCompare(b.shortName) },
      { title: 'Full Scientific Name', dataIndex: 'name', key: 'name', width: isMobile ? 150 : 300 },
      { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="orange">{t}</Tag> },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Completed' ? 'green' : s === 'Ongoing' ? 'blue' : 'gray'}>{s}</Tag> },
      { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (b: number) => `₹${b.toLocaleString()}`, sorter: (a: any, b: any) => a.budget - b.budget },
      { title: 'PI Name', dataIndex: 'piId', key: 'piId', render: (id: string) => scientists.find(s => s.id === id)?.name || 'Unknown' },
    ];

    if (!isMobile) {
      baseColumns.push(
        { title: 'Duration', dataIndex: 'durationDays', key: 'durationDays', render: (val: number) => `${val || 0} days` },
        { title: 'Days Left', dataIndex: 'pendingDays', key: 'pendingDays', render: (val: number) => <Tag color={val === 0 ? 'red' : 'green'}>{val || 0} days</Tag> },
        { title: 'Active Staff', dataIndex: 'staffCount', key: 'staffCount', render: (val: number) => <Badge count={val || 0} showZero className="bg-slate-400" /> }
      );
    }

    if (isAuthenticated) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, rec: Project) => (
          <Space size="middle">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('project'); }} />
            <Popconfirm title="Delete project?" onConfirm={() => handleDelete('project', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        )
      });
    }
    return baseColumns;
  };

  const getProjectStaffColumns = () => {
    const baseColumns = [
      { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || '') },
      { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
      { title: 'Designation', dataIndex: 'designation', key: 'designation' },
      { title: 'Linked Project', dataIndex: 'projectId', key: 'projectId', render: (id: string) => projects.find(p => p.id === id)?.shortName || 'None' },
    ];

    if (!isMobile) {
      baseColumns.push(
        { title: 'Email', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
        { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
        { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
      );
    }

    if (isAuthenticated) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, rec: ProjectStaff) => (
          <Space size="middle">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('pstaff'); }} />
            <Popconfirm title="Delete staff profile?" onConfirm={() => handleDelete('pstaff', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        )
      });
    }
    return baseColumns;
  };

  const getPermanentStaffColumns = () => {
    const baseColumns = [
      { title: 'Perm Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
      { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold' },
      { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    ];

    if (!isMobile) {
      baseColumns.push(
        { title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
        { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
        { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
      );
    }

    if (isAuthenticated) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, rec: PermanentStaff) => (
          <Space size="middle">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('perm'); }} />
            <Popconfirm title="Delete staff profile?" onConfirm={() => handleDelete('perm', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        )
      });
    }
    return baseColumns;
  };

  const getYPConsultantColumns = () => {
    const baseColumns = [
      { title: 'Temp/CONS Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
      { title: 'Staff Member', dataIndex: 'name', key: 'name', font: 'bold' },
      { title: 'Designation Type', dataIndex: 'designationType', key: 'designationType', render: (val: string) => <Tag color={val === 'Consultant' ? 'magenta' : 'cyan'}>{val}</Tag> },
    ];

    if (!isMobile) {
      baseColumns.push(
        { title: 'Full Designation', dataIndex: 'fullDesignation', key: 'fullDesignation' },
        { title: 'Email', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') },
        { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
      );
    }

    if (isAuthenticated) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, rec: YPConsultant) => (
          <Space size="middle">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(rec); setActiveModal('ypc'); }} />
            <Popconfirm title="Delete profile?" onConfirm={() => handleDelete('ypc', rec.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
          </Space>
        )
      });
    }
    return baseColumns;
  };

  const getCircularColumns = () => [
    { title: 'Circular Title', dataIndex: 'title', key: 'title', width: isMobile ? 150 : 450 },
    { title: 'Upload Date', dataIndex: 'uploadDate', key: 'uploadDate', sorter: (a: any, b: any) => a.uploadDate.localeCompare(b.uploadDate) },
    {
      title: 'Document',
      key: 'document',
      render: (_: any, rec: Circular) => (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />} 
          onClick={() => handleDownloadBase64File(rec.fileName, rec.fileData)}
          size={isMobile ? "small" : "middle"}
        >
          {!isMobile && rec.fileName}
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
    { title: 'Form Title', dataIndex: 'title', key: 'title', width: isMobile ? 150 : 450 },
    { title: 'Upload Date', dataIndex: 'uploadDate', key: 'uploadDate', sorter: (a: any, b: any) => a.uploadDate.localeCompare(b.uploadDate) },
    {
      title: 'Form File',
      key: 'document',
      render: (_: any, rec: FormDocument) => (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />} 
          onClick={() => handleDownloadBase64File(rec.fileName, rec.fileData)}
          size={isMobile ? "small" : "middle"}
        >
          {!isMobile && rec.fileName}
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
              {!isMobile && ' Scientists'}
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
                  pagination={{ pageSize: getPageSize() }} 
                  size={isMobile ? "small" : "middle"} 
                  rowKey="id" 
                  scroll={getTableScroll()}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Drill-Down Level 1: Scientific Leadership</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex flex-wrap items-center gap-2">
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
                        pagination={{ pageSize: getPageSize() }}
                        size={isMobile ? "small" : "small"}
                        rowKey="id"
                        scroll={getTableScroll()}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
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
                              pagination={{ pageSize: getPageSize() }}
                              size={isMobile ? "small" : "small"}
                              rowKey="id"
                              scroll={getTableScroll()}
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
              {!isMobile && ' Projects Ledger'}
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
                  pagination={{ pageSize: getPageSize() }} 
                  size={isMobile ? "small" : "middle"} 
                  rowKey="id" 
                  scroll={getTableScroll()}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
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
                              pagination={{ pageSize: getPageSize() }}
                              size={isMobile ? "small" : "small"}
                              rowKey="id"
                              scroll={getTableScroll()}
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
              {!isMobile && ' Project Research Staff'}
            </span>
          ),
          children: (
            <Card title="👥 Project Research Staff Profiles (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getProjectStaffColumns()} 
                dataSource={projectStaff} 
                pagination={{ pageSize: getPageSize() }} 
                size={isMobile ? "small" : "middle"} 
                rowKey="id" 
                scroll={{ x: isMobile ? 600 : 1200 }}
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
              {!isMobile && ' Permanent Staff'}
            </span>
          ),
          children: (
            <Card title="💼 Permanent Staff Directory (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getPermanentStaffColumns()} 
                dataSource={permanentStaff} 
                pagination={{ pageSize: getPageSize() }} 
                size={isMobile ? "small" : "middle"} 
                rowKey="id" 
                scroll={{ x: isMobile ? 600 : 'max-content' }}
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
              {!isMobile && ' YP & Consultants'}
            </span>
          ),
          children: (
            <Card title="🌟 Young Professional & Consultant Staff (Click row for full profile)" variant="borderless" className="shadow-sm rounded-xl overflow-hidden">
              <Table 
                columns={getYPConsultantColumns()} 
                dataSource={ypConsultants} 
                pagination={{ pageSize: getPageSize() }} 
                size={isMobile ? "small" : "middle"} 
                rowKey="id" 
                scroll={{ x: isMobile ? 600 : 'max-content' }}
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
        }] : [])
      ];

      // Library Tabs with Pagination (replaces separate cards)
      const LibraryTabs = () => {
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

        const libraryTabItems = [
          {
            key: 'circulars',
            label: (
              <span className="flex items-center gap-1">
                <FilePdfOutlined className="text-red-500" />
                Circulars ({filteredCirculars.length})
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    📄 Institutional Office Circulars
                  </span>
                  <Input
                    placeholder="Search circulars..."
                    size={isMobile ? "small" : "middle"}
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={circularSearchText}
                    onChange={(e) => { setCircularSearchText(e.target.value); setCircularPage(1); }}
                    style={{ width: isMobile ? '100%' : '220px' }}
                    className="rounded-lg text-xs"
                    allowClear
                  />
                </div>
                
                {paginatedCirculars.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center py-12">
                    <Empty description="No matching circulars found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedCirculars.map((item, index) => (
                      <div key={item.id || index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg gap-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm">
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          <Avatar icon={<FilePdfOutlined />} size={isMobile ? "small" : "default"} className="bg-red-50 dark:bg-red-950/40 text-red-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.title}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">Published: {item.uploadDate}</div>
                          </div>
                        </div>
                        <Button 
                          type="primary" 
                          size={isMobile ? "small" : "middle"}
                          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md w-full sm:w-auto"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
                        >
                          {isMobile ? 'View' : 'View Doc'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredCirculars.length > 5 && (
                  <div className="mt-4 flex justify-center sm:justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                    <Pagination 
                      size={isMobile ? "small" : "default"}
                      current={circularPage} 
                      total={filteredCirculars.length} 
                      pageSize={5} 
                      onChange={(page) => setCircularPage(page)}
                      showSizeChanger={!isMobile}
                      showLessItems={isMobile}
                    />
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'forms',
            label: (
              <span className="flex items-center gap-1">
                <SolutionOutlined className="text-purple-500" />
                Forms ({filteredForms.length})
              </span>
            ),
            children: (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    📝 Office Forms & Templates
                  </span>
                  <Input
                    placeholder="Search forms..."
                    size={isMobile ? "small" : "middle"}
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={formSearchText}
                    onChange={(e) => { setFormSearchText(e.target.value); setFormPage(1); }}
                    style={{ width: isMobile ? '100%' : '220px' }}
                    className="rounded-lg text-xs"
                    allowClear
                  />
                </div>
                
                {paginatedForms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center py-12">
                    <Empty description="No matching forms found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedForms.map((item, index) => (
                      <div key={item.id || index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 rounded-lg gap-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:shadow-sm">
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          <Avatar icon={<SolutionOutlined />} size={isMobile ? "small" : "default"} className="bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.title}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">Published: {item.uploadDate}</div>
                          </div>
                        </div>
                        <Button 
                          type="primary" 
                          size={isMobile ? "small" : "middle"}
                          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 rounded-md w-full sm:w-auto"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadBase64File(item.fileName, item.fileData)}
                        >
                          {isMobile ? 'Download' : 'Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredForms.length > 5 && (
                  <div className="mt-4 flex justify-center sm:justify-end border-t border-slate-100 dark:border-zinc-800 pt-3">
                    <Pagination 
                      size={isMobile ? "small" : "default"}
                      current={formPage} 
                      total={filteredForms.length} 
                      pageSize={5} 
                      onChange={(page) => setFormPage(page)}
                      showSizeChanger={!isMobile}
                      showLessItems={isMobile}
                    />
                  </div>
                )}
              </div>
            )
          }
        ];

        return (
          <Col xs={24} lg={8} className="flex flex-col">
            <Card 
              variant="outlined"
              className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
              styles={{ body: { flex: 1, padding: isMobile ? '12px' : '16px', display: 'flex', flexDirection: 'column' } }}
            >
              <Tabs 
                activeKey={libraryActiveTab} 
                onChange={(key) => {
                  setLibraryActiveTab(key);
                  setCircularPage(1);
                  setFormPage(1);
                }}
                items={libraryTabItems}
                className="library-tabs"
                size={isMobile ? "small" : "middle"}
              />
            </Card>
          </Col>
        );
      };

      // Merged Events & Celebrations Card
      const EventsAndCelebrationsCard = () => {
        return (
          <Col xs={24} md={12} lg={8} className="flex flex-col">
            <Card 
              title={<span className="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span> EVENTS & CELEBRATIONS</span>}
              variant="outlined"
              className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
              styles={{ body: { flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px', maxHeight: isMobile ? '500px' : '600px' } }}
            >
              <div className="space-y-4 pr-1">
                {/* Today's Events Section */}
                {visibility?.modules.events && (
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-2 border-b border-blue-100 dark:border-blue-950/40 pb-1 flex items-center gap-1.5">
                      <span>📅 Today's Seminars & Events</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded text-[7px] sm:text-[8px] font-bold">{events.length}</span>
                    </div>
                    {events.length === 0 ? (
                      <div className="text-center py-4 text-[9px] sm:text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No events scheduled today</div>
                    ) : (
                      <div className="space-y-2">
                        {events.slice(0, isMobile ? 3 : 5).map((ev, index) => (
                          <div key={ev.id || index} className="p-2 sm:p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col gap-1 transition-all hover:bg-white dark:hover:bg-zinc-850 hover:shadow-sm">
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="font-extrabold text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 line-clamp-1">{ev.title}</span>
                              <Tag color="blue" className="m-0 text-[7px] sm:text-[8px] font-extrabold border-0 px-1 py-0.5">{ev.time}</Tag>
                            </div>
                            <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                              <span className="bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-bold text-slate-600 dark:text-zinc-400">
                                {ev.date ? new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarOutlined className="text-slate-400 text-[8px] sm:text-[9px]" /> <span className="font-semibold truncate">{ev.venue}</span>
                              </span>
                            </div>
                            {ev.description && (
                              <p className="text-[8px] sm:text-[10px] text-slate-400 leading-relaxed m-0 italic line-clamp-2">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Birthdays Section */}
                {visibility?.modules.birthdays && (
                  <div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-pink-500 uppercase tracking-widest mb-2 border-b border-pink-100 dark:border-pink-950/40 pb-1 flex items-center gap-1.5">
                      <span>🎈 Active Birthdays This Week</span>
                      <span className="px-1.5 py-0.5 bg-pink-50 dark:bg-pink-950 text-pink-600 rounded text-[7px] sm:text-[8px] font-bold">{localBirthdays.length}</span>
                    </div>
                    {localBirthdays.length === 0 ? (
                      <div className="text-center py-4 text-[9px] sm:text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No birthdays this week</div>
                    ) : (
                      <div className="space-y-2">
                        {localBirthdays.slice(0, isMobile ? 3 : 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar icon={<UserOutlined />} size={isMobile ? "small" : "default"} className="bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-[9px] sm:text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                                <div className="text-[8px] sm:text-[9px] text-slate-400 truncate">{item.designation}</div>
                              </div>
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-extrabold text-pink-600 flex-shrink-0">
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
                    <div className="text-[8px] sm:text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2 border-b border-amber-100 dark:border-amber-950/40 pb-1 flex items-center gap-1.5">
                      <span>🌟 Service Milestones</span>
                      <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded text-[7px] sm:text-[8px] font-bold">{localAnniversaries.length}</span>
                    </div>
                    {localAnniversaries.length === 0 ? (
                      <div className="text-center py-4 text-[9px] sm:text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No milestones this week</div>
                    ) : (
                      <div className="space-y-2">
                        {localAnniversaries.slice(0, isMobile ? 3 : 5).map((item, index) => (
                          <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar icon={<StarOutlined />} size={isMobile ? "small" : "default"} className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-[9px] sm:text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                                <div className="text-[8px] sm:text-[9px] text-slate-400 truncate">{item.designation}</div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <Tag color="orange" className="font-extrabold border-0 text-[7px] sm:text-[8px] m-0 px-1 py-0">{item.years} Yrs</Tag>
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
        );
      };

      return (
        <div className="space-y-6">
          {/* 1. Latest Announcements left to right marquee */}
          {visibility?.modules.announcements && (
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 overflow-hidden shadow-sm">
              <div className="flex-shrink-0 flex items-center gap-2 bg-[#075E54] text-white px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse w-full sm:w-auto">
                <NotificationOutlined /> Official Board
              </div>
              <div className="flex-1 overflow-hidden relative w-full">
                <div className="animate-marquee-rtl hover:[animation-play-state:paused] whitespace-nowrap inline-flex gap-8 sm:gap-12">
                  {announcements.map((ann, idx) => (
                    <span key={ann.id || idx} className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-zinc-200">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></span>
                      {ann.title}
                      {ann.fileName && (
                        <a href={ann.fileData} target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-extrabold ml-1 text-[10px] sm:text-xs">
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

          {/* 2. Top-Level Layout Grid - Responsive */}
          <Row gutter={[16, 16]} className="items-stretch">
            {/* Left: WhatsApp-theme Broadcast Bulletin Channel */}
            {visibility?.modules.broadcast && (
              <Col xs={24} lg={8} className="flex flex-col">
                <BroadcastFeed
                  messages={broadcasts}
                  isAdmin={false}
                  onSendMessage={async () => {}}
                  onDeleteMessage={async () => {}}
                  isWhatsAppTheme={true}
                   onNewMessage={(newMessages) => {
    // Update broadcasts state with new messages
    setBroadcasts(newMessages);
    // Optionally trigger a refresh of other data if needed
    console.log('[App] Broadcasts updated via SSE');
  }}
                />
              </Col>
            )}

            {/* Middle: Merged Events & Celebrations Card */}
            <EventsAndCelebrationsCard />

            {/* Right: Library Tabs - Circulars & Forms */}
            {(visibility?.modules.circulars || visibility?.modules.forms) && (
              <LibraryTabs />
            )}
          </Row>

          {/* 3. Below Grid: Beautiful Tabbed Navigation */}
          <Tabs 
            activeKey={dashboardTab} 
            onChange={(key) => {
              setDashboardTab(key);
              setSelectedScientist(null);
              setSelectedProject(null);
            }} 
            items={tabItems} 
            className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm"
            size={isMobile ? "small" : "middle"}
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
                 onNewMessage={(newMessages) => {
    // For admin, also update broadcasts when new messages arrive
    setBroadcasts(newMessages);
  }}
              />
            </Col>
            <Col xs={24} lg={8}>
              <Card 
                title="⚙️ Quick Admin Panel" 
                variant="borderless" 
                className="shadow-sm rounded-xl"
              >
                <div className="space-y-2 sm:space-y-3">
                  <Button type="primary" block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('scientist'); }}>Register New Scientist</Button>
                  <Button type="primary" block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('project'); }}>Initialize New Project</Button>
                  <Button type="primary" block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('pstaff'); }}>Add Project Staff</Button>
                  <Button type="primary" block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('perm'); }}>Add Permanent Staff</Button>
                  <Button type="primary" block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('ypc'); }}>Add YP/Consultant</Button>
                  <Divider className="my-2" />
                  <Button block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('circular'); }}>Upload Office Circular</Button>
                  <Button block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('form'); }}>Upload Form Template</Button>
                  <Button block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('announcement'); }}>Add Announcement Bulletin</Button>
                  <Button block icon={<PlusOutlined />} size={isMobile ? "small" : "middle"} onClick={() => { setEditRecord(null); setActiveModal('event'); }}>Schedule New Event</Button>
                </div>
              </Card>
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
        { title: 'Event Title', dataIndex: 'title', key: 'title', width: isMobile ? 150 : 350 },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (val: string) => val ? new Date(val).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Today' },
        { title: 'Venue', dataIndex: 'venue', key: 'venue' },
        { title: 'Time Slot', dataIndex: 'time', key: 'time' },
        ...(isMobile ? [] : [{ title: 'Description', dataIndex: 'description', key: 'description' }]),
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-1">
            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-zinc-100">{title}</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search resources..."
                size={isMobile ? "small" : "middle"}
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: isMobile ? '100%' : '220px' }}
                className="rounded-lg text-xs"
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size={isMobile ? "small" : "middle"}
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
          pagination={{ pageSize: getPageSize() }}
          size={isMobile ? "small" : "middle"}
          rowKey="id"
          scroll={getTableScroll()}
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

  // Mobile Menu Items
  const getMobileMenuItems = () => {
    if (!isAuthenticated) {
      return [
        { key: 'public-dashboard', icon: <TeamOutlined />, label: 'Public Dashboard' }
      ];
    }

    return [
      { key: 'admin-dashboard', icon: <AppstoreOutlined />, label: 'Admin Dashboard' },
      {
        key: 'registries',
        icon: <TeamOutlined />,
        label: 'Registries',
        children: [
          { key: 'admin-scientists', icon: <UserOutlined />, label: 'Scientists' },
          { key: 'admin-projects', icon: <ProjectOutlined />, label: 'Projects' },
          { key: 'admin-project-staff', icon: <SolutionOutlined />, label: 'Project Staff' },
          { key: 'admin-permanent-staff', icon: <TeamOutlined />, label: 'Permanent Staff' },
          { key: 'admin-yp-consultants', icon: <StarOutlined />, label: 'YP & Consultants' },
        ]
      },
      {
        key: 'library',
        icon: <FilePdfOutlined />,
        label: 'Library',
        children: [
          { key: 'admin-circulars', icon: <FilePdfOutlined />, label: 'Circulars' },
          { key: 'admin-forms', icon: <FilePdfOutlined />, label: 'Forms' },
          { key: 'admin-events', icon: <CalendarOutlined />, label: 'Events' },
        ]
      },
      { key: 'admin-visibility', icon: <SettingOutlined />, label: 'Visibility' },
      { key: 'admin-accounts', icon: <KeyOutlined />, label: 'Accounts' },
      { key: 'public-dashboard', icon: <TeamOutlined />, label: 'Public View' }
    ];
  };

  return (
    <Layout className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-300">
        {/* Responsive Header */}
        <Header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-3 sm:px-4 md:px-6 flex justify-between items-center sticky top-0 z-50 h-12 sm:h-14">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Toggle */}
            {isAuthenticated && isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                className="text-slate-600 dark:text-zinc-300"
              />
            )}

            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#005EB8] rounded flex items-center justify-center overflow-hidden font-bold text-white text-[8px] sm:text-xs">
              <img src="https://icmr.gov.in/images/icmr_logo.png" alt="Logo" className="w-full h-full object-contain p-0.5 sm:p-1" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span className="italic">NIHR</span>
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-xs sm:text-sm md:text-base font-semibold tracking-tight text-[#005EB8] dark:text-blue-400 m-0">
                Intranet <span className="hidden xs:inline text-slate-400 dark:text-zinc-500 font-normal ml-1">| Project & Staff Ledger</span>
              </h1>
            </div>
          </div>

          <Space size="small" className="gap-1 sm:gap-2">
            {/* Theme Toggle Button */}
            <Button 
              type="text" 
              icon={themeMode === 'dark' ? <BulbFilled className="text-yellow-500" /> : <BulbOutlined />} 
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              className="text-slate-600 dark:text-zinc-300"
              size={isMobile ? "small" : "middle"}
            />

            {/* Public/Admin Mode toggler */}
            {!isAuthenticated ? (
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                size={isMobile ? "small" : "middle"}
                className="rounded-lg text-[10px] sm:text-xs font-semibold"
                onClick={() => { setShowLoginModal(true); loadCaptcha(); }}
              >
                {isMobile ? 'Login' : 'Super Admin Login'}
              </Button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                {!isMobile && (
                  <Tag color="blue" className="m-0 border-0 text-[10px] sm:text-xs px-2 py-1 font-bold uppercase tracking-wider flex items-center gap-1">
                    <UserOutlined /> {currentAdmin?.name}
                  </Tag>
                )}
                <Button 
                  danger 
                  icon={<LogoutOutlined />} 
                  size={isMobile ? "small" : "middle"}
                  className="rounded-lg text-[10px] sm:text-xs font-semibold"
                  onClick={handleLogout}
                >
                  {isMobile ? 'Logout' : 'Logout'}
                </Button>
              </div>
            )}
          </Space>
        </Header>

        {/* Mobile Menu Drawer */}
        <Drawer
          title="NIHR Intranet Menu"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          className="dark:bg-zinc-900"
        >
          <Menu
            mode="inline"
            selectedKeys={[currentKey]}
            onClick={({ key }) => {
              if (key === 'public-overview' || key === 'public-dashboard') {
                setCurrentKey('public-dashboard');
                setDashboardTab('scientists');
                setSelectedScientist(null);
                setSelectedProject(null);
              } else {
                setCurrentKey(key);
              }
              setMobileMenuOpen(false);
            }}
            items={getMobileMenuItems()}
            className="border-r-0"
          />
        </Drawer>

        {/* Core Layout Grid */}
        <Layout>
          {/* Centered Main Area */}
          <Layout className="p-2 sm:p-3 md:p-4 lg:p-6 overflow-x-hidden bg-[#F8FAFC] dark:bg-zinc-950">
            <Content className="w-full min-h-[500px]">
              {isAuthenticated && !isMobile && (
                <div className="mb-4 sm:mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-3">
                    <span className="w-2.5 h-2.5 bg-[#005EB8] rounded-full animate-pulse"></span>
                    <span className="text-[10px] sm:text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Super Admin Console</span>
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
                    className="border-b-0 flex-1 justify-end font-semibold text-[10px] sm:text-xs text-slate-600 dark:text-zinc-300 bg-transparent dark:bg-transparent"
                    style={{ borderBottom: 'none' }}
                    items={[
                      { key: 'admin-dashboard', icon: <AppstoreOutlined />, label: 'Admin Dashboard' },
                      {
                        key: 'registries',
                        icon: <TeamOutlined />,
                        label: 'Registries',
                        children: [
                          { key: 'admin-scientists', icon: <UserOutlined />, label: 'Scientists' },
                          { key: 'admin-projects', icon: <ProjectOutlined />, label: 'Projects' },
                          { key: 'admin-project-staff', icon: <SolutionOutlined />, label: 'Project Staff' },
                          { key: 'admin-permanent-staff', icon: <TeamOutlined />, label: 'Permanent Staff' },
                          { key: 'admin-yp-consultants', icon: <StarOutlined />, label: 'YP & Consultants' },
                        ]
                      },
                      {
                        key: 'library',
                        icon: <FilePdfOutlined />,
                        label: 'Library',
                        children: [
                          { key: 'admin-circulars', icon: <FilePdfOutlined />, label: 'Circulars' },
                          { key: 'admin-forms', icon: <FilePdfOutlined />, label: 'Forms' },
                          { key: 'admin-events', icon: <CalendarOutlined />, label: 'Events' },
                        ]
                      },
                      { key: 'admin-visibility', icon: <SettingOutlined />, label: 'Visibility' },
                      { key: 'admin-accounts', icon: <KeyOutlined />, label: 'Accounts' },
                      { key: 'public-overview', icon: <TeamOutlined />, label: 'Public View' }
                    ]}
                  />
                </div>
              )}

              {/* Show simplified admin bar on mobile */}
              {isAuthenticated && isMobile && (
                <div className="mb-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button 
                      type={currentKey === 'admin-dashboard' ? 'primary' : 'text'} 
                      size="small"
                      onClick={() => { setCurrentKey('admin-dashboard'); setMobileMenuOpen(false); }}
                      className="text-[10px]"
                    >
                      Dashboard
                    </Button>
                    <Button 
                      type={currentKey.startsWith('admin-scientist') || currentKey.startsWith('admin-project') || currentKey.startsWith('admin-permanent') || currentKey.startsWith('admin-yp') ? 'primary' : 'text'} 
                      size="small"
                      onClick={() => setMobileMenuOpen(true)}
                      className="text-[10px]"
                    >
                      Staff
                    </Button>
                    <Button 
                      type={currentKey === 'admin-circulars' || currentKey === 'admin-forms' || currentKey === 'admin-events' ? 'primary' : 'text'} 
                      size="small"
                      onClick={() => setMobileMenuOpen(true)}
                      className="text-[10px]"
                    >
                      Library
                    </Button>
                    <Button 
                      type={currentKey === 'admin-visibility' ? 'primary' : 'text'} 
                      size="small"
                      onClick={() => { setCurrentKey('admin-visibility'); setMobileMenuOpen(false); }}
                      className="text-[10px]"
                    >
                      Settings
                    </Button>
                    <Button 
                      type={currentKey === 'public-dashboard' ? 'primary' : 'text'} 
                      size="small"
                      onClick={() => { setCurrentKey('public-dashboard'); setDashboardTab('scientists'); setSelectedScientist(null); setSelectedProject(null); }}
                      className="text-[10px]"
                    >
                      Public
                    </Button>
                  </div>
                </div>
              )}
              {renderContentView()}
            </Content>
            
            <Footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between text-[8px] sm:text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-tight mt-6 sm:mt-8 rounded-lg shadow-sm">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-1 sm:mb-0">
                <span>System v1.4.2</span>
                <span>Environment: Production</span>
                <span className="hidden xs:inline">Last Sync: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="text-center sm:text-right">National Institute of Health Research © 2026</div>
            </Footer>
          </Layout>
        </Layout>

        {/* Login Modal with Captcha verification */}
        <Modal
          title={<Space><LockOutlined className="text-blue-500" /><span>Super User Authentication</span></Space>}
          open={showLoginModal}
          onOk={handleLogin}
          onCancel={() => setShowLoginModal(false)}
          okText="Authenticate"
          confirmLoading={submittingLogin}
          className="rounded-xl overflow-hidden"
          width={isMobile ? '95%' : 520}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Official Email Address</label>
              <Input 
                placeholder="icmrdigicare@gmail.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                className="rounded-md"
                size={isMobile ? "small" : "middle"}
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
                size={isMobile ? "small" : "middle"}
              />
            </div>

            {/* Math CAPTCHA verification */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-2">🛡️ Human Verification</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base font-extrabold text-blue-700 tracking-wide select-none">{captchaQuestion}</span>
                <Button size={isMobile ? "small" : "middle"} type="dashed" className="text-xs" onClick={loadCaptcha}>Refresh</Button>
              </div>
              <Input 
                placeholder="Enter computed answer" 
                value={captchaAnswer} 
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="mt-2 rounded-md"
                size={isMobile ? "small" : "middle"}
              />
            </div>
          </div>
        </Modal>

        {/* Dynamic Forms Modals */}
        <Modal
          title={<Space><SettingOutlined /><span>{editRecord ? 'Modify Record' : 'Register New Entry'}</span></Space>}
          open={activeModal !== null}
          footer={null}
          onCancel={() => { setActiveModal(null); setEditRecord(null); }}
          width={isMobile ? '95%' : 800}
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
                <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-zinc-100">
                  {viewDetailRecord?.name || 'Staff Member Profile'}
                </span>
                <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">
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
          ]}
          width={isMobile ? '95%' : 700}
          className="rounded-xl overflow-hidden"
        >
          {viewDetailRecord && (
            <div className="space-y-4 sm:space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Profile Header Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                {viewDetailRecord.photoUrl ? (
                  <img 
                    src={viewDetailRecord.photoUrl} 
                    alt={viewDetailRecord.name} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(viewDetailRecord.name);
                    }}
                  />
                ) : (
                  <Avatar 
                    size={isMobile ? 64 : 80} 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewDetailRecord.name)}`}
                    className="border-2 border-blue-500 shadow-sm"
                  />
                )}
                <div className="space-y-1 w-full">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-100 m-0">{viewDetailRecord.name}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-blue-600 m-0">{viewDetailRecord.designation || viewDetailRecord.fullDesignation || 'Officer'}</p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Tag color="blue" className="m-0 text-[8px] sm:text-[10px] uppercase font-bold">{viewDetailRecord.employeeCode || 'TEMP-CODE'}</Tag>
                    <Tag color={viewDetailRecord.status === 'Active' ? 'green' : 'red'} className="m-0 text-[8px] sm:text-[10px] uppercase font-bold">
                      {viewDetailRecord.status || 'Active'}
                    </Tag>
                    {viewDetailRecord.category && (
                      <Tag color="purple" className="m-0 text-[8px] sm:text-[10px] uppercase font-bold">Category: {viewDetailRecord.category}</Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Categorized Fields Grid */}
              <Row gutter={[12, 12]}>
                {/* Section 1: Professional & Academic */}
                <Col xs={24}>
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    💼 Professional & Placement Details
                  </h4>
                  <Row gutter={[8, 8]}>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Date of Joining</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.doj || 'Not Registered'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Room Number</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.roomNumber || 'Not Assigned'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Department Location</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.departmentLocation || 'Main Campus Block'}
                      </span>
                    </Col>
                    {viewDetailRecord.projectId && (
                      <Col xs={24} sm={12}>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Linked Research Project</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-blue-600">
                          {projects.find(p => p.id === viewDetailRecord.projectId)?.name || 'Research Scheme'}
                        </span>
                      </Col>
                    )}
                  </Row>
                </Col>

                {/* Section 2: Contact Details */}
                <Col xs={24}>
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    ✉️ Contact & Communications
                  </h4>
                  <Row gutter={[8, 8]}>
                    <Col xs={24} sm={12}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Primary Email</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.govtEmail || viewDetailRecord.email, isAuthenticated || !!visibility?.fields.email)}
                      </span>
                    </Col>
                    {viewDetailRecord.personalEmail && (
                      <Col xs={24} sm={12}>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Personal Email</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.personalEmail, isAuthenticated)}
                        </span>
                      </Col>
                    )}
                    <Col xs={12} sm={12}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Phone / Mobile</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.phone, isAuthenticated || !!visibility?.fields.phone)}
                      </span>
                    </Col>
                    <Col xs={12} sm={12}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Emergency Contact</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.emergencyContact, isAuthenticated || !!visibility?.fields.phone, '🔒 Masked')}
                      </span>
                    </Col>
                  </Row>
                </Col>

                {/* Section 3: Personal & Identification Verification */}
                <Col xs={24}>
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                    👤 Personal Identity & Security IDs
                  </h4>
                  <Row gutter={[8, 8]}>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Date of Birth</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.dob, isAuthenticated || !!visibility?.fields.dob)}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Gender</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.gender || '-'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Blood Group</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {viewDetailRecord.bloodGroup || '-'}
                      </span>
                    </Col>
                    <Col xs={24} sm={12}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Aadhaar Card Number</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.aadhaarNumber, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                    <Col xs={24} sm={12}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Permanent Account Number (PAN)</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.panNumber, isAuthenticated || !!visibility?.fields.pan, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                    <Col xs={24}>
                      <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Residential Home Address</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {renderMaskedField(viewDetailRecord.address, isAuthenticated || !!visibility?.fields.address, '🔒 Restricted Masked')}
                      </span>
                    </Col>
                  </Row>
                </Col>

                {/* Section 4: Bank Details */}
                {viewDetailRecord.accountNumber && (
                  <Col xs={24}>
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                      🏦 Official Salary Disbursement Bank Account
                    </h4>
                    <Row gutter={[8, 8]}>
                      <Col xs={24} sm={8}>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Bank Name</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.bankName, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                      <Col xs={24} sm={8}>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">Account Number</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.accountNumber, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                      <Col xs={24} sm={8}>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-medium">IFSC Routing Code</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {renderMaskedField(viewDetailRecord.ifscCode, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Restricted Masked')}
                        </span>
                      </Col>
                    </Row>
                  </Col>
                )}

                {/* Section 5: Experience Entries (For Project Staff) */}
                {viewDetailType === 'pstaff' && (
                  <Col xs={24}>
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                      🎓 Historical Service Experience Records
                    </h4>
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2 sm:p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/30 mb-3 text-[10px] sm:text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Cumulative Experience Month Totals:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {viewDetailRecord.totalExpMonths || 0} Months (ICMR: {viewDetailRecord.icmrExpMonths || 0} | Non-ICMR: {viewDetailRecord.nonIcmrExpMonths || 0})
                      </span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Previous ICMR Experience */}
                      <div>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase mb-1.5">ICMR Experience</span>
                        {viewDetailRecord.previousIcmrExperience && viewDetailRecord.previousIcmrExperience.length > 0 ? (
                          <div className="space-y-2">
                            {viewDetailRecord.previousIcmrExperience.map((exp: any, i: number) => (
                              <div key={exp.id || i} className="bg-slate-50/75 dark:bg-zinc-900/30 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-[10px] sm:text-xs">
                                <div className="flex flex-col sm:flex-row justify-between font-bold text-slate-700 dark:text-zinc-300">
                                  <span>{exp.instituteName}</span>
                                  <span className="text-blue-600">{exp.designation}</span>
                                </div>
                                <div className="text-[8px] sm:text-[10px] text-slate-400 mt-1">
                                  From: {exp.fromDate || '-'} To: {exp.toDate || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs italic text-slate-400 block pl-1">No previous ICMR service logged.</span>
                        )}
                      </div>

                      {/* Previous Non-ICMR Experience */}
                      <div>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase mb-1.5">Non-ICMR Experience</span>
                        {viewDetailRecord.previousNonIcmrExperience && viewDetailRecord.previousNonIcmrExperience.length > 0 ? (
                          <div className="space-y-2">
                            {viewDetailRecord.previousNonIcmrExperience.map((exp: any, i: number) => (
                              <div key={exp.id || i} className="bg-slate-50/75 dark:bg-zinc-900/30 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 text-[10px] sm:text-xs">
                                <div className="flex flex-col sm:flex-row justify-between font-bold text-slate-700 dark:text-zinc-300">
                                  <span>{exp.instituteName}</span>
                                  <span className="text-blue-600">{exp.designation}</span>
                                </div>
                                <div className="text-[8px] sm:text-[10px] text-slate-400 mt-1">
                                  From: {exp.fromDate || '-'} To: {exp.toDate || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs italic text-slate-400 block pl-1">No previous non-ICMR service logged.</span>
                        )}
                      </div>
                    </div>
                  </Col>
                )}

                {/* Section 6: Leave Clearance Information */}
                {viewDetailRecord.status === 'Left' && (
                  <Col xs={24} className="bg-red-50/50 dark:bg-red-950/10 p-3 sm:p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <h4 className="text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2">
                      ⚠️ Separation & Exit Clearance Guidelines
                    </h4>
                    <Row gutter={[8, 8]}>
                      <Col xs={12}>
                        <span className="block text-[8px] sm:text-[10px] text-red-500 font-medium">Last Working Date</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {viewDetailRecord.lastWorkingDate || '-'}
                        </span>
                      </Col>
                      <Col xs={12}>
                        <span className="block text-[8px] sm:text-[10px] text-red-500 font-medium">No Dues Certificate Status</span>
                        <Tag color={viewDetailRecord.noDuesCleared ? 'green' : 'orange'} className="text-[8px] sm:text-[10px]">
                          {viewDetailRecord.noDuesCleared ? '✔️ CLEARED' : '❌ PENDING'}
                        </Tag>
                      </Col>
                      <Col xs={24}>
                        <span className="block text-[8px] sm:text-[10px] text-red-500 font-medium">Leaving Reason</span>
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-zinc-300">
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
          colorPrimary: '#005EB8',
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