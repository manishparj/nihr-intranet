import React, { useState } from 'react';
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
  PrinterOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { EquipmentBooking } from '../../types/labEquipment';

const { Option } = Select;

export interface AdminBookingTabProps {
  bookings?: EquipmentBooking[];
  adminBookings?: EquipmentBooking[];
  loading?: boolean;
  bookingSearch?: string;
  search?: string;
  setBookingSearch?: (val: string) => void;
  onSearchChange?: (val: string) => void;
  bookingStatusFilter?: string;
  statusFilter?: string;
  setBookingStatusFilter?: (val: string) => void;
  onStatusChange?: (val: string) => void;
  onReviewBooking?: (booking: EquipmentBooking) => void;
  onReview?: (booking: EquipmentBooking) => void;
  onDirectReleaseBooking?: ((bookingId: string) => void) | ((booking: EquipmentBooking) => void);
  onDeleteBooking?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPrintBookingSlip?: (booking: EquipmentBooking) => void;
  onPrintSlip?: (booking: EquipmentBooking) => void;
  onRefresh?: () => void;
}

export const AdminBookingTab: React.FC<AdminBookingTabProps> = ({
  bookings,
  adminBookings,
  loading = false,
  bookingSearch,
  search,
  setBookingSearch,
  onSearchChange,
  bookingStatusFilter,
  statusFilter,
  setBookingStatusFilter,
  onStatusChange,
  onReviewBooking,
  onReview,
  onDirectReleaseBooking,
  onDeleteBooking,
  onDelete,
  onPrintBookingSlip,
  onPrintSlip,
  onRefresh
}) => {
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [internalStatus, setInternalStatus] = useState<string>('all');

  const currentBookings = bookings || adminBookings || [];
  const currentSearch =
    bookingSearch !== undefined
      ? bookingSearch
      : search !== undefined
      ? search
      : internalSearch;
  const handleSearchChange = setBookingSearch || onSearchChange || setInternalSearch;

  const currentStatus =
    bookingStatusFilter !== undefined
      ? bookingStatusFilter
      : statusFilter !== undefined
      ? statusFilter
      : internalStatus;
  const handleStatusChange = setBookingStatusFilter || onStatusChange || setInternalStatus;

  const handleReview = onReviewBooking || onReview || (() => {});
  const handleDirectRelease = (b: EquipmentBooking) => {
    if (onDirectReleaseBooking) {
      (onDirectReleaseBooking as any)(b.id, b);
    }
  };
  const handleDelete = onDeleteBooking || onDelete || (() => {});
  const handlePrint = onPrintBookingSlip || onPrintSlip || (() => {});

  const filteredBookings = currentBookings.filter(b => {
    const q = currentSearch.toLowerCase();
    const matchSearch =
      !q ||
      b.id.toLowerCase().includes(q) ||
      b.applicantName.toLowerCase().includes(q) ||
      b.applicantMobile.includes(q) ||
      (b.applicantEmail && b.applicantEmail.toLowerCase().includes(q)) ||
      (b.equipmentNames && b.equipmentNames.some(name => name.toLowerCase().includes(q))) ||
      (b.purposeRemark && b.purposeRemark.toLowerCase().includes(q));

    const matchStatus = currentStatus === 'all' || b.status === currentStatus;

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
              placeholder="Search booking ID, applicant, mobile, equipment..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={currentSearch}
              onChange={e => handleSearchChange(e.target.value)}
              allowClear
              className="rounded-xl text-xs flex-1 min-w-[220px]"
            />

            <Select
              value={currentStatus}
              onChange={handleStatusChange}
              className="rounded-xl text-xs w-full sm:w-[160px]"
            >
              <Option value="all">All Statuses</Option>
              <Option value="Pending">Pending Review</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Rejected">Rejected</Option>
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
            <div className="text-xs text-slate-500 font-semibold px-2">
              Showing {filteredBookings.length} of {currentBookings.length} Bookings
            </div>
          </div>
        </div>
      </Card>

      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <Table
          dataSource={filteredBookings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Booking ID & Applicant',
              key: 'info',
              render: (_, b) => (
                <div>
                  <div className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-xs">
                    {b.id}
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1.5">
                    <UserOutlined className="text-blue-600" /> {b.applicantName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {b.applicantMobile} {b.applicantEmail ? `• ${b.applicantEmail}` : ''}
                  </div>
                </div>
              )
            },
            {
              title: 'Requested Equipment(s)',
              key: 'equipments',
              render: (_, b) => (
                <div className="space-y-1">
                  {b.equipmentNames.map((name, i) => (
                    <Tag key={i} color="blue" className="font-semibold text-xs rounded-md block max-w-xs truncate">
                      {name}
                    </Tag>
                  ))}
                </div>
              )
            },
            {
              title: 'Reservation Window',
              key: 'slot',
              render: (_, b) => (
                <div className="text-xs space-y-0.5">
                  <div className="font-mono text-slate-800 dark:text-zinc-200">
                    <strong>From:</strong> {b.fromDateTime}
                  </div>
                  <div className="font-mono text-slate-800 dark:text-zinc-200">
                    <strong>To:</strong> {b.toDateTime}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Duration: <strong>{b.durationHours || 0} Hours</strong>
                  </div>
                </div>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (s: string) => {
                let color = 'gold';
                if (s === 'Approved') color = 'success';
                if (s === 'Completed') color = 'blue';
                if (s === 'Rejected') color = 'error';
                return (
                  <Tag color={color} className="font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {s}
                  </Tag>
                );
              }
            },
            {
              title: 'Purpose / Remarks',
              key: 'purpose',
              render: (_, b) => (
                <div className="text-xs max-w-xs space-y-1">
                  <div className="text-slate-700 dark:text-zinc-300 line-clamp-2">
                    {b.purposeRemark || '-'}
                  </div>
                  {b.adminRemark && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                      Admin: {b.adminRemark}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, b) => (
                <Space size="small" wrap>
                  <Button
                    size="small"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleReview(b)}
                    className="bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold"
                  >
                    Review
                  </Button>
                  {b.status === 'Approved' && (
                    <Button
                      size="small"
                      icon={<ThunderboltOutlined />}
                      onClick={() => handleDirectRelease(b)}
                      className="rounded-lg text-xs font-semibold text-emerald-600 border-emerald-500 hover:bg-emerald-50"
                    >
                      Mark Done
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrint(b)}
                    className="rounded-lg text-xs"
                    title="Print Booking Slip"
                  />
                  {onDeleteBooking || onDelete ? (
                    <Popconfirm
                      title="Delete Booking Record"
                      description="Are you sure you want to delete this booking requisition?"
                      onConfirm={() => handleDelete(b.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        className="rounded-lg text-xs"
                      />
                    </Popconfirm>
                  ) : null}
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};
