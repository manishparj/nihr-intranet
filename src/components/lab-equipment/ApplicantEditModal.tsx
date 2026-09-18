import React from 'react';
import { Modal, Form, Input, Select, Button, Alert } from 'antd';
import { UserOutlined, KeyOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { FormInstance } from 'antd/es/form';
import { LabApplicant } from '../../types/labEquipment';

const { Option } = Select;

interface ApplicantEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  form: FormInstance;
  editingApplicant: LabApplicant | null;
}

export const ApplicantEditModal: React.FC<ApplicantEditModalProps> = ({
  visible,
  onCancel,
  onSave,
  form,
  editingApplicant
}) => {
  const handleGenerateRandomCode = () => {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    form.setFieldsValue({ secretCode: randomCode });
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onSave}
      title={
        <span className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <UserOutlined className="text-blue-600" />
          {editingApplicant ? `Edit Applicant: ${editingApplicant.name}` : 'Register New Pre-Approved Applicant'}
        </span>
      }
      okText={editingApplicant ? 'Update Profile & Passcode' : 'Register Applicant & Save Passcode'}
      okButtonProps={{ className: 'bg-blue-600 font-bold rounded-xl' }}
      cancelButtonProps={{ className: 'rounded-xl' }}
      className="rounded-2xl overflow-hidden"
    >
      <Form form={form} layout="vertical" className="space-y-3 py-2">
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: 'Applicant name is required' }]}
        >
          <Input placeholder="e.g. Dr. Meenakshi Sharma" className="rounded-xl" />
        </Form.Item>

        <Form.Item
          label="Mobile Number (Unique 10 Digits)"
          name="mobile"
          rules={[
            { required: true, message: 'Mobile number is required' },
            { pattern: /^[0-9]{10}$/, message: 'Must be exact 10 digits' }
          ]}
        >
          <Input placeholder="e.g. 9876543210" maxLength={10} className="rounded-xl font-mono" />
        </Form.Item>

        <Form.Item
          label="Institutional Email ID"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' }
          ]}
        >
          <Input placeholder="e.g. meenakshi.s@nihr.res.in" className="rounded-xl" />
        </Form.Item>

        {/* 8-Digit Secret Passcode Field */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <KeyOutlined className="text-amber-600" />
              Applicant 8-Digit Secret Passcode
            </span>
            <Button
              size="small"
              type="link"
              icon={<ReloadOutlined />}
              onClick={handleGenerateRandomCode}
              className="text-xs text-amber-800 dark:text-amber-300 font-semibold p-0 h-auto"
            >
              Generate New 8-Digit Code
            </Button>
          </div>

          <Form.Item
            name="secretCode"
            rules={[
              { required: true, message: '8-digit secret passcode is required' },
              { pattern: /^[0-9]{8}$/, message: 'Passcode must be exactly 8 numeric digits (e.g. 12345678)' }
            ]}
            className="m-0"
          >
            <Input
              prefix={<SafetyCertificateOutlined className="text-amber-500 mr-1" />}
              placeholder="e.g. 12345678"
              maxLength={8}
              className="rounded-xl font-mono text-base font-bold tracking-widest text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900"
            />
          </Form.Item>

          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 m-0 leading-tight">
            Visible to Lab Super Admin. The applicant will use this 8-digit passcode alongside their registered mobile number to authenticate equipment booking requests. You can update it anytime.
          </p>
        </div>

        <Form.Item label="Department / Unit / Division" name="department">
          <Input placeholder="e.g. Division of Molecular Biology & Genomics" className="rounded-xl" />
        </Form.Item>

        <Form.Item label="Designation / Role" name="designation">
          <Input placeholder="e.g. Scientist-C / Senior Research Fellow" className="rounded-xl" />
        </Form.Item>

        <Form.Item label="Account Status" name="status" initialValue="Active">
          <Select className="rounded-xl">
            <Option value="Active">Active (Permitted to Book)</Option>
            <Option value="Inactive">Inactive (Suspended)</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
