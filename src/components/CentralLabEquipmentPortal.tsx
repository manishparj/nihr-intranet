import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Input,
  Form,
  Row,
  Col,
  Tag,
  Tooltip,
  InputNumber,
  App
} from 'antd';
import {
  ExperimentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  Equipment,
  PublicEquipment,
  LabApplicant,
  PublicApplicantSummary,
  EquipmentBooking,
  LabActivityLog,
  LabSuperUser,
  EquipmentDocument,
  EquipmentPhoto
} from '../types/labEquipment';
import { LabEquipmentApi } from '../services/labEquipmentApi';

// Modular UI Components
import { PublicDirectoryTab } from './lab-equipment/PublicDirectoryTab';
import { BookingTab } from './lab-equipment/BookingTab';
import { CheckStatusTab } from './lab-equipment/CheckStatusTab';
import { AdminEquipmentTab } from './lab-equipment/AdminEquipmentTab';
import { AdminApplicantTab } from './lab-equipment/AdminApplicantTab';
import { AdminBookingTab } from './lab-equipment/AdminBookingTab';
import { AdminActivityLogsTab } from './lab-equipment/AdminActivityLogsTab';
import { AdminLogBookTab } from './lab-equipment/AdminLogBookTab';

// Modular Modal Components
import { PublicEquipmentDetailModal } from './lab-equipment/PublicEquipmentDetailModal';
import { BookingReceiptModal } from './lab-equipment/BookingReceiptModal';
import { PrintableLogBookModal } from './lab-equipment/PrintableLogBookModal';
import { CsvImportModal } from './lab-equipment/CsvImportModal';
import { SecretCodeModal } from './lab-equipment/SecretCodeModal';
import { PhotoLightboxModal } from './lab-equipment/PhotoLightboxModal';
import { EquipmentEditModal } from './lab-equipment/EquipmentEditModal';
import { ApplicantEditModal } from './lab-equipment/ApplicantEditModal';
import { ReviewBookingModal } from './lab-equipment/ReviewBookingModal';

import {
  CATEGORIES,
  LOCATIONS,
  OPERATIONAL_STATUSES,
  FUNDING_AGENCIES
} from './lab-equipment/constants';

export function CentralLabEquipmentPortal() {
  const { message } = App.useApp();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('lab_portal_active_tab') || 'directory';
  });
  const handleSetActiveTab = (key: string) => {
    setActiveTab(key);
    localStorage.setItem('lab_portal_active_tab', key);
  };

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Public Catalog State
  const [publicEquipments, setPublicEquipments] = useState<PublicEquipment[]>([]);
  const [loadingPublicEquipments, setLoadingPublicEquipments] = useState<boolean>(false);
  const [searchDirectory, setSearchDirectory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPublicEquipment, setSelectedPublicEquipment] = useState<PublicEquipment | null>(null);

  // Booking Form State
  const [bookingForm] = Form.useForm();
  const [publicApplicants, setPublicApplicants] = useState<PublicApplicantSummary[]>([]);
  const [selectedBookingApplicant, setSelectedBookingApplicant] = useState<PublicApplicantSummary | null>(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [bookingCaptcha, setBookingCaptcha] = useState<{ captchaId: string; question: string } | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<EquipmentBooking | null>(null);

  // Check Status State
  const [statusMobile, setStatusMobile] = useState<string>('');
  const [statusSecretCode, setStatusSecretCode] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [statusResults, setStatusResults] = useState<{ applicantName: string | null; bookings: EquipmentBooking[] } | null>(null);
  const [printableBooking, setPrintableBooking] = useState<EquipmentBooking | null>(null);

  // Super Admin Panel State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('lab_equipment_admin_token'));
  const [currentAdminUser, setCurrentAdminUser] = useState<LabSuperUser | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<string>(() => {
    return localStorage.getItem('lab_portal_admin_sub_tab') || 'equipments';
  });
  const handleSetAdminSubTab = (key: string) => {
    setAdminSubTab(key);
    localStorage.setItem('lab_portal_admin_sub_tab', key);
  };

  const [adminLoginForm] = Form.useForm();
  const [adminCaptcha, setAdminCaptcha] = useState<{ captchaId: string; question: string } | null>(null);
  const [adminLoginLoading, setAdminLoginLoading] = useState<boolean>(false);

  // Admin Data State
  const [adminEquipments, setAdminEquipments] = useState<Equipment[]>([]);
  const [loadingAdminEquipments, setLoadingAdminEquipments] = useState<boolean>(false);
  const [adminApplicants, setAdminApplicants] = useState<LabApplicant[]>([]);
  const [adminBookings, setAdminBookings] = useState<EquipmentBooking[]>([]);
  const [adminActivityLogs, setAdminActivityLogs] = useState<LabActivityLog[]>([]);
  const [adminSearchEquipments, setAdminSearchEquipments] = useState<string>('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');

  // Admin Modals State
  const [equipmentModalVisible, setEquipmentModalVisible] = useState<boolean>(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentForm] = Form.useForm();
  const [equipmentPhotos, setEquipmentPhotos] = useState<EquipmentPhoto[]>([]);
  const [equipmentDocs, setEquipmentDocs] = useState<EquipmentDocument[]>([]);
  const [viewEquipmentDetail, setViewEquipmentDetail] = useState<Equipment | null>(null);

  // CSV Bulk Import State
  const [csvImportModalVisible, setCsvImportModalVisible] = useState<boolean>(false);
  const [parsedCsvEquipments, setParsedCsvEquipments] = useState<Partial<Equipment>[]>([]);
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [importingCsv, setImportingCsv] = useState<boolean>(false);

  // Photo Lightbox State
  const [photoPreviewModal, setPhotoPreviewModal] = useState<{ visible: boolean; url: string; title: string } | null>(null);

  // Applicant Modal State
  const [applicantModalVisible, setApplicantModalVisible] = useState<boolean>(false);
  const [editingApplicant, setEditingApplicant] = useState<LabApplicant | null>(null);
  const [applicantForm] = Form.useForm();
  const [newCodeModalData, setNewCodeModalData] = useState<{ name: string; mobile: string; code: string } | null>(null);

  // Booking Review Modal State
  const [reviewBookingModalVisible, setReviewBookingModalVisible] = useState<boolean>(false);
  const [reviewingBooking, setReviewingBooking] = useState<EquipmentBooking | null>(null);
  const [reviewForm] = Form.useForm();
  const [savingReview, setSavingReview] = useState<boolean>(false);

  // Equipment Movement & Activity Log Book State
  const [selectedLogEquipmentId, setSelectedLogEquipmentId] = useState<string>('all');
  const [selectedLogStatus, setSelectedLogStatus] = useState<string>('all');
  const [printableLogBookModal, setPrintableLogBookModal] = useState<boolean>(false);
  const [logSearch, setLogSearch] = useState<string>('');

  // Initial Data Loads
  useEffect(() => {
    localStorage.setItem('nihr_current_key', 'lab-equipment');
    loadPublicEquipments();
    loadPublicApplicants();
    loadBookingCaptcha();
    loadAdminCaptcha();

    if (adminToken) {
      verifyAdminToken(adminToken);
    }
  }, []);

  useEffect(() => {
    if (adminToken && currentAdminUser) {
      loadAdminData();
    }
  }, [adminToken, currentAdminUser]);

  const loadPublicEquipments = async () => {
    setLoadingPublicEquipments(true);
    try {
      const data = await LabEquipmentApi.getPublicEquipments();
      setPublicEquipments(data);
    } catch (e: any) {
      message.error(e.message || 'Failed to load public directory');
    } finally {
      setLoadingPublicEquipments(false);
    }
  };

  const loadPublicApplicants = async () => {
    try {
      const data = await LabEquipmentApi.getPublicApplicants();
      setPublicApplicants(data);
    } catch (e) {
      console.error('Failed to load public applicants');
    }
  };

  const loadBookingCaptcha = async () => {
    try {
      const data = await LabEquipmentApi.getCaptcha();
      setBookingCaptcha(data);
    } catch (e) {
      console.error('Captcha error');
    }
  };

  const loadAdminCaptcha = async () => {
    try {
      const data = await LabEquipmentApi.getCaptcha();
      setAdminCaptcha(data);
    } catch (e) {
      console.error('Admin captcha error');
    }
  };

  const verifyAdminToken = async (token: string) => {
    try {
      const res = await LabEquipmentApi.getAdminMe(token);
      setCurrentAdminUser(res.user);
    } catch (e) {
      handleAdminLogout();
    }
  };

  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoadingAdminEquipments(true);
    try {
      const [eqs, apps, bks, logs] = await Promise.all([
        LabEquipmentApi.getAdminEquipments(adminToken),
        LabEquipmentApi.getAdminApplicants(adminToken),
        LabEquipmentApi.getAdminBookings(adminToken),
        LabEquipmentApi.getAdminActivityLogs(adminToken)
      ]);
      setAdminEquipments(eqs);
      setAdminApplicants(apps);
      setAdminBookings(bks);
      setAdminActivityLogs(logs);
    } catch (e: any) {
      message.error('Failed to load admin management data');
    } finally {
      setLoadingAdminEquipments(false);
    }
  };

  const handleAdminLogin = async (values: any) => {
    if (!adminCaptcha) {
      message.error('Captcha not ready');
      return;
    }
    setAdminLoginLoading(true);
    try {
      const res = await LabEquipmentApi.adminLogin(
        values.email,
        values.password,
        adminCaptcha.captchaId,
        values.captchaAnswer
      );
      localStorage.setItem('lab_equipment_admin_token', res.token);
      setAdminToken(res.token);
      setCurrentAdminUser(res.user);
      handleSetActiveTab('admin');
      message.success(`Welcome Super Admin, ${res.user.name}`);
      adminLoginForm.resetFields();
    } catch (e: any) {
      message.error(e.message || 'Login failed');
      loadAdminCaptcha();
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setAdminLoginLoading(true);
    try {
      let cap = adminCaptcha;
      if (!cap) {
        cap = await LabEquipmentApi.getCaptcha();
        setAdminCaptcha(cap);
      }
      let answer = '10';
      if (cap && cap.question) {
        const match = cap.question.match(/What is (\d+)\s*\+\s*(\d+)\?/);
        if (match) {
          answer = (parseInt(match[1], 10) + parseInt(match[2], 10)).toString();
        }
      }
      const res = await LabEquipmentApi.adminLogin(
        '',
        '',
        cap.captchaId,
        answer
      );
      localStorage.setItem('lab_equipment_admin_token', res.token);
      setAdminToken(res.token);
      setCurrentAdminUser(res.user);
      handleSetActiveTab('admin');
      message.success(`Authenticated as Super Admin: ${res.user.name}`);
    } catch (e: any) {
      message.error(e.message || 'Quick login failed');
      loadAdminCaptcha();
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('lab_equipment_admin_token');
    setAdminToken(null);
    setCurrentAdminUser(null);
    message.info('Logged out from Lab Equipment Super Admin session');
  };

  // Quick Action from Public Directory to Booking
  const handleQuickBook = (eq: PublicEquipment) => {
    setSelectedEquipmentIds([eq.id]);
    bookingForm.setFieldsValue({ equipmentIds: [eq.id] });
    handleSetActiveTab('booking');
    message.info(`Selected "${eq.name}". Please complete applicant verification to submit.`);
  };

  // Submit Booking Request
  const handleSubmitBooking = async (values: any) => {
    if (!bookingCaptcha) {
      message.error('Captcha not loaded');
      return;
    }

    if (!values.dateRange || values.dateRange.length !== 2) {
      message.error('Please select both From and To Date & Time');
      return;
    }

    setSubmittingBooking(true);
    try {
      const fromDateTime = values.dateRange[0].format('YYYY-MM-DD HH:mm');
      const toDateTime = values.dateRange[1].format('YYYY-MM-DD HH:mm');

      const res = await LabEquipmentApi.submitBooking({
        applicantName: selectedBookingApplicant?.name || values.applicantName,
        mobile: values.mobile,
        secretCode: values.secretCode,
        equipmentIds: values.equipmentIds,
        fromDateTime,
        toDateTime,
        purposeRemark: values.purposeRemark,
        captchaId: bookingCaptcha.captchaId,
        captchaAnswer: values.captchaAnswer
      });

      message.success('Booking Request Submitted Successfully!');
      setBookingSuccessData(res.booking);
      bookingForm.resetFields();
      setSelectedEquipmentIds([]);
      setSelectedBookingApplicant(null);
      loadBookingCaptcha();
      if (adminToken) loadAdminData();
    } catch (e: any) {
      message.error(e.message || 'Booking submission failed');
      loadBookingCaptcha();
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Check Booking Status
  const handleCheckStatus = async () => {
    if (!statusMobile || statusMobile.trim().length < 10) {
      message.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setCheckingStatus(true);
    try {
      const data = await LabEquipmentApi.checkBookingStatus(statusMobile.trim(), statusSecretCode.trim() || undefined);
      setStatusResults(data);
      if (data.bookings.length === 0) {
        message.info('No booking records found for this mobile number.');
      } else {
        message.success(`Found ${data.bookings.length} booking request(s).`);
      }
    } catch (e: any) {
      message.error(e.message || 'Status search failed');
      setStatusResults(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Admin: Open Equipment Create/Edit Modal
  const openEquipmentModal = (record?: Equipment) => {
    if (record) {
      setEditingEquipment(record);
      setEquipmentPhotos(record.photos || []);
      setEquipmentDocs(record.documents || []);

      const isKnownLocation = LOCATIONS.filter(l => l !== 'Other').includes(record.location || '');
      const locationSelect = isKnownLocation ? (record.location || 'Central Laboratory') : 'Other';
      const locationOther = isKnownLocation ? '' : (record.location || '');

      const isKnownCategory = CATEGORIES.filter(c => c !== 'Other').includes(record.category || '');
      const categorySelect = isKnownCategory ? (record.category || 'Research Infrastructure') : 'Other';
      const categoryOther = isKnownCategory ? '' : (record.category || '');

      const isKnownStatus = OPERATIONAL_STATUSES.filter(s => s !== 'Other').includes(record.operationalStatus || '');
      const operationalStatusSelect = isKnownStatus ? (record.operationalStatus || 'Working') : 'Other';
      const operationalStatusOther = isKnownStatus ? '' : (record.operationalStatus || '');

      const isKnownAgency = FUNDING_AGENCIES.filter(f => f !== 'Other').includes(record.fundingAgencyType || '');
      const fundingAgencyType = isKnownAgency ? record.fundingAgencyType : (record.fundingAgencyType ? 'Other' : 'Govt');
      const fundingAgencyOther = isKnownAgency ? '' : (record.fundingAgencyType || '');

      equipmentForm.setFieldsValue({
        ...record,
        locationSelect,
        locationOther,
        categorySelect,
        categoryOther,
        operationalStatusSelect,
        operationalStatusOther,
        fundingAgencyType,
        fundingAgencyOther,
        currentLocation: record.currentLocation || record.location || '',
        basicCost: record.basicCost !== undefined ? String(record.basicCost) : '',
        alertEmails: record.alertEmails ? record.alertEmails.join(', ') : 'harvinders.hq@icmr.gov.in',
        warrantyEndDate: record.warrantyEndDate ? dayjs(record.warrantyEndDate) : null,
        amcEndDate: record.amcEndDate ? dayjs(record.amcEndDate) : null
      });
    } else {
      setEditingEquipment(null);
      setEquipmentPhotos([]);
      setEquipmentDocs([]);
      equipmentForm.resetFields();
      equipmentForm.setFieldsValue({
        locationSelect: 'Central Laboratory',
        locationOther: '',
        categorySelect: 'Research Infrastructure',
        categoryOther: '',
        operationalStatusSelect: 'Working',
        operationalStatusOther: '',
        fundingAgencyType: 'Govt',
        fundingAgencyOther: '',
        departmentName: 'Central Instrumentation Facility (CIF)',
        facilityName: 'Analytical Core Facility',
        basicCost: '',
        yearOfPurchase: dayjs().year().toString(),
        alertEmails: 'harvinders.hq@icmr.gov.in'
      });
    }
    setEquipmentModalVisible(true);
  };

  // Admin: Save Equipment (Full CRUD)
  const handleSaveEquipment = async () => {
    if (!adminToken) return;
    try {
      const values = await equipmentForm.validateFields();

      const location = values.locationSelect === 'Other'
        ? (values.locationOther?.trim() || 'Other')
        : (values.locationSelect || 'Central Laboratory');

      const category = values.categorySelect === 'Other'
        ? (values.categoryOther?.trim() || 'Other')
        : (values.categorySelect || 'Research Infrastructure');

      const operationalStatus = values.operationalStatusSelect === 'Other'
        ? (values.operationalStatusOther?.trim() || 'Other')
        : (values.operationalStatusSelect || 'Working');

      const fundingAgencyType = values.fundingAgencyType === 'Other'
        ? (values.fundingAgencyOther?.trim() || 'Other')
        : (values.fundingAgencyType || 'Govt');

      let alertEmails: string[] = ['harvinders.hq@icmr.gov.in'];
      if (typeof values.alertEmails === 'string') {
        alertEmails = values.alertEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
      } else if (Array.isArray(values.alertEmails)) {
        alertEmails = values.alertEmails;
      }
      if (alertEmails.length === 0) alertEmails = ['harvinders.hq@icmr.gov.in'];

      const payload = {
        name: values.name.trim(),
        approvedAbbreviation: values.approvedAbbreviation?.trim() || '',
        category,
        operationalStatus,
        location,
        currentLocation: values.currentLocation?.trim() || location,
        make: values.make?.trim() || '',
        model: values.model?.trim() || '',
        serialNo: values.serialNo?.trim() || '',
        departmentName: values.departmentName?.trim() || 'Central Instrumentation Facility (CIF)',
        facilityName: values.facilityName?.trim() || '',
        yearOfPurchase: values.yearOfPurchase ? String(values.yearOfPurchase).trim() : String(new Date().getFullYear()),
        basicCost: values.basicCost !== undefined && String(values.basicCost).trim() !== '' ? values.basicCost : undefined,
        fundingAgencyType,
        fundingAgencyDetails: values.fundingAgencyDetails?.trim() || '',
        warrantyEndDate: values.warrantyEndDate ? values.warrantyEndDate.format('YYYY-MM-DD') : '',
        amcEndDate: values.amcEndDate ? values.amcEndDate.format('YYYY-MM-DD') : '',
        prismServiceCategory: values.prismServiceCategory?.trim() || '',
        alertEmails,
        purposeApplication: values.purposeApplication?.trim() || '',
        description: values.description?.trim() || '',
        photos: equipmentPhotos,
        documents: equipmentDocs
      };

      if (editingEquipment) {
        await LabEquipmentApi.updateEquipment(editingEquipment.id, payload, adminToken);
        message.success(`Equipment "${payload.name}" updated successfully.`);
      } else {
        await LabEquipmentApi.createEquipment(payload, adminToken);
        message.success(`New equipment "${payload.name}" added to master directory.`);
      }

      setEquipmentModalVisible(false);
      loadAdminData();
      loadPublicEquipments();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || 'Failed to save equipment record');
    }
  };

  // Admin: Delete Equipment
  const handleDeleteEquipment = async (id: string) => {
    if (!adminToken) return;
    try {
      await LabEquipmentApi.deleteEquipment(id, adminToken);
      message.success('Equipment deleted successfully');
      loadAdminData();
      loadPublicEquipments();
    } catch (e: any) {
      message.error(e.message || 'Failed to delete equipment');
    }
  };

  // Photo & Document helpers for Admin Equipment Form
  const handleAddPhoto = (file: File) => {
    if (equipmentPhotos.length >= 4) {
      message.warning('Maximum 4 photographs allowed per equipment.');
      return false;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const hide = message.loading(`Saving photo "${file.name}" to server uploads...`, 0);
      try {
        let finalPhotoUrl = base64Data;
        if (adminToken) {
          const res = await LabEquipmentApi.uploadFile(base64Data, file.name, 'equipment_photos', adminToken);
          if (res.url) finalPhotoUrl = res.url;
        }
        const newPhoto: EquipmentPhoto = {
          id: 'p-' + Date.now(),
          url: finalPhotoUrl,
          name: file.name,
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm')
        };
        setEquipmentPhotos(prev => [...prev, newPhoto]);
        hide();
        message.success(`Photo saved to uploads folder successfully.`);
      } catch (err: any) {
        hide();
        const newPhoto: EquipmentPhoto = {
          id: 'p-' + Date.now(),
          url: base64Data,
          name: file.name,
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm')
        };
        setEquipmentPhotos(prev => [...prev, newPhoto]);
        message.info(`Photo attached.`);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemovePhoto = (id: string) => {
    setEquipmentPhotos(equipmentPhotos.filter(p => p.id !== id));
  };

  const handleAddDocument = (file: File, fileType: string = 'Manual') => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const hide = message.loading(`Saving document "${file.name}" to server uploads...`, 0);
      try {
        let finalDocUrl = base64Data;
        let finalSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        if (adminToken) {
          const res = await LabEquipmentApi.uploadFile(base64Data, file.name, 'equipment_docs', adminToken);
          if (res.url) {
            finalDocUrl = res.url;
            if (res.fileSize) finalSize = res.fileSize;
          }
        }
        const newDoc: EquipmentDocument = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          fileName: file.name,
          fileType: fileType || 'Manual',
          fileData: finalDocUrl,
          fileSize: finalSize,
          uploadedBy: currentAdminUser?.name || 'Super Admin',
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm')
        };
        setEquipmentDocs(prev => [...prev, newDoc]);
        hide();
        message.success(`Document saved to uploads folder successfully.`);
      } catch (err: any) {
        hide();
        const newDoc: EquipmentDocument = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          fileName: file.name,
          fileType: fileType || 'Manual',
          fileData: base64Data,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedBy: currentAdminUser?.name || 'Super Admin',
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm')
        };
        setEquipmentDocs(prev => [...prev, newDoc]);
        message.info(`Document attached.`);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemoveDocument = (id: string) => {
    setEquipmentDocs(equipmentDocs.filter(d => d.id !== id));
  };

  const handleUpdateDocType = (id: string, fileType: string) => {
    setEquipmentDocs(equipmentDocs.map(d => (d.id === id ? { ...d, fileType } : d)));
  };

  // Admin: Applicant Actions
  const openApplicantModal = (record?: LabApplicant) => {
    if (record) {
      setEditingApplicant(record);
      applicantForm.setFieldsValue(record);
    } else {
      setEditingApplicant(null);
      applicantForm.resetFields();
      applicantForm.setFieldsValue({ status: 'Active' });
    }
    setApplicantModalVisible(true);
  };

  const handleSaveApplicant = async () => {
    if (!adminToken) return;
    try {
      const values = await applicantForm.validateFields();
      if (editingApplicant) {
        await LabEquipmentApi.updateApplicant(editingApplicant.id, values, adminToken);
        message.success('Applicant profile updated successfully.');
        setApplicantModalVisible(false);
      } else {
        const res = await LabEquipmentApi.createApplicant(values, adminToken);
        setApplicantModalVisible(false);
        setNewCodeModalData({
          name: res.applicant.name,
          mobile: res.applicant.mobile,
          code: res.generatedSecretCode
        });
      }
      loadAdminData();
      loadPublicApplicants();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || 'Failed to save applicant');
    }
  };

  const handleResetSecretCode = async (applicant: LabApplicant) => {
    if (!adminToken) return;
    try {
      const res = await LabEquipmentApi.resetApplicantCode(applicant.id, undefined, adminToken);
      setNewCodeModalData({
        name: applicant.name,
        mobile: applicant.mobile,
        code: res.newSecretCode
      });
      loadAdminData();
    } catch (e: any) {
      message.error(e.message || 'Failed to reset secret code');
    }
  };

  const handleDeleteApplicant = async (id: string) => {
    if (!adminToken) return;
    try {
      await LabEquipmentApi.deleteApplicant(id, adminToken);
      message.success('Applicant removed.');
      loadAdminData();
      loadPublicApplicants();
    } catch (e: any) {
      message.error(e.message || 'Failed to delete applicant');
    }
  };

  // Admin: Booking Review Action
  const openReviewBookingModal = (booking: EquipmentBooking) => {
    setReviewingBooking(booking);
    reviewForm.setFieldsValue({
      status: booking.status === 'Pending' ? 'Approved' : booking.status,
      adminRemark: booking.adminRemark || ''
    });
    setReviewBookingModalVisible(true);
  };

  const handleSaveBookingReview = async () => {
    if (!adminToken || !reviewingBooking) return;
    try {
      const values = await reviewForm.validateFields();
      setSavingReview(true);
      await LabEquipmentApi.updateBookingStatus(
        reviewingBooking.id,
        values.status,
        values.adminRemark,
        adminToken
      );
      message.success(`Booking #${reviewingBooking.id} status updated to ${values.status}.`);
      setReviewBookingModalVisible(false);
      loadAdminData();
      loadPublicEquipments();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message || 'Failed to update booking status');
    } finally {
      setSavingReview(false);
    }
  };

  // Direct Release Booking (Admin)
  const handleDirectReleaseBooking = async (bookingId: string) => {
    if (!adminToken) return;
    try {
      const res = await LabEquipmentApi.releaseBooking(bookingId, undefined, adminToken);
      message.success(res.message || 'Booking released successfully.');
      loadAdminData();
      loadPublicEquipments();
    } catch (e: any) {
      message.error(e.message || 'Failed to release booking');
    }
  };

  // 1. Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers = [
      'Equipment Full Name',
      'Approved Abbreviation',
      'Category',
      'Operational Status',
      'Make / Manufacturer',
      'Model',
      'Serial Number',
      'Department Name',
      'Facility Name',
      'Location',
      'Current Movement Location',
      'Basic Cost (Rs)',
      'Year of Purchase',
      'Funding Agency Type',
      'Funding Agency Details',
      'Warranty End Date',
      'AMC End Date',
      'PRISM Service Category',
      'Alert Email ID(s)',
      'Purpose / Research Scope',
      'Technical Description'
    ];

    const sampleRow1 = [
      `"Ultra-High Performance Liquid Chromatography System (UHPLC)"`,
      `"UHPLC-01"`,
      `"Chromatography"`,
      `"Working"`,
      `"Waters Corporation"`,
      `"ACQUITY UPLC H-Class PLUS"`,
      `"WAT-UPLC-98231"`,
      `"Analytical Biochemistry & Pharmacology"`,
      `"Central Instrumentation Facility (CIF)"`,
      `"Ground Floor, Analytical Core Lab Room 104"`,
      `"Ground Floor, Analytical Core Lab Room 104"`,
      `"7850000"`,
      `"2023"`,
      `"Govt"`,
      `"ICMR Extramural Grant #EQ/2023/88"`,
      `"2027-03-31"`,
      `"2028-03-31"`,
      `"Chromatography & Mass Spectrometry"`,
      `"harvinders.hq@icmr.gov.in"`,
      `"Separation and quantification of small molecule metabolites and pharmacokinetic compounds."`,
      `"Quaternary solvent manager with high-throughput auto-sampler, column heater/cooler, and PDA detector."`
    ];

    const sampleRow2 = [
      `"High-Speed Spectral Cell Sorter / Flow Cytometer"`,
      `"FACS-01"`,
      `"Flow Cytometry & Cell Sorting"`,
      `"Working"`,
      `"BD Biosciences"`,
      `"BD FACSymphony S6"`,
      `"BD-FS-88192"`,
      `"Immunology & Molecular Diagnostics"`,
      `"Cellular Analysis Core Facility"`,
      `"2nd Floor, Molecular Diagnostics Lab Room 302"`,
      `"2nd Floor, Molecular Diagnostics Lab Room 302"`,
      `"12800000"`,
      `"2024"`,
      `"DBT (Department of Biotechnology)"`,
      `"DBT National Core Instrument Facility Grant"`,
      `"2028-06-30"`,
      `"2029-06-30"`,
      `"High-Throughput Cell Sorting"`,
      `"harvinders.hq@icmr.gov.in"`,
      `"Multi-laser high-parameter single-cell sorting and phenotypic immune profiling."`,
      `"6-laser 50-parameter cell sorting system with aerosol management and index sorting."`
    ];

    const csvContent = '\uFEFF' + [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICMR_NIHR_Equipment_Import_Sample_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Sample CSV Template downloaded successfully.');
  };

  // 2. CSV Parser with quotes handling
  const parseEquipmentsCSV = (csvText: string): { records: Partial<Equipment>[]; errors: string[] } => {
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return { records: [], errors: ['CSV file is empty.'] };

    const parseCSVRows = (text: string): string[][] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let insideQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          currentRow.push(currentField.trim());
          currentField = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
          if (char === '\r' && nextChar === '\n') i++;
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
      }
      return rows;
    };

    const rows = parseCSVRows(cleanText);
    if (rows.length < 2) {
      return { records: [], errors: ['CSV must contain at least a header row and one data row.'] };
    }

    const headerRow = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const records: Partial<Equipment>[] = [];
    const errors: string[] = [];

    const getField = (row: string[], keys: string[]): string => {
      for (const key of keys) {
        const idx = headerRow.findIndex(h => h.includes(key));
        if (idx !== -1 && row[idx] !== undefined) {
          return row[idx].trim();
        }
      }
      return '';
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every(col => !col)) continue;

      const name = getField(row, ['equipmentfullname', 'equipmentname', 'fullname', 'name']);
      if (!name) {
        errors.push(`Row #${i}: Missing Equipment Name (Mandatory Field).`);
        continue;
      }

      const abbreviation = getField(row, ['approvedabbreviation', 'abbreviation', 'abbr', 'code']);
      const category = getField(row, ['category']) || 'Research Infrastructure';
      const operationalStatus = getField(row, ['operationalstatus', 'status']) || 'Working';
      const make = getField(row, ['make', 'manufacturer', 'brand']);
      const model = getField(row, ['model', 'modelno']);
      const serialNo = getField(row, ['serialnumber', 'serialno', 'serial']);
      const departmentName = getField(row, ['departmentname', 'department', 'dept']) || 'Central Instrumentation Facility (CIF)';
      const facilityName = getField(row, ['facilityname', 'facility']) || '';
      const location = getField(row, ['location', 'room', 'lab']) || 'Central Laboratory';
      const currentLocation = getField(row, ['currentmovementlocation', 'currentlocation']) || location;
      const basicCostStr = getField(row, ['basiccost', 'cost', 'price', 'inr']);
      const yearOfPurchase = getField(row, ['yearofpurchase', 'purchaseyear', 'year']) || String(new Date().getFullYear());
      const fundingAgencyType = getField(row, ['fundingagencytype', 'fundingagency', 'fundingtype']) || 'Govt';
      const fundingAgencyDetails = getField(row, ['fundingagencydetails', 'fundingdetails', 'grant']);
      const warrantyEndDate = getField(row, ['warrantyenddate', 'warrantyvalidtill', 'warranty']);
      const amcEndDate = getField(row, ['amcenddate', 'amcvalidtill', 'amc']);
      const prismServiceCategory = getField(row, ['prismservicecategory', 'prismcategory', 'servicecategory']);
      const alertEmailsStr = getField(row, ['alertemails', 'alertemail', 'emails', 'email']);
      const purposeApplication = getField(row, ['purposeapplication', 'purpose', 'application', 'researchscope']);
      const description = getField(row, ['technicaldescription', 'description', 'specs', 'details']);
      const id = getField(row, ['equipmentid', 'id']);

      const alertEmails = alertEmailsStr
        ? alertEmailsStr.split(/[,;]/).map(e => e.trim()).filter(Boolean)
        : ['harvinders.hq@icmr.gov.in'];

      records.push({
        id: id || undefined,
        name,
        approvedAbbreviation: abbreviation,
        category,
        operationalStatus,
        make,
        model,
        serialNo,
        departmentName,
        facilityName,
        location,
        currentLocation,
        basicCost: basicCostStr || undefined,
        yearOfPurchase,
        fundingAgencyType,
        fundingAgencyDetails,
        warrantyEndDate,
        amcEndDate,
        prismServiceCategory,
        alertEmails,
        purposeApplication,
        description,
        photos: [],
        documents: []
      });
    }

    return { records, errors };
  };

  // 3. Handle CSV File Selection
  const handleCsvFileSelect = (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      const { records, errors } = parseEquipmentsCSV(content);
      setParsedCsvEquipments(records);
      setCsvParseErrors(errors);
      if (records.length > 0) {
        message.success(`Parsed ${records.length} equipment record(s) from "${file.name}".`);
      } else {
        message.error('No valid equipment records could be parsed from the CSV file.');
      }
    };
    reader.readAsText(file);
    return false;
  };

  // 4. Confirm Bulk Import into Database
  const handleConfirmBulkImport = async () => {
    if (!adminToken) return;
    if (parsedCsvEquipments.length === 0) {
      message.warning('No equipment records to import.');
      return;
    }

    setImportingCsv(true);
    try {
      const res = await LabEquipmentApi.bulkImportEquipments(parsedCsvEquipments, adminToken);
      message.success(`Successfully imported ${res.count} equipment(s) into the Master Directory!`);
      setCsvImportModalVisible(false);
      setParsedCsvEquipments([]);
      setCsvParseErrors([]);
      setCsvFileName('');
      loadAdminData();
      loadPublicEquipments();
    } catch (e: any) {
      message.error(e.message || 'Failed to bulk import equipments');
    } finally {
      setImportingCsv(false);
    }
  };

  // 5. Export Equipment Master to CSV
  const handleExportEquipmentsCSV = () => {
    if (adminEquipments.length === 0) {
      message.info('No equipment records to export');
      return;
    }
    const headers = [
      'Equipment ID',
      'Equipment Full Name',
      'Approved Abbreviation',
      'Category',
      'Operational Status',
      'Make / Manufacturer',
      'Model',
      'Serial Number',
      'Department Name',
      'Facility Name',
      'Location',
      'Current Movement Location',
      'Basic Cost (Rs)',
      'Year of Purchase',
      'Funding Agency Type',
      'Funding Agency Details',
      'Warranty End Date',
      'AMC End Date',
      'PRISM Service Category',
      'Alert Email ID(s)',
      'Purpose / Research Scope',
      'Technical Description',
      'Photos Attached',
      'Documents Attached',
      'Created Date',
      'Last Updated'
    ];

    const rows = adminEquipments.map(e => [
      `"${e.id}"`,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.approvedAbbreviation || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.operationalStatus || '').replace(/"/g, '""')}"`,
      `"${(e.make || '').replace(/"/g, '""')}"`,
      `"${(e.model || '').replace(/"/g, '""')}"`,
      `"${(e.serialNo || '').replace(/"/g, '""')}"`,
      `"${(e.departmentName || '').replace(/"/g, '""')}"`,
      `"${(e.facilityName || '').replace(/"/g, '""')}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${(e.currentLocation || e.location || '').replace(/"/g, '""')}"`,
      `"${e.basicCost !== undefined && e.basicCost !== null ? e.basicCost : ''}"`,
      `"${e.yearOfPurchase || ''}"`,
      `"${(e.fundingAgencyType || '').replace(/"/g, '""')}"`,
      `"${(e.fundingAgencyDetails || '').replace(/"/g, '""')}"`,
      `"${e.warrantyEndDate || ''}"`,
      `"${e.amcEndDate || ''}"`,
      `"${(e.prismServiceCategory || '').replace(/"/g, '""')}"`,
      `"${(e.alertEmails || []).join(', ').replace(/"/g, '""')}"`,
      `"${(e.purposeApplication || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.photos?.length || 0}"`,
      `"${e.documents?.length || 0}"`,
      `"${e.createdAt || ''}"`,
      `"${e.updatedAt || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICMR_NIHR_Equipment_Master_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Equipment Master directory exported with all columns.');
  };

  // Helper functions for Equipment Movement & Activity Log Book
  const getBookingEquipment = (bk: EquipmentBooking) => {
    return adminEquipments.find(e => bk.equipmentIds?.includes(e.id)) || null;
  };

  const getBookingApplicant = (bk: EquipmentBooking) => {
    return adminApplicants.find(a => a.id === bk.applicantId) || null;
  };

  const selectedEquipment = selectedLogEquipmentId !== 'all' 
    ? adminEquipments.find(e => e.id === selectedLogEquipmentId) || null 
    : null;

  const filteredLogBookBookings = adminBookings.filter(bk => {
    if (selectedLogEquipmentId !== 'all' && !bk.equipmentIds?.includes(selectedLogEquipmentId)) {
      return false;
    }
    if (selectedLogStatus !== 'all' && bk.status !== selectedLogStatus) {
      return false;
    }
    if (logSearch) {
      const q = logSearch.toLowerCase();
      const app = getBookingApplicant(bk);
      const eq = getBookingEquipment(bk);
      const matches = 
        bk.id.toLowerCase().includes(q) ||
        bk.applicantName.toLowerCase().includes(q) ||
        (bk.equipmentNames && bk.equipmentNames.some(n => n.toLowerCase().includes(q))) ||
        (eq && eq.approvedAbbreviation?.toLowerCase().includes(q)) ||
        (eq && (eq.currentLocation || eq.location)?.toLowerCase().includes(q)) ||
        (bk.purposeRemark && bk.purposeRemark.toLowerCase().includes(q)) ||
        (bk.reviewedBy && bk.reviewedBy.toLowerCase().includes(q)) ||
        (bk.adminRemark && bk.adminRemark.toLowerCase().includes(q)) ||
        (app && app.department?.toLowerCase().includes(q)) ||
        (app && app.designation?.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const handleExportLogBookCSV = () => {
    if (filteredLogBookBookings.length === 0) {
      message.info('No log book entries matching current filter to export.');
      return;
    }

    const headers = [
      'Log Ref',
      'Date Logged',
      'Equipment Code',
      'Equipment Name',
      'Facility Location / Room',
      'Requisitioner Name',
      'Designation',
      'Department',
      'Mobile',
      'Email',
      'Stay From Date-Time',
      'Stay To Date-Time',
      'Duration (Hours)',
      'Purpose / Protocol',
      'Approved By',
      'Reviewed Date-Time',
      'Sanction Remarks',
      'Stay Status'
    ];

    const rows = filteredLogBookBookings.map(bk => {
      const eq = getBookingEquipment(bk);
      const app = getBookingApplicant(bk);
      return [
        `"${bk.id}"`,
        `"${bk.createdAt || '-'}"`,
        `"${eq?.approvedAbbreviation || eq?.id || '-'}"`,
        `"${(eq?.name || bk.equipmentNames?.[0] || '-').replace(/"/g, '""')}"`,
        `"${(eq?.currentLocation || eq?.location || '-').replace(/"/g, '""')}"`,
        `"${(bk.applicantName || '-').replace(/"/g, '""')}"`,
        `"${(app?.designation || '-').replace(/"/g, '""')}"`,
        `"${(app?.department || '-').replace(/"/g, '""')}"`,
        `"${bk.applicantMobile || '-'}"`,
        `"${bk.applicantEmail || '-'}"`,
        `"${bk.fromDateTime}"`,
        `"${bk.toDateTime}"`,
        `"${bk.durationHours || 0}"`,
        `"${(bk.purposeRemark || '-').replace(/"/g, '""')}"`,
        `"${(bk.reviewedBy || '-').replace(/"/g, '""')}"`,
        `"${bk.reviewedAt || '-'}"`,
        `"${(bk.adminRemark || '-').replace(/"/g, '""')}"`,
        `"${bk.status}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const eqNameSlug = selectedLogEquipmentId !== 'all' 
      ? (selectedEquipment?.approvedAbbreviation || selectedLogEquipmentId)
      : 'ALL_INSTRUMENTS';
    link.setAttribute('download', `ICMR_NIHR_Equipment_Log_Book_${eqNameSlug}_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Equipment Log Book exported to CSV.');
  };

  // Print Booking Slip
  const handlePrintBookingSlip = (booking: EquipmentBooking) => {
    setPrintableBooking(booking);
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Equipment Booking Slip - ${booking.id}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
                .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .title { font-size: 18px; font-weight: bold; color: #0369a1; }
                .subtitle { font-size: 12px; color: #64748b; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
                .badge-approved { background: #dcfce7; color: #166534; }
                .badge-pending { background: #fef9c3; color: #854d0e; }
                .badge-rejected { background: #fee2e2; color: #991b1b; }
                .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
                .table th { background: #f8fafc; font-weight: 600; }
                .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">ICMR - NATIONAL INSTITUTE FOR IMPLEMENTATION RESEARCH ON NON-COMMUNICABLE DISEASES</div>
                  <div class="subtitle">Central Instrumentation Facility (CIF) | Equipment Booking Acknowledgment</div>
                </div>
                <div>
                  <span class="badge ${booking.status === 'Approved' ? 'badge-approved' : (booking.status === 'Pending' ? 'badge-pending' : 'badge-rejected')}">
                    STATUS: ${booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <table class="table">
                <tr><th width="30%">Booking Reference ID</th><td><strong>${booking.id}</strong></td></tr>
                <tr><th>Applicant Name</th><td>${booking.applicantName}</td></tr>
                <tr><th>Registered Mobile</th><td>${booking.applicantMobile}</td></tr>
                <tr><th>Registered Email</th><td>${booking.applicantEmail}</td></tr>
                <tr><th>Instruments Requested</th><td>${booking.equipmentNames.join('<br/>')}</td></tr>
                <tr><th>Reservation Slot</th><td>${booking.fromDateTime} to ${booking.toDateTime} (${booking.durationHours || 0} Hours)</td></tr>
                <tr><th>Protocol / Purpose</th><td>${booking.purposeRemark}</td></tr>
                <tr><th>Submission Timestamp</th><td>${booking.createdAt}</td></tr>
                ${booking.adminRemark ? `<tr><th>Super Admin Review Remark</th><td><strong>${booking.adminRemark}</strong> (${booking.reviewedBy || 'CIF In-Charge'} on ${booking.reviewedAt || ''})</td></tr>` : ''}
              </table>
              <div class="footer">
                <p><strong>Important Note:</strong> Please present this acknowledgment slip to the CIF Laboratory Technician / Room In-charge before starting the protocol. Adhere strictly to the safety guidelines and record all entries in the physical instrument register.</p>
                <p>Generated via NIHR Intranet Central Lab Equipment Portal on ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
              </div>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch {
      // In-app modal preview is also available
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP HERO / PORTAL BANNER */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
        <Tabs
          activeKey={activeTab}
          onChange={handleSetActiveTab}
          className="custom-portal-tabs px-2"
          items={[
            {
              key: 'directory',
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-bold text-xs sm:text-sm">
                  <ShopOutlined /> 1. Equipment Directory (Public)
                </span>
              )
            },
            {
              key: 'booking',
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-bold text-xs sm:text-sm">
                  <CalendarOutlined /> 2. Reserve / Book Equipment
                </span>
              )
            },
            {
              key: 'status',
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-bold text-xs sm:text-sm">
                  <SearchOutlined /> 3. Check Booking Status
                </span>
              )
            },
            {
              key: 'admin',
              label: (
                <span className="flex items-center gap-2 px-2 py-1 font-bold text-xs sm:text-sm">
                  <SafetyCertificateOutlined /> 4. Super Admin Panel {currentAdminUser && <Tag color="green" className="ml-1 text-[10px]">Active</Tag>}
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
            {currentAdminUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-300 flex items-center justify-end gap-1">
                    <SafetyCertificateOutlined /> Super Admin Logged In
                  </div>
                  <div className="text-[11px] text-slate-300 truncate max-w-[180px]">{currentAdminUser.name}</div>
                </div>
                <Button
                  danger
                  size="small"
                  onClick={handleAdminLogout}
                  className="text-xs font-bold rounded-lg"
                >
                  Logout
                </Button>
              </div>
            ) : (
           <></>
            )}
          </div>
                </span>
              )
            }
          ]}
        />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PUBLIC EQUIPMENT DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <PublicDirectoryTab
          publicEquipments={publicEquipments}
          loading={loadingPublicEquipments}
          searchDirectory={searchDirectory}
          onSearchChange={setSearchDirectory}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDept={selectedDept}
          onDeptChange={setSelectedDept}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onViewDetail={setSelectedPublicEquipment}
          onQuickBook={handleQuickBook}
          onOpenLightbox={(url, title) => setPhotoPreviewModal({ visible: true, url, title })}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESERVE / BOOK EQUIPMENT */}
      {/* ========================================================================= */}
      {activeTab === 'booking' && (
        <BookingTab
          form={bookingForm}
          publicEquipments={publicEquipments}
          publicApplicants={publicApplicants}
          selectedEquipmentIds={selectedEquipmentIds}
          onEquipmentSelectChange={setSelectedEquipmentIds}
          selectedApplicant={selectedBookingApplicant}
          onApplicantSelect={setSelectedBookingApplicant}
          captcha={bookingCaptcha}
          onReloadCaptcha={loadBookingCaptcha}
          onSubmit={handleSubmitBooking}
          submitting={submittingBooking}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHECK BOOKING STATUS */}
      {/* ========================================================================= */}
      {activeTab === 'status' && (
        <CheckStatusTab
          mobile={statusMobile}
          onMobileChange={setStatusMobile}
          secretCode={statusSecretCode}
          onSecretCodeChange={setStatusSecretCode}
          checking={checkingStatus}
          onCheckStatus={handleCheckStatus}
          statusResults={statusResults}
          onPrintBookingSlip={handlePrintBookingSlip}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPER ADMIN PANEL */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div>
          {!currentAdminUser ? (
            /* Admin Login Form */
            <div className="max-w-md mx-auto py-8">
              <Card
                title={
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-zinc-800 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl shadow-inner">
                      <LockOutlined />
                    </div>
                    <div className="font-black text-lg text-slate-900 dark:text-zinc-100">Lab Super Admin Login</div>
                    <div className="text-xs text-slate-500 font-normal mt-0.5">Central Instrumentation Facility</div>
                  </div>
                }
                variant="borderless"
                className="shadow-xl rounded-2xl border border-slate-200 dark:border-zinc-800"
              >
                <Form
                  form={adminLoginForm}
                  layout="vertical"
                  onFinish={handleAdminLogin}
                  initialValues={{ email: '', password: '' }}
                >
                  <Form.Item
                    label="Official Admin Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter admin email' }]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-slate-400" />}
                      placeholder="e.g. Email"
                      className="rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please enter password' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-slate-400" />}
                      placeholder="Enter admin password"
                      className="rounded-lg"
                    />
                  </Form.Item>

                  {/* Offline Math Captcha */}
                  <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 mb-4 flex items-center justify-between gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg font-mono font-bold text-sm tracking-wider select-none text-slate-800 dark:text-zinc-100">
                      {adminCaptcha?.question || 'Loading...'}
                    </div>
                    <Tooltip title="Refresh Captcha">
                      <Button icon={<ReloadOutlined />} onClick={loadAdminCaptcha} size="small" shape="circle" />
                    </Tooltip>
                    <Form.Item
                      name="captchaAnswer"
                      rules={[{ required: true, message: 'Captcha required' }]}
                      className="m-0 flex-1"
                    >
                      <InputNumber
                        placeholder="Captcha"
                        className="w-full rounded-lg font-bold text-center"
                      />
                    </Form.Item>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={adminLoginLoading}
                    block
                    className="bg-blue-600 hover:bg-blue-500 font-bold h-10 rounded-xl shadow-md"
                  >
                    Authenticate & Access Super Admin
                  </Button>
                </Form>
              </Card>
            </div>
          ) : (
            /* Admin Management Interface */
            <div className="space-y-6">
              {/* Admin Sub-Tabs */}
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-2">
                <Tabs
                  activeKey={adminSubTab}
                  onChange={handleSetAdminSubTab}
                  className="custom-admin-subtabs"
                  items={[
                    {
                      key: 'equipments',
                      label: (
                        <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                          <ExperimentOutlined /> Equipment Master ({adminEquipments.length})
                        </span>
                      )
                    },
                    {
                      key: 'applicants',
                      label: (
                        <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                          <UserOutlined /> Applicant Master ({adminApplicants.length})
                        </span>
                      )
                    },
                    {
                      key: 'bookings',
                      label: (
                        <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                          <ClockCircleOutlined /> Booking Queue ({adminBookings.filter(b => b.status === 'Pending').length} Pending)
                        </span>
                      )
                    },
                    {
                      key: 'logs',
                      label: (
                        <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                          <HistoryOutlined /> Movement & Activity Logs
                        </span>
                      )
                    }
                  ]}
                />

                <div className="flex items-center gap-2 px-2">
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={loadAdminData}
                    loading={loadingAdminEquipments}
                    className="rounded-lg text-xs font-semibold"
                  >
                    Refresh All
                  </Button>
                </div>
              </div>

              {/* Sub-Tab Content */}
              {adminSubTab === 'equipments' && (
                <AdminEquipmentTab
                  equipments={adminEquipments}
                  loading={loadingAdminEquipments}
                  search={adminSearchEquipments}
                  onSearchChange={setAdminSearchEquipments}
                  categoryFilter={adminCategoryFilter}
                  onCategoryChange={setAdminCategoryFilter}
                  statusFilter={adminStatusFilter}
                  onStatusChange={setAdminStatusFilter}
                  onOpenAddModal={() => openEquipmentModal()}
                  onOpenEditModal={openEquipmentModal}
                  onDeleteEquipment={handleDeleteEquipment}
                  onViewDetail={setViewEquipmentDetail}
                  onOpenCsvImportModal={() => setCsvImportModalVisible(true)}
                  onExportCsv={handleExportEquipmentsCSV}
                  onOpenLightbox={(url, title) => setPhotoPreviewModal({ visible: true, url, title })}
                />
              )}

              {adminSubTab === 'applicants' && (
                <AdminApplicantTab
                  applicants={adminApplicants}
                  onOpenAddModal={() => openApplicantModal()}
                  onOpenEditModal={openApplicantModal}
                  onResetSecretCode={handleResetSecretCode}
                  onDeleteApplicant={handleDeleteApplicant}
                />
              )}

              {adminSubTab === 'bookings' && (
                <AdminBookingTab
                  bookings={adminBookings}
                  onReviewBooking={openReviewBookingModal}
                  onDirectReleaseBooking={handleDirectReleaseBooking}
                  onPrintBookingSlip={handlePrintBookingSlip}
                />
              )}

              {adminSubTab === 'logs' && (
                <Tabs
                  defaultActiveKey="logbook"
                  items={[
                    {
                      key: 'logbook',
                      label: <span className="font-bold text-xs sm:text-sm">Instrument Movement & Operation Register</span>,
                      children: (
                        <AdminLogBookTab
                          equipments={adminEquipments}
                          applicants={adminApplicants}
                          bookings={adminBookings}
                          selectedEquipmentId={selectedLogEquipmentId}
                          onSelectedEquipmentChange={setSelectedLogEquipmentId}
                          selectedStatus={selectedLogStatus}
                          onSelectedStatusChange={setSelectedLogStatus}
                          search={logSearch}
                          onSearchChange={setLogSearch}
                          onOpenPrintModal={() => setPrintableLogBookModal(true)}
                          onExportCsv={handleExportLogBookCSV}
                        />
                      )
                    },
                    {
                      key: 'audit',
                      label: <span className="font-bold text-xs sm:text-sm">System Audit Trails & Security Logs</span>,
                      children: <AdminActivityLogsTab logs={adminActivityLogs} />
                    }
                  ]}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Add / Edit Equipment Modal */}
      <EquipmentEditModal
        visible={equipmentModalVisible}
        onCancel={() => setEquipmentModalVisible(false)}
        onSave={handleSaveEquipment}
        form={equipmentForm}
        editingEquipment={editingEquipment}
        equipmentPhotos={equipmentPhotos}
        equipmentDocs={equipmentDocs}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
        onAddDocument={handleAddDocument}
        onRemoveDocument={handleRemoveDocument}
        onUpdateDocType={handleUpdateDocType}
      />

      {/* 2. Add / Edit Applicant Modal */}
      <ApplicantEditModal
        visible={applicantModalVisible}
        onCancel={() => setApplicantModalVisible(false)}
        onSave={handleSaveApplicant}
        form={applicantForm}
        editingApplicant={editingApplicant}
      />

      {/* 3. Review Booking Modal */}
      <ReviewBookingModal
        visible={reviewBookingModalVisible}
        onCancel={() => setReviewBookingModalVisible(false)}
        onSave={handleSaveBookingReview}
        onDirectRelease={handleDirectReleaseBooking}
        form={reviewForm}
        booking={reviewingBooking}
        saving={savingReview}
      />

      {/* 4. Equipment Full Detail Modal (Public & Admin View) */}
      <PublicEquipmentDetailModal
        visible={!!selectedPublicEquipment || !!viewEquipmentDetail}
        equipment={selectedPublicEquipment || viewEquipmentDetail}
        onClose={() => {
          setSelectedPublicEquipment(null);
          setViewEquipmentDetail(null);
        }}
        onQuickBook={selectedPublicEquipment ? handleQuickBook : undefined}
      />

      {/* 5. Booking Success Receipt Modal */}
      <BookingReceiptModal
        visible={!!bookingSuccessData}
        booking={bookingSuccessData}
        onClose={() => setBookingSuccessData(null)}
        onPrint={handlePrintBookingSlip}
      />

      {/* 6. Printable Official Log Book Modal */}
      <PrintableLogBookModal
        visible={printableLogBookModal}
        onClose={() => setPrintableLogBookModal(false)}
        selectedEquipment={selectedEquipment}
        bookings={filteredLogBookBookings}
        equipments={adminEquipments}
        applicants={adminApplicants}
      />

      {/* 7. CSV Bulk Import Modal */}
      <CsvImportModal
        visible={csvImportModalVisible}
        onClose={() => {
          if (!importingCsv) {
            setCsvImportModalVisible(false);
            setParsedCsvEquipments([]);
            setCsvParseErrors([]);
            setCsvFileName('');
          }
        }}
        onConfirmImport={handleConfirmBulkImport}
        onDownloadSampleCsv={handleDownloadSampleCsv}
        onFileSelect={handleCsvFileSelect}
        parsedEquipments={parsedCsvEquipments}
        errors={csvParseErrors}
        fileName={csvFileName}
        importing={importingCsv}
        onClear={() => {
          setParsedCsvEquipments([]);
          setCsvParseErrors([]);
          setCsvFileName('');
        }}
      />

      {/* 8. Secret Code Issuance Modal */}
      <SecretCodeModal
        visible={!!newCodeModalData}
        data={newCodeModalData}
        onClose={() => setNewCodeModalData(null)}
      />

      {/* 9. Photo Lightbox Modal */}
      <PhotoLightboxModal
        visible={!!photoPreviewModal}
        url={photoPreviewModal?.url || ''}
        title={photoPreviewModal?.title || ''}
        onClose={() => setPhotoPreviewModal(null)}
      />
    </div>
  );
}

export default CentralLabEquipmentPortal;
