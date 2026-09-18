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
      (eq.departmentName && eq.departmentName.toLowerCase().includes(q));

    const matchCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    const matchDept = selectedDept === 'all' || eq.departmentName === selectedDept;
    const matchStatus = selectedStatus === 'all' || eq.operationalStatus === selectedStatus;

    return matchSearch && matchCategory && matchDept && matchStatus;
  });

  const availableCategories = Array.from(
    new Set(['Research Infrastructure', 'Other', ...CATEGORIES, ...publicEquipments.map(e => e.category)])
  );

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <Input
              placeholder="Search instrument, code, make, room, department..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchDirectory}
              onChange={e => handleSearchChange(e.target.value)}
              allowClear
              className="rounded-xl text-xs flex-1 min-w-[220px] sm:min-w-[280px]"
            />

            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="rounded-xl text-xs w-full sm:w-[180px]"
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
              className="rounded-xl text-xs w-full sm:w-[220px]"
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
              className="rounded-xl text-xs w-full sm:w-[150px]"
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

          <div className="flex items-center justify-between xl:justify-end gap-3 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-zinc-800">
            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Showing <strong className="text-blue-600">{filteredEquipments.length}</strong> of {publicEquipments.length}
            </div>

            <div className="flex items-center gap-2">
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
                  <AppstoreOutlined /> Grid
                </Radio.Button>
                <Radio.Button value="table">
                  <UnorderedListOutlined /> Table
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEquipments.map(eq => (
            <Card
              key={eq.id}
              hoverable
              className="rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md bg-white dark:bg-zinc-900"
              cover={
                <div
                  className="h-52 bg-slate-950 relative overflow-hidden group flex items-center justify-center cursor-pointer select-none"
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
                        className="relative z-10 max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Zoom hint overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-white/20">
                          <EyeOutlined /> Click to Zoom Photo
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-zinc-800">
                      <ExperimentOutlined className="text-4xl text-slate-400 mb-1" />
                      <span className="text-xs">No photograph attached</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 z-30 pointer-events-none">
                    <Tag color="blue" className="font-bold border-0 bg-slate-950/85 backdrop-blur-md text-white shadow-sm">
                      {eq.category}
                    </Tag>
                  </div>

                  <div className="absolute top-3 right-3 z-30 pointer-events-none">
                    {renderOperationalStatusBadge(eq.operationalStatus)}
                  </div>

                  <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 pointer-events-none">
                    {eq.approvedAbbreviation && (
                      <span className="bg-slate-950/85 backdrop-blur-md text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-white/10">
                        {eq.approvedAbbreviation}
                      </span>
                    )}
                    {eq.photos && eq.photos.length > 1 && (
                      <span className="bg-blue-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        +{eq.photos.length - 1} more
                      </span>
                    )}
                  </div>
                </div>
              }
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-bold text-base text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleViewDetail(eq)}
                  >
                    {eq.name}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Make & Model:</span>
                    <span className="truncate">{eq.make || '-'} {eq.model ? `(${eq.model})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Location:</span>
                    <span className="truncate">{eq.currentLocation || eq.location || 'Central Lab'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">Facility / Dept:</span>
                    <span className="truncate">{eq.facilityName || eq.departmentName || 'CIF'}</span>
                  </div>
                </div>

                {/* Booking Status Badge / Banner */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  {eq.activeBooking ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <LockOutlined /> Currently Booked
                        </span>
                        <Tag color="error" className="font-bold text-[10px] m-0">RESERVED</Tag>
                      </div>
                      <div className="text-slate-900 dark:text-zinc-100 font-semibold flex items-center gap-1.5">
                        <UserOutlined className="text-rose-500" />
                        <span>Booked by: <span className="font-bold text-blue-700 dark:text-blue-400">{eq.activeBooking.bookedBy}</span></span>
                      </div>
                      <div className="text-slate-700 dark:text-zinc-300 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-rose-100 dark:border-rose-900/40 font-mono">
                        <div><strong>From:</strong> {eq.activeBooking.fromDateTime}</div>
                        <div><strong>To:</strong> {eq.activeBooking.toDateTime}</div>
                      </div>
                      {eq.activeBooking.purposeRemark && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 italic truncate">
                          <strong>Purpose:</strong> {eq.activeBooking.purposeRemark}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircleOutlined /> Available for Booking
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(eq)}
                  className="text-xs font-semibold rounded-lg"
                >
                  Specs & Docs
                </Button>

                <Button
                  type="primary"
                  size="small"
                  icon={<CalendarOutlined />}
                  disabled={eq.operationalStatus !== 'Working' || !!eq.activeBooking}
                  onClick={() => onQuickBook(eq)}
                  className={
                    eq.activeBooking
                      ? "bg-slate-300 text-slate-600 text-xs font-bold rounded-lg cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg"
                  }
                >
                  {eq.activeBooking ? 'Currently Booked' : 'Book Instrument'}
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
        >
          <Table
            dataSource={filteredEquipments}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Equipment Name',
                key: 'name',
                render: (_, eq) => (
                  <div>
                    <div className="font-bold text-slate-900 dark:text-zinc-100">{eq.name}</div>
                    {eq.approvedAbbreviation && (
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
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
                render: c => <Tag color="blue">{c}</Tag>
              },
              {
                title: 'Make / Model',
                key: 'makeModel',
                render: (_, eq) => `${eq.make || '-'} ${eq.model ? `(${eq.model})` : ''}`
              },
              { title: 'Department / Facility', dataIndex: 'departmentName', key: 'dept' },
              {
                title: 'Current Location',
                dataIndex: 'currentLocation',
                key: 'location',
                render: (l, r) => l || r.location || '-'
              },
              {
                title: 'Booking Status & Slot',
                key: 'bookingStatus',
                render: (_, eq) =>
                  eq.activeBooking ? (
                    <div className="space-y-1">
                      <Tag color="error" icon={<LockOutlined />} className="font-bold">
                        Booked
                      </Tag>
                      <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1">
                        <UserOutlined className="text-rose-500 text-[10px]" /> {eq.activeBooking.bookedBy}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {eq.activeBooking.fromDateTime} → {eq.activeBooking.toDateTime}
                      </div>
                    </div>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
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
                render: (_, eq) => (
                  <Space size="small">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(eq)}
                      className="rounded-lg"
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      disabled={eq.operationalStatus !== 'Working' || !!eq.activeBooking}
                      onClick={() => onQuickBook(eq)}
                      className={eq.activeBooking ? 'bg-slate-300 rounded-lg' : 'bg-blue-600 rounded-lg'}
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
