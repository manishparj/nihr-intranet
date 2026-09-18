import React from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Equipment, EquipmentBooking, LabApplicant } from '../../types/labEquipment';

export interface PrintableLogBookModalProps {
  visible: boolean;
  onClose: () => void;
  selectedEquipment?: Equipment | null;
  filteredLogBookBookings?: EquipmentBooking[];
  bookings?: EquipmentBooking[];
  adminEquipments?: Equipment[];
  equipments?: Equipment[];
  adminApplicants?: LabApplicant[];
  applicants?: LabApplicant[];
}

export const PrintableLogBookModal: React.FC<PrintableLogBookModalProps> = ({
  visible,
  onClose,
  selectedEquipment,
  filteredLogBookBookings,
  bookings,
  adminEquipments,
  equipments,
  adminApplicants,
  applicants
}) => {
  const currentBookings = filteredLogBookBookings || bookings || [];
  const currentEquipments = adminEquipments || equipments || [];
  const currentApplicants = adminApplicants || applicants || [];

  const getBookingEquipment = (b: EquipmentBooking) => {
    return currentEquipments.find(e => b.equipmentIds?.includes(e.id)) || null;
  };

  const getBookingApplicant = (b: EquipmentBooking) => {
    return currentApplicants.find(a => a.id === b.applicantId || a.mobile === b.applicantMobile) || null;
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width="95vw"
      style={{ maxWidth: 1000, top: 20 }}
      centered
      title={
        <div className="flex items-center gap-2">
          <PrinterOutlined className="text-blue-600" />
          <span className="font-bold text-slate-900 dark:text-zinc-100">
            Official Equipment Movement & Operation Log Register (ICMR-NIHR CIF)
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
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-500 font-bold rounded-lg"
        >
          Print Register (PDF / Paper)
        </Button>
      ]}
    >
      <div className="print-document-container p-4 bg-white text-slate-900 space-y-4 rounded-xl border border-slate-200">
        {/* Institutional Letterhead */}
        <div className="border-b-2 border-blue-900 pb-3 text-center">
          <h2 className="m-0 font-extrabold text-blue-950 text-base tracking-wide uppercase">
            ICMR - National Institute for Implementation Research on Non-Communicable Diseases
          </h2>
          <h4 className="m-0 font-bold text-slate-700 text-xs tracking-wider uppercase mt-0.5">
            Central Instrumentation Facility (CIF) | Official Equipment Movement & Operation Register
          </h4>
          <p className="m-0 text-[11px] text-slate-500 mt-0.5">
            New Pali Road, Jodhpur - 342005 (Rajasthan) | Good Laboratory Practice (GLP) Audit Record
          </p>
        </div>

        {/* Equipment Specification Banner */}
        <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <strong>Instrument Asset: </strong>
              {selectedEquipment ? (
                <span className="font-bold text-blue-900">
                  [{selectedEquipment.approvedAbbreviation || selectedEquipment.id}] {selectedEquipment.name}
                </span>
              ) : (
                <span className="font-bold text-blue-900">
                  All Central Facility Instruments (Consolidated Institutional Register)
                </span>
              )}
            </div>
            <div>
              <strong>Date Generated: </strong>
              <span className="font-mono">{dayjs().format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </div>
          {selectedEquipment && (
            <div className="flex justify-between items-center flex-wrap gap-2 text-slate-600">
              <div>
                <strong>Station / Lab Location: </strong>
                {selectedEquipment.currentLocation || selectedEquipment.location || 'CIF Core'}
              </div>
              <div>
                <strong>Make & Model: </strong>
                {selectedEquipment.make || '-'} {selectedEquipment.model || ''}
              </div>
              <div>
                <strong>Facility / Department: </strong>
                {selectedEquipment.facilityName || selectedEquipment.departmentName || 'CIF Core Facility'}
              </div>
            </div>
          )}
        </div>

        {/* Log Book Register Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-400">
                <th className="border border-slate-300 p-1.5 text-center w-8">#</th>
                <th className="border border-slate-300 p-1.5 text-left w-20">Log Ref</th>
                <th className="border border-slate-300 p-1.5 text-left w-36">Equipment & Bay</th>
                <th className="border border-slate-300 p-1.5 text-left w-36">Requisitioner (Dept)</th>
                <th className="border border-slate-300 p-1.5 text-left w-32">Stay Period (Slot)</th>
                <th className="border border-slate-300 p-1.5 text-center w-12">Hrs</th>
                <th className="border border-slate-300 p-1.5 text-left">Study Protocol / Purpose</th>
                <th className="border border-slate-300 p-1.5 text-left w-32">Approved By & Remark</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Sign Off</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-300 p-4 text-center text-slate-400">
                    No log book records found for the selected instrument and criteria.
                  </td>
                </tr>
              ) : (
                currentBookings.map((bk, idx) => {
                  const eq = getBookingEquipment(bk);
                  const app = getBookingApplicant(bk);
                  return (
                    <tr key={bk.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold text-[11px] text-blue-800">
                        {bk.id}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-bold text-[11px]">{eq?.approvedAbbreviation || eq?.id || 'EQ'}</div>
                        <div className="text-[10px] text-slate-500">{eq?.currentLocation || eq?.location || 'CIF'}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-bold text-[11px]">{bk.applicantName}</div>
                        <div className="text-[10px] text-slate-500">{app?.department || 'Research'}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-[10px] font-mono">
                        <div>{bk.fromDateTime}</div>
                        <div className="text-slate-400">to {bk.toDateTime}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold font-mono">
                        {bk.durationHours || 0}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-[10px] text-slate-700">
                        {bk.purposeRemark}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-[10px]">
                        <div className="font-bold text-emerald-800">{bk.reviewedBy || '-'}</div>
                        <div className="text-slate-500">{bk.adminRemark || ''}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center text-[9px] text-slate-400">
                        [ Verified ]
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={5} className="border border-slate-300 p-2 text-right">
                  Total Log Entries: {currentBookings.length} | Cumulative Operating Hours:
                </td>
                <td className="border border-slate-300 p-2 text-center font-mono text-blue-900">
                  {currentBookings.reduce((acc, b) => acc + (b.durationHours || 0), 0)}
                </td>
                <td colSpan={3} className="border border-slate-300 p-2 text-[10px] text-slate-500">
                  Verified by Central Instrumentation Facility Quality In-Charge
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Certification Signatures */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-[11px] text-slate-700">
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            Technical Officer (Instrumentation)<br />
            CIF Core Facility
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            Officer In-Charge (CIF)<br />
            ICMR-NIHR Jodhpur
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 font-bold">
            Head of Office / Director<br />
            Statutory Compliance
          </div>
        </div>

        <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-400 text-center">
          This document represents an official certified printout of the ICMR-NIHR Central Instrumentation Facility Equipment Movement & Operating Register.
        </div>
      </div>
    </Modal>
  );
};
