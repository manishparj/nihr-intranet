import React from 'react';
import { Modal, Button, Upload, Table, Tag } from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Equipment } from '../../types/labEquipment';

export interface CsvImportModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadSample?: () => void;
  onDownloadSampleCsv?: () => void;
  onConfirmImport: () => void;
  onFileSelect: (file: File) => boolean;
  onClearParsed?: () => void;
  onClear?: () => void;
  parsedRecords?: Partial<Equipment>[];
  parsedEquipments?: Partial<Equipment>[];
  parseErrors?: string[];
  errors?: string[];
  fileName?: string;
  importing: boolean;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  visible,
  onClose,
  onDownloadSample,
  onDownloadSampleCsv,
  onConfirmImport,
  onFileSelect,
  onClearParsed,
  onClear,
  parsedRecords,
  parsedEquipments,
  parseErrors,
  errors,
  fileName,
  importing
}) => {
  const currentRecords = parsedRecords || parsedEquipments || [];
  const currentErrors = parseErrors || errors || [];
  const handleDownload = onDownloadSampleCsv || onDownloadSample || (() => {});
  const handleClear = onClear || onClearParsed || (() => {});

  return (
    <Modal
      open={visible}
      onCancel={() => {
        if (!importing) onClose();
      }}
      width="95vw"
      style={{ maxWidth: 960, top: 20 }}
      centered
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <UploadOutlined />
          </div>
          <div>
            <div className="font-bold text-base text-slate-900 dark:text-zinc-100">
              Bulk Import Equipments via CSV File
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Upload a standard CSV spreadsheet to add or update equipment records in the Master Directory
            </div>
          </div>
        </div>
      }
      footer={[
        <Button
          key="sample"
          icon={<FileExcelOutlined className="text-emerald-600" />}
          onClick={handleDownload}
          className="float-left font-semibold text-xs rounded-lg"
        >
          Download Sample CSV
        </Button>,
        <Button key="cancel" onClick={onClose} disabled={importing} className="rounded-lg">
          Cancel
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<UploadOutlined />}
          onClick={onConfirmImport}
          loading={importing}
          disabled={currentRecords.length === 0}
          className="bg-blue-600 hover:bg-blue-500 font-bold rounded-lg"
        >
          {currentRecords.length > 0
            ? `Confirm & Import ${currentRecords.length} Record(s)`
            : 'Upload CSV to Import'}
        </Button>
      ]}
    >
      <div className="space-y-4 py-2">
        {/* Upload Area */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-900/60 text-center">
          <Upload.Dragger
            accept=".csv,text/csv"
            showUploadList={false}
            beforeUpload={file => onFileSelect(file)}
            className="bg-transparent border-0"
          >
            <p className="ant-upload-drag-icon text-blue-600 mb-2">
              <FileExcelOutlined className="text-4xl" />
            </p>
            <p className="ant-upload-text font-bold text-sm text-slate-800 dark:text-zinc-200">
              {fileName ? `Selected File: "${fileName}"` : 'Click or Drag & Drop Equipment CSV File Here to Upload'}
            </p>
            <p className="ant-upload-hint text-xs text-slate-500 mt-1">
              Supports all fields: Equipment Name, Abbr, Category, Make, Model, Serial No, Location, Basic Cost, Purchase Year, Funding Agency, Warranty/AMC End Dates, and Alert Emails.
            </p>
          </Upload.Dragger>
        </div>

        {/* Parse Errors / Warnings */}
        {currentErrors.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ExclamationCircleOutlined /> Validation Warnings ({currentErrors.length}):
            </div>
            <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 max-h-24 overflow-y-auto space-y-0.5">
              {currentErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parsed Records Table Preview */}
        {currentRecords.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Ready to Import ({currentRecords.length} Valid Records Parsed)
              </span>
              <Button
                size="small"
                danger
                type="text"
                onClick={handleClear}
                className="text-xs"
              >
                Clear Selection
              </Button>
            </div>

            <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <Table
                dataSource={currentRecords.map((r, i) => ({ ...r, rowKey: i }))}
                rowKey="rowKey"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                columns={[
                  { title: '#', render: (_, __, i) => i + 1, width: 45 },
                  {
                    title: 'Equipment Name',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name, r) => (
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">{name}</div>
                        {r.approvedAbbreviation && (
                          <Tag color="cyan" className="text-[10px] font-mono font-semibold">{r.approvedAbbreviation}</Tag>
                        )}
                      </div>
                    )
                  },
                  { title: 'Category', dataIndex: 'category', key: 'category', render: c => <Tag color="blue">{c}</Tag> },
                  { title: 'Make / Model', render: (_, r) => `${r.make || '-'} ${r.model ? `(${r.model})` : ''}` },
                  { title: 'Serial No', dataIndex: 'serialNo', key: 'serial', render: s => s || '-' },
                  { title: 'Location', dataIndex: 'location', key: 'loc' },
                  {
                    title: 'Cost (Rs)',
                    dataIndex: 'basicCost',
                    key: 'cost',
                    render: c => (c ? `₹${Number(c).toLocaleString('en-IN')}` : '-')
                  },
                  { title: 'Funding', dataIndex: 'fundingAgencyType', key: 'fund', render: f => f || 'Govt' },
                  { title: 'Year', dataIndex: 'yearOfPurchase', key: 'year' },
                  { title: 'Warranty', dataIndex: 'warrantyEndDate', key: 'warranty', render: w => w || '-' }
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
