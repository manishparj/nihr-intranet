import React from 'react';
import { Modal, Button, Tag } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { EquipmentBooking } from '../../types/labEquipment';

export interface BookingReceiptModalProps {
  visible?: boolean;
  booking: EquipmentBooking | null;
  onClose: () => void;
  onPrint?: (booking: EquipmentBooking) => void;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  visible = true,
  booking,
  onClose,
  onPrint
}) => {
  if (!booking || !visible) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(booking);
    } else {
      window.print();
    }
  };

  return (
    <Modal
      open={visible && !!booking}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 760, top: 20 }}
      centered
      title={
        <div className="flex items-center gap-2">
          <PrinterOutlined className="text-blue-600" />
          <span className="font-bold text-slate-900 dark:text-zinc-100">
            Official Equipment Booking Application Slip - {booking.id}
          </span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          Close
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-500 font-bold rounded-lg"
        >
          Print Slip (PDF / Paper)
        </Button>
      ]}
    >
      <div className="print-document-container p-4 bg-white text-slate-900 space-y-4 rounded-xl border border-slate-200">
        <div className="border-b-2 border-blue-600 pb-3 flex flex-wrap justify-between items-start gap-2">
          <div>
            <h3 className="m-0 font-extrabold text-blue-900 text-sm tracking-wide uppercase">
              ICMR - National Institute for Implementation Research on Non-Communicable Diseases
            </h3>
            <p className="m-0 text-xs text-slate-600 font-medium">
              Central Instrumentation Facility (CIF) | Equipment Booking Acknowledgment
            </p>
            <p className="m-0 text-[11px] text-slate-500">
              Institutional Intranet Portal | Jodhpur, Rajasthan
            </p>
          </div>
          <div className="text-right">
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
              className="font-extrabold text-xs px-3 py-1 uppercase rounded-full"
            >
              {booking.status}
            </Tag>
            <div className="text-[11px] font-mono text-slate-600 mt-1 font-bold">
              REF: {booking.id}
            </div>
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-1/3 p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Booking Reference ID
              </td>
              <td className="p-2 font-mono font-bold text-blue-700">{booking.id}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Applicant Name
              </td>
              <td className="p-2 font-bold text-slate-900">{booking.applicantName}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Registered Mobile & Email
              </td>
              <td className="p-2 text-slate-800 font-mono">
                {booking.applicantMobile} | {booking.applicantEmail}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Instruments Requested
              </td>
              <td className="p-2 font-semibold text-slate-800">
                <ul className="list-disc list-inside m-0 p-0 space-y-0.5">
                  {booking.equipmentNames.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Reservation Slot
              </td>
              <td className="p-2 font-semibold text-slate-800">
                {booking.fromDateTime} to {booking.toDateTime} ({booking.durationHours || 0} Hours)
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Protocol / Purpose
              </td>
              <td className="p-2 text-slate-700">{booking.purposeRemark || 'N/A'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                Submission Timestamp
              </td>
              <td className="p-2 text-slate-600 font-mono">{booking.createdAt}</td>
            </tr>
            {booking.adminRemark && (
              <tr className="border-b border-slate-200 bg-blue-50/50">
                <td className="p-2 font-bold text-blue-950 border-r border-slate-200">
                  Super Admin Review & Sanction Remark
                </td>
                <td className="p-2 font-medium text-blue-950">
                  <strong>{booking.adminRemark}</strong>
                  <span className="block text-[10px] text-slate-600 mt-0.5">
                    Reviewed by: {booking.reviewedBy || 'CIF In-Charge'}{' '}
                    {booking.reviewedAt ? `on ${booking.reviewedAt}` : ''}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-[11px] text-slate-600">
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            Applicant Signature<br />({booking.applicantName})
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            CIF Lab Technician / In-Charge<br />(Verification & Slot Sanction)
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            Officer In-Charge (CIF)<br />(ICMR-NIHR Jodhpur)
          </div>
        </div>

        <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500 text-center">
          Please present this printout to the CIF Laboratory In-Charge before starting instrument operations. Record all log entries in physical instrument registers.
        </div>
      </div>
    </Modal>
  );
};
