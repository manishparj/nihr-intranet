import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Select, Table, Tag, Modal, 
  Row, Col, Space, Badge, Divider, Upload, message, Empty, Tabs, 
  Statistic, Tooltip, Typography, List, Descriptions, Steps, Alert, Popconfirm
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, LoginOutlined, LogoutOutlined, 
  FileExcelOutlined, FileImageOutlined, LoadingOutlined, 
  CustomerServiceOutlined, MessageOutlined, CheckCircleOutlined,
  UserOutlined, IdcardOutlined, PhoneOutlined, MailOutlined,
  EnvironmentOutlined, ApartmentOutlined, FileTextOutlined,
  EditOutlined, SyncOutlined, PrinterOutlined, AlertOutlined,
  FilterOutlined, ClockCircleOutlined, InfoCircleOutlined,
  CheckOutlined, DeleteOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { Complaint } from '../types';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

export const ComplaintPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('raise');
  
  // Public Raise Complaint states
  const [raising, setRaising] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string } | null>(null);
  const [raiseForm] = Form.useForm();

  // Tracking states
  const [trackMobile, setTrackMobile] = useState('');
  const [trackingResults, setTrackingResults] = useState<Complaint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  // Superuser Authentication states
  const [suToken, setSuToken] = useState<string | null>(() => localStorage.getItem('complaint_su_token'));
  const [currentSu, setCurrentSu] = useState<any | null>(() => {
    const saved = localStorage.getItem('complaint_su_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [suLoginEmail, setSuLoginEmail] = useState('');
  const [suLoginPassword, setSuLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Superuser Complaint Management states
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignForm] = Form.useForm();
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredComplaints = complaintsList.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || (c.priority || 'Medium') === filterPriority;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      c.id.toLowerCase().includes(searchLower) ||
      c.name.toLowerCase().includes(searchLower) ||
      c.complaintDescriptionFull.toLowerCase().includes(searchLower) ||
      (c.assignedStaff && c.assignedStaff.toLowerCase().includes(searchLower));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'Draft': return 0;
      case 'Pending': return 1;
      case 'Staff Assigned': return 2;
      case 'Staff Action Needed':
      case 'Dependency':
      case 'Custom Status': return 3;
      case 'Resolved': return 4;
      case 'Closed': return 5;
      default: return 1;
    }
  };

  const getPriorityTag = (priority?: string) => {
    let color = 'blue';
    if (priority === 'Low') color = 'green';
    if (priority === 'Medium') color = 'blue';
    if (priority === 'High') color = 'orange';
    if (priority === 'Critical') color = 'red';
    return (
      <Tag color={color} className="font-extrabold text-[10px]">
        {(priority || 'MEDIUM').toUpperCase()}
      </Tag>
    );
  };

  const handlePrintReceipt = (c: Complaint) => {
    const printContent = `
      <html>
        <head>
          <title>Grievance Receipt - ${c.id.toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #005EB8; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #005EB8; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .ticket-box { background: #f0f7ff; border: 1px solid #005eb8; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; color: #005eb8; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; width: 30%; }
            .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ICMR-NIHR INTRANET PORTAL</h1>
            <div class="subtitle">Official Grievance & Complaint Desk Receipt</div>
          </div>
          <div class="ticket-box">
            GRIEVANCE TICKET NO: ${c.id.toUpperCase()}
          </div>
          <table>
            <tr><th>Status</th><td><strong>${(c.status === 'Custom Status' && c.customStatusText ? c.customStatusText : c.status).toUpperCase()}</strong></td></tr>
            <tr><th>Priority Level</th><td><strong>${(c.priority || 'Medium').toUpperCase()}</strong></td></tr>
            <tr><th>Department Desk</th><td>${c.typeOfComplaint} Department</td></tr>
            <tr><th>Staff Name</th><td>${c.name}</td></tr>
            <tr><th>Designation</th><td>${c.designation}</td></tr>
            <tr><th>Mobile Number</th><td>${c.mobile}</td></tr>
            <tr><th>Email Address</th><td>${c.email}</td></tr>
            <tr><th>Location / Room</th><td>Room ${c.locationRoom}</td></tr>
            <tr><th>Department/Division</th><td>${c.department}</td></tr>
            <tr><th>Grievance Description</th><td><i>${c.complaintDescriptionFull}</i></td></tr>
            <tr><th>Assigned technician</th><td>${c.assignedStaff || 'Pending Assignment'}</td></tr>
            <tr><th>Official Remark / Description</th><td><strong>${c.superUserRemark || 'No action notes added yet.'}</strong></td></tr>
            <tr><th>Date Registered</th><td>${new Date(c.createdAt).toLocaleString()}</td></tr>
            <tr><th>Last Updated</th><td>${new Date(c.updatedAt).toLocaleString()}</td></tr>
          </table>
          <div class="footer">
            This is an automated computer-generated receipt issued by ICMR-NIHR Intranet. For support, please contact the respective departmental superuser.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      message.error("Pop-up blocked. Please allow pop-ups or use the browser's print option.");
    }
  };

  // Load complaints if superuser is logged in
  const loadSuComplaints = async () => {
    if (!suToken) return;
    setLoadingComplaints(true);
    try {
      const data = await apiService.getComplaints();
      setComplaintsList(data);
    } catch (e: any) {
      console.error(e);
      message.error(e.response?.data?.error || 'Failed to fetch department complaints.');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    try {
      await apiService.deleteComplaint(id);
      message.success('Complaint deleted successfully.');
      loadSuComplaints();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to delete complaint.');
    }
  };

  useEffect(() => {
    if (suToken) {
      loadSuComplaints();
    }
  }, [suToken]);

  // Handle Photo Document Upload (optional)
  const handlePhotoUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'application/pdf';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG/WEBP Images or PDF files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        data: reader.result as string
      });
      message.success(`File "${file.name}" loaded successfully.`);
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  // Submit Complaint
  const handleRaiseSubmit = async (values: any) => {
    setRaising(true);
    try {
      const payload = {
        ...values,
        photoDocument: attachedFile ? attachedFile.data : undefined,
        photoName: attachedFile ? attachedFile.name : undefined
      };
      await apiService.raiseComplaint(payload);
      message.success('Your grievance / complaint has been registered successfully!');
      raiseForm.resetFields();
      setAttachedFile(null);
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to register complaint.');
    } finally {
      setRaising(false);
    }
  };

  // Track Complaint by Mobile
  const handleTrackSearch = async () => {
    if (!trackMobile.trim()) {
      message.warning('Please enter a valid mobile number.');
      return;
    }
    setIsTracking(true);
    setHasTracked(true);
    try {
      const data = await apiService.searchComplaintsByMobile(trackMobile);
      setTrackingResults(data);
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to track complaints.');
    } finally {
      setIsTracking(false);
    }
  };

  // Superuser Login
  const handleSuLogin = async () => {
    if (!suLoginEmail || !suLoginPassword) {
      message.warning('Please enter official email and password.');
      return;
    }
    setLoggingIn(true);
    try {
      const data = await apiService.loginComplaintSuperUser({
        email: suLoginEmail,
        password: suLoginPassword
      });
      setSuToken(data.token);
      setCurrentSu(data.superUser);
      localStorage.setItem('complaint_su_user', JSON.stringify(data.superUser));
      message.success(`Logged in as ${data.superUser.name} (${data.superUser.department} Super User)`);
      setSuLoginEmail('');
      setSuLoginPassword('');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Invalid credentials or login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Superuser Logout
  const handleSuLogout = () => {
    apiService.logoutComplaintSuperUser();
    localStorage.removeItem('complaint_su_user');
    setSuToken(null);
    setCurrentSu(null);
    setComplaintsList([]);
    message.success('Logged out from Complaint Super User Console.');
  };

  // Assign staff & update ticket
  const handleUpdateTicket = async (values: any) => {
    if (!selectedComplaint) return;
    setUpdatingTicket(true);
    try {
      await apiService.updateComplaint(selectedComplaint.id, values);
      message.success('Complaint status and staff assignment updated successfully.');
      setDetailModalOpen(false);
      loadSuComplaints();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Failed to update ticket.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Export complaints to CSV for Superuser
  const handleExportCSV = () => {
    if (complaintsList.length === 0) {
      message.warning('No complaints available to export.');
      return;
    }
    try {
      const headers = ['Complaint ID', 'Staff Name', 'Designation', 'Mobile', 'Email', 'Room', 'Department', 'Type', 'Description', 'Assigned Staff', 'Status', 'Custom Status', 'Created At'];
      const rows = complaintsList.map(c => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.designation.replace(/"/g, '""')}"`,
        c.mobile,
        c.email,
        c.locationRoom,
        `"${c.department.replace(/"/g, '""')}"`,
        c.typeOfComplaint,
        `"${c.complaintDescriptionFull.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        c.assignedStaff ? `"${c.assignedStaff.replace(/"/g, '""')}"` : '-',
        c.status,
        c.customStatusText ? `"${c.customStatusText.replace(/"/g, '""')}"` : '-',
        new Date(c.createdAt).toLocaleString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${currentSu?.department}_Complaints_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Complaints report exported successfully.');
    } catch (e) {
      message.error('Export failed. Please try again.');
    }
  };

  // Status Badge Helper
  const getStatusTag = (status: string, customText?: string) => {
    let color = 'gold';
    if (status === 'Resolved' || status === 'Closed') color = 'green';
    if (status === 'Pending') color = 'red';
    if (status === 'Staff Assigned') color = 'blue';
    if (status === 'Staff Action Needed' || status === 'Dependency') color = 'orange';
    
    return (
      <Tag color={color} className="font-extrabold text-[10px]">
        {status === 'Custom Status' && customText ? customText.toUpperCase() : status.toUpperCase()}
      </Tag>
    );
  };

  return (
    <Card 
      className="shadow-md rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      styles={{ body: { padding: '16px' } }}
    >
      <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <Title level={4} style={{ margin: 0, color: '#005EB8' }} className="flex items-center gap-2 text-base sm:text-lg">
            <CustomerServiceOutlined />
            <span>Complaint & Grievance / Task Tracker Portal</span>
          </Title>
          <Text className="text-xs text-slate-500">
            Submit, track and manage institutional IT, maintenance, or administrative grievances.
          </Text>
        </div>
        {currentSu && (
          <Tag color="geekblue" className="px-2.5 py-1 m-0 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-0">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-ping"></span>
            {currentSu.department} Admin Console Active
          </Tag>
        )}
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'raise',
            label: (
              <span className="flex items-center gap-1">
                <PlusOutlined />
                Raise Grievance
              </span>
            ),
            children: (
              <div className="py-2">
                <Row gutter={[24, 24]}>
                  {/* Left Column: Raise Grievance Form */}
                  <Col xs={24} lg={16}>
                    <Form 
                      form={raiseForm}
                      layout="vertical" 
                      onFinish={handleRaiseSubmit}
                      requiredMark
                      initialValues={{ typeOfComplaint: 'IT', priority: 'Medium' }}
                    >
                      <Card size="small" title={<span className="font-bold text-xs sm:text-sm text-[#005EB8]">Fill Grievance Details</span>} className="shadow-sm rounded-xl mb-4 border-slate-200 bg-white dark:bg-zinc-900">
                        <Row gutter={[16, 12]}>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Staff Name</span>}
                              name="name" 
                              rules={[{ required: true, message: 'Please enter your name' }]}
                            >
                              <Input prefix={<UserOutlined />} placeholder="e.g. Dr. Sunita Sharma" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Designation</span>}
                              name="designation" 
                              rules={[{ required: true, message: 'Please enter designation' }]}
                            >
                              <Input prefix={<IdcardOutlined />} placeholder="e.g. Scientist E / Section Officer" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Mobile Number</span>}
                              name="mobile" 
                              rules={[{ required: true, message: 'Please enter mobile' }]}
                            >
                              <Input prefix={<PhoneOutlined />} placeholder="e.g. 9876543210" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Email Address</span>}
                              name="email" 
                              rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
                            >
                              <Input prefix={<MailOutlined />} placeholder="e.g. s.sharma@nihr.res.in" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Location (Room Number)</span>}
                              name="locationRoom" 
                              rules={[{ required: true, message: 'Please enter room number' }]}
                            >
                              <Input prefix={<EnvironmentOutlined />} placeholder="e.g. Room 204, Second Floor" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Department / Division</span>}
                              name="department" 
                              rules={[{ required: true, message: 'Please enter department' }]}
                            >
                              <Input prefix={<ApartmentOutlined />} placeholder="e.g. Virology Laboratory" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Grievance Category</span>}
                              name="typeOfComplaint" 
                              rules={[{ required: true }]}
                            >
                              <Select size="middle">
                                <Option value="IT">💻 IT (Network, Hardware, Software)</Option>
                                <Option value="Maintenance">🔧 Maintenance (Electricity, Plumbing, HVAC)</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Grievance Priority Level</span>}
                              name="priority" 
                              rules={[{ required: true }]}
                            >
                              <Select size="middle">
                                <Option value="Low">🟢 Low (Routine, Non-blocking)</Option>
                                <Option value="Medium">🔵 Medium (Standard support request)</Option>
                                <Option value="High">🟠 High (Serious issue, blocking work)</Option>
                                <Option value="Critical">🔴 Critical (Outage / Emergency)</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item 
                              label={<span className="text-xs font-bold">Description of Grievance (Full Details)</span>}
                              name="complaintDescriptionFull" 
                              rules={[{ required: true, message: 'Please describe the issue in detail' }]}
                            >
                              <TextArea rows={4} placeholder="Please provide specific, clear details of the problem so the superuser can resolve it swiftly." />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item label={<span className="text-xs font-bold">Photo / Document Attachment (Optional)</span>}>
                              <Upload 
                                beforeUpload={handlePhotoUpload} 
                                maxCount={1}
                                showUploadList={false}
                              >
                                <Button icon={<FileImageOutlined />} className="rounded-lg">
                                  Select Image or PDF Document
                                </Button>
                              </Upload>
                              {attachedFile && (
                                <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-2 bg-green-50 dark:bg-green-950/20 p-2 rounded-lg border border-green-100">
                                  <CheckCircleOutlined /> Selected: {attachedFile.name}
                                  <Button type="text" size="small" danger onClick={() => setAttachedFile(null)} className="p-0 ml-auto">Remove</Button>
                                </div>
                              )}
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>

                      <div className="flex justify-end gap-2">
                        <Button onClick={() => { raiseForm.resetFields(); setAttachedFile(null); }} className="rounded-lg">Reset Form</Button>
                        <Button type="primary" htmlType="submit" loading={raising} className="rounded-lg bg-[#005EB8]" icon={<CheckCircleOutlined />}>
                          Submit Grievance
                        </Button>
                      </div>
                    </Form>
                  </Col>

                  {/* Right Column: Self-Help Sidebar */}
                  <Col xs={24} lg={8}>
                    <Space orientation="vertical" className="w-full" size="middle">
                      <Card size="small" title={<span className="font-bold text-xs text-slate-700 dark:text-zinc-200">Grievance Flowchart</span>} className="rounded-xl border-slate-200 bg-white dark:bg-zinc-900">
                        <Steps
                          orientation="vertical"
                          size="small"
                          current={0}
                          items={[
                            { title: 'Raise Grievance', content: 'Submit details and attach optional supporting document.' },
                            { title: 'Desk Triage', content: 'Super User reviews severity and designates specific technician.' },
                            { title: 'In-Progress Resolution', content: 'Official remark/custom status and progress notes are logged.' },
                            { title: 'Completion & Receipt', content: 'Ticket is marked resolved and permanent PDF receipt is available.' }
                          ]}
                        />
                      </Card>

                      <Card size="small" title={<span className="font-bold text-xs text-slate-700 dark:text-zinc-200">🛠️ Departmental Self-Help Tips</span>} className="rounded-xl border-slate-200 bg-white dark:bg-zinc-900">
                        <div className="space-y-3 text-xs">
                          <Alert 
                            title="💻 IT support" 
                            description="For network interruptions, try unplugging and re-inserting your LAN ethernet patch cable before raising tickets." 
                            type="info" 
                            showIcon 
                          />
                          <Alert 
                            title="🔧 HVAC & Power" 
                            description="Check if the mains switch is set on. If an AC remote has no display, try replacing the AAA dry cells." 
                            type="info" 
                            showIcon 
                          />
                          <Alert 
                            title="📂 File Tracking" 
                            description="Kindly mention the official File diary number in the description for fast-track retrieval and approval." 
                            type="info" 
                            showIcon 
                          />
                        </div>
                      </Card>

                      <Card size="small" title={<span className="font-bold text-xs text-slate-700 dark:text-zinc-200">📞 Urgent Out-Of-Hours Desk</span>} className="rounded-xl border-slate-200 bg-amber-50/50 dark:bg-amber-950/10">
                        <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400">
                          <p>For emergencies (flooding, electrical short circuit, server room failure):</p>
                          <p className="font-bold text-[#005EB8] mt-1.5">📞 IT Hotline: +91 11-26588920 (Ext. 402)</p>
                          <p className="font-bold text-[#005EB8]">📞 Civil Maintenance: +91 11-26588931</p>
                          <p className="font-bold text-[#005EB8]">📂 Main Admin Registry: ext-admin@nihr.res.in</p>
                        </div>
                      </Card>
                    </Space>
                  </Col>
                </Row>
              </div>
            )
          },
          {
            key: 'track',
            label: (
              <span className="flex items-center gap-1">
                <SearchOutlined />
                Track Grievance Status
              </span>
            ),
            children: (
              <div className="max-w-4xl mx-auto py-2">
                <Card size="small" className="bg-slate-50/50 dark:bg-zinc-900/40 rounded-xl mb-6 p-2 sm:p-4 border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Input 
                      placeholder="Enter registered mobile number (e.g., 9876543210)" 
                      value={trackMobile}
                      onChange={(e) => setTrackMobile(e.target.value)}
                      onPressEnter={handleTrackSearch}
                      prefix={<PhoneOutlined />}
                      size="large"
                      className="rounded-lg flex-1"
                    />
                    <Button 
                      type="primary" 
                      onClick={handleTrackSearch} 
                      loading={isTracking}
                      size="large"
                      className="rounded-lg bg-[#005EB8]"
                      icon={<SearchOutlined />}
                    >
                      Search Complaints
                    </Button>
                  </div>
                  <Text className="text-[10px] sm:text-xs text-slate-400 mt-2 block">
                    Multiple complaints matching your mobile number will be retrieved. Use this to review statuses, assigned staff, and resolution updates.
                  </Text>
                </Card>

                {hasTracked && (
                  <div className="space-y-4">
                    <Divider className="my-2" />
                    <Title level={5} className="text-slate-800 dark:text-zinc-200">
                      Found {trackingResults.length} registered complaint{trackingResults.length === 1 ? '' : 's'}
                    </Title>

                    {trackingResults.length === 0 ? (
                      <Empty description="No complaints found for this mobile number." />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {trackingResults.map((c) => (
                          <Col xs={24} key={c.id}>
                            <Card 
                              size="small"
                              className="border border-slate-200 dark:border-zinc-800 hover:shadow-md transition-shadow duration-200 rounded-xl bg-white dark:bg-zinc-900"
                              title={
                                <div className="flex justify-between items-center w-full gap-2 py-1">
                                  <Space>
                                    <span className="font-extrabold text-xs text-blue-600">{c.id.toUpperCase()}</span>
                                    {getPriorityTag(c.priority)}
                                  </Space>
                                  {getStatusTag(c.status, c.customStatusText)}
                                </div>
                              }
                            >
                              <div className="space-y-3 text-xs p-1">
                                <Row gutter={[16, 8]}>
                                  <Col xs={24} sm={12}>
                                    <div><strong className="text-slate-400">Department Type:</strong> <Tag color="geekblue" className="text-[10px] ml-1">{c.typeOfComplaint}</Tag></div>
                                    <div className="mt-1"><strong className="text-slate-400">Raised By:</strong> <span className="font-semibold text-slate-700 dark:text-zinc-300 ml-1">{c.name} ({c.designation})</span></div>
                                  </Col>
                                  <Col xs={24} sm={12}>
                                    <div><strong className="text-slate-400">Location / Room:</strong> <span className="font-semibold ml-1">{c.locationRoom}</span></div>
                                    <div className="mt-1"><strong className="text-slate-400">Division:</strong> <span className="font-semibold ml-1">{c.department}</span></div>
                                  </Col>
                                </Row>

                                <div>
                                  <strong className="text-slate-400">Detailed Grievance Description:</strong> 
                                  <p className="text-slate-600 dark:text-zinc-400 italic mt-1 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg m-0 whitespace-pre-line leading-relaxed">
                                    {c.complaintDescriptionFull}
                                  </p>
                                </div>

                                {/* Active status timeline */}
                                <div className="my-4 py-2 px-3 bg-slate-50 dark:bg-zinc-950/30 rounded-xl border border-slate-100">
                                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2 tracking-wider">Live Processing Steps</span>
                                  <Steps 
                                    progressDot 
                                    size="small" 
                                    current={getStatusStepIndex(c.status)}
                                    items={[
                                      { title: 'Registered', content: 'Pending Desk review' },
                                      { title: 'Staff Designated', content: c.assignedStaff || 'Assigning specialist' },
                                      { title: 'Action Taken', content: (c.status === 'Resolved' || c.status === 'Closed') ? 'Done' : 'Update pending' },
                                      { title: 'Resolved / Closed', content: (c.status === 'Resolved' || c.status === 'Closed') ? 'Completed' : 'Awaiting fix' }
                                    ]}
                                  />
                                </div>

                                {/* Super User Official Remark */}
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-xl border border-blue-100 text-xs">
                                  <div className="font-extrabold text-[#005EB8] flex items-center gap-1.5 mb-1">
                                    <MessageOutlined /> 
                                    <span>Super User Remark / Description Log:</span>
                                  </div>
                                  <p className="text-slate-700 dark:text-zinc-300 font-semibold italic m-0 whitespace-pre-wrap leading-relaxed">
                                    {c.superUserRemark || "No official action notes logged by the superuser yet. Our technical desk is currently scheduling triage."}
                                  </p>
                                </div>

                                <Divider className="my-2" />
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <div>
                                    <strong className="text-slate-400">Assigned Staff:</strong> 
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 ml-1">
                                      {c.assignedStaff || 'Pending Triage'}
                                    </span>
                                  </div>
                                  <Space className="w-full sm:w-auto justify-end">
                                    <span className="text-[10px] text-slate-400 mr-2">Last Updated: {new Date(c.updatedAt).toLocaleString()}</span>
                                    <Button 
                                      type="primary" 
                                      ghost 
                                      size="small" 
                                      icon={<PrinterOutlined />} 
                                      onClick={() => handlePrintReceipt(c)}
                                      className="rounded-lg text-[11px] font-bold border-[#005EB8] text-[#005EB8]"
                                    >
                                      Download Receipt
                                    </Button>
                                  </Space>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'su',
            label: (
              <span className="flex items-center gap-1">
                <UserOutlined />
                Super User Panel
              </span>
            ),
            children: (
              <div className="py-2">
                {!suToken ? (
                  <div className="max-w-md mx-auto py-8">
                    <Card title={<Space><LoginOutlined /><span>Grievance Super User Authentication</span></Space>} className="rounded-xl shadow-sm">
                      <Form layout="vertical" onFinish={handleSuLogin}>
                        <Form.Item label={<span className="text-xs font-bold">Super User Email</span>} required>
                          <Input 
                            prefix={<MailOutlined />} 
                            placeholder="e.g. it_super1@nihr.res.in" 
                            value={suLoginEmail}
                            onChange={(e) => setSuLoginEmail(e.target.value)}
                          />
                        </Form.Item>
                        <Form.Item label={<span className="text-xs font-bold">Password</span>} required>
                          <Input.Password 
                            prefix={<UserOutlined />} 
                            placeholder="Password" 
                            value={suLoginPassword}
                            onChange={(e) => setSuLoginPassword(e.target.value)}
                            onPressEnter={handleSuLogin}
                          />
                        </Form.Item>
                        <Button type="primary" block onClick={handleSuLogin} loading={loggingIn} className="rounded-lg bg-[#005EB8] mt-2">
                          Login to Department Desk
                        </Button>
                      </Form>
                      <Divider className="my-4" />
                      <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-500">
                        <strong>📌 Seeded Super User Login Details for evaluation:</strong>
                        <ul className="list-disc list-inside mt-1.5 space-y-1">
                          <li>IT Department: <code>it_super1@nihr.res.in</code> (pass: <code>admin</code>)</li>
                          <li>Maintenance Dept: <code>maint_super1@nihr.res.in</code> (pass: <code>admin</code>)</li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[10px] text-blue-500 uppercase font-extrabold tracking-widest block">Logged In Super User Portal</span>
                        <Title level={5} style={{ margin: 0 }} className="text-slate-800 dark:text-zinc-100">
                          Welcome, {currentSu?.name}
                        </Title>
                        <Text className="text-xs text-slate-400">
                          Reviewing, assigning, and resolving grievances for <strong>{currentSu?.department} Department</strong>.
                        </Text>
                      </div>
                      <Space size="middle" className="w-full sm:w-auto justify-end">
                        <Button icon={<SyncOutlined />} onClick={loadSuComplaints} className="rounded-lg">Refresh</Button>
                        <Button icon={<FileExcelOutlined />} onClick={handleExportCSV} className="rounded-lg bg-green-600 hover:bg-green-700 text-white border-green-600">Export CSV</Button>
                        <Button danger icon={<LogoutOutlined />} onClick={handleSuLogout} className="rounded-lg">Logout</Button>
                      </Space>
                    </div>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="rounded-xl border border-slate-100">
                          <Statistic 
                            title="Total Grievances" 
                            value={complaintsList.length} 
                            valueStyle={{ color: '#005EB8', fontWeight: 800 }} 
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="rounded-xl border border-slate-100">
                          <Statistic 
                            title="Pending Review" 
                            value={complaintsList.filter(c => c.status === 'Pending').length} 
                            valueStyle={{ color: '#cf1322', fontWeight: 800 }} 
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small" className="rounded-xl border border-slate-100">
                          <Statistic 
                            title="Resolved / Closed" 
                            value={complaintsList.filter(c => c.status === 'Resolved' || c.status === 'Closed').length} 
                            valueStyle={{ color: '#3f8600', fontWeight: 800 }} 
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Card 
                      size="small" 
                      title={<span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-zinc-200">Grievance Worklist Tickets</span>}
                      className="rounded-xl overflow-hidden border-slate-200"
                    >
                      <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl mb-4 border border-slate-100 flex flex-col md:flex-row gap-3 items-center">
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                          <FilterOutlined className="text-blue-600" /> Filter Worklist:
                        </div>
                        <Input 
                          placeholder="Search ID, name, or description..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          prefix={<SearchOutlined />}
                          className="rounded-lg max-w-sm"
                          allowClear
                        />
                        <Select 
                          value={filterStatus} 
                          onChange={setFilterStatus} 
                          className="w-full md:w-44 rounded-lg"
                        >
                          <Option value="all">All Statuses</Option>
                          <Option value="Draft">Draft</Option>
                          <Option value="Pending">Pending</Option>
                          <Option value="Staff Assigned">Staff Assigned</Option>
                          <Option value="Staff Action Needed">Staff Action Needed</Option>
                          <Option value="Dependency">Dependency</Option>
                          <Option value="Resolved">Resolved</Option>
                          <Option value="Closed">Closed</Option>
                        </Select>
                        <Select 
                          value={filterPriority} 
                          onChange={setFilterPriority} 
                          className="w-full md:w-36 rounded-lg"
                        >
                          <Option value="all">All Priorities</Option>
                          <Option value="Low">Low</Option>
                          <Option value="Medium">Medium</Option>
                          <Option value="High">High</Option>
                          <Option value="Critical">Critical</Option>
                        </Select>
                        {(filterStatus !== 'all' || filterPriority !== 'all' || searchQuery !== '') && (
                          <Button 
                            type="text" 
                            size="small" 
                            danger 
                            onClick={() => {
                              setFilterStatus('all');
                              setFilterPriority('all');
                              setSearchQuery('');
                            }}
                            className="font-bold text-[11px]"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>

                      <Table 
                        dataSource={filteredComplaints}
                        loading={loadingComplaints}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 'max-content' }}
                        columns={[
                          { 
                            title: 'ID', 
                            dataIndex: 'id', 
                            key: 'id',
                            render: (val: string) => <span className="font-mono font-bold text-blue-600">{val.toUpperCase()}</span>,
                            width: 100
                          },
                          { 
                            title: 'Staff Name', 
                            dataIndex: 'name', 
                            key: 'name',
                            render: (val: string, c: any) => (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-zinc-200 block">{val}</span>
                                <span className="text-[10px] text-slate-400 block">{c.designation}</span>
                              </div>
                            ),
                            width: 150
                          },
                          { 
                            title: 'Location', 
                            dataIndex: 'locationRoom', 
                            key: 'locationRoom',
                            width: 100
                          },
                          { 
                            title: 'Priority', 
                            dataIndex: 'priority', 
                            key: 'priority',
                            render: (val: string) => getPriorityTag(val as any),
                            width: 110,
                            sorter: (a: Complaint, b: Complaint) => {
                              const priorities = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                              return (priorities[a.priority || 'Medium'] || 0) - (priorities[b.priority || 'Medium'] || 0);
                            }
                          },
                          { 
                            title: 'Description', 
                            dataIndex: 'complaintDescriptionFull', 
                            key: 'complaintDescriptionFull',
                            ellipsis: true,
                            width: 200
                          },
                          { 
                            title: 'Super User Remark', 
                            dataIndex: 'superUserRemark', 
                            key: 'superUserRemark',
                            ellipsis: true,
                            width: 180,
                            render: (val: string) => <span className="text-xs text-blue-600 dark:text-blue-400 italic font-medium">{val || 'No remark logged'}</span>
                          },
                          { 
                            title: 'Status', 
                            dataIndex: 'status', 
                            key: 'status',
                            render: (val: string, c: any) => getStatusTag(val, c.customStatusText),
                            width: 120
                          },
                          { 
                            title: 'Assigned Staff', 
                            dataIndex: 'assignedStaff', 
                            key: 'assignedStaff',
                            render: (val: string) => <span className="font-semibold">{val || 'Unassigned'}</span>,
                            width: 120
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            width: 140,
                            render: (_: any, c: Complaint) => (
                              <Space size="small">
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  className="rounded-lg text-xs"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setSelectedComplaint(c);
                                    assignForm.setFieldsValue({
                                      assignedStaff: c.assignedStaff,
                                      status: c.status,
                                      customStatusText: c.customStatusText,
                                      priority: c.priority || 'Medium',
                                      superUserRemark: c.superUserRemark || ''
                                    });
                                    setDetailModalOpen(true);
                                  }}
                                >
                                  Manage
                                </Button>
                                <Popconfirm
                                  title="Delete this ticket?"
                                  onConfirm={() => handleDeleteComplaint(c.id)}
                                  okText="Yes"
                                  cancelText="No"
                                  okButtonProps={{ danger: true, size: 'small' }}
                                  cancelButtonProps={{ size: 'small' }}
                                >
                                  <Button 
                                    type="text" 
                                    danger 
                                    size="small" 
                                    className="rounded-lg text-xs hover:bg-red-50"
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              </Space>
                            )
                          }
                        ]}
                      />
                    </Card>
                  </div>
                )}
              </div>
            )
          }
        ]}
      />

      {/* Complaint Detail & Assignment Modal for Super User */}
      <Modal
        title={
          <div className="border-b border-slate-100 pb-2">
            <span className="font-extrabold text-sm text-blue-600 block">MANAGE GRIEVANCE TICKET</span>
            <span className="text-xs text-slate-400 font-medium">Ticket: {selectedComplaint?.id.toUpperCase()}</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={720}
        className="rounded-xl overflow-hidden"
      >
        {selectedComplaint && (
          <div className="space-y-4 pt-3 max-h-[75vh] overflow-y-auto pr-1">
            <Descriptions bordered size="small" column={1} className="rounded-xl overflow-hidden">
              <Descriptions.Item label={<span className="font-semibold text-xs">Raised By Staff</span>}>
                <span className="font-bold text-slate-800">{selectedComplaint.name}</span> ({selectedComplaint.designation})
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-xs">Contact Details</span>}>
                Mobile: <span className="font-bold">{selectedComplaint.mobile}</span> | Email: <span className="font-bold">{selectedComplaint.email}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-xs">Location / Room</span>}>
                {selectedComplaint.locationRoom}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-xs">Department</span>}>
                {selectedComplaint.department}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-xs">Grievance Category</span>}>
                <Tag color="purple" className="font-bold">{selectedComplaint.typeOfComplaint}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-semibold text-xs">Description Full</span>}>
                <p className="text-slate-700 italic bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed m-0 text-xs">
                  {selectedComplaint.complaintDescriptionFull}
                </p>
              </Descriptions.Item>
              {selectedComplaint.photoDocument && (
                <Descriptions.Item label={<span className="font-semibold text-xs">Attached Document</span>}>
                  <div className="p-2 border border-slate-100 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-600"><FileTextOutlined className="text-green-600 mr-1.5" /> Attachment Document loaded</span>
                    <Button 
                      type="link" 
                      size="small" 
                      className="font-bold p-0"
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${selectedComplaint.photoDocument}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                    >
                      View Attachment
                    </Button>
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider className="my-2" />

            <Card size="small" title={<span className="font-bold text-xs text-slate-700">Assign Action & Update Status</span>} className="bg-slate-50/50 dark:bg-zinc-900/50 rounded-xl">
              <Form 
                form={assignForm} 
                layout="vertical" 
                onFinish={handleUpdateTicket}
              >
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<span className="text-xs font-semibold">Assign Staff Name</span>} 
                      name="assignedStaff"
                    >
                      <Input placeholder="Enter support/technician name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<span className="text-xs font-semibold">Update Ticket Status</span>} 
                      name="status"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="Draft">Draft</Option>
                        <Option value="Pending">Pending</Option>
                        <Option value="Staff Assigned">Staff Assigned</Option>
                        <Option value="Resolved">Resolved</Option>
                        <Option value="Closed">Closed</Option>
                        <Option value="Staff Action Needed">Staff Action Needed</Option>
                        <Option value="Dependency">Dependency</Option>
                        <Option value="Custom Status">Custom Status</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<span className="text-xs font-semibold">Priority Severity</span>} 
                      name="priority"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="Low">🟢 Low</Option>
                        <Option value="Medium">🔵 Medium</Option>
                        <Option value="High">🟠 High</Option>
                        <Option value="Critical">🔴 Critical</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* Conditional custom status input */}
                  <Form.Item noStyle shouldUpdate={(prev, curr) => prev.status !== curr.status}>
                    {({ getFieldValue }) => {
                      return getFieldValue('status') === 'Custom Status' ? (
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            label={<span className="text-xs font-semibold">Provide Custom Status text</span>} 
                            name="customStatusText"
                            rules={[{ required: true, message: 'Please input custom status text' }]}
                          >
                            <Input placeholder="e.g. Waiting for spare parts" />
                          </Form.Item>
                        </Col>
                      ) : null;
                    }}
                  </Form.Item>

                  <Col xs={24}>
                    <Form.Item 
                      label={<span className="text-xs font-semibold">Super User Remark / Action Taken Description</span>} 
                      name="superUserRemark"
                    >
                      <TextArea rows={3} placeholder="Provide specific action notes, status updates, or final resolution remarks that the public staff can see." />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="flex justify-between items-center mt-4">
                  <Button 
                    icon={<PrinterOutlined />} 
                    onClick={() => handlePrintReceipt(selectedComplaint)}
                    className="rounded-lg hover:border-[#005EB8]"
                  >
                    Print Receipt
                  </Button>
                  <Space>
                    <Button onClick={() => setDetailModalOpen(false)} className="rounded-lg">Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={updatingTicket} className="bg-[#005EB8] rounded-lg" icon={<CheckCircleOutlined />}>
                      Update Grievance Status
                    </Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </div>
        )}
      </Modal>
    </Card>
  );
};
