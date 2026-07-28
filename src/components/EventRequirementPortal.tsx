import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Input, Select, Button, Space, DatePicker, 
  Row, Col, Form, InputNumber, Alert, Divider, Modal, Badge, 
  Tabs, Popconfirm, Tooltip, Empty, App as AntdApp
} from 'antd';
import { 
  CalendarOutlined, UserOutlined, MailOutlined, PhoneOutlined, 
  FilePdfOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, 
  CloseCircleOutlined, LockOutlined, FileTextOutlined, DollarOutlined,
  SendOutlined, InfoCircleOutlined, SafetyCertificateOutlined, ReloadOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

export interface RequirementItem {
  srNo: number;
  itemName: string;
  quantity: number;
  pricePerItem: number;
  estimateTotal: number;
  remarkJustification: string;
}

export interface EventRequirementRequest {
  id: string;
  name: string;
  designation: string;
  email: string;
  mobile: string;
  eventTitle: string;
  budgetHead: 'Institutional' | 'Project' | 'Other';
  otherBudgetHead?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  advanceDays: number;
  submissionDate: string;
  lateJustification?: string;
  additionalRemark?: string;
  budgetStatementPdf?: string;
  budgetStatementFileName?: string;
  supportingDocPdf?: string;
  supportingDocFileName?: string;
  items: RequirementItem[];
  totalEstimateBudget: number;
  status: 'Approved' | 'Recommended' | 'In Discussion' | 'Rejected' | 'Custom Status' | 'Pending';
  customStatusText?: string;
  superUserRemarks?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const EventRequirementPortal: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'admin'>('submit');
  
  // Public Form States
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [budgetHead, setBudgetHead] = useState<'Institutional' | 'Project' | 'Other'>('Institutional');
  const [otherBudgetHead, setOtherBudgetHead] = useState('');
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs().add(30, 'day'), dayjs().add(32, 'day')]);
  const [lateJustification, setLateJustification] = useState('');
  const [additionalRemark, setAdditionalRemark] = useState('');
  
  // Uploaded Files
  const [budgetPdf, setBudgetPdf] = useState<{ name: string; data: string } | null>(null);
  const [supportingPdf, setSupportingPdf] = useState<{ name: string; data: string } | null>(null);

  // Requirement Items Table
  const [items, setItems] = useState<RequirementItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);

  // Tracking States
  const [trackMobile, setTrackMobile] = useState('');
  const [trackedRequests, setTrackedRequests] = useState<EventRequirementRequest[]>([]);
  const [searchingTrack, setSearchingTrack] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Event Manager Super User Auth & Admin States
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [superUserToken, setSuperUserToken] = useState<string | null>(localStorage.getItem('event_mgr_token'));
  const [superUserInfo, setSuperUserInfo] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('aonihr@gmail.com');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin View Data
  const [allRequests, setAllRequests] = useState<EventRequirementRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EventRequirementRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status Action Modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionRequest, setActionRequest] = useState<EventRequirementRequest | null>(null);
  const [newStatus, setNewStatus] = useState<'Approved' | 'Recommended' | 'In Discussion' | 'Rejected' | 'Custom Status' | 'Pending'>('Approved');
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [superRemarksInput, setSuperRemarksInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // PDF Preview Modal
  const [pdfModal, setPdfModal] = useState<{ visible: boolean; title: string; url: string }>({ visible: false, title: '', url: '' });

  // Calculation Logic
  const startDateObj = dates && dates[0] ? dates[0] : dayjs();
  const endDateObj = dates && dates[1] ? dates[1] : dayjs();
  
  const today = dayjs().startOf('day');
  const startDay = startDateObj.startOf('day');
  
  // Auto calculate duration in days
  const durationDays = Math.max(1, endDateObj.diff(startDateObj, 'day') + 1);
  // Auto calculate advance days = Today to Event Start Date
  const advanceDays = startDay.diff(today, 'day');

  const totalEstimateBudget = items.reduce((acc, curr) => acc + (Number(curr.estimateTotal) || 0), 0);

  useEffect(() => {
    if (superUserToken) {
      setIsSuperUser(true);
      fetchAdminRequests();
    }
  }, [superUserToken]);

  const handlePrintRequest = (req: EventRequirementRequest) => {
    const itemsRowsHtml = (req.items || []).map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><strong>${item.itemName || '-'}</strong></td>
        <td style="text-align: center;">${item.quantity || 0}</td>
        <td style="text-align: right;">₹${(item.pricePerItem || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: bold;">₹${(item.estimateTotal || 0).toLocaleString('en-IN')}</td>
        <td>${item.remarkJustification || '-'}</td>
      </tr>
    `).join('');

    const statusDisplay = req.status === 'Custom Status' && req.customStatusText 
      ? req.customStatusText 
      : req.status;

    const budgetHeadDisplay = req.budgetHead === 'Other' 
      ? (req.otherBudgetHead || 'Other') 
      : `${req.budgetHead} Budget`;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event Requirement Application - ${req.id}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 24px;
              line-height: 1.5;
              font-size: 13px;
              background: #ffffff;
            }
            .header-table {
              width: 100%;
              border-bottom: 2.5px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .org-title {
              font-size: 15px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .org-sub {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .doc-title {
              font-size: 17px;
              font-weight: 900;
              color: #0284c7;
              text-align: center;
              text-transform: uppercase;
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              padding: 8px 12px;
              border-radius: 6px;
              margin-bottom: 20px;
              letter-spacing: 0.5px;
            }
            .ref-badge {
              display: inline-block;
              font-size: 13px;
              font-weight: 800;
              background: #eff6ff;
              color: #1d4ed8;
              padding: 5px 12px;
              border-radius: 6px;
              border: 1px solid #bfdbfe;
            }
            .section-title {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              color: #1e40af;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-top: 18px;
              margin-bottom: 10px;
              letter-spacing: 0.5px;
            }
            .info-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            .info-grid td {
              padding: 7px 10px;
              vertical-align: top;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .info-label {
              font-weight: 700;
              color: #334155;
              width: 22%;
              background-color: #f8fafc;
            }
            .info-val {
              color: #0f172a;
            }
            .item-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              margin-bottom: 16px;
              font-size: 12px;
            }
            .item-table th, .item-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
            }
            .item-table th {
              background-color: #f1f5f9;
              font-weight: 800;
              color: #1e293b;
              text-align: left;
            }
            .total-row td {
              background-color: #f0f9ff;
              font-weight: 800;
              font-size: 13px;
              color: #0369a1;
            }
            .status-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-left: 5px solid #2563eb;
              padding: 12px 16px;
              border-radius: 6px;
              margin-top: 12px;
            }
            .alert-box {
              background: #fffbeb;
              border: 1px solid #fde68a;
              color: #92400e;
              padding: 10px 14px;
              border-radius: 6px;
              font-size: 12px;
              margin-top: 10px;
              margin-bottom: 12px;
            }
            .signatures {
              margin-top: 45px;
              width: 100%;
              border-collapse: collapse;
            }
            .signatures td {
              width: 33.33%;
              text-align: center;
              vertical-align: bottom;
              padding-top: 45px;
            }
            .sig-line {
              border-top: 1px dashed #64748b;
              margin: 0 12px;
              padding-top: 6px;
              font-weight: 700;
              font-size: 11px;
              color: #334155;
            }
            .footer {
              margin-top: 35px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 10px;
              color: #64748b;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="org-title">ICMR - National Institute of Health Research</div>
                <div class="org-sub">Indian Council of Medical Research, Dept. of Health Research, Govt. of India</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <span class="ref-badge">REF: ${req.id}</span>
              </td>
            </tr>
          </table>

          <div class="section-title">1. Applicant Details</div>
          <table class="info-grid">
            <tr>
              <td class="info-label">Applicant Name</td>
              <td class="info-val"><strong>${req.name}</strong></td>
              <td class="info-label">Designation</td>
              <td class="info-val">${req.designation}</td>
            </tr>
            <tr>
              <td class="info-label">Mobile Number</td>
              <td class="info-val">${req.mobile}</td>
              <td class="info-label">Email Address</td>
              <td class="info-val">${req.email}</td>
            </tr>
            <tr>
              <td class="info-label">Submission Date</td>
              <td class="info-val">${req.submissionDate}</td>
              <td class="info-label">Budget Head</td>
              <td class="info-val"><strong>${budgetHeadDisplay}</strong></td>
            </tr>
          </table>

          <div class="section-title">2. Event Schedule & Timeline</div>
          <table class="info-grid">
            <tr>
              <td class="info-label">Event Title</td>
              <td class="info-val" colspan="3"><strong>${req.eventTitle}</strong></td>
            </tr>
            <tr>
              <td class="info-label">Event Duration</td>
              <td class="info-val"><strong>${req.startDate}</strong> to <strong>${req.endDate}</strong> (${req.durationDays} Days)</td>
              <td class="info-label">Advance Notice</td>
              <td class="info-val">
                <strong>${req.advanceDays} Days</strong> ${req.advanceDays < 25 ? '<span style="color:#b45309; font-weight:bold;">(Late Submission Notice &lt; 25 Days)</span>' : '<span style="color:#15803d; font-weight:bold;">(Standard Policy &gt;= 25 Days)</span>'}
              </td>
            </tr>
          </table>

          ${req.advanceDays < 25 && req.lateJustification ? `
            <div class="alert-box">
              <strong>The delay in submission may result in procurement outside Gem for which DHR, MoFHW seeks justification.Late Submission Justification Reason (Compulsory):</strong><br/>
              <span style="font-style: italic; margin-top: 4px; display: block;">"${req.lateJustification}"</span>
            </div>
          ` : ''}

          <div class="section-title">3. Itemized Requirement & Estimated Budget Statement</div>
          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>Item Description / Service Required</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 110px; text-align: right;">Rate / Item (₹)</th>
                <th style="width: 120px; text-align: right;">Estimate Total (₹)</th>
                <th>Remarks / Justification</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
              <tr class="total-row">
                <td colspan="4" style="text-align: right; font-weight: 800;">GRAND TOTAL ESTIMATE BUDGET:</td>
                <td style="text-align: right; font-weight: 900;">₹${(req.totalEstimateBudget || 0).toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          ${req.additionalRemark ? `
            <div style="margin-bottom: 14px;">
              <strong style="color: #334155; font-size: 11px; text-transform: uppercase;">Additional Remarks</strong>
              <div style="background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 4px; font-size: 12px;">
                ${req.additionalRemark}
              </div>
            </div>
          ` : ''}

          <div class="section-title">4.Official Sanction Status</div>
          <div class="status-box">
            <table style="width:100%; border:none; border-collapse:collapse;">
              <tr>
                <td style="border:none; padding:0; vertical-align:middle;">
                  <strong>Application Status:</strong> <span style="font-size: 14px; font-weight: 900; color: #1d4ed8; text-transform: uppercase;">${statusDisplay}</span>
                </td>
              </tr>
            </table>
            ${req.superUserRemarks ? `
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 12px; color: #1e293b;">
                <strong>Remarks / Sanction Notes:</strong><br/>
                <span style="font-weight: 500;">${req.superUserRemarks}</span>
              </div>
            ` : ''}
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

  const handleItemChange = (index: number, field: keyof RequirementItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'pricePerItem') {
      const q = Number(field === 'quantity' ? value : item.quantity) || 0;
      const p = Number(field === 'pricePerItem' ? value : item.pricePerItem) || 0;
      item.estimateTotal = q * p;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        srNo: items.length + 1,
        itemName: '',
        quantity: 1,
        pricePerItem: 0,
        estimateTotal: 0,
        remarkJustification: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, srNo: idx + 1 }));
    setItems(filtered);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'budget' | 'supporting') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      message.error('Please upload a valid PDF document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      message.error('PDF file size should be less than 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'budget') {
        setBudgetPdf({ name: file.name, data: base64 });
        message.success(`Uploaded Budget Statement: ${file.name}`);
      } else {
        setSupportingPdf({ name: file.name, data: base64 });
        message.success(`Uploaded Supporting Document: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRequest = async () => {
    if (!name.trim() || !designation.trim() || !email.trim() || !mobile.trim() || !eventTitle.trim()) {
      message.error('Please fill all compulsory details (Name, Designation, Email, Mobile, Event Title).');
      return;
    }

    if (!mobile.match(/^\d{10}$/)) {
      message.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (budgetHead === 'Other' && !otherBudgetHead.trim()) {
      message.error('Please specify the Other Budget Head details.');
      return;
    }

    if (!dates[0] || !dates[1]) {
      message.error('Please select valid Event Start Date and End Date.');
      return;
    }

    if (advanceDays < 25 && !lateJustification.trim()) {
      message.error('Advance submission days are less than 25 days. Justification Reason for late submission is compulsory.');
      return;
    }

    if (items.length === 0) {
      message.error('Please add at least 1 item in the requirement table.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        message.error(`Requirement Table Row #${i + 1} item name cannot be empty.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        designation,
        email,
        mobile,
        eventTitle,
        budgetHead,
        otherBudgetHead: budgetHead === 'Other' ? otherBudgetHead : undefined,
        startDate: startDateObj.format('YYYY-MM-DD'),
        endDate: endDateObj.format('YYYY-MM-DD'),
        durationDays,
        advanceDays,
        submissionDate: dayjs().format('YYYY-MM-DD'),
        lateJustification: advanceDays < 25 ? lateJustification : undefined,
        additionalRemark,
        budgetStatementPdf: budgetPdf?.data,
        budgetStatementFileName: budgetPdf?.name,
        supportingDocPdf: supportingPdf?.data,
        supportingDocFileName: supportingPdf?.name,
        items,
        totalEstimateBudget
      };

      const res = await apiService.submitEventRequest(payload);
      message.success('Event Requirement Request submitted successfully!');
      setSubmittedRefId(res.id);
      
      // Clear form
      setEventTitle('');
      setLateJustification('');
      setAdditionalRemark('');
      setBudgetPdf(null);
      setSupportingPdf(null);
      setItems([]);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to submit event request. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async () => {
    if (!trackMobile.trim() || !trackMobile.match(/^\d{10}$/)) {
      message.error('Please enter a valid 10-digit mobile number to search requests.');
      return;
    }

    setSearchingTrack(true);
    setHasSearched(true);
    try {
      const data = await apiService.trackEventRequestsByMobile(trackMobile.trim());
      setTrackedRequests(data || []);
    } catch (err) {
      message.error('Failed to fetch requests for this mobile number.');
    } finally {
      setSearchingTrack(false);
    }
  };

  const handleSuperUserLogin = async () => {
    if (!loginEmail || !loginPassword) {
      message.error('Please enter email and password.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await apiService.loginEventManagerSuperUser({ email: loginEmail, password: loginPassword });
      message.success(`Logged in as Event Manager Super User: ${res.user.name}`);
      setSuperUserToken(res.token);
      setSuperUserInfo(res.user);
      setIsSuperUser(true);
      fetchAdminRequests();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Invalid Event Manager Super User credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSuperUserLogout = () => {
    apiService.logoutEventManagerSuperUser();
    setIsSuperUser(false);
    setSuperUserToken(null);
    setSuperUserInfo(null);
    message.info('Logged out from Event Manager Super User session.');
  };

  const fetchAdminRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await apiService.getEventRequests();
      setAllRequests(data || []);
    } catch (err) {
      message.error('Failed to load event requirement requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const openActionModal = (req: EventRequirementRequest) => {
    setActionRequest(req);
    setNewStatus(req.status);
    setCustomStatusInput(req.customStatusText || '');
    setSuperRemarksInput(req.superUserRemarks || '');
    setActionModalVisible(true);
  };

  const handleUpdateStatusSubmit = async () => {
    if (!actionRequest) return;
    if (newStatus === 'Custom Status' && !customStatusInput.trim()) {
      message.error('Please enter text for the Custom Status.');
      return;
    }

    setUpdatingStatus(true);
    try {
      await apiService.updateEventRequestStatus(actionRequest.id, {
        status: newStatus,
        customStatusText: newStatus === 'Custom Status' ? customStatusInput : undefined,
        superUserRemarks: superRemarksInput,
        reviewedBy: superUserInfo?.name || 'Event Manager Super User'
      });
      message.success(`Updated request ${actionRequest.id} status to ${newStatus === 'Custom Status' ? customStatusInput : newStatus}`);
      setActionModalVisible(false);
      fetchAdminRequests();
      if (selectedRequest?.id === actionRequest.id) {
        setSelectedRequest(prev => prev ? {
          ...prev,
          status: newStatus,
          customStatusText: newStatus === 'Custom Status' ? customStatusInput : prev.customStatusText,
          superUserRemarks: superRemarksInput,
          reviewedBy: superUserInfo?.name || 'Event Manager Super User'
        } : null);
      }
    } catch (err) {
      message.error('Failed to update request status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await apiService.deleteEventRequest(id);
      message.success('Event requirement request deleted.');
      fetchAdminRequests();
      if (selectedRequest?.id === id) setSelectedRequest(null);
    } catch (err) {
      message.error('Failed to delete request.');
    }
  };

  const renderStatusBadge = (status: string, customText?: string) => {
    switch (status) {
      case 'Approved':
        return <Tag color="success" icon={<CheckCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">APPROVED</Tag>;
      case 'Recommended':
        return <Tag color="cyan" icon={<CheckCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">RECOMMENDED</Tag>;
      case 'In Discussion':
        return <Tag color="warning" icon={<ClockCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">IN DISCUSSION</Tag>;
      case 'Rejected':
        return <Tag color="error" icon={<CloseCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">REJECTED</Tag>;
      case 'Custom Status':
        return <Tag color="purple" icon={<InfoCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">{customText?.toUpperCase() || 'CUSTOM STATUS'}</Tag>;
      default:
        return <Tag color="gold" icon={<ClockCircleOutlined />} className="px-3 py-1 font-bold text-xs rounded-full">PENDING REVIEW</Tag>;
    }
  };

  const filteredRequests = allRequests.filter(req => {
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    const matchesQuery = !searchQuery.trim() || 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.mobile.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-400/30">
              <CalendarOutlined className="text-2xl" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white m-0">
                Event / Workshop / Seminar Requirement Portal
              </h1>
              <p className="text-xs md:text-sm text-blue-200/80 m-0 mt-0.5">
                Official Submission, Advance Duration Calculator & Event Manager Portal
              </p>
            </div>
          </div>
        </div>

        <Space className="flex-wrap">
          {isSuperUser ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
              <SafetyCertificateOutlined className="text-emerald-400 text-base" />
              <div>
                <span className="font-extrabold block text-white">{superUserInfo?.name || 'Event Manager Super User'}</span>
                <span className="text-[10px] text-emerald-300">Authorized Manager Session</span>
              </div>
              <Button size="small" type="link" danger onClick={handleSuperUserLogout} className="text-xs p-0 ml-2">
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              type="primary" 
              icon={<LockOutlined />}
              onClick={() => setActiveTab('admin')}
              className="bg-blue-600 hover:bg-blue-500 border-none font-bold text-xs h-9 rounded-xl shadow-md"
            >
              Event Manager Super User Access
            </Button>
          )}
        </Space>
      </div>

      {/* Main Tabs Navigation */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-0 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          size="large"
          className="px-4 pt-2"
          items={[
            {
              key: 'submit',
              label: (
                <span className="flex items-center gap-2 font-bold px-2">
                  <SendOutlined /> Submit New Requirement Form
                </span>
              )
            },
            {
              key: 'track',
              label: (
                <span className="flex items-center gap-2 font-bold px-2">
                  <SearchOutlined /> Track Request Status
                </span>
              )
            },
            {
              key: 'admin',
              label: (
                <span className="flex items-center gap-2 font-bold px-2">
                  <SafetyCertificateOutlined /> Event Manager Portal {isSuperUser && <Badge count={allRequests.length} className="ml-1" />}
                </span>
              )
            }
          ]}
        />

        {/* TAB 1: PUBLIC SUBMISSION FORM */}
        {activeTab === 'submit' && (
          <div className="p-4 md:p-8 space-y-6">
            {submittedRefId && (
              <Alert
                title="Requirement Form Submitted Successfully!"
                description={
                  <div className="space-y-2 mt-1 text-slate-800">
                    <p className="m-0">Your application reference ID is: <strong className="text-blue-700 text-base font-black bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{submittedRefId}</strong></p>
                    <p className="m-0 text-xs text-slate-600">You can track real-time approval status anytime using your mobile number <strong>({mobile || 'registered'})</strong> in the Track Request Status tab.</p>
                    <Button type="primary" size="small" onClick={() => { setTrackMobile(mobile); setActiveTab('track'); handleTrackSearch(); }} className="mt-2 font-bold">
                      Track Request Now
                    </Button>
                  </div>
                }
                type="success"
                showIcon
                closable
                onClose={() => setSubmittedRefId(null)}
                className="rounded-xl border-emerald-300 bg-emerald-50/90"
              />
            )}

            <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-1">
                <UserOutlined className="text-blue-600" /> Applicant & Event Basic Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 m-0">Fields marked with <span className="text-red-500 font-bold">*</span> are compulsory.</p>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input 
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="e.g. Dr. Ananya Roy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg"
                />
              </Col>

              <Col xs={24} md={6}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="e.g. Scientist D / Professor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="rounded-lg"
                />
              </Col>

              <Col xs={24} md={6}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input 
                  prefix={<MailOutlined className="text-slate-400" />}
                  placeholder="e.g. email@nihr.res.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg"
                />
              </Col>

              <Col xs={24} md={6}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input 
                  prefix={<PhoneOutlined className="text-slate-400" />}
                  placeholder="10 digit mobile"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="rounded-lg"
                />
              </Col>

              <Col xs={24} md={14}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Event / Workshop / Seminar Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  prefix={<FileTextOutlined className="text-slate-400" />}
                  placeholder="Full title of Event / Workshop / Seminar"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="rounded-lg"
                />
              </Col>

              <Col xs={24} md={10}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Budget Head <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={budgetHead} 
                  onChange={(v) => setBudgetHead(v)}
                  className="w-full rounded-lg"
                >
                  <Option value="Institutional">Institutional</Option>
                  <Option value="Project">Project</Option>
                  <Option value="Other">Other (Custom Specification)</Option>
                </Select>
              </Col>

              {budgetHead === 'Other' && (
                <Col xs={24} md={24}>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                      Specify Other Budget Head Details <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      placeholder="Specify funding agency or custom budget head details"
                      value={otherBudgetHead}
                      onChange={(e) => setOtherBudgetHead(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </Col>
              )}
            </Row>

            <Divider titlePlacement="left" className="m-0">
              <span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                🗓️ Event Dates & Advance Days Calculation
              </span>
            </Divider>

            <Row gutter={[16, 16]} className="items-center">
              <Col xs={24} md={12}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Event Schedule (Start Date to End Date) <span className="text-red-500">*</span>
                </label>
                <DatePicker.RangePicker 
                  value={dates}
                  onChange={(v) => setDates(v as any)}
                  format="DD-MM-YYYY"
                  className="w-full rounded-lg h-10"
                />
              </Col>

              <Col xs={12} md={6}>
                <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Event Duration</span>
                  <span className="text-lg font-black text-slate-800 dark:text-zinc-100">{durationDays} Days</span>
                </div>
              </Col>

              <Col xs={12} md={6}>
                <div className={`p-3 rounded-xl border text-center ${
                  advanceDays >= 25 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                }`}>
                  <span className="text-[10px] uppercase font-bold block">Advance Days</span>
                  <span className="text-lg font-black">{advanceDays} Days</span>
                </div>
              </Col>
            </Row>

            {advanceDays < 25 && (
              <Alert 
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                title={`The delay in submission may result in procurement outside Gem for which DHR, MoFHW seeks justification. So please mention your reason for delay in submission.`}
                description={
                  <div className="mt-2">
                    <TextArea 
                      rows={2}
                      placeholder="Advance submission time is < 25 days. Justification Reason for Late Requirement Submission is Compulsory."
                      value={lateJustification}
                      onChange={(e) => setLateJustification(e.target.value)}
                      className="rounded-lg bg-white dark:bg-zinc-900"
                    />
                  </div>
                }
                className="rounded-xl border-amber-300 bg-amber-50/90 dark:bg-amber-950/40"
              />
            )}

            <Divider titlePlacement="left" className="m-0">
              <span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                📋 Requirement Items Table
              </span>
            </Divider>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 text-xs rounded-xl overflow-hidden">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold uppercase">
                  <tr>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 text-center w-12">Sr.</th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 min-w-[180px]">Item Name <span className="text-red-500">*</span></th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 w-24 text-center">Qty <span className="text-red-500">*</span></th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 w-32 text-center">Price / Item (₹)</th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 w-32 text-center">Estimate Total (₹)</th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 min-w-[150px]">Remark / Justification</th>
                    <th className="p-2.5 border border-slate-200 dark:border-zinc-700 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="p-2 text-center border border-slate-200 dark:border-zinc-800 font-bold text-slate-500">
                        {item.srNo}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800">
                        <Input 
                          size="small"
                          placeholder="e.g. Honorarium / Stage Decor"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center">
                        <InputNumber 
                          size="small"
                          min={1}
                          value={item.quantity}
                          onChange={(v) => handleItemChange(index, 'quantity', v)}
                          className="w-full rounded"
                        />
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center">
                        <InputNumber 
                          size="small"
                          min={0}
                          value={item.pricePerItem}
                          onChange={(v) => handleItemChange(index, 'pricePerItem', v)}
                          className="w-full rounded"
                        />
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center font-bold text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40">
                        ₹{(item.estimateTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800">
                        <Input 
                          size="small"
                          placeholder="Optional justification"
                          value={item.remarkJustification}
                          onChange={(e) => handleItemChange(index, 'remarkJustification', e.target.value)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center">
                        <Button 
                          size="small" 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          disabled={items.length === 1}
                          onClick={() => handleRemoveItem(index)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={handleAddItem}
                className="font-bold border-blue-400 text-blue-700 dark:text-blue-300"
              >
                Add Requirement Item Row
              </Button>

              <div className="text-right flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                  Total Estimate Budget:
                </span>
                <span className="text-xl font-black text-blue-900 dark:text-blue-200 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-blue-300 shadow-sm">
                  ₹{totalEstimateBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Divider titlePlacement="left" className="m-0">
              <span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
                📎 Document Attachments (PDF Copy)
              </span>
            </Divider>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    1. Budget Statement Copy (PDF)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 m-0">Upload scanned PDF copy of approved budget statement allocation.</p>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => handleFileUpload(e, 'budget')}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {budgetPdf && (
                    <Tag color="blue" icon={<FilePdfOutlined />} className="mt-1 font-semibold">
                      {budgetPdf.name}
                    </Tag>
                  )}
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    2. Upload Supporting Document (PDF)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 m-0">Upload supporting Circular, Approval Letter, ICMR Guidelines PDF.</p>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => handleFileUpload(e, 'supporting')}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {supportingPdf && (
                    <Tag color="cyan" icon={<FilePdfOutlined />} className="mt-1 font-semibold">
                      {supportingPdf.name}
                    </Tag>
                  )}
                </div>
              </Col>

              <Col xs={24}>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Additional Remarks / Special Setup Requirements (Optional)
                </label>
                <TextArea 
                  rows={2}
                  placeholder="Enter any additional remarks, hall preferences, streaming or Audio Video setup notes..."
                  value={additionalRemark}
                  onChange={(e) => setAdditionalRemark(e.target.value)}
                  className="rounded-lg"
                />
              </Col>
            </Row>

            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <Button 
                type="primary" 
                size="large"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={handleSubmitRequest}
                className="bg-blue-600 hover:bg-blue-500 font-bold px-8 h-12 rounded-xl text-sm shadow-lg"
              >
                Submit Requirement Request & Forward to Event Manager
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: PUBLIC TRACK STATUS */}
        {activeTab === 'track' && (
          <div className="p-4 md:p-8 space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
              <h3 className="text-base font-extrabold text-white m-0 mb-1 flex items-center gap-2">
                <SearchOutlined className="text-blue-400" /> Track Application Status by Mobile Number
              </h3>
              <p className="text-xs text-slate-300 m-0 mb-4">
                Enter your 10-digit mobile number to view status, approval notes, and itemized details of all your submitted event requirement applications.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <Input 
                  size="large"
                  prefix={<PhoneOutlined className="text-slate-400" />}
                  placeholder="Enter 10 digit mobile number..."
                  maxLength={10}
                  value={trackMobile}
                  onChange={(e) => setTrackMobile(e.target.value.replace(/\D/g, ''))}
                  onPressEnter={handleTrackSearch}
                  className="rounded-xl text-slate-900 font-bold"
                />
                <Button 
                  type="primary" 
                  size="large"
                  icon={<SearchOutlined />}
                  loading={searchingTrack}
                  onClick={handleTrackSearch}
                  className="bg-blue-600 hover:bg-blue-500 font-bold rounded-xl h-10 sm:h-auto px-6"
                >
                  Search Status
                </Button>
              </div>
            </div>

            {hasSearched && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                    Search Results ({trackedRequests.length} Applications Found)
                  </h4>
                  {trackedRequests.length > 0 && (
                    <Button size="small" icon={<ReloadOutlined />} onClick={handleTrackSearch} className="rounded-lg text-xs font-semibold">
                      Refresh Status
                    </Button>
                  )}
                </div>

                {trackedRequests.length === 0 ? (
                  <Card className="rounded-2xl border border-slate-200 text-center py-8">
                    <Empty description={`No event requirement requests found for mobile number ${trackMobile}.`} />
                  </Card>
                ) : (
                  trackedRequests.map((req) => (
                    <Card key={req.id} className="rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-base text-blue-900 dark:text-blue-300">{req.id}</span>
                              <Tag color="blue" className="font-bold">{req.budgetHead} Budget</Tag>
                              <span className="text-xs text-slate-400">Submitted: {req.submissionDate}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 m-0 mt-1">{req.eventTitle}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {renderStatusBadge(req.status, req.customStatusText)}
                            <Button 
                              size="small" 
                              type="primary"
                              icon={<PrinterOutlined />}
                              onClick={() => handlePrintRequest(req)}
                              className="text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700"
                            >
                              Print Application
                            </Button>
                          </div>
                        </div>

                        {/* Applicant Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                          <div>
                            <span className="text-slate-400 block font-semibold">Applicant</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{req.name} ({req.designation})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Event Schedule</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{req.startDate} to {req.endDate} ({req.durationDays} Days)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Advance Submission</span>
                            <span className={`font-bold ${req.advanceDays < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{req.advanceDays} Days</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Total Estimate Budget</span>
                            <span className="font-black text-blue-800 dark:text-blue-300 text-sm">₹{req.totalEstimateBudget?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Late Justification if advance < 25 */}
                        {req.advanceDays < 25 && req.lateJustification && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                            <span className="font-extrabold block mb-0.5">Late Submission Justification (Less than 25 Days Advance):</span>
                            <p className="m-0 italic">{req.lateJustification}</p>
                          </div>
                        )}

                        {/* Event Manager Super User Remarks */}
                        {req.superUserRemarks && (
                          <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 mb-1">
                              <SafetyCertificateOutlined className="text-blue-600" />
                              Event Manager Remarks ({req.reviewedBy || 'Event Manager Super User'}):
                            </div>
                            <p className="m-0 text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">{req.superUserRemarks}</p>
                          </div>
                        )}

                        {/* Itemized Table */}
                        <div>
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">Requirement Items Breakdown</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 text-xs rounded-lg overflow-hidden">
                              <thead className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                                <tr>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700 text-center w-10">#</th>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700">Item Description</th>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700 text-center">Qty</th>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700 text-center">Price / Item</th>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700 text-center">Estimate Total</th>
                                  <th className="p-2 border border-slate-200 dark:border-zinc-700">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {req.items?.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center text-slate-500 font-bold">{idx + 1}</td>
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 font-semibold text-slate-800 dark:text-zinc-200">{item.itemName}</td>
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center">{item.quantity}</td>
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center">₹{item.pricePerItem?.toLocaleString('en-IN')}</td>
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 text-center font-bold text-blue-700 dark:text-blue-300">₹{item.estimateTotal?.toLocaleString('en-IN')}</td>
                                    <td className="p-2 border border-slate-200 dark:border-zinc-800 text-slate-500 italic">{item.remarkJustification || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Attachments */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                          {req.budgetStatementPdf && (
                            <Button 
                              size="small" 
                              icon={<FilePdfOutlined className="text-red-500" />}
                              onClick={() => setPdfModal({ visible: true, title: 'Budget Statement Copy PDF', url: req.budgetStatementPdf! })}
                              className="text-xs font-bold rounded-lg"
                            >
                              View Budget Statement PDF
                            </Button>
                          )}
                          {req.supportingDocPdf && (
                            <Button 
                              size="small" 
                              icon={<FilePdfOutlined className="text-blue-500" />}
                              onClick={() => setPdfModal({ visible: true, title: 'Supporting Document PDF', url: req.supportingDocPdf! })}
                              className="text-xs font-bold rounded-lg"
                            >
                              View Supporting Document PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EVENT MANAGER SUPER USER PORTAL */}
        {activeTab === 'admin' && (
          <div className="p-4 md:p-8 space-y-6">
            {!isSuperUser ? (
              <div className="max-w-md mx-auto my-8 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 rounded-2xl mx-auto flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl border border-blue-200 shadow-inner">
                    <SafetyCertificateOutlined />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Event Manager Super User Authentication</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Restricted portal for authorized Event Managers to review, update status, and add remarks.
                  </p>
                </div>

               

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Super User Email</label>
                    <Input 
                      prefix={<MailOutlined className="text-slate-400" />}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter Email"
                      className="rounded-lg h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Password</label>
                    <Input.Password 
                      prefix={<LockOutlined className="text-slate-400" />}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onPressEnter={handleSuperUserLogin}
                      className="rounded-lg h-10"
                    />
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    loading={loggingIn}
                    onClick={handleSuperUserLogin}
                    className="bg-blue-600 hover:bg-blue-500 font-bold h-11 rounded-xl shadow-md text-sm mt-2"
                  >
                    Authenticate & Access Event Manager Portal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Header */}
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60">
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Submissions</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-zinc-100">{allRequests.length}</span>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-2xl border-amber-200 bg-amber-50/50 dark:bg-amber-950/30">
                      <span className="text-xs font-bold text-amber-700 uppercase block mb-1">Pending Review</span>
                      <span className="text-2xl font-black text-amber-800 dark:text-amber-300">
                        {allRequests.filter(r => r.status === 'Pending').length}
                      </span>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30">
                      <span className="text-xs font-bold text-emerald-700 uppercase block mb-1">Approved</span>
                      <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                        {allRequests.filter(r => r.status === 'Approved').length}
                      </span>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card className="rounded-2xl border-blue-200 bg-blue-50/50 dark:bg-blue-950/30">
                      <span className="text-xs font-bold text-blue-700 uppercase block mb-1">In Discussion / Custom</span>
                      <span className="text-2xl font-black text-blue-800 dark:text-blue-300">
                        {allRequests.filter(r => r.status === 'In Discussion' || r.status === 'Custom Status' || r.status === 'Recommended').length}
                      </span>
                    </Card>
                  </Col>
                </Row>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row justify-between gap-3 bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase">Filter Status:</span>
                    <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} className="w-40">
                      <Option value="All">All Statuses</Option>
                      <Option value="Pending">Pending</Option>
                      <Option value="Approved">Approved</Option>
                      <Option value="Recommended">Recommended</Option>
                      <Option value="In Discussion">In Discussion</Option>
                      <Option value="Rejected">Rejected</Option>
                      <Option value="Custom Status">Custom Status</Option>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Search ID, Applicant, Title..."
                      prefix={<SearchOutlined className="text-slate-400" />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-72 rounded-lg"
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchAdminRequests} className="rounded-lg font-bold">
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Requests Data Table */}
                <Card className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-0 overflow-hidden">
                  <Table 
                    dataSource={filteredRequests}
                    loading={loadingRequests}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    columns={[
                      {
                        title: 'Ref ID',
                        dataIndex: 'id',
                        key: 'id',
                        render: (id: string) => <span className="font-black text-blue-700 dark:text-blue-300 text-xs">{id}</span>
                      },
                      {
                        title: 'Applicant Details',
                        key: 'applicant',
                        render: (rec: EventRequirementRequest) => (
                          <div>
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-100 block">{rec.name}</span>
                            <span className="text-[11px] text-slate-500 block">{rec.designation}</span>
                            <span className="text-[11px] text-slate-400 font-mono">📱 {rec.mobile}</span>
                          </div>
                        )
                      },
                      {
                        title: 'Event Title & Budget Head',
                        key: 'event',
                        render: (rec: EventRequirementRequest) => (
                          <div className="max-w-xs">
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-100 block line-clamp-2">{rec.eventTitle}</span>
                            <Tag color="blue" className="text-[10px] font-bold mt-1">
                              {rec.budgetHead === 'Other' ? rec.otherBudgetHead || 'Other' : rec.budgetHead}
                            </Tag>
                          </div>
                        )
                      },
                      {
                        title: 'Advance & Duration',
                        key: 'advance',
                        render: (rec: EventRequirementRequest) => (
                          <div className="text-xs">
                            <span className="block text-slate-600 font-medium">{rec.startDate} to {rec.endDate}</span>
                            <span className="text-[11px] text-slate-400 block">{rec.durationDays} Days Duration</span>
                            <span className={`text-[11px] font-bold ${rec.advanceDays < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              Advance: {rec.advanceDays} Days {rec.advanceDays < 25 && '(Late)'}
                            </span>
                          </div>
                        )
                      },
                      {
                        title: 'Total Budget',
                        dataIndex: 'totalEstimateBudget',
                        key: 'totalEstimateBudget',
                        render: (val: number) => <span className="font-black text-xs text-blue-900 dark:text-blue-200">₹{(val || 0).toLocaleString('en-IN')}</span>
                      },
                      {
                        title: 'Current Status',
                        key: 'status',
                        render: (rec: EventRequirementRequest) => renderStatusBadge(rec.status, rec.customStatusText)
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (rec: EventRequirementRequest) => (
                          <Space>
                            <Button 
                              size="small" 
                              type="primary" 
                              onClick={() => setSelectedRequest(rec)}
                              className="bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg"
                            >
                              View Details
                            </Button>
                            <Button 
                              size="small" 
                              icon={<PrinterOutlined />}
                              onClick={() => handlePrintRequest(rec)}
                              className="text-xs font-bold rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50"
                              title="Print Application"
                            >
                              Print
                            </Button>
                            <Button 
                              size="small" 
                              type="primary"
                              onClick={() => openActionModal(rec)}
                              className="bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg"
                            >
                              Update Status
                            </Button>
                            <Popconfirm title="Delete request?" onConfirm={() => handleDeleteRequest(rec.id)}>
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
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
        )}
      </Card>

      {/* DETAILED VIEW MODAL FOR EVENT MANAGER */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span>Event Requirement Request Details - {selectedRequest?.id}</span>
          </div>
        }
        open={!!selectedRequest}
        onCancel={() => setSelectedRequest(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedRequest(null)}>Close</Button>,
          selectedRequest && (
            <Button 
              key="print" 
              icon={<PrinterOutlined />} 
              onClick={() => handlePrintRequest(selectedRequest)} 
              className="font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Print Application Form
            </Button>
          ),
          selectedRequest && (
            <Button key="action" type="primary" onClick={() => { const req = selectedRequest; setSelectedRequest(null); openActionModal(req); }} className="bg-blue-600 font-bold">
              Update Status & Add Remarks
            </Button>
          )
        ]}
        width={850}
        destroyOnHidden
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
              <div>
                <span className="text-slate-400 block font-semibold">Current Application Status</span>
                <div className="mt-1">{renderStatusBadge(selectedRequest.status, selectedRequest.customStatusText)}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-semibold">Total Estimate Budget</span>
                <span className="text-lg font-black text-blue-800 dark:text-blue-300">₹{selectedRequest.totalEstimateBudget?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Row gutter={[12, 12]} className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Applicant Name</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.name}</span>
              </Col>
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Designation</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.designation}</span>
              </Col>
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Email</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.email}</span>
              </Col>
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Mobile</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.mobile}</span>
              </Col>
              <Col xs={24} sm={12}>
                <span className="text-slate-400 block font-semibold">Event Title</span>
                <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedRequest.eventTitle}</span>
              </Col>
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Budget Head</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {selectedRequest.budgetHead === 'Other' ? selectedRequest.otherBudgetHead || 'Other' : selectedRequest.budgetHead}
                </span>
              </Col>
              <Col xs={12} sm={6}>
                <span className="text-slate-400 block font-semibold">Submission Date</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.submissionDate}</span>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={12} sm={8}>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <span className="text-slate-400 block font-semibold">Event Dates</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.startDate} to {selectedRequest.endDate}</span>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <span className="text-slate-400 block font-semibold">Calculated Duration</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRequest.durationDays} Days</span>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className={`p-2.5 rounded-lg border ${selectedRequest.advanceDays < 25 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
                  <span className="block font-semibold">Advance Submission Days</span>
                  <span className="font-black text-sm">{selectedRequest.advanceDays} Days {selectedRequest.advanceDays < 25 ? '(Late Submission)' : '(Normal)'}</span>
                </div>
              </Col>
            </Row>

            {selectedRequest.advanceDays < 25 && selectedRequest.lateJustification && (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-300 text-amber-900 dark:text-amber-200">
                <span className="font-extrabold block mb-0.5">Late Submission Justification (Less than 25 Days Advance):</span>
                <p className="m-0 italic">{selectedRequest.lateJustification}</p>
              </div>
            )}

            {selectedRequest.superUserRemarks && (
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 text-blue-900 dark:text-blue-200">
                <span className="font-extrabold block mb-0.5">Event Manager Remarks ({selectedRequest.reviewedBy}):</span>
                <p className="m-0 font-medium">{selectedRequest.superUserRemarks}</p>
              </div>
            )}

            {/* Items Table */}
            <div>
              <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5 uppercase tracking-wider">Requirement Table Items</span>
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 text-xs">
                <thead className="bg-slate-100 dark:bg-zinc-800 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-200 text-center">#</th>
                    <th className="p-2 border border-slate-200">Item Name</th>
                    <th className="p-2 border border-slate-200 text-center">Qty</th>
                    <th className="p-2 border border-slate-200 text-center">Price/Item</th>
                    <th className="p-2 border border-slate-200 text-center">Estimate Total</th>
                    <th className="p-2 border border-slate-200">Remark / Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-slate-200 text-center font-bold">{i + 1}</td>
                      <td className="p-2 border border-slate-200 font-semibold">{item.itemName}</td>
                      <td className="p-2 border border-slate-200 text-center">{item.quantity}</td>
                      <td className="p-2 border border-slate-200 text-center">₹{item.pricePerItem?.toLocaleString('en-IN')}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold text-blue-700">₹{item.estimateTotal?.toLocaleString('en-IN')}</td>
                      <td className="p-2 border border-slate-200 italic text-slate-500">{item.remarkJustification || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PDF Attachments */}
            <div className="flex gap-2">
              {selectedRequest.budgetStatementPdf && (
                <Button 
                  icon={<FilePdfOutlined className="text-red-500" />}
                  onClick={() => setPdfModal({ visible: true, title: 'Budget Statement Copy PDF', url: selectedRequest.budgetStatementPdf! })}
                  className="font-bold text-xs"
                >
                  View Budget Statement Copy PDF
                </Button>
              )}
              {selectedRequest.supportingDocPdf && (
                <Button 
                  icon={<FilePdfOutlined className="text-blue-500" />}
                  onClick={() => setPdfModal({ visible: true, title: 'Supporting Document PDF', url: selectedRequest.supportingDocPdf! })}
                  className="font-bold text-xs"
                >
                  View Supporting Document PDF
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* UPDATE STATUS & REMARKS MODAL */}
      <Modal
        title={`Update Status for Request ID: ${actionRequest?.id}`}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setActionModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={updatingStatus} onClick={handleUpdateStatusSubmit} className="bg-blue-600 font-bold">
            Save Status & Remarks
          </Button>
        ]}
        destroyOnHidden
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Select Request Status <span className="text-red-500">*</span>
            </label>
            <Select 
              value={newStatus} 
              onChange={(v) => setNewStatus(v as any)} 
              className="w-full"
            >
              <Option value="Approved">Approved</Option>
              <Option value="Recommended">Recommended</Option>
              <Option value="In Discussion">In Discussion</Option>
              <Option value="Rejected">Rejected</Option>
              <Option value="Custom Status">Other Custom Status</Option>
              <Option value="Pending">Pending</Option>
            </Select>
          </div>

          {newStatus === 'Custom Status' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                Enter Custom Status Text <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="e.g. Sent to Finance Division / Pending Committee Verification"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                className="rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
              Event Manager Remarks / Notes
            </label>
            <TextArea 
              rows={3}
              placeholder="Enter official remarks, sanction notes, or reasons for decision..."
              value={superRemarksInput}
              onChange={(e) => setSuperRemarksInput(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
      </Modal>

      {/* PDF PREVIEW MODAL */}
      <Modal
        title={pdfModal.title}
        open={pdfModal.visible}
        onCancel={() => setPdfModal({ visible: false, title: '', url: '' })}
        footer={[
          <Button key="download" type="primary" onClick={() => {
            const a = document.createElement('a');
            a.href = pdfModal.url;
            a.download = `${pdfModal.title.replace(/\s+/g, '_')}.pdf`;
            a.click();
          }}>
            Download Document
          </Button>,
          <Button key="close" onClick={() => setPdfModal({ visible: false, title: '', url: '' })}>Close</Button>
        ]}
        width={800}
        destroyOnHidden
      >
        <div className="h-[550px] w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
          {pdfModal.url.startsWith('data:application/pdf') || pdfModal.url.startsWith('/uploads/') ? (
            <iframe src={pdfModal.url} title="PDF Document" className="w-full h-full border-none" />
          ) : (
            <div className="text-center p-6 space-y-2">
              <FilePdfOutlined className="text-4xl text-red-500" />
              <p className="text-sm font-bold text-slate-700">Scanned Document Copy Available</p>
              <Button type="primary" size="small" onClick={() => window.open(pdfModal.url, '_blank')}>
                Open in New Window
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
