import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  Tooltip,
  message
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  KeyOutlined,
  ReloadOutlined,
  PhoneOutlined,
  MailOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { LabApplicant } from '../../types/labEquipment';

const { Option } = Select;

export interface AdminApplicantTabProps {
  applicants?: LabApplicant[];
  adminApplicants?: LabApplicant[];
  loading?: boolean;
  applicantSearch?: string;
  search?: string;
  setApplicantSearch?: (val: string) => void;
  onSearchChange?: (val: string) => void;
  applicantStatusFilter?: string;
  statusFilter?: string;
  setApplicantStatusFilter?: (val: string) => void;
  onStatusChange?: (val: string) => void;
  onOpenAddModal?: () => void;
  onAddNew?: () => void;
  onOpenEditModal?: (app: LabApplicant) => void;
  onEdit?: (app: LabApplicant) => void;
  onResetSecretCode?: (app: LabApplicant) => void;
  onRegenerateCode?: (app: LabApplicant) => void;
  onDeleteApplicant?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export const AdminApplicantTab: React.FC<AdminApplicantTabProps> = ({
  applicants,
  adminApplicants,
  loading = false,
  applicantSearch,
  search,
  setApplicantSearch,
  onSearchChange,
  applicantStatusFilter,
  statusFilter,
  setApplicantStatusFilter,
  onStatusChange,
  onOpenAddModal,
  onAddNew,
  onOpenEditModal,
  onEdit,
  onResetSecretCode,
  onRegenerateCode,
  onDeleteApplicant,
  onDelete,
  onRefresh
}) => {
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [internalStatus, setInternalStatus] = useState<string>('all');
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});

  const toggleRevealCode = (id: string) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string = 'Passcode') => {
    if (!text) {
      message.warning('No passcode available to copy');
      return;
    }
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard: ${text}`);
  };

  const currentApplicants = applicants || adminApplicants || [];
  const currentSearch =
    applicantSearch !== undefined
      ? applicantSearch
      : search !== undefined
      ? search
      : internalSearch;
  const handleSearchChange = setApplicantSearch || onSearchChange || setInternalSearch;

  const currentStatus =
    applicantStatusFilter !== undefined
      ? applicantStatusFilter
      : statusFilter !== undefined
      ? statusFilter
      : internalStatus;
  const handleStatusChange = setApplicantStatusFilter || onStatusChange || setInternalStatus;

  const handleAdd = onOpenAddModal || onAddNew || (() => {});
  const handleEdit = onOpenEditModal || onEdit || (() => {});
  const handleResetCode = onResetSecretCode || onRegenerateCode || (() => {});
  const handleDelete = onDeleteApplicant || onDelete || (() => {});

  const filteredApplicants = currentApplicants.filter(a => {
    const q = currentSearch.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.mobile.includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.department && a.department.toLowerCase().includes(q)) ||
      (a.designation && a.designation.toLowerCase().includes(q));

    const matchStatus = currentStatus === 'all' || a.status === currentStatus;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <Input
              placeholder="Search applicant name, mobile, email, division..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={currentSearch}
              onChange={e => handleSearchChange(e.target.value)}
              allowClear
              className="rounded-xl text-xs flex-1 min-w-[200px]"
            />

            <Select
              value={currentStatus}
              onChange={handleStatusChange}
              className="rounded-xl text-xs w-full sm:w-[150px]"
            >
              <Option value="all">All Statuses</Option>
              <Option value="Active">Active</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
            {onRefresh && (
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                className="rounded-xl text-xs"
              />
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-xs shadow-sm"
            >
              Add Authorized Applicant
            </Button>
          </div>
        </div>
      </Card>

      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <Table
          dataSource={filteredApplicants}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Applicant Details',
              key: 'info',
              render: (_, app) => (
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <UserOutlined className="text-blue-600" />
                    <span>{app.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {app.designation || 'Staff'} • Ref: <span className="font-mono text-[11px]">{app.id}</span>
                  </div>
                </div>
              )
            },
            {
              title: 'Contact Information',
              key: 'contact',
              render: (_, app) => (
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-zinc-200">
                    <PhoneOutlined className="text-slate-400" /> {app.mobile}
                  </div>
                  {app.email && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MailOutlined className="text-slate-400" /> {app.email}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: 'Department / Lab',
              dataIndex: 'department',
              key: 'dept',
              render: d => <span className="text-xs">{d || '-'}</span>
            },
            {
              title: '8-Digit Secret Passcode',
              key: 'secretCode',
              render: (_, app) => {
                const isRevealed = revealedCodes[app.id] ?? true; // Visible by default to Super Admin
                const rawCode = app.secretCode || (app as any).code || '';
                const displayCode = isRevealed && rawCode ? rawCode : rawCode ? '••••••••' : (app.secretCodeHint || '••••••••');

                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                      <KeyOutlined className="text-amber-600 text-xs" />
                      <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200 tracking-wider">
                        {displayCode}
                      </span>
                      {rawCode && (
                        <>
                          <Tooltip title={isRevealed ? "Hide Passcode" : "Reveal Passcode"}>
                            <Button
                              size="small"
                              type="text"
                              icon={isRevealed ? <EyeInvisibleOutlined className="text-slate-400 hover:text-slate-600" /> : <EyeOutlined className="text-slate-400 hover:text-slate-600" />}
                              onClick={() => toggleRevealCode(app.id)}
                              className="w-5 h-5 min-w-5 p-0 flex items-center justify-center text-[11px]"
                            />
                          </Tooltip>
                          <Tooltip title="Copy 8-Digit Passcode">
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined className="text-amber-700 hover:text-amber-900" />}
                              onClick={() => copyToClipboard(rawCode, `Passcode for ${app.name}`)}
                              className="w-5 h-5 min-w-5 p-0 flex items-center justify-center text-[11px]"
                            />
                          </Tooltip>
                        </>
                      )}
                    </div>
                    <Tooltip title="Update or Reset Passcode">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => handleEdit(app)}
                        className="text-xs text-blue-600 dark:text-blue-400 p-0 font-semibold"
                      >
                        Update
                      </Button>
                    </Tooltip>
                  </div>
                );
              }
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: s => (
                <Tag color={s === 'Active' ? 'success' : 'error'} className="font-bold text-xs">
                  {s}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, app) => (
                <Space size="small">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(app)}
                    className="rounded-lg text-xs text-blue-600 hover:text-blue-500"
                    title="Edit Applicant Profile"
                  />
                  <Popconfirm
                    title="Delete Applicant Record"
                    description={`Are you sure you want to remove ${app.name}? This will invalidate their authorization.`}
                    onConfirm={() => handleDelete(app.id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="rounded-lg text-xs"
                      title="Delete Applicant"
                    />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};
