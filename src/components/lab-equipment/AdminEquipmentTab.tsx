import React from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { Equipment } from '../../types/labEquipment';
import { CATEGORIES, renderOperationalStatusBadge } from './constants';

const { Option } = Select;

export interface AdminEquipmentTabProps {
  equipments?: Equipment[];
  adminEquipments?: Equipment[];
  loading?: boolean;
  search?: string;
  adminSearchEquipments?: string;
  onSearchChange?: (val: string) => void;
  setAdminSearchEquipments?: (val: string) => void;
  categoryFilter?: string;
  adminCategoryFilter?: string;
  onCategoryChange?: (val: string) => void;
  setAdminCategoryFilter?: (val: string) => void;
  statusFilter?: string;
  adminStatusFilter?: string;
  onStatusChange?: (val: string) => void;
  setAdminStatusFilter?: (val: string) => void;
  onOpenAddModal?: () => void;
  onAddNew?: () => void;
  onOpenCsvImportModal?: () => void;
  onOpenImportCsv?: () => void;
  onExportCsv?: () => void;
  onExportMasterCSV?: () => void;
  onOpenEditModal?: (eq: Equipment) => void;
  onEdit?: (eq: Equipment) => void;
  onDeleteEquipment?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenLightbox?: (url: string, title: string) => void;
  onPreviewPhoto?: (url: string, title: string) => void;
  onViewDetail?: (eq: Equipment) => void;
  onViewDetails?: (eq: Equipment) => void;
  onRefresh?: () => void;
}

export const AdminEquipmentTab: React.FC<AdminEquipmentTabProps> = ({
  equipments,
  adminEquipments,
  loading = false,
  search,
  adminSearchEquipments,
  onSearchChange,
  setAdminSearchEquipments,
  categoryFilter,
  adminCategoryFilter,
  onCategoryChange,
  setAdminCategoryFilter,
  statusFilter,
  adminStatusFilter,
  onStatusChange,
  setAdminStatusFilter,
  onOpenAddModal,
  onAddNew,
  onOpenCsvImportModal,
  onOpenImportCsv,
  onExportCsv,
  onExportMasterCSV,
  onOpenEditModal,
  onEdit,
  onDeleteEquipment,
  onDelete,
  onOpenLightbox,
  onPreviewPhoto,
  onViewDetail,
  onViewDetails,
  onRefresh
}) => {
  const currentEquipments = equipments || adminEquipments || [];
  const currentSearch = search !== undefined ? search : (adminSearchEquipments || '');
  const handleSearchChange = onSearchChange || setAdminSearchEquipments || (() => {});
  const currentCategory = categoryFilter !== undefined ? categoryFilter : (adminCategoryFilter || 'all');
  const handleCategoryChange = onCategoryChange || setAdminCategoryFilter || (() => {});
  const currentStatus = statusFilter !== undefined ? statusFilter : (adminStatusFilter || 'all');
  const handleStatusChange = onStatusChange || setAdminStatusFilter || (() => {});

  const handleAddNew = onOpenAddModal || onAddNew || (() => {});
  const handleOpenImport = onOpenCsvImportModal || onOpenImportCsv || (() => {});
  const handleExport = onExportCsv || onExportMasterCSV || (() => {});
  const handleEdit = onOpenEditModal || onEdit || (() => {});
  const handleDelete = onDeleteEquipment || onDelete || (() => {});
  const handlePreview = onOpenLightbox || onPreviewPhoto || (() => {});
  const handleDetail = onViewDetail || onViewDetails || (() => {});

  const filteredEquipments = currentEquipments.filter(eq => {
    const q = currentSearch.toLowerCase();
    const matchSearch =
      !q ||
      eq.name.toLowerCase().includes(q) ||
      eq.id.toLowerCase().includes(q) ||
      (eq.approvedAbbreviation && eq.approvedAbbreviation.toLowerCase().includes(q)) ||
      (eq.make && eq.make.toLowerCase().includes(q)) ||
      (eq.model && eq.model.toLowerCase().includes(q)) ||
      (eq.location && eq.location.toLowerCase().includes(q)) ||
      (eq.departmentName && eq.departmentName.toLowerCase().includes(q)) ||
      (eq.contactPersonName && eq.contactPersonName.toLowerCase().includes(q)) ||
      (eq.contactPersonEmail && eq.contactPersonEmail.toLowerCase().includes(q)) ||
      (eq.contactPersonMobile && eq.contactPersonMobile.toLowerCase().includes(q));

    const matchCategory = currentCategory === 'all' || eq.category === currentCategory;
    const matchStatus = currentStatus === 'all' || eq.operationalStatus === currentStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const availableCategories = Array.from(
    new Set(['Research Infrastructure', 'Other', ...CATEGORIES, ...currentEquipments.map(e => e.category)])
  );

  return (
    <div className="space-y-4">
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <Input
              placeholder="Search master equipment records..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={currentSearch}
              onChange={e => handleSearchChange(e.target.value)}
              allowClear
              className="rounded-xl text-xs flex-1 min-w-[200px]"
            />

            <Select
              value={currentCategory}
              onChange={handleCategoryChange}
              className="rounded-xl text-xs w-full sm:w-[170px]"
            >
              <Option value="all">All Categories</Option>
              {availableCategories.map(c => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>

            <Select
              value={currentStatus}
              onChange={handleStatusChange}
              className="rounded-xl text-xs w-full sm:w-[150px]"
            >
              <Option value="all">All Statuses</Option>
              <Option value="Working">Working</Option>
              <Option value="Under Maintenance">Maintenance</Option>
              <Option value="Out of Order">Out of Order</Option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-zinc-800">
            {onRefresh && (
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                className="rounded-xl text-xs"
              />
            )}
            <Button
              icon={<UploadOutlined />}
              onClick={handleOpenImport}
              className="rounded-xl text-xs font-semibold"
            >
              Import CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              className="rounded-xl text-xs font-semibold"
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-xs shadow-sm"
            >
              Add New Equipment
            </Button>
          </div>
        </div>
      </Card>

      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <Table
          dataSource={filteredEquipments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Instrument / Make / Model',
              key: 'info',
              render: (_, eq) => (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200 dark:border-zinc-700 select-none shadow-sm relative group"
                    onClick={() => {
                      if (eq.photos && eq.photos.length > 0) {
                        handlePreview(eq.photos[0].url, eq.name);
                      }
                    }}
                  >
                    {eq.photos && eq.photos.length > 0 ? (
                      <img
                        src={eq.photos[0].url}
                        alt={eq.name}
                        className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <ExperimentOutlined className="text-slate-400 text-lg" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{eq.name}</span>
                      {eq.approvedAbbreviation && (
                        <Tag color="blue" className="font-mono text-[10px] m-0 font-bold">
                          {eq.approvedAbbreviation}
                        </Tag>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {eq.make || '-'} {eq.model ? `(${eq.model})` : ''} • Ref: <span className="font-mono text-[11px]">{eq.id}</span>
                    </div>
                  </div>
                </div>
              )
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: c => <Tag color="blue">{c}</Tag>
            },
            {
              title: 'Location & Dept',
              key: 'location',
              render: (_, eq) => (
                <div className="text-xs">
                  <div className="font-semibold text-slate-800 dark:text-zinc-200">{eq.location || '-'}</div>
                  <div className="text-slate-500">{eq.departmentName || '-'}</div>
                </div>
              )
            },
             {
              title: 'Contact Person',
              key: 'contact',
              render: (_, eq) =>
                eq.contactPersonName || eq.contactPersonEmail || eq.contactPersonMobile ? (
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                      <UserOutlined className="text-blue-600 text-[10px]" />
                      <span>{eq.contactPersonName || '-'}</span>
                    </div>
                    {eq.contactPersonEmail && (
                      <div className="text-[11px] text-blue-600 truncate max-w-[180px] flex items-center gap-1">
                        <MailOutlined className="text-[10px]" />
                        <span className="truncate">{eq.contactPersonEmail}</span>
                      </div>
                    )}
                    {eq.contactPersonMobile && (
                      <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono flex items-center gap-1">
                        <PhoneOutlined className="text-emerald-600 text-[10px]" />
                        <span>{eq.contactPersonMobile}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )
            },
            {
              title: 'Operational Status',
              dataIndex: 'operationalStatus',
              key: 'status',
              render: s => renderOperationalStatusBadge(s)
            },
            {
              title: 'Photos & Docs',
              key: 'assets',
              render: (_, eq) => (
                <div className="text-xs space-y-1">
                  <div>
                    📸 <strong>{eq.photos?.length || 0}</strong> Photo(s)
                  </div>
                  <div>
                    📄 <strong>{eq.documents?.length || 0}</strong> Doc(s)
                  </div>
                </div>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, eq) => (
                <Space size="small">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleDetail(eq)}
                    className="rounded-lg text-xs"
                    title="View Details"
                  />
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(eq)}
                    className="rounded-lg text-xs text-blue-600 hover:text-blue-500"
                    title="Edit Equipment"
                  />
                  <Popconfirm
                    title="Delete Equipment Record"
                    description={`Are you sure you want to delete ${eq.name}? This will permanently remove its catalog entry and documents.`}
                    onConfirm={() => handleDelete(eq.id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="rounded-lg text-xs"
                      title="Delete Equipment"
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
