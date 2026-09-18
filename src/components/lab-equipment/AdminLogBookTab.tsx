import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Radio,
  Tooltip
} from 'antd';
import {
  HistoryOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  PrinterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Equipment, EquipmentBooking, LabApplicant, LabActivityLog } from '../../types/labEquipment';
import { renderOperationalStatusBadge } from './constants';
import { AdminActivityLogsTab } from './AdminActivityLogsTab';

const { Option } = Select;

export interface AdminLogBookTabProps {
  equipments?: Equipment[];
  adminEquipments?: Equipment[];
  applicants?: LabApplicant[];
  adminApplicants?: LabApplicant[];
  bookings?: EquipmentBooking[];
  adminBookings?: EquipmentBooking[];
  adminActivityLogs?: LabActivityLog[];
  logSubView?: 'logbook' | 'audit';
  setLogSubView?: (val: 'logbook' | 'audit') => void;
  selectedEquipmentId?: string;
  selectedLogEquipmentId?: string;
  onSelectedEquipmentChange?: (val: string) => void;
  setSelectedLogEquipmentId?: (val: string) => void;
  selectedStatus?: string;
  selectedLogStatus?: string;
  onSelectedStatusChange?: (val: string) => void;
  setSelectedLogStatus?: (val: string) => void;
  search?: string;
  logSearch?: string;
  onSearchChange?: (val: string) => void;
  setLogSearch?: (val: string) => void;
  onOpenPrintModal?: () => void;
  onExportCsv?: () => void;
  onPrintBookingSlip?: (booking: EquipmentBooking) => void;
}

export const AdminLogBookTab: React.FC<AdminLogBookTabProps> = ({
  equipments,
  adminEquipments,
  applicants,
  adminApplicants,
  bookings,
  adminBookings,
  adminActivityLogs = [],
  logSubView: propLogSubView,
  setLogSubView: propSetLogSubView,
  selectedEquipmentId,
  selectedLogEquipmentId,
  onSelectedEquipmentChange,
  setSelectedLogEquipmentId,
  selectedStatus,
  selectedLogStatus,
  onSelectedStatusChange,
  setSelectedLogStatus,
  search,
  logSearch,
  onSearchChange,
  setLogSearch,
  onOpenPrintModal,
  onExportCsv,
  onPrintBookingSlip
}) => {
  const [internalLogSubView, setInternalLogSubView] = useState<'logbook' | 'audit'>('logbook');
  const [internalEqId, setInternalEqId] = useState<string>('all');
  const [internalStatus, setInternalStatus] = useState<string>('all');
  const [internalSearch, setInternalSearch] = useState<string>('');

  const currentEquipments = equipments || adminEquipments || [];
  const currentApplicants = applicants || adminApplicants || [];
  const currentBookings = bookings || adminBookings || [];

  const activeSubView = propLogSubView !== undefined ? propLogSubView : internalLogSubView;
  const handleSetSubView = propSetLogSubView || setInternalLogSubView;

  const currentEqId =
    selectedEquipmentId !== undefined
      ? selectedEquipmentId
      : selectedLogEquipmentId !== undefined
      ? selectedLogEquipmentId
      : internalEqId;
  const handleEqIdChange = onSelectedEquipmentChange || setSelectedLogEquipmentId || setInternalEqId;

  const currentStatusFilter =
    selectedStatus !== undefined
      ? selectedStatus
      : selectedLogStatus !== undefined
      ? selectedLogStatus
      : internalStatus;
  const handleStatusChange = onSelectedStatusChange || setSelectedLogStatus || setInternalStatus;

  const currentSearch =
    search !== undefined
      ? search
      : logSearch !== undefined
      ? logSearch
      : internalSearch;
  const handleSearchChange = onSearchChange || setLogSearch || setInternalSearch;

  const getBookingEquipment = (bk: EquipmentBooking) => {
    return currentEquipments.find(e => bk.equipmentIds?.includes(e.id)) || null;
  };

  const getBookingApplicant = (bk: EquipmentBooking) => {
    return currentApplicants.find(a => a.id === bk.applicantId || a.mobile === bk.applicantMobile) || null;
  };

  const selectedEquipment =
    currentEqId !== 'all'
      ? currentEquipments.find(e => e.id === currentEqId) || null
      : null;

  const filteredLogBookBookings = currentBookings.filter(bk => {
    if (currentEqId !== 'all' && !bk.equipmentIds?.includes(currentEqId)) {
      return false;
    }
    if (currentStatusFilter !== 'all' && bk.status !== currentStatusFilter) {
      return false;
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
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

  return (
    <div className="space-y-4">
      {/* Header with Switcher */}
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <HistoryOutlined className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 m-0">
                Equipment Movement & Activity Log Book
                <Tag color="blue" className="text-[11px] font-semibold">Institutional Register</Tag>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 m-0">
                Official register of equipment custody, booking stay periods, research protocols & approving authorities
              </p>
            </div>
          </div>

          {adminActivityLogs.length > 0 && (
            <Radio.Group
              value={activeSubView}
              onChange={e => handleSetSubView(e.target.value)}
              buttonStyle="solid"
              size="middle"
              className="rounded-xl overflow-hidden"
            >
              <Radio.Button value="logbook">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <FileTextOutlined /> Movement Log ({filteredLogBookBookings.length})
                </span>
              </Radio.Button>
              <Radio.Button value="audit">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <SafetyCertificateOutlined /> System Audit Logs ({adminActivityLogs.length})
                </span>
              </Radio.Button>
            </Radio.Group>
          )}
        </div>
      </Card>

      {activeSubView === 'audit' && adminActivityLogs.length > 0 ? (
        <AdminActivityLogsTab logs={adminActivityLogs} />
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card
            variant="borderless"
            className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Equipment Filter Dropdown */}
                <Select
                  value={currentEqId}
                  onChange={handleEqIdChange}
                  className="rounded-xl text-xs flex-1 min-w-[220px]"
                  showSearch
                  optionFilterProp="children"
                >
                  <Option value="all">
                    All Equipments (Combined Master Log)
                  </Option>
                  {currentEquipments.map(eq => (
                    <Option key={eq.id} value={eq.id}>
                      {eq.name} {eq.approvedAbbreviation ? `(${eq.approvedAbbreviation})` : ''} - {eq.currentLocation || eq.location || 'CIF'}
                    </Option>
                  ))}
                </Select>

                {/* Status Filter */}
                <Select
                  value={currentStatusFilter}
                  onChange={handleStatusChange}
                  className="rounded-xl text-xs w-full sm:w-[150px]"
                >
                  <Option value="all">All Booking Statuses</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Rejected">Rejected</Option>
                </Select>

                {/* General Search Input */}
                <Input
                  placeholder="Search log by ref, applicant, keyword..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={currentSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  allowClear
                  className="rounded-xl text-xs flex-1 min-w-[180px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-zinc-800">
                {onOpenPrintModal && (
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={onOpenPrintModal}
                    className="bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-xs shadow-sm"
                  >
                    Print Official Register
                  </Button>
                )}
                {onExportCsv && (
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={onExportCsv}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Export Log (CSV)
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Selected Equipment Snapshot Banner if filtered by a specific equipment */}
          {selectedEquipment && (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <span>Log Register for: {selectedEquipment.name}</span>
                  {selectedEquipment.approvedAbbreviation && (
                    <Tag color="blue" className="font-mono text-[10px] font-bold m-0">
                      {selectedEquipment.approvedAbbreviation}
                    </Tag>
                  )}
                </div>
                <div className="text-slate-600 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Location:</strong> {selectedEquipment.currentLocation || selectedEquipment.location || '-'}</span>
                  <span><strong>Department:</strong> {selectedEquipment.facilityName || selectedEquipment.departmentName || '-'}</span>
                  <span><strong>Serial No:</strong> {selectedEquipment.serialNo || (selectedEquipment as any).serialNumber || '-'}</span>
                  <span><strong>Status:</strong> {selectedEquipment.operationalStatus}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {filteredLogBookBookings.length} Logged Reservation(s)
                </span>
              </div>
            </div>
          )}

          {/* Master Log Book Table */}
          <Card
            variant="borderless"
            className="shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <Table
              dataSource={filteredLogBookBookings}
              rowKey="id"
              pagination={{ pageSize: 12, showSizeChanger: true }}
              size="middle"
              scroll={{ x: 'max-content' }}
              columns={[
                {
                  title: 'Ref # & Submitted',
                  key: 'id',
                  width: 140,
                  render: (_, bk) => (
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {bk.id}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {bk.createdAt || '-'}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Applicant & Division',
                  key: 'applicant',
                  render: (_, bk) => {
                    const app = getBookingApplicant(bk);
                    return (
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <UserOutlined className="text-blue-600" />
                          <span>{bk.applicantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app?.designation || 'Staff'} • {app?.department || '-'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {bk.applicantMobile}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  title: 'Instruments Booked',
                  key: 'equipment',
                  render: (_, bk) => (
                    <div className="space-y-1 max-w-xs">
                      {bk.equipmentNames.map((n, i) => (
                        <Tag key={i} color="blue" className="text-xs font-semibold rounded-md block truncate">
                          {n}
                        </Tag>
                      ))}
                    </div>
                  )
                },
                {
                  title: 'Stay Period / Operational Window',
                  key: 'timing',
                  render: (_, bk) => (
                    <div className="text-xs space-y-0.5">
                      <div className="font-mono text-slate-800 dark:text-zinc-200">
                        <strong>From:</strong> {bk.fromDateTime}
                      </div>
                      <div className="font-mono text-slate-800 dark:text-zinc-200">
                        <strong>To:</strong> {bk.toDateTime}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        Duration: {bk.durationHours || 0} Hours
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Research Scope / Remarks',
                  key: 'purpose',
                  render: (_, bk) => (
                    <div className="text-xs max-w-xs space-y-1">
                      <div className="text-slate-700 dark:text-zinc-300 line-clamp-2">
                        {bk.purposeRemark || '-'}
                      </div>
                      {bk.adminRemark && (
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                          Admin Note: {bk.adminRemark}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  title: 'Status & Sanctioned By',
                  key: 'status',
                  render: (_, bk) => (
                    <div className="text-xs space-y-1">
                      <Tag
                        color={
                          bk.status === 'Approved'
                            ? 'success'
                            : bk.status === 'Pending'
                            ? 'gold'
                            : bk.status === 'Completed'
                            ? 'blue'
                            : 'error'
                        }
                        className="font-bold text-xs px-2 py-0.5 rounded-full"
                      >
                        {bk.status}
                      </Tag>
                      {bk.reviewedBy && (
                        <div className="text-[10px] text-slate-500 font-semibold">
                          By: {bk.reviewedBy}
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
