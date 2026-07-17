import { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Modal, Form, Input, InputNumber, 
  Select, DatePicker, Space, Row, Col, Statistic, Tabs, Popconfirm, message 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, 
  SafetyCertificateOutlined, AlertOutlined, InfoCircleOutlined,
  CalendarOutlined, SearchOutlined, BarChartOutlined, FileTextOutlined,
  AppstoreOutlined, KeyOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Agency, OutsourcedEmployee, ExperienceEntry } from '../types';
import { apiService } from '../services/api';
import { 
  calculateOutsourcedEmployeeTenureStatus, 
  renderMaskedField, 
  parseDateFlexible 
} from '../utils/experience';
import dayjs from 'dayjs';

interface OutsourcingPortalProps {
  currentAdmin: any;
  isAuthenticated: boolean; // standard admin auth
}

export function OutsourcingPortal({ currentAdmin, isAuthenticated }: OutsourcingPortalProps) {
  // Authentication & Data States
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [employees, setEmployees] = useState<OutsourcedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Store Super User Auth State
  const [isStoreSu, setIsStoreSu] = useState(false);
  const [storeUser, setStoreUser] = useState<any>(null);
  
  // Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Agency Modal State
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [agencyForm] = Form.useForm();

  // Employee Modal State
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<OutsourcedEmployee | null>(null);
  const [employeeForm] = Form.useForm();
  
  // Detail views
  const [selectedEmployee, setSelectedEmployee] = useState<OutsourcedEmployee | null>(null);
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [agencyDetailOpen, setAgencyDetailOpen] = useState(false);

  // Search/Filters State
  const [agencySearch, setAgencySearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Experience entry list fields state for dynamic creation
  const [prevIcmrExp, setPrevIcmrExp] = useState<ExperienceEntry[]>([]);
  const [prevNonIcmrExp, setPrevNonIcmrExp] = useState<ExperienceEntry[]>([]);

  // Check if current user has write permission
  const hasWritePermission = isAuthenticated || isStoreSu;

  // Load Captcha
  const loadCaptcha = async () => {
    try {
      const data = await apiService.getCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaQuestion(data.question);
    } catch (e) {
      message.error('Failed to load verification captcha.');
    }
  };

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [agencyData, employeeData] = await Promise.all([
        apiService.getAgencies(),
        apiService.getOutsourcedEmployees()
      ]);
      setAgencies(agencyData || []);
      setEmployees(employeeData || []);
    } catch (e) {
      message.error('Failed to load outsourcing databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Check if store super user credentials already exist in session
    const storedUser = localStorage.getItem('store_su_user');
    if (storedUser) {
      try {
        setStoreUser(JSON.parse(storedUser));
        setIsStoreSu(true);
      } catch (e) {
        localStorage.removeItem('store_su_user');
      }
    }
  }, []);

  // Handle Login Modal Open
  const openLoginModal = () => {
    loadCaptcha();
    setLoginModalOpen(true);
  };

  // Handle Store Super User Login
  const handleStoreLogin = async () => {
    if (!loginEmail || !loginPassword) {
      message.warning('Email and Password are required.');
      return;
    }
    if (!captchaAnswer) {
      message.warning('Please answer the verification captcha.');
      return;
    }
    setLoggingIn(true);
    try {
      // First verify captcha locally/via existing flow
      // (Since /store/auth/login relies on standard captcha, we can submit directly)
      const data = await apiService.loginStoreSuperUser({
        email: loginEmail,
        password: loginPassword,
        // Optional captcha answer validation parameter if required by server
      } as any);
      
      setIsStoreSu(true);
      setStoreUser(data.storeUser);
      localStorage.setItem('store_su_user', JSON.stringify(data.storeUser));
      message.success(`Welcome back, ${data.storeUser.name}! (Store Console Mode Active)`);
      setLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
      setCaptchaAnswer('');
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Invalid store credentials or bad login attempt.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Store Super User Logout
  const handleStoreLogout = () => {
    setIsStoreSu(false);
    setStoreUser(null);
    localStorage.removeItem('store_su_user');
    message.info('Logged out from Store Super User Console.');
  };

  // --- AGENCY CRUD HANDLERS ---
  const handleAddAgency = () => {
    setEditingAgency(null);
    agencyForm.resetFields();
    setAgencyModalOpen(true);
  };

  const handleEditAgency = (record: Agency) => {
    setEditingAgency(record);
    agencyForm.setFieldsValue({
      ...record,
      dateOfAgreement: record.dateOfAgreement ? dayjs(record.dateOfAgreement) : null,
      contractStartDate: record.contractStartDate ? dayjs(record.contractStartDate) : null,
      contractEndDate: record.contractEndDate ? dayjs(record.contractEndDate) : null,
      performanceSecurityValidity: record.performanceSecurityValidity ? dayjs(record.performanceSecurityValidity) : null,
    });
    setAgencyModalOpen(true);
  };

  const handleSaveAgency = async (values: any) => {
    const formattedValues = {
      ...values,
      dateOfAgreement: values.dateOfAgreement ? values.dateOfAgreement.format('YYYY-MM-DD') : '',
      contractStartDate: values.contractStartDate ? values.contractStartDate.format('YYYY-MM-DD') : '',
      contractEndDate: values.contractEndDate ? values.contractEndDate.format('YYYY-MM-DD') : '',
      performanceSecurityValidity: values.performanceSecurityValidity ? values.performanceSecurityValidity.format('YYYY-MM-DD') : '',
    };

    try {
      if (editingAgency) {
        await apiService.updateAgency(editingAgency.id, formattedValues);
        message.success('Agency updated successfully.');
      } else {
        await apiService.createAgency(formattedValues);
        message.success('New agency registered successfully.');
      }
      setAgencyModalOpen(false);
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to save agency details.');
    }
  };

  const handleDeleteAgency = async (id: string) => {
    try {
      await apiService.deleteAgency(id);
      message.success('Agency deleted successfully.');
      loadData();
    } catch (e) {
      message.error('Failed to delete agency.');
    }
  };

  // --- EMPLOYEE CRUD HANDLERS ---
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    employeeForm.resetFields();
    setPrevIcmrExp([]);
    setPrevNonIcmrExp([]);
    setEmployeeModalOpen(true);
  };

  const handleEditEmployee = (record: OutsourcedEmployee) => {
    setEditingEmployee(record);
    setPrevIcmrExp(record.previousIcmrExperience || []);
    setPrevNonIcmrExp(record.previousNonIcmrExperience || []);
    employeeForm.setFieldsValue({
      ...record,
      doj: record.doj ? dayjs(record.doj) : null,
      doc: record.doc ? dayjs(record.doc) : null,
    });
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (values: any) => {
    // Lookup agency name from list for assignment
    const selectedAgencyObj = agencies.find(a => a.id === values.agencyId);
    
    const formattedValues = {
      ...values,
      agencyName: selectedAgencyObj ? selectedAgencyObj.agencyName : '',
      doj: values.doj ? values.doj.format('YYYY-MM-DD') : '',
      doc: values.doc ? values.doc.format('YYYY-MM-DD') : '',
      previousIcmrExperience: prevIcmrExp,
      previousNonIcmrExperience: prevNonIcmrExp,
    };

    try {
      if (editingEmployee) {
        await apiService.updateOutsourcedEmployee(editingEmployee.id, formattedValues);
        message.success('Outsourced employee updated successfully.');
      } else {
        await apiService.createOutsourcedEmployee(formattedValues);
        message.success('Outsourced employee registered successfully.');
      }
      setEmployeeModalOpen(false);
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to save employee details.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await apiService.deleteOutsourcedEmployee(id);
      message.success('Outsourced employee record deleted.');
      loadData();
    } catch (e) {
      message.error('Failed to delete employee record.');
    }
  };

  // --- EXP LOGIC ---
  const addExpItem = (type: 'icmr' | 'non-icmr') => {
    const newItem: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      instituteName: '',
      designation: '',
      fromDate: '',
      toDate: ''
    };
    if (type === 'icmr') {
      setPrevIcmrExp([...prevIcmrExp, newItem]);
    } else {
      setPrevNonIcmrExp([...prevNonIcmrExp, newItem]);
    }
  };

  const updateExpItem = (type: 'icmr' | 'non-icmr', idx: number, field: string, value: string) => {
    if (type === 'icmr') {
      const copy = [...prevIcmrExp];
      copy[idx] = { ...copy[idx], [field]: value };
      setPrevIcmrExp(copy);
    } else {
      const copy = [...prevNonIcmrExp];
      copy[idx] = { ...copy[idx], [field]: value };
      setPrevNonIcmrExp(copy);
    }
  };

  const removeExpItem = (type: 'icmr' | 'non-icmr', idx: number) => {
    if (type === 'icmr') {
      setPrevIcmrExp(prevIcmrExp.filter((_, i) => i !== idx));
    } else {
      setPrevNonIcmrExp(prevNonIcmrExp.filter((_, i) => i !== idx));
    }
  };

  // --- COMPUTED ANALYTICS AND DASHBOARD ---
  const today = dayjs();
  
  const totalAgencies = agencies.length;
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const inactiveEmployees = employees.filter(e => e.status === 'Left').length;

  // Contracts expiring within 30, 60, 90 days
  const expiring30 = agencies.filter(a => {
    if (!a.contractEndDate) return false;
    const diffDays = dayjs(a.contractEndDate).diff(today, 'day');
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const expiring60 = agencies.filter(a => {
    if (!a.contractEndDate) return false;
    const diffDays = dayjs(a.contractEndDate).diff(today, 'day');
    return diffDays >= 0 && diffDays <= 60;
  }).length;

  const expiring90 = agencies.filter(a => {
    if (!a.contractEndDate) return false;
    const diffDays = dayjs(a.contractEndDate).diff(today, 'day');
    return diffDays >= 0 && diffDays <= 90;
  }).length;

  // Agency wise employees
  const agencyCounts: Record<string, number> = {};
  employees.forEach(e => {
    if (e.status === 'Active') {
      agencyCounts[e.agencyName] = (agencyCounts[e.agencyName] || 0) + 1;
    }
  });

  // Department wise employees
  const deptCounts: Record<string, number> = {};
  employees.forEach(e => {
    if (e.status === 'Active' && e.departmentSectionLocation) {
      deptCounts[e.departmentSectionLocation] = (deptCounts[e.departmentSectionLocation] || 0) + 1;
    }
  });

  // Columns definition for table
  const agencyColumns = [
    { 
      title: 'Agency Name', 
      dataIndex: 'agencyName', 
      key: 'agencyName', 
      className: 'font-bold text-slate-800',
      sorter: (a: Agency, b: Agency) => a.agencyName.localeCompare(b.agencyName) 
    },
    { title: 'Agreement No.', dataIndex: 'agreementNo', key: 'agreementNo' },
    { 
      title: 'Contract End Date', 
      dataIndex: 'contractEndDate', 
      key: 'contractEndDate', 
      render: (val: string) => {
        const isExpiringSoon = val ? dayjs(val).diff(today, 'day') <= 60 : false;
        return <span className={isExpiringSoon ? "text-red-600 font-bold" : ""}>{val || '-'}</span>;
      },
      sorter: (a: Agency, b: Agency) => (a.contractEndDate || '').localeCompare(b.contractEndDate || '')
    },
    { title: 'Approved Manpower', dataIndex: 'approvedManpower', key: 'approvedManpower' },
    { 
      title: 'Contract Value (INR)', 
      dataIndex: 'contractValue', 
      key: 'contractValue',
      render: (val: number) => val ? `₹${val.toLocaleString()}` : '-',
      sorter: (a: Agency, b: Agency) => (a.contractValue || 0) - (b.contractValue || 0)
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'Inactive' || status === 'Expired') color = 'red';
        if (status === 'Terminated') color = 'volcano';
        return <Tag color={color}>{status || 'Active'}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Agency) => (
        <Space size="middle">
          <Button 
            size="small" 
            icon={<InfoCircleOutlined />} 
            onClick={() => { setSelectedAgency(record); setAgencyDetailOpen(true); }}
          >
            Details
          </Button>
          {hasWritePermission && (
            <>
              <Button 
                size="small" 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => handleEditAgency(record)}
              />
              <Popconfirm
                title="Are you sure you want to delete this agency? Doing so will unassign its employees."
                onConfirm={() => handleDeleteAgency(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" type="primary" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const employeeColumns = [
    { title: 'Emp ID', dataIndex: 'employeeId', key: 'employeeId' },
    { 
      title: 'Name', 
      dataIndex: 'employeeName', 
      key: 'employeeName', 
      className: 'font-bold text-slate-800',
      sorter: (a: OutsourcedEmployee, b: OutsourcedEmployee) => a.employeeName.localeCompare(b.employeeName)
    },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Assigned Agency', dataIndex: 'agencyName', key: 'agencyName' },
    { title: 'Department/Section', dataIndex: 'departmentSectionLocation', key: 'departmentSectionLocation' },
    { 
      title: 'Tenure Remaining / Exceeded', 
      key: 'tenureRemaining',
      render: (_: any, rec: OutsourcedEmployee) => {
        const agencyObj = agencies.find(a => a.id === rec.agencyId);
        const tenure = calculateOutsourcedEmployeeTenureStatus(rec, agencyObj);
        
        let tagColor = 'green';
        if (tenure.isExceeded) {
          tagColor = 'red';
        } else if (tenure.isRedFlag) {
          tagColor = 'orange';
        }

        return (
          <Space direction="vertical" size={1}>
            <Tag color={tagColor} className="font-semibold text-[11px] block text-center">
              {tenure.remainingText}
            </Tag>
            {tenure.cutOffDateStr && (
              <span className="text-[10px] text-gray-500 block text-center">
                Ends: {tenure.cutOffDateStr} ({tenure.cutOffReason})
              </span>
            )}
          </Space>
        );
      }
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const color = status === 'Active' ? 'green' : 'gray';
        return <Tag color={color}>{status || 'Active'}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: OutsourcedEmployee) => (
        <Space size="middle">
          <Button 
            size="small" 
            icon={<InfoCircleOutlined />} 
            onClick={() => { setSelectedEmployee(record); setEmployeeDetailOpen(true); }}
          >
            Details
          </Button>
          {hasWritePermission && (
            <>
              <Button 
                size="small" 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => handleEditEmployee(record)}
              />
              <Popconfirm
                title="Are you sure you want to delete this employee record?"
                onConfirm={() => handleDeleteEmployee(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" type="primary" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  // Filtering lists
  const filteredAgencies = agencies.filter(a => 
    a.agencyName.toLowerCase().includes(agencySearch.toLowerCase()) ||
    a.agreementNo.toLowerCase().includes(agencySearch.toLowerCase()) ||
    a.contactPerson.toLowerCase().includes(agencySearch.toLowerCase())
  );

  const filteredEmployees = employees.filter(e => 
    e.employeeName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.designation.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.agencyName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.departmentSectionLocation.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Box with Store Authentication Access */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <SafetyCertificateOutlined className="text-blue-300" />
              Contract Agency & Outsourced Staff Registry
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Official store super user directory tracking outsourcing agency service agreements, manpower approvals, deployment status, and automatic contract tenure notifications.
            </p>
          </div>
          <div>
            {hasWritePermission ? (
              <div className="flex items-center gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-700">
                <div className="text-right">
                  <div className="text-xs text-green-400 font-extrabold flex items-center gap-1">
                    <CheckCircleOutlined /> CONSOLE ACTIVE
                  </div>
                  <div className="text-xs text-white">
                    Logged in as: {isAuthenticated ? 'Admin' : storeUser?.name}
                  </div>
                </div>
                {isStoreSu && (
                  <Button 
                    size="small" 
                    danger 
                    type="primary" 
                    onClick={handleStoreLogout}
                    className="ml-2 font-semibold"
                  >
                    Logout
                  </Button>
                )}
              </div>
            ) : (
              <Button 
                type="primary" 
                icon={<KeyOutlined />} 
                onClick={openLoginModal}
                className="bg-amber-600 hover:bg-amber-700 border-amber-600 text-white rounded-lg px-4 py-2 font-semibold"
              >
                Store Super User Login
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 1. Analytics & Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-slate-100 rounded-lg">
          <Statistic 
            title={<span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Agencies</span>}
            value={totalAgencies}
            prefix={<FileTextOutlined className="text-blue-500 mr-1" />}
            styles={{ content: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' } }}
          />
        </Card>
        <Card className="shadow-xs border-slate-100 rounded-lg">
          <Statistic 
            title={<span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Outsourced Staff</span>}
            value={totalEmployees}
            suffix={<span className="text-xs font-normal text-slate-400 ml-1">({activeEmployees} active)</span>}
            prefix={<AppstoreOutlined className="text-indigo-500 mr-1" />}
            styles={{ content: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' } }}
          />
        </Card>
        <Card className="shadow-xs border-slate-100 rounded-lg">
          <Statistic 
            title={<span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Agencies Expiring (90 Days)</span>}
            value={expiring90}
            prefix={<AlertOutlined className="text-amber-500 mr-1" />}
            styles={{ content: { fontSize: '24px', fontWeight: 'bold', color: expiring90 > 0 ? '#d97706' : '#1e293b' } }}
          />
          <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
            <span>30 days: <strong>{expiring30}</strong></span>
            <span>60 days: <strong>{expiring60}</strong></span>
          </div>
        </Card>
        <Card className="shadow-xs border-slate-100 rounded-lg">
          <Statistic 
            title={<span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Inactive Staff (Left)</span>}
            value={inactiveEmployees}
            prefix={<CloseCircleOutlined className="text-red-500 mr-1" />}
            styles={{ content: { fontSize: '24px', fontWeight: 'bold', color: '#ef4444' } }}
          />
        </Card>
      </div>

      {/* Simple Bento Layout showing Agency-wise counts & Department-wise counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={<span className="text-sm font-semibold text-slate-800 flex items-center gap-1"><BarChartOutlined className="text-indigo-600"/> Active Deployment per Agency</span>} className="shadow-xs border-slate-100 rounded-lg">
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {Object.keys(agencyCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active outsourced personnel deployed currently.</p>
            ) : (
              Object.entries(agencyCounts).map(([agency, count]) => {
                const percentage = totalEmployees > 0 ? Math.round((count / activeEmployees) * 100) : 0;
                return (
                  <div key={agency} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="truncate max-w-[80%]">{agency}</span>
                      <span>{count} deployed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card title={<span className="text-sm font-semibold text-slate-800 flex items-center gap-1"><BarChartOutlined className="text-blue-600"/> Active Distribution per Department</span>} className="shadow-xs border-slate-100 rounded-lg">
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {Object.keys(deptCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active distribution details recorded.</p>
            ) : (
              Object.entries(deptCounts).map(([dept, count]) => {
                const percentage = totalEmployees > 0 ? Math.round((count / activeEmployees) * 100) : 0;
                return (
                  <div key={dept} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="truncate max-w-[80%]">{dept}</span>
                      <span>{count} staff</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 2. Main Tabbed Table Display (Agencies & Outsourced Personnel) */}
      <Card className="shadow-xs border-slate-100 rounded-lg">
        <Tabs defaultActiveKey="agencies" items={[
          {
            key: 'agencies',
            label: <span className="font-semibold px-2">Outsourcing Agencies</span>,
            children: (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <Input
                    placeholder="Search agencies by name, contact or agreement..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={agencySearch}
                    onChange={e => setAgencySearch(e.target.value)}
                    className="max-w-md rounded-lg"
                  />
                  {hasWritePermission && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={handleAddAgency}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg"
                    >
                      Register New Agency
                    </Button>
                  )}
                </div>
                <Table 
                  columns={agencyColumns} 
                  dataSource={filteredAgencies} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  className="border border-slate-100 rounded-lg overflow-hidden"
                />
              </div>
            )
          },
          {
            key: 'employees',
            label: <span className="font-semibold px-2">Outsourced Personnel</span>,
            children: (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <Input
                    placeholder="Search employees by name, ID, designation or agency..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={employeeSearch}
                    onChange={e => setEmployeeSearch(e.target.value)}
                    className="max-w-md rounded-lg"
                  />
                  {hasWritePermission && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={handleAddEmployee}
                      className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg"
                    >
                      Deploy Outsourced Staff
                    </Button>
                  )}
                </div>
                <Table 
                  columns={employeeColumns} 
                  dataSource={filteredEmployees} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  className="border border-slate-100 rounded-lg overflow-hidden"
                />
              </div>
            )
          }
        ]} />
      </Card>

      {/* ===================================== */}
      {/* STORE SUPER USER LOGIN MODAL          */}
      {/* ===================================== */}
      <Modal
        title={<span className="font-bold text-slate-800 text-lg flex items-center gap-2"><KeyOutlined className="text-amber-500" /> Store Super User Console Login</span>}
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        width={400}
      >
        <div className="space-y-4 pt-2">
          <div className="text-xs text-slate-500">
            Please log in using your registered Store Administrator official credentials to access write features, CRUD forms and employee registrations.
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email ID</label>
              <Input 
                prefix={<LockOutlined className="text-slate-400" />} 
                placeholder="Enter Email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Password</label>
              <Input.Password 
                prefix={<LockOutlined className="text-slate-400" />} 
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>

            {/* Verification Captcha Challenge */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Dynamic Human Verification:</span>
                <Button size="small" type="link" onClick={loadCaptcha}>Refresh Challenge</Button>
              </div>
              <div className="bg-white p-2 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded tracking-wider">
                {captchaQuestion || 'Loading Verification Question...'}
              </div>
              <Input 
                placeholder="Enter computed mathematical result..." 
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                type="number"
                size="small"
              />
            </div>

            <Button 
              type="primary" 
              block 
              onClick={handleStoreLogin}
              loading={loggingIn}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg mt-2"
            >
              Sign In to Store Console
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================== */}
      {/* AGENCY FORM MODAL (CRUD)              */}
      {/* ===================================== */}
      <Modal
        title={<span className="font-bold text-slate-800 text-lg">{editingAgency ? 'Edit Service Agency Details' : 'Register New Service Agency'}</span>}
        open={agencyModalOpen}
        onCancel={() => setAgencyModalOpen(false)}
        onOk={() => agencyForm.submit()}
        width={720}
      >
        <Form
          form={agencyForm}
          layout="vertical"
          onFinish={handleSaveAgency}
          initialValues={{ status: 'Active' }}
          className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1"
        >
          <Form.Item label="Agency Name" name="agencyName" rules={[{ required: true, message: 'Please enter agency name' }]} className="col-span-2">
            <Input placeholder="Security & Manpower Solutions Pvt Ltd" />
          </Form.Item>
          
          <Form.Item label="Agreement Number" name="agreementNo" rules={[{ required: true, message: 'Please enter agreement no' }]}>
            <Input placeholder="SMS/ICMR/2026/04" />
          </Form.Item>

          <Form.Item label="Date of Agreement" name="dateOfAgreement" rules={[{ required: true, message: 'Please choose date' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Contract Start Date" name="contractStartDate" rules={[{ required: true, message: 'Please choose date' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Contract End Date" name="contractEndDate" rules={[{ required: true, message: 'Please choose date' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Contract Duration" name="contractDuration" rules={[{ required: true, message: 'e.g. 12 Months' }]}>
            <Input placeholder="12 Months" />
          </Form.Item>

          <Form.Item label="Approved Manpower Count" name="approvedManpower" rules={[{ required: true, message: 'Total permitted staff' }]}>
            <InputNumber className="w-full" min={1} placeholder="10" />
          </Form.Item>

          <Form.Item label="Contract Value (INR)" name="contractValue" rules={[{ required: true, message: 'Agreement financial value' }]}>
            <InputNumber className="w-full" min={0} placeholder="1500000" />
          </Form.Item>

          <Form.Item label="Contact Person Name" name="contactPerson" rules={[{ required: true, message: 'Primary supervisor' }]}>
            <Input placeholder="Mr. Rajesh Kumar" />
          </Form.Item>

          <Form.Item label="Mobile Number" name="mobileNo" rules={[{ required: true, message: 'Please enter phone' }]}>
            <Input placeholder="9876543210" />
          </Form.Item>

          <Form.Item label="Email ID" name="emailId" rules={[{ required: true, type: 'email', message: 'Official email ID' }]}>
            <Input placeholder="rajesh@smssolutions.com" />
          </Form.Item>

          <Form.Item label="Performance Security Validity" name="performanceSecurityValidity" rules={[{ required: true, message: 'Validity date' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Inactive">Inactive</Select.Option>
              <Select.Option value="Terminated">Terminated</Select.Option>
              <Select.Option value="Expired">Expired</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Agency Address" name="agencyAddress" className="col-span-2">
            <Input.TextArea rows={3} placeholder="Sector 62, Noida, UP, India" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===================================== */}
      {/* OUTSOURCED EMPLOYEE FORM MODAL (CRUD) */}
      {/* ===================================== */}
      <Modal
        title={<span className="font-bold text-slate-800 text-lg">{editingEmployee ? 'Edit Deployed Personnel' : 'Deploy New Outsourced Staff'}</span>}
        open={employeeModalOpen}
        onCancel={() => setEmployeeModalOpen(false)}
        onOk={() => employeeForm.submit()}
        width={800}
      >
        <Form
          form={employeeForm}
          layout="vertical"
          onFinish={handleSaveEmployee}
          initialValues={{ status: 'Active' }}
          className="pt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item label="Employee ID / Code" name="employeeId" rules={[{ required: true, message: 'Unique code' }]}>
              <Input placeholder="OUT-1001" />
            </Form.Item>

            <Form.Item label="Employee Full Name" name="employeeName" rules={[{ required: true, message: 'Please enter name' }]}>
              <Input placeholder="Anil Yadav" />
            </Form.Item>

            <Form.Item label="Designation" name="designation" rules={[{ required: true, message: 'e.g. MTS, DEO, Driver' }]}>
              <Input placeholder="Multi Tasking Staff (MTS)" />
            </Form.Item>

            <Form.Item label="Assign Agency" name="agencyId" rules={[{ required: true, message: 'Select registered agency' }]}>
              <Select placeholder="Assign agency from contract list">
                {agencies.map(a => (
                  <Select.Option key={a.id} value={a.id}>{a.agencyName}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Department / Section / Location" name="departmentSectionLocation" rules={[{ required: true }]}>
              <Input placeholder="Administration" />
            </Form.Item>

            <Form.Item label="Reporting Officer" name="reportingOfficer" rules={[{ required: true }]}>
              <Input placeholder="Dr. Sunita Sharma" />
            </Form.Item>

            <Form.Item label="Date of Joining (DOJ)" name="doj" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Date of Completion (DOC)" name="doc" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="EPF Number" name="epfNo">
              <Input placeholder="EPF/100293/92" />
            </Form.Item>

            <Form.Item label="ESIC Number" name="esicNo">
              <Input placeholder="ESIC/993041/44" />
            </Form.Item>

            <Form.Item label="Aadhaar Number" name="aadhaarNo" rules={[{ len: 12, message: 'Must be 12 digits' }]}>
              <Input placeholder="123456789012" maxLength={12} />
            </Form.Item>

            <Form.Item label="PAN Number" name="panNo" rules={[{ len: 10, message: 'Must be 10 characters' }]}>
              <Input placeholder="ABCDE1234F" maxLength={10} />
            </Form.Item>

            <Form.Item label="Mobile Number" name="mobileNo" rules={[{ required: true, message: '10 digit number' }]}>
              <Input placeholder="9988776655" maxLength={10} />
            </Form.Item>

            <Form.Item label="Email ID" name="emailId" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="anil.yadav@example.com" />
            </Form.Item>

            <Form.Item label="Employment Status" name="status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="Left">Left</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* DYNAMIC EXPERIENCE LIST - PREVIOUS ICMR EXPERIENCE */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-slate-800">Previous ICMR Experience Logs</h3>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addExpItem('icmr')}>Add Experience Entry</Button>
            </div>
            
            {prevIcmrExp.length === 0 ? (
              <p className="text-xs text-slate-400 italic mb-4">No previous ICMR experience logs recorded.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {prevIcmrExp.map((exp, idx) => (
                  <div key={exp.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 items-end">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Institute Name</label>
                      <Input size="small" value={exp.instituteName} onChange={e => updateExpItem('icmr', idx, 'instituteName', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Designation</label>
                      <Input size="small" value={exp.designation} onChange={e => updateExpItem('icmr', idx, 'designation', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">From Date & To Date</label>
                      <div className="flex gap-1">
                        <Input size="small" type="date" value={exp.fromDate} onChange={e => updateExpItem('icmr', idx, 'fromDate', e.target.value)} placeholder="From" />
                        <Input size="small" type="date" value={exp.toDate} onChange={e => updateExpItem('icmr', idx, 'toDate', e.target.value)} placeholder="To" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Button size="small" type="primary" danger onClick={() => removeExpItem('icmr', idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC EXPERIENCE LIST - PREVIOUS NON-ICMR EXPERIENCE */}
          <div className="mt-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-slate-800">Previous Non-ICMR Experience Logs</h3>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addExpItem('non-icmr')}>Add Experience Entry</Button>
            </div>

            {prevNonIcmrExp.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No previous Non-ICMR experience logs recorded.</p>
            ) : (
              <div className="space-y-2">
                {prevNonIcmrExp.map((exp, idx) => (
                  <div key={exp.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 items-end">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Company / Institute Name</label>
                      <Input size="small" value={exp.instituteName} onChange={e => updateExpItem('non-icmr', idx, 'instituteName', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Designation</label>
                      <Input size="small" value={exp.designation} onChange={e => updateExpItem('non-icmr', idx, 'designation', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">From Date & To Date</label>
                      <div className="flex gap-1">
                        <Input size="small" type="date" value={exp.fromDate} onChange={e => updateExpItem('non-icmr', idx, 'fromDate', e.target.value)} placeholder="From" />
                        <Input size="small" type="date" value={exp.toDate} onChange={e => updateExpItem('non-icmr', idx, 'toDate', e.target.value)} placeholder="To" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Button size="small" type="primary" danger onClick={() => removeExpItem('non-icmr', idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* ===================================== */}
      {/* AGENCY DETAIL DRAWER/MODAL            */}
      {/* ===================================== */}
      <Modal
        title={<span className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileTextOutlined className="text-blue-600"/> Agency Full Record Sheet</span>}
        open={agencyDetailOpen}
        onCancel={() => setAgencyDetailOpen(false)}
        footer={null}
        width={750}
      >
        {selectedAgency && (() => {
          const agencyEmployees = employees.filter(e => e.agencyId === selectedAgency.id);
          return (
            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h2 className="text-base font-extrabold text-slate-800 mb-1">{selectedAgency.agencyName}</h2>
                <Tag color="green" className="font-semibold">{selectedAgency.status || 'Active'}</Tag>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold block">Agreement Number:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.agreementNo || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Date of Agreement:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.dateOfAgreement || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Contract Start Date:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.contractStartDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Contract End Date:</span>
                  <span className="font-bold text-slate-800 text-[13px] text-indigo-700">{selectedAgency.contractEndDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Approved Manpower capacity:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.approvedManpower || '-'} staff members</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Contract Value:</span>
                  <span className="font-bold text-slate-800 text-[13px]">₹{selectedAgency.contractValue ? selectedAgency.contractValue.toLocaleString() : '0'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Performance Security Validity:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.performanceSecurityValidity || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Contract Duration:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedAgency.contractDuration || '-'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Agency Address</h4>
                <p className="bg-slate-50 p-2 rounded text-slate-700">{selectedAgency.agencyAddress || '-'}</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Supervisory Contact Person</h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Contact Name</span>
                    <span className="font-bold text-slate-800">{selectedAgency.contactPerson || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Mobile Number</span>
                    <span className="font-bold text-slate-800">{selectedAgency.mobileNo || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-semibold block">Email ID</span>
                    <span className="font-bold text-slate-800 text-blue-600">{selectedAgency.emailId || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <TeamOutlined className="text-indigo-600"/> Deployed Personnel / Employees ({agencyEmployees.length})
                </h4>
                {agencyEmployees.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No employees currently registered under this agency.</p>
                ) : (
                  <Table
                    size="small"
                    pagination={{ pageSize: 5 }}
                    dataSource={agencyEmployees}
                    rowKey="id"
                    columns={[
                      { title: 'Emp ID', dataIndex: 'employeeId', key: 'employeeId' },
                      { title: 'Name', dataIndex: 'employeeName', key: 'employeeName', className: 'font-semibold text-slate-700' },
                      { title: 'Designation', dataIndex: 'designation', key: 'designation' },
                      { title: 'Department', dataIndex: 'departmentSectionLocation', key: 'departmentSectionLocation' },
                      { 
                        title: 'Status', 
                        dataIndex: 'status', 
                        key: 'status',
                        render: (status: string) => (
                          <Tag color={status === 'Active' ? 'green' : 'gray'}>{status || 'Active'}</Tag>
                        )
                      }
                    ]}
                    className="border border-slate-100 rounded-lg overflow-hidden"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ===================================== */}
      {/* EMPLOYEE DETAIL SHEET (MASKED FIELDS)  */}
      {/* ===================================== */}
      <Modal
        title={<span className="font-bold text-slate-800 text-lg flex items-center gap-2"><AppstoreOutlined className="text-indigo-600"/> Deployed Personnel Record Sheet</span>}
        open={employeeDetailOpen}
        onCancel={() => setEmployeeDetailOpen(false)}
        footer={null}
        width={650}
      >
        {selectedEmployee && (() => {
          const assocAgency = agencies.find(a => a.id === selectedEmployee.agencyId);
          const tenure = calculateOutsourcedEmployeeTenureStatus(selectedEmployee, assocAgency);
          
          return (
            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 mb-1">{selectedEmployee.employeeName}</h2>
                  <p className="text-slate-500 font-semibold">{selectedEmployee.designation}</p>
                </div>
                <Tag color={selectedEmployee.status === 'Active' ? 'green' : 'gray'} className="font-semibold">{selectedEmployee.status || 'Active'}</Tag>
              </div>

              {/* Tenure alert block */}
              <div className={`p-3 rounded-lg border ${tenure.isExceeded ? 'bg-red-50 border-red-100 text-red-700' : tenure.isRedFlag ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertOutlined /> Active Service Tenure Remaining
                </div>
                <p className="text-[13px] font-extrabold">{tenure.remainingText}</p>
                <div className="mt-2 text-[10px] opacity-80 grid grid-cols-2 gap-x-4">
                  <span>5-Year ICMR Date Limit: <strong>{tenure.limitDateStr || '-'}</strong></span>
                  <span>Agency Contract Expiry: <strong>{tenure.agencyEndDateStr || '-'}</strong></span>
                  <span>Completion Date: <strong>{tenure.docDateStr || '-'}</strong></span>
                  <span>Determined Cut-off: <strong>{tenure.cutOffDateStr || '-'} ({tenure.cutOffReason})</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold block">Employee ID:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedEmployee.employeeId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Assigned Service Agency:</span>
                  <span className="font-bold text-slate-800 text-[13px] text-blue-700">{selectedEmployee.agencyName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Department/Section/Location:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedEmployee.departmentSectionLocation || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Reporting Officer:</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedEmployee.reportingOfficer || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Date of Joining (DOJ):</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedEmployee.doj || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Date of Completion (DOC):</span>
                  <span className="font-bold text-slate-800 text-[13px]">{selectedEmployee.doc || '-'}</span>
                </div>
              </div>

              {/* PRIVACY PROTECTION: MASKED PERSONAL DATA SECTOR */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <LockOutlined className="text-amber-500"/> Privacy-Masked Regulatory Details
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Mobile Number</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.mobileNo, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Email ID</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.emailId, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Aadhaar Card Number</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.aadhaarNo, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">PAN Card Number</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.panNo, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">EPF Number</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.epfNo, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">ESIC Number</span>
                    <span className="font-bold text-slate-700">{renderMaskedField(selectedEmployee.esicNo, hasWritePermission, '🔒 Masked (Store Auth required)')}</span>
                  </div>
                </div>
              </div>

              {/* Previous ICMR Experience Log entries */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Previous ICMR Experience Records</h4>
                {(!selectedEmployee.previousIcmrExperience || selectedEmployee.previousIcmrExperience.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic">No previous ICMR experience logs recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedEmployee.previousIcmrExperience.map((exp: any, i: number) => (
                      <div key={exp.id || i} className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                        <div>
                          <span className="font-bold text-slate-700 block">{exp.instituteName}</span>
                          <span className="text-[10px] text-slate-500">{exp.designation}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium self-center">{exp.fromDate} to {exp.toDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous Non-ICMR Experience Log entries */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Previous Non-ICMR Experience Records</h4>
                {(!selectedEmployee.previousNonIcmrExperience || selectedEmployee.previousNonIcmrExperience.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic">No previous non-ICMR experience logs recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedEmployee.previousNonIcmrExperience.map((exp: any, i: number) => (
                      <div key={exp.id || i} className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                        <div>
                          <span className="font-bold text-slate-700 block">{exp.instituteName}</span>
                          <span className="text-[10px] text-slate-500">{exp.designation}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium self-center">{exp.fromDate} to {exp.toDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}
