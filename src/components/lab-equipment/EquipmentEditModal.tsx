import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  Upload,
  Button
} from 'antd';
import {
  ExperimentOutlined,
  PictureOutlined,
  PlusOutlined,
  FilePdfOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Equipment, EquipmentDocument, EquipmentPhoto } from '../../types/labEquipment';
import { FormInstance } from 'antd/es/form';

const { Option } = Select;
const { TextArea } = Input;

interface EquipmentEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  form: FormInstance;
  editingEquipment: Equipment | null;
  equipmentPhotos: EquipmentPhoto[];
  equipmentDocs: EquipmentDocument[];
  onAddPhoto: (file: File) => boolean;
  onRemovePhoto: (id: string) => void;
  onAddDocument: (file: File, fileType?: string) => boolean;
  onRemoveDocument: (id: string) => void;
  onUpdateDocType: (id: string, fileType: string) => void;
}

export const EquipmentEditModal: React.FC<EquipmentEditModalProps> = ({
  visible,
  onCancel,
  onSave,
  form,
  editingEquipment,
  equipmentPhotos,
  equipmentDocs,
  onAddPhoto,
  onRemovePhoto,
  onAddDocument,
  onRemoveDocument,
  onUpdateDocType
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onSave}
      title={
        <span className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <ExperimentOutlined className="text-blue-600" />
          {editingEquipment ? `Edit Equipment: ${editingEquipment.name}` : 'Add New Equipment to Master'}
        </span>
      }
      width={900}
      okText="Save Equipment Record"
      okButtonProps={{ className: 'bg-blue-600 font-bold rounded-xl' }}
      cancelButtonProps={{ className: 'rounded-xl' }}
      className="rounded-2xl overflow-hidden"
    >
      <Form
        form={form}
        layout="vertical"
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 py-1"
      >
        {/* Section 1: Basic Identifiers */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
            1. Basic Identification & Categorization
          </div>
          <Row gutter={12}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Equipment Full Name"
                name="name"
                rules={[{ required: true, message: 'Equipment Name is mandatory' }]}
              >
                <Input placeholder="e.g. Ultra-High Performance Liquid Chromatography System" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Approved Abbreviation" name="approvedAbbreviation">
                <Input placeholder="e.g. UHPLC-01" className="rounded-xl" />
              </Form.Item>
            </Col>

            {/* Category */}
            <Col xs={24} md={8}>
              <Form.Item
                label="Category"
                name="categorySelect"
                rules={[{ required: true, message: 'Category is mandatory' }]}
              >
                <Select placeholder="Select category..." className="rounded-xl">
                  <Option value="Research Infrastructure">Research Infrastructure</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.categorySelect !== currentValues.categorySelect}
            >
              {({ getFieldValue }) =>
                getFieldValue('categorySelect') === 'Other' ? (
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Specify Other Category"
                      name="categoryOther"
                      rules={[{ required: true, message: 'Please specify category' }]}
                    >
                      <Input placeholder="Enter custom category..." className="rounded-xl" />
                    </Form.Item>
                  </Col>
                ) : null
              }
            </Form.Item>

            {/* Operational Status */}
            <Col xs={24} md={8}>
              <Form.Item
                label="Operational Status"
                name="operationalStatusSelect"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select className="rounded-xl">
                  <Option value="Working">Working</Option>
                  <Option value="Under Maintenance">Under Maintenance</Option>
                  <Option value="Out of Order">Out of Order</Option>
                  <Option value="Decommissioned">Decommissioned</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.operationalStatusSelect !== currentValues.operationalStatusSelect}
            >
              {({ getFieldValue }) =>
                getFieldValue('operationalStatusSelect') === 'Other' ? (
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Specify Other Operational Status"
                      name="operationalStatusOther"
                      rules={[{ required: true, message: 'Please specify status' }]}
                    >
                      <Input placeholder="e.g. Under Calibration / Standby" className="rounded-xl" />
                    </Form.Item>
                  </Col>
                ) : null
              }
            </Form.Item>

            <Col xs={24} md={8}>
              <Form.Item
                label="Year of Purchase"
                name="yearOfPurchase"
                rules={[{ required: true, message: 'Purchase Year is required' }]}
              >
                <Input placeholder="e.g. 2024" className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Technical & Specs */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
            2. Technical & Manufacturer Specifications
          </div>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label="Make (Manufacturer)" name="make">
                <Input placeholder="e.g. Waters Corporation / Leica" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Model" name="model">
                <Input placeholder="e.g. ACQUITY UPLC H-Class" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Serial No." name="serialNo">
                <Input placeholder="e.g. WAT-98231-A" className="rounded-xl font-mono" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Department Name" name="departmentName">
                <Input placeholder="e.g. Central Instrumentation Facility / Biochemistry" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Facility Name" name="facilityName">
                <Input placeholder="e.g. Central Instrumentation Facility" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Location"
                name="locationSelect"
                rules={[{ required: true, message: 'Please select location' }]}
              >
                <Select placeholder="Select location..." className="rounded-xl">
                  <Option value="Central Laboratory">Central Laboratory</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.locationSelect !== currentValues.locationSelect}
            >
              {({ getFieldValue }) =>
                getFieldValue('locationSelect') === 'Other' ? (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Specify Other Location"
                      name="locationOther"
                      rules={[{ required: true, message: 'Please specify other location' }]}
                    >
                      <Input placeholder="Enter other lab location / room..." className="rounded-xl" />
                    </Form.Item>
                  </Col>
                ) : null
              }
            </Form.Item>

            <Col xs={24} md={12}>
              <Form.Item label="Current Movement Location" name="currentLocation">
                <Input placeholder="e.g. Ground Floor, Analytical Core Lab Room 104" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="PRISM Service Category" name="prismServiceCategory">
                <Input placeholder="e.g. Chromatography & Mass Spectrometry" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Alert Email ID(s) (Comma-separated)"
                name="alertEmails"
                rules={[{ required: true, message: 'Alert email is mandatory' }]}
              >
                <Input placeholder="e.g. Email, " className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 3: Financial & Warranty */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
            3. Financial, Warranty & Funding
          </div>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Basic Cost (Rs)*"
                name="basicCost"
                rules={[{ required: true, message: 'Basic Cost (Rs) is required' }]}
              >
                <Input placeholder="e.g. 4500000" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Funding Agency Type" name="fundingAgencyType">
                <Input placeholder="e.g. Govt / ICMR / DBT / CSIR / Intramural" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Funding Agency Details" name="fundingAgencyDetails">
                <Input placeholder="Grant number / agency name" className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Warranty End Date (Valid Till)" name="warrantyEndDate">
                <DatePicker className="w-full rounded-xl" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="AMC End Date (Valid Till)" name="amcEndDate">
                <DatePicker className="w-full rounded-xl" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Purpose / Application of Equipment" name="purposeApplication">
                <TextArea rows={2} placeholder="Scientific purpose and research scope..." className="rounded-xl" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Equipment Description" name="description">
                <TextArea rows={2} placeholder="Technical configuration and module details..." className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 4: Photo Gallery */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              4. Equipment Photographs (Max 4 Photos - {equipmentPhotos.length}/4)
            </div>
            <Upload
              beforeUpload={file => onAddPhoto(file)}
              showUploadList={false}
              accept="image/*"
              disabled={equipmentPhotos.length >= 4}
            >
              <Button
                size="small"
                icon={<PictureOutlined />}
                disabled={equipmentPhotos.length >= 4}
                className="rounded-xl text-xs font-semibold"
              >
                + Attach Photo
              </Button>
            </Upload>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {equipmentPhotos.map(p => (
              <div
                key={p.id}
                className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-700 h-24 bg-black"
              >
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(p.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 shadow"
                >
                  ×
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5">
                  {p.name}
                </div>
              </div>
            ))}
            {equipmentPhotos.length === 0 && (
              <div className="col-span-full text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl">
                No photos uploaded yet. Attach up to 4 high-resolution pictures saved to uploads folder.
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Documents Checklist Manager */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                5. Equipment Documents Checklist
              </div>
              <div className="text-[11px] text-slate-500">
                Attach SOPs, manuals, calibration certificates saved directly into uploads directory.
              </div>
            </div>

            <Upload
              beforeUpload={file => onAddDocument(file, 'Manual')}
              showUploadList={false}
              accept=".pdf,.doc,.docx,.jpg,.png"
            >
              <Button size="small" type="primary" icon={<PlusOutlined />} className="bg-blue-600 rounded-xl text-xs font-bold">
                + Add Document
              </Button>
            </Upload>
          </div>

          <div className="space-y-2">
            {equipmentDocs.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FilePdfOutlined className="text-red-500 text-base" />
                  <div className="truncate">
                    <div className="font-bold text-slate-800 dark:text-zinc-100 truncate">{d.fileName}</div>
                    <div className="text-[10px] text-slate-400">
                      Type: <span className="font-semibold text-blue-600">{d.fileType}</span> | {d.fileSize || '1.0 MB'} | Uploaded: {d.uploadedAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    size="small"
                    value={['Manual', 'Calibration Certificate', 'SOP', 'Label', 'Warranty Card'].includes(d.fileType) ? d.fileType : 'Other'}
                    onChange={val => onUpdateDocType(d.id, val)}
                    style={{ width: 130 }}
                    className="text-xs"
                  >
                    <Option value="Manual">Manual</Option>
                    <Option value="Calibration Certificate">Calibration Cert</Option>
                    <Option value="SOP">SOP</Option>
                    <Option value="Label">Label</Option>
                    <Option value="Warranty Card">Warranty Card</Option>
                    <Option value="Other">Other</Option>
                  </Select>

                  {(!['Manual', 'Calibration Certificate', 'SOP', 'Label', 'Warranty Card'].includes(d.fileType) || d.fileType === 'Other') && (
                    <Input
                      size="small"
                      placeholder="Specify custom type..."
                      value={['Manual', 'Calibration Certificate', 'SOP', 'Label', 'Warranty Card', 'Other'].includes(d.fileType) ? '' : d.fileType}
                      onChange={e => onUpdateDocType(d.id, e.target.value)}
                      style={{ width: 170 }}
                      className="text-xs rounded-md"
                    />
                  )}

                  {d.fileData && (
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = d.fileData;
                        link.download = d.fileName;
                        link.target = '_blank';
                        link.click();
                      }}
                      className="text-xs text-blue-600 px-1"
                    >
                      View
                    </Button>
                  )}

                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => onRemoveDocument(d.id)}
                    className="font-bold text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}

            {equipmentDocs.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl">
                No documents attached. Click "+ Add Document" to attach operating manuals and calibration reports.
              </div>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};
