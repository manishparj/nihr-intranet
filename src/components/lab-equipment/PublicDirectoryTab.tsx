import React from 'react';
import {
  Card,
  Input,
  Select,
  Tag,
  Button,
  Table,
  Radio,
  Empty,
  Space
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  CalendarOutlined,
  LockOutlined,
  CheckCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ExperimentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { PublicEquipment } from '../../types/labEquipment';
import { CATEGORIES, DEPARTMENTS, renderOperationalStatusBadge } from './constants';

const { Option } = Select;

export interface PublicDirectoryTabProps {
  publicEquipments: PublicEquipment[];
  loading?: boolean;
  searchDirectory: string;
  onSearchChange?: (val: string) => void;
  setSearchDirectory?: (val: string) => void;
  selectedCategory: string;
  onCategoryChange?: (val: string) => void;
  setSelectedCategory?: (val: string) => void;
  selectedDept: string;
  onDeptChange?: (val: string) => void;
  setSelectedDept?: (val: string) => void;
  selectedStatus: string;
  onStatusChange?: (val: string) => void;
  setSelectedStatus?: (val: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange?: (val: 'grid' | 'table') => void;
  setViewMode?: (val: 'grid' | 'table') => void;
  onViewDetail?: (eq: PublicEquipment) => void;
  onSelectEquipment?: (eq: PublicEquipment) => void;
  onQuickBook: (eq: PublicEquipment) => void;
  onOpenLightbox?: (url: string, title: string) => void;
  onPreviewPhoto?: (url: string, title: string) => void;
  onRefresh?: () => void;
}

export const PublicDirectoryTab: React.FC<PublicDirectoryTabProps> = ({
  publicEquipments,
  loading = false,
  searchDirectory,
  onSearchChange,
  setSearchDirectory,
  selectedCategory,
  onCategoryChange,
  setSelectedCategory,
  selectedDept,
  onDeptChange,
  setSelectedDept,
  selectedStatus,
  onStatusChange,
  setSelectedStatus,
  viewMode,
  onViewModeChange,
  setViewMode,
  onViewDetail,
  onSelectEquipment,
  onQuickBook,
  onOpenLightbox,
  onPreviewPhoto,
  onRefresh
}) => {
  const handleSearchChange = onSearchChange || setSearchDirectory || (() => {});
  const handleCategoryChange = onCategoryChange || setSelectedCategory || (() => {});
  const handleDeptChange = onDeptChange || setSelectedDept || (() => {});
  const handleStatusChange = onStatusChange || setSelectedStatus || (() => {});
  const handleViewModeChange = onViewModeChange || setViewMode || (() => {});
  const handleViewDetail = onViewDetail || onSelectEquipment || (() => {});
  const handlePreviewPhoto = onOpenLightbox || onPreviewPhoto || (() => {});
  const filteredEquipments = publicEquipments.filter(eq => {
    const q = searchDirectory.toLowerCase();
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

    const matchCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    const matchDept = selectedDept === 'all' || eq.departmentName === selectedDept;
    const matchStatus = selectedStatus === 'all' || eq.operationalStatus === selectedStatus;

    return matchSearch && matchCategory && matchDept && matchStatus;
  });

  const availableCategories = Array.from(
    new Set(['Research Infrastructure', 'Other', ...CATEGORIES, ...publicEquipments.map(e => e.category)])
  );

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        styles={{ body: { padding: '12px 14px' } }}
      >
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Input
              placeholder="Search instrument, code, make, room, department..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchDirectory}
              onChange={e => handleSearchChange(e.target.value)}
              allowClear
              size="small"
              className="rounded-xl text-xs flex-1 min-w-[180px] sm:min-w-[240px]"
            />

            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              size="small"
              className="rounded-xl text-xs w-[47%] sm:w-auto sm:min-w-[150px]"
            >
              <Option value="all">All Categories</Option>
              {availableCategories.map(c => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>

            <Select
              value={selectedDept}
              onChange={handleDeptChange}
              size="small"
              className="rounded-xl text-xs w-[47%] sm:w-auto sm:min-w-[180px]"
            >
              <Option value="all">All Departments / Facilities</Option>
              {DEPARTMENTS.map(d => (
                <Option key={d} value={d}>
                  {d}
                </Option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={handleStatusChange}
              size="small"
              className="rounded-xl text-xs w-[47%] sm:w-auto sm:min-w-[130px]"
            >
              <Option value="all">All Statuses</Option>
              <Option value="Working">Working</Option>
              <Option value="Under Maintenance">Maintenance</Option>
              <Option value="Out of Order">Out of Order</Option>
            </Select>

            {(searchDirectory || selectedCategory !== 'all' || selectedDept !== 'all' || selectedStatus !== 'all') && (
              <Button
                size="small"
                onClick={() => {
                  handleSearchChange('');
                  handleCategoryChange('all');
                  handleDeptChange('all');
                  handleStatusChange('all');
                }}
                className="rounded-lg text-xs"
              >
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between xl:justify-end gap-2.5 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-zinc-800">
            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Showing <strong className="text-blue-600">{filteredEquipments.length}</strong> of {publicEquipments.length}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="small"
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                className="rounded-lg text-xs"
                title="Refresh catalog"
              />

              <Radio.Group
                value={viewMode}
                onChange={e => handleViewModeChange(e.target.value)}
                buttonStyle="solid"
                size="small"
                className="rounded-lg overflow-hidden"
              >
                <Radio.Button value="grid">
                  <AppstoreOutlined /> <span className="hidden sm:inline">Grid</span>
                </Radio.Button>
                <Radio.Button value="table">
                  <UnorderedListOutlined /> <span className="hidden sm:inline">Table</span>
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {filteredEquipments.map(eq => (
            <Card
              key={eq.id}
              hoverable
              size="small"
              className="rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md bg-white dark:bg-zinc-900"
              styles={{ body: { padding: '8px 10px' } }}
              cover={
                <div
                  className="h-28 sm:h-32 bg-slate-950 relative overflow-hidden group flex items-center justify-center cursor-pointer select-none"
                  onClick={() => {
                    if (eq.photos && eq.photos.length > 0) {
                      handlePreviewPhoto(eq.photos[0].url, eq.name);
                    } else {
                      handleViewDetail(eq);
                    }
                  }}
                >
                  {eq.photos && eq.photos.length > 0 ? (
                    <>
                      {/* Ambient background blur for cinematic framing */}
                      <img
                        src={eq.photos[0].url}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110 pointer-events-none"
                      />
                      {/* Main full-aspect equipment photo */}
                      <img
                        src={eq.photos[0].url}
                        alt={eq.name}
                        className="relative z-10 max-h-full max-w-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Zoom hint overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-lg border border-white/20">
                          <EyeOutlined /> Zoom
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-zinc-800">
                      <ExperimentOutlined className="text-2xl text-slate-400 mb-1" />
                      <span className="text-[10px]">No photo</span>
                    </div>
                  )}

                  <div className="absolute top-1.5 left-1.5 z-30 pointer-events-none max-w-[75%]">
                    <Tag
                      color="blue"
                      className="font-bold border-0 bg-slate-950/85 backdrop-blur-md text-white shadow-sm text-[10px] px-1.5 py-0 leading-4 m-0 truncate block"
                    >
                      {eq.category}
                    </Tag>
                  </div>

                  <div className="absolute top-1.5 right-1.5 z-30 pointer-events-none scale-90 origin-top-right">
                    {renderOperationalStatusBadge(eq.operationalStatus)}
                  </div>

                  <div className="absolute bottom-1.5 left-1.5 z-30 flex items-center gap-1 pointer-events-none">
                    {eq.approvedAbbreviation && (
                      <span className="bg-slate-950/85 backdrop-blur-md text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-white/10">
                        {eq.approvedAbbreviation}
                      </span>
                    )}
                    {eq.photos && eq.photos.length > 1 && (
                      <span className="bg-blue-600/90 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                        +{eq.photos.length - 1}
                      </span>
                    )}
                  </div>
                </div>
              }
            >
              <div>
                <h3
                  className="font-bold text-[12.5px] text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors min-h-[2.4em]"
                  onClick={() => handleViewDetail(eq)}
                >
                  {eq.name}
                </h3>

                <div className="mt-1 space-y-0.5 text-[10.5px] text-slate-600 dark:text-zinc-400">
                  <div className="truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Model: </span>
                    <span>{eq.make || '-'} {eq.model ? `(${eq.model})` : ''}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Loc: </span>
                    <span>{eq.currentLocation || eq.location || 'Central Lab'}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Dept: </span>
                    <span>{eq.facilityName || eq.departmentName || 'CIF'}</span>
                  </div>
                </div>

                {/* Contact Person Details */}
                {(eq.contactPersonName || eq.contactPersonEmail || eq.contactPersonMobile) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 p-2 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 font-semibold truncate">
                      <UserOutlined className="text-blue-600 text-[11px]" />
                      <span className="truncate">{eq.contactPersonName || 'In-Charge'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                      {eq.contactPersonEmail && (
                        <a
                          href={`mailto:${eq.contactPersonEmail}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline truncate flex items-center gap-1"
                          title={eq.contactPersonEmail}
                        >
                          <MailOutlined className="text-[10px]" />
                          <span className="truncate">{eq.contactPersonEmail}</span>
                        </a>
                      )}
                      {eq.contactPersonMobile && (
                        <a
                          href={`tel:${eq.contactPersonMobile}`}
                          className="text-slate-600 dark:text-zinc-400 hover:text-blue-600 font-mono flex items-center gap-1 shrink-0"
                          title={eq.contactPersonMobile}
                        >
                          <PhoneOutlined className="text-emerald-600 text-[10px]" />
                          <span>{eq.contactPersonMobile}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Status Badge / Banner */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                  {eq.activeBooking ? (
                    <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          <LockOutlined /> Booked
                        </span>
                      </div>
                      <div className="text-slate-900 dark:text-zinc-100 font-semibold flex items-center gap-1 truncate">
                        <UserOutlined className="text-rose-500 shrink-0" />
                        <span className="truncate">{eq.activeBooking.bookedBy}</span>
                      </div>
                      <div className="text-slate-600 dark:text-zinc-400 text-[9.5px] font-mono truncate">
                        {eq.activeBooking.fromDateTime} → {eq.activeBooking.toDateTime}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircleOutlined /> Available
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(eq)}
                  className="text-[10.5px] font-semibold rounded-lg px-1.5"
                >
                  Specs
                </Button>

                <Button
                  type="primary"
                  size="small"
                  icon={<CalendarOutlined />}
                  disabled={eq.operationalStatus !== 'Working' || !!eq.activeBooking}
                  onClick={() => onQuickBook(eq)}
                  className={
                    eq.activeBooking
                      ? "bg-slate-300 text-slate-600 text-[10.5px] font-bold rounded-lg cursor-not-allowed px-1.5"
                      : "bg-blue-600 hover:bg-blue-500 text-[10.5px] font-bold rounded-lg px-1.5"
                  }
                >
                  {eq.activeBooking ? 'Booked' : 'Book'}
                </Button>
              </div>
            </Card>
          ))}

          {filteredEquipments.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <Empty description="No equipment found matching your filter criteria" />
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Card
          variant="borderless"
          className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={filteredEquipments}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="small"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Equipment Name',
                key: 'name',
                render: (_, eq) => (
                  <div>
                    <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs">{eq.name}</div>
                    {eq.approvedAbbreviation && (
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {eq.approvedAbbreviation}
                      </span>
                    )}
                  </div>
                )
              },
              {
                title: 'Category',
                dataIndex: 'category',
                key: 'category',
                render: c => <Tag color="blue" className="text-[10px]">{c}</Tag>
              },
              {
                title: 'Make / Model',
                key: 'makeModel',
                render: (_, eq) => (
                  <span className="text-xs">{eq.make || '-'} {eq.model ? `(${eq.model})` : ''}</span>
                )
              },
              {
                title: 'Department / Facility',
                dataIndex: 'departmentName',
                key: 'dept',
                render: (d) => <span className="text-xs">{d}</span>
              },
              {
                title: 'Current Location',
                dataIndex: 'currentLocation',
                key: 'location',
                render: (l, r) => <span className="text-xs">{l || r.location || '-'}</span>
              },
              {
                title: 'Booking Status & Slot',
                key: 'bookingStatus',
                render: (_, eq) =>
                  eq.activeBooking ? (
                    <div className="space-y-0.5">
                      <Tag color="error" icon={<LockOutlined />} className="font-bold text-[10px]">
                        Booked
                      </Tag>
                      <div className="font-bold text-[11px] text-slate-900 dark:text-zinc-100 flex items-center gap-1">
                        <UserOutlined className="text-rose-500 text-[10px]" /> {eq.activeBooking.bookedBy}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {eq.activeBooking.fromDateTime} → {eq.activeBooking.toDateTime}
                      </div>
                    </div>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} className="text-[10px]">
                      Available
                    </Tag>
                  )
              },
              {
                title: 'Operational Status',
                key: 'status',
                render: (_, eq) => renderOperationalStatusBadge(eq.operationalStatus)
              },
              {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                render: (_, eq) => (
                  <Space size="small">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(eq)}
                      className="rounded-lg text-xs"
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      disabled={eq.operationalStatus !== 'Working' || !!eq.activeBooking}
                      onClick={() => onQuickBook(eq)}
                      className={eq.activeBooking ? 'bg-slate-300 rounded-lg text-xs' : 'bg-blue-600 rounded-lg text-xs'}
                    >
                      {eq.activeBooking ? 'Booked' : 'Book'}
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}
    </div>
  );
};