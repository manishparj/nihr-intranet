import React from 'react';
import {
  Card,
  Input,
  Button,
  Tag,
  Alert,
  Empty
} from 'antd';
import {
  SearchOutlined,
  PrinterOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { EquipmentBooking } from '../../types/labEquipment';

export interface CheckStatusTabProps {
  mobile?: string;
  statusMobile?: string;
  onMobileChange?: (val: string) => void;
  setStatusMobile?: (val: string) => void;
  secretCode?: string;
  statusSecretCode?: string;
  onSecretCodeChange?: (val: string) => void;
  setStatusSecretCode?: (val: string) => void;
  checking?: boolean;
  loadingStatus?: boolean;
  onCheckStatus: () => Promise<void> | void;
  statusResults?: { applicantName: string | null; bookings: EquipmentBooking[] } | EquipmentBooking[] | null;
  bookingStatusResults?: EquipmentBooking[] | null;
  onPrintBookingSlip: (booking: EquipmentBooking) => void;
}

export const CheckStatusTab: React.FC<CheckStatusTabProps> = ({
  mobile,
  statusMobile: propStatusMobile,
  onMobileChange,
  setStatusMobile: propSetStatusMobile,
  secretCode,
  statusSecretCode: propStatusSecretCode,
  onSecretCodeChange,
  setStatusSecretCode: propSetStatusSecretCode,
  checking,
  loadingStatus,
  onCheckStatus,
  statusResults,
  bookingStatusResults,
  onPrintBookingSlip
}) => {
  const currentMobile = mobile !== undefined ? mobile : (propStatusMobile || '');
  const handleMobileChange = (val: string) => {
    if (onMobileChange) onMobileChange(val);
    if (propSetStatusMobile) propSetStatusMobile(val);
  };

  const currentSecretCode = secretCode !== undefined ? secretCode : (propStatusSecretCode || '');
  const handleSecretCodeChange = (val: string) => {
    if (onSecretCodeChange) onSecretCodeChange(val);
    if (propSetStatusSecretCode) propSetStatusSecretCode(val);
  };

  const isLoading = checking !== undefined ? checking : (loadingStatus || false);

  let rawBookings: EquipmentBooking[] | null = null;
  let applicantNameHeader: string | null = null;

  if (statusResults) {
    if (Array.isArray(statusResults)) {
      rawBookings = statusResults;
    } else if (statusResults.bookings) {
      rawBookings = statusResults.bookings;
      applicantNameHeader = statusResults.applicantName;
    }
  } else if (bookingStatusResults) {
    rawBookings = bookingStatusResults;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <ClockCircleOutlined className="text-blue-600" />
            Check Application Status & Download Slips
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track sanction approvals, active slot reservations, and retrieve printable acknowledgment slips.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1.5">
                Registered Mobile (10 Digits)
              </label>
              <Input
                placeholder="e.g. 9876543210"
                value={currentMobile}
                onChange={e => handleMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="rounded-xl h-11 text-base font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1.5">
                Applicant Secret Code (Optional / 8 Digits)
              </label>
              <Input
                placeholder="e.g. 84920193"
                value={currentSecretCode}
                onChange={e => handleSecretCodeChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                className="rounded-xl h-11 text-base font-mono tracking-widest"
              />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={isLoading}
            onClick={onCheckStatus}
            className="w-full bg-blue-600 hover:bg-blue-500 font-bold rounded-xl h-11 text-sm shadow-sm"
          >
            Search Application Records
          </Button>
        </div>

        {/* Results */}
        {rawBookings !== null && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Application History ({rawBookings.length} Record(s) Found)
                {applicantNameHeader && (
                  <span className="ml-2 text-blue-600">for {applicantNameHeader}</span>
                )}
              </span>
            </div>

            {rawBookings.length === 0 ? (
              <Empty
                description="No application records found matching the provided mobile number and secret code."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {rawBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                          REF: {booking.id}
                        </span>
                        <Tag
                          color={
                            booking.status === 'Approved'
                              ? 'success'
                              : booking.status === 'Pending'
                              ? 'warning'
                              : booking.status === 'Completed'
                              ? 'processing'
                              : 'error'
                          }
                          icon={
                            booking.status === 'Approved' ? (
                              <CheckCircleOutlined />
                            ) : booking.status === 'Pending' ? (
                              <SyncOutlined spin />
                            ) : booking.status === 'Completed' ? (
                              <CheckCircleOutlined />
                            ) : (
                              <CloseCircleOutlined />
                            )
                          }
                          className="font-bold text-xs px-2.5 py-0.5 rounded-full"
                        >
                          {booking.status}
                        </Tag>
                      </div>

                      <Button
                        size="small"
                        icon={<PrinterOutlined />}
                        onClick={() => onPrintBookingSlip(booking)}
                        className="rounded-lg text-xs font-semibold"
                      >
                        Print Slip
                      </Button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                      <div>
                        <strong className="text-slate-900 dark:text-zinc-100">Reserved Equipment:</strong>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {booking.equipmentNames.map((name, i) => (
                            <Tag key={i} color="blue" className="font-semibold text-xs rounded-md">
                              {name}
                            </Tag>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <CalendarOutlined className="text-blue-600" />
                          <span>
                            <strong>Slot:</strong> {booking.fromDateTime} → {booking.toDateTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserOutlined className="text-blue-600" />
                          <span>
                            <strong>Applicant:</strong> {booking.applicantName} ({booking.applicantMobile})
                          </span>
                        </div>
                      </div>

                      {booking.purposeRemark && (
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                          <strong>Purpose / Protocol:</strong> {booking.purposeRemark}
                        </div>
                      )}

                      {booking.adminRemark && (
                        <div className="p-3 bg-blue-50/60 dark:bg-zinc-800 rounded-xl border border-blue-100 dark:border-zinc-700 text-xs text-blue-900 dark:text-blue-300">
                          <strong>Admin Remark:</strong> {booking.adminRemark}
                          {booking.reviewedBy && (
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              Reviewed by {booking.reviewedBy} on {booking.reviewedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
