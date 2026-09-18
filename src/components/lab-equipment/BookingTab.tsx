import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  Alert,
  Tag,
  Row,
  Col,
  Tooltip,
  InputNumber
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SendOutlined,
  ExperimentOutlined,
  ApartmentOutlined,
  IdcardOutlined,
  KeyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { FormInstance } from 'antd/lib/form';
import { PublicEquipment, PublicApplicantSummary } from '../../types/labEquipment';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export interface BookingTabProps {
  form: FormInstance;
  publicEquipments: PublicEquipment[];
  publicApplicants: PublicApplicantSummary[];
  selectedEquipmentIds: string[];
  onEquipmentSelectChange: (ids: string[]) => void;
  selectedApplicant: PublicApplicantSummary | null;
  onApplicantSelect: (app: PublicApplicantSummary | null) => void;
  captcha: { captchaId: string; question: string } | null;
  onReloadCaptcha: () => void;
  onSubmit: (values: any) => Promise<void> | void;
  submitting: boolean;
}

export const BookingTab: React.FC<BookingTabProps> = ({
  form,
  publicEquipments,
  publicApplicants,
  selectedEquipmentIds,
  onEquipmentSelectChange,
  selectedApplicant,
  onApplicantSelect,
  captcha,
  onReloadCaptcha,
  onSubmit,
  submitting
}) => {
  const [slotHours, setSlotHours] = useState<number>(0);

  useEffect(() => {
    if (selectedEquipmentIds.length > 0) {
      form.setFieldsValue({ equipmentIds: selectedEquipmentIds });
    }
  }, [selectedEquipmentIds, form]);

  const handleEquipmentChange = (vals: string[]) => {
    onEquipmentSelectChange(vals);
    form.setFieldsValue({ equipmentIds: vals });
  };

  const handleApplicantDropdown = (applicantId: string) => {
    const app = publicApplicants.find(a => a.id === applicantId) || null;
    onApplicantSelect(app);
    if (app) {
      form.setFieldsValue({
        applicantName: app.name,
        mobile: app.mobile,
        email: app.email,
        department: app.department,
        designation: app.designation
      });
    }
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const diffHrs = dates[1].diff(dates[0], 'hour', true);
      setSlotHours(Math.max(0.5, Math.round(diffHrs * 10) / 10));
    } else {
      setSlotHours(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            Central Instrumentation Requisition & Slot Booking Form
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Official requisition portal for ICMR scientists, technical officers, research fellows, and scholars.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          className="space-y-6"
        >
          {/* Step 1: Equipment Selection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <ExperimentOutlined className="text-blue-600" />
                Step 1: Select Instrument(s) for Reservation
              </span>
              <span className="text-xs text-slate-500">
                {publicEquipments.filter(e => e.operationalStatus === 'Working').length} instruments operational
              </span>
            </div>

            <Form.Item
              name="equipmentIds"
              label="Select Core Instruments (Multi-Select Allowed)"
              rules={[{ required: true, message: 'Please select at least one instrument' }]}
              className="m-0"
            >
              <Select
                mode="multiple"
                placeholder="Search or select instruments from CIF Master Catalog..."
                value={selectedEquipmentIds}
                onChange={handleEquipmentChange}
                className="w-full rounded-xl"
                size="large"
                optionFilterProp="children"
                showSearch
              >
                {publicEquipments.map(eq => {
                  const isAvailable = eq.operationalStatus === 'Working';
                  return (
                    <Option
                      key={eq.id}
                      value={eq.id}
                      disabled={!isAvailable}
                    >
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-200">
                            {eq.name}
                          </span>
                          {eq.approvedAbbreviation && (
                            <span className="ml-2 text-xs font-mono text-blue-600 dark:text-blue-400">
                              ({eq.approvedAbbreviation})
                            </span>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {eq.location || 'Central Laboratory'} {eq.category ? `• ${eq.category}` : ''}
                          </div>
                        </div>
                        <Tag
                          color={isAvailable ? 'success' : 'error'}
                          className="ml-2 text-[10px] font-bold"
                        >
                          {eq.operationalStatus}
                        </Tag>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </div>

          {/* Step 2: Applicant Details & Verification */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <UserOutlined className="text-blue-600" />
                Step 2: Authorized Applicant Identification
              </span>
              {selectedApplicant && (
                <Tag color="success" icon={<CheckCircleOutlined />} className="font-bold">
                  Pre-Registered Profile Loaded
                </Tag>
              )}
            </div>

            {/* Quick Profile Selector for Approved Applicants */}
            {publicApplicants.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block mb-1">
                  Quick Select Approved Applicant Profile (Optional)
                </label>
                <Select
                  placeholder="Select registered scientist/scholar..."
                  allowClear
                  onChange={handleApplicantDropdown}
                  className="w-full rounded-xl"
                  showSearch
                  optionFilterProp="children"
                >
                  {publicApplicants.map(app => (
                    <Option key={app.id} value={app.id}>
                      {app.name} — {app.designation || 'Staff'} ({app.department || 'NIHR'}) [Mobile: {app.mobile}]
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Applicant Full Name"
                  name="applicantName"
                  rules={[{ required: true, message: 'Please enter applicant full name' }]}
                >
                  <Input
                    prefix={<UserOutlined className="text-slate-400" />}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="rounded-xl"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Registered Mobile Number (10 Digits)"
                  name="mobile"
                  rules={[
                    { required: true, message: 'Please enter registered mobile number' },
                    { pattern: /^[0-9]{10}$/, message: 'Must be a 10-digit mobile number' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined className="text-slate-400" />}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Institutional Email ID"
                  name="email"
                >
                  <Input
                    prefix={<MailOutlined className="text-slate-400" />}
                    placeholder="e.g. ramesh.gupta@nihr.res.in"
                    className="rounded-xl"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Applicant 8-Digit Secret Passcode"
                  name="secretCode"
                  rules={[
                    { required: true, message: 'Please enter your 8-digit secret authorization code' },
                    { pattern: /^\d{8}$/, message: 'Must be an 8-digit numeric code' }
                  ]}
                >
                  <Input.Password
                    prefix={<KeyOutlined className="text-slate-400" />}
                    placeholder="Enter 8-digit secret security code"
                    maxLength={8}
                    className="rounded-xl font-mono"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Designation / Academic Role"
                  name="designation"
                >
                  <Input
                    prefix={<IdcardOutlined className="text-slate-400" />}
                    placeholder="e.g. Scientist-C / Senior Research Fellow"
                    className="rounded-xl"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Department / Division / Research Wing"
                  name="department"
                >
                  <Input
                    prefix={<ApartmentOutlined className="text-slate-400" />}
                    placeholder="e.g. Department of Molecular Diagnostics"
                    className="rounded-xl"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Step 3: Schedule Slot & Protocol Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 space-y-4">
            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <CalendarOutlined className="text-blue-600" />
              Step 3: Protocol Schedule & Operational Window
            </span>

            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Form.Item
                  label="Reservation Slot Date & Time Range"
                  name="dateRange"
                  rules={[{ required: true, message: 'Please select reservation start and end times' }]}
                >
                  <RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    onChange={handleDateChange}
                    className="w-full rounded-xl"
                    size="large"
                    disabledDate={current => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <div className="p-3 bg-blue-50/50 dark:bg-zinc-800 rounded-xl border border-blue-100 dark:border-zinc-700 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Duration</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {slotHours} <span className="text-xs font-normal text-slate-600">Hours</span>
                  </div>
                </div>
              </Col>
            </Row>

            <Form.Item
              label="Research Scope / Protocol Title / Special Consumable Requisition"
              name="purposeRemark"
              rules={[{ required: true, message: 'Please briefly describe the protocol or purpose' }]}
            >
              <TextArea
                rows={3}
                placeholder="e.g. Analysis of serum metabolomics samples under Project #NIHR-2024-88. Requires 0.22u filters and C18 column setup."
                className="rounded-xl"
              />
            </Form.Item>
          </div>

          {/* Step 4: Verification & Anti-Spam Captcha */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-4 py-2 rounded-xl font-mono font-bold text-base tracking-widest text-slate-800 dark:text-zinc-100 select-none shadow-sm">
                  {captcha?.question || 'Loading...'}
                </div>
                <Tooltip title="Reload anti-spam question">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={onReloadCaptcha}
                    shape="circle"
                    size="middle"
                  />
                </Tooltip>
              </div>

              <Form.Item
                name="captchaAnswer"
                label="Mathematical Captcha Answer"
                rules={[{ required: true, message: 'Captcha answer is required' }]}
                className="m-0 flex-1 max-w-xs"
              >
                <InputNumber
                  placeholder="Enter Answer"
                  className="w-full rounded-xl text-center font-bold"
                  size="large"
                />
              </Form.Item>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              size="large"
              block
              className="bg-blue-600 hover:bg-blue-500 font-bold h-12 rounded-xl shadow-lg"
            >
              Submit Equipment Reservation Request
            </Button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Submissions are immediately queued for Super Admin review and institutional email notifications are dispatched.
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
};
