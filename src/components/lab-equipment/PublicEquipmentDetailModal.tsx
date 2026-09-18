import React from 'react';
import { Modal, Button, Descriptions, Tag } from 'antd';
import {
  ExperimentOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Equipment, PublicEquipment } from '../../types/labEquipment';
import { renderOperationalStatusBadge } from './constants';

export interface PublicEquipmentDetailModalProps {
  visible?: boolean;
  open?: boolean;
  equipment: Equipment | PublicEquipment | null;
  onClose: () => void;
  onQuickBook?: (eq: PublicEquipment) => void;
}

export const PublicEquipmentDetailModal: React.FC<PublicEquipmentDetailModalProps> = ({
  visible,
  open: propOpen,
  equipment,
  onClose,
  onQuickBook
}) => {
  const isOpen = visible !== undefined ? visible : (propOpen !== undefined ? propOpen : !!equipment);
  if (!equipment || !isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          Close
        </Button>,
        equipment.operationalStatus === 'Working' && onQuickBook && (
          <Button
            key="book"
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => {
              const eq = equipment as PublicEquipment;
              onClose();
              onQuickBook(eq);
            }}
            className="bg-blue-600 hover:bg-blue-500 font-bold rounded-lg"
          >
            Book This Instrument
          </Button>
        )
      ]}
      width="90vw"
      style={{ maxWidth: 840, top: 20 }}
      centered
      title={
        <div className="flex items-center gap-2 pr-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <ExperimentOutlined className="text-base" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base text-slate-900 dark:text-zinc-100 truncate">
              {equipment.name}
            </div>
            {equipment.approvedAbbreviation && (
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                Code: {equipment.approvedAbbreviation}
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Photo Carousel / Gallery */}
        {equipment.photos && equipment.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {equipment.photos.map(p => (
              <div
                key={p.id}
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 h-32 bg-slate-950 flex items-center justify-center group relative shadow-xs"
              >
                <img
                  src={p.url}
                  alt={p.name}
                  className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        )}

        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 2 }}
          className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl overflow-hidden shadow-2xs"
        >
          <Descriptions.Item label="Category">
            <Tag color="blue" className="font-semibold">{equipment.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Operational Status">
            {renderOperationalStatusBadge(equipment.operationalStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="Make / Manufacturer">{equipment.make || '-'}</Descriptions.Item>
          <Descriptions.Item label="Model">{equipment.model || '-'}</Descriptions.Item>
          <Descriptions.Item label="Department">{equipment.departmentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Facility">{equipment.facilityName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Permanent Location" span={2}>
            {equipment.currentLocation || equipment.location || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Purchase Year">{equipment.yearOfPurchase || '-'}</Descriptions.Item>
          <Descriptions.Item label="PRISM Category">{equipment.prismServiceCategory || '-'}</Descriptions.Item>

          {/* Admin Only Fields */}
          {'basicCost' in equipment && (equipment as Equipment).basicCost && (
            <Descriptions.Item label="Basic Cost (Admin)">
              ₹{Number((equipment as Equipment).basicCost).toLocaleString('en-IN')}
            </Descriptions.Item>
          )}
          {'serialNo' in equipment && (equipment as Equipment).serialNo && (
            <Descriptions.Item label="Serial No. (Admin)">
              <span className="font-mono">{(equipment as Equipment).serialNo}</span>
            </Descriptions.Item>
          )}
          {'fundingAgencyType' in equipment && (equipment as Equipment).fundingAgencyType && (
            <Descriptions.Item label="Funding Agency (Admin)">
              {(equipment as Equipment).fundingAgencyType} ({(equipment as Equipment).fundingAgencyDetails || ''})
            </Descriptions.Item>
          )}
          {'warrantyEndDate' in equipment && (equipment as Equipment).warrantyEndDate && (
            <Descriptions.Item label="Warranty Till (Admin)">
              {(equipment as Equipment).warrantyEndDate}
            </Descriptions.Item>
          )}
        </Descriptions>

        {equipment.description && (
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Configuration & Technical Description:
            </div>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 m-0">
              {equipment.description}
            </p>
          </div>
        )}

        {equipment.purposeApplication && (
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Purpose & Research Scope:
            </div>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 m-0">
              {equipment.purposeApplication}
            </p>
          </div>
        )}

        {/* Attached Documents List */}
        {('documents' in equipment ? equipment.documents : equipment.publicDocuments) && (
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Attached Documents, Manuals & SOPs:
            </div>
            <div className="space-y-2">
              {(('documents' in equipment ? equipment.documents : equipment.publicDocuments) || []).map((d: any) => (
                <div
                  key={d.id}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FilePdfOutlined className="text-red-500 text-base shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-zinc-200 truncate">{d.fileName}</span>
                    <Tag color="cyan" className="text-[10px] shrink-0 m-0">{d.fileType}</Tag>
                  </div>
                  {d.fileData && (
                    <Button
                      size="small"
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = d.fileData;
                        link.download = d.fileName;
                        link.target = '_blank';
                        link.click();
                      }}
                      className="text-blue-600 font-semibold shrink-0"
                    >
                      Download
                    </Button>
                  )}
                </div>
              ))}
              {((('documents' in equipment ? equipment.documents : equipment.publicDocuments) || []).length === 0) && (
                <div className="text-center py-3 text-xs text-slate-400 bg-slate-50 dark:bg-zinc-800/40 rounded-xl">
                  No public manuals or SOP files attached to this asset.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
