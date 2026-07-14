import React from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Input, Select, Button, Space, Divider, Checkbox, Card, message, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Scientist, Project } from '../types';

const { Option } = Select;

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const scientistValidationSchema = Yup.object().shape({
  name: Yup.string().optional(),
  dob: Yup.string().optional(),
  doj: Yup.string().optional(),
  designation: Yup.string().optional(),
  govtEmail: Yup.string().email('Invalid email').optional(),
  personalEmail: Yup.string().email('Invalid email').optional(),
  phone: Yup.string().optional(),
  employeeCode: Yup.string().required('Employee Code is required'),
  gender: Yup.string().optional(),
  bloodGroup: Yup.string().optional(),
  emergencyContact: Yup.string().optional(),
  address: Yup.string().optional(),
  departmentLocation: Yup.string().optional(),
  roomNumber: Yup.string().optional(),
  category: Yup.string().optional(),
  status: Yup.string().oneOf(['Active', 'Left']).optional(),
  lastWorkingDate: Yup.string().optional(),
});

const projectValidationSchema = Yup.object().shape({
  name: Yup.string().optional(),
  shortName: Yup.string().optional(),
  type: Yup.string().oneOf(['Intramural', 'Extramural', 'ICMR', 'Other', 'NHRP']).optional(),
  status: Yup.string().oneOf(['Yet to Start', 'Ongoing', 'Completed']).optional(),
  startDate: Yup.string().optional(),
  endDate: Yup.string().optional(),
  budget: Yup.number().positive('Must be positive').optional(),
  piId: Yup.string().optional(),
});

// ==========================================
// 1. SCIENTIST FORM COMPONENT
// ==========================================
interface ScientistFormProps {
  initialValues?: Partial<Scientist>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const ScientistForm: React.FC<ScientistFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { message } = App.useApp();
  const defaultValues = {
    name: '', dob: '', doj: '', designation: '', govtEmail: '', personalEmail: '',
    phone: '', employeeCode: '', gender: '', bloodGroup: '', emergencyContact: '',
    address: '', departmentLocation: '', roomNumber: '', category: 'UR', status: 'Active',
    lastWorkingDate: '', noDuesCleared: false,
    ...initialValues,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={scientistValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <Field as={Input} name="name" placeholder="Dr. Jane Doe" className="rounded-md" />
              <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Employee Code</label>
              <Field as={Input} name="employeeCode" placeholder="SCI-012" className="rounded-md" />
              <ErrorMessage name="employeeCode" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">DOB</label>
              <Field as={Input} type="date" name="dob" className="rounded-md w-full" />
              <ErrorMessage name="dob" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">DOJ</label>
              <Field as={Input} type="date" name="doj" className="rounded-md w-full" />
              <ErrorMessage name="doj" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Designation</label>
              <Field as={Input} name="designation" placeholder="Scientist E" className="rounded-md" />
              <ErrorMessage name="designation" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Govt Email</label>
              <Field as={Input} name="govtEmail" placeholder="j.doe@nihr.res.in" className="rounded-md" />
              <ErrorMessage name="govtEmail" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Personal Email</label>
              <Field as={Input} name="personalEmail" placeholder="jane.doe@gmail.com" className="rounded-md" />
              <ErrorMessage name="personalEmail" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Phone</label>
              <Field as={Input} name="phone" placeholder="+91 99999 88888" className="rounded-md" />
              <ErrorMessage name="phone" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Emergency Contact</label>
              <Field as={Input} name="emergencyContact" placeholder="+91 99999 77777" className="rounded-md" />
              <ErrorMessage name="emergencyContact" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
              <Select 
                value={values.category} 
                onChange={(v) => setFieldValue('category', v)} 
                className="w-full"
              >
                {['SC', 'ST', 'OBC', 'PWD', 'EWS', 'UR'].map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
              <Select value={values.gender} onChange={(v) => setFieldValue('gender', v)} className="w-full">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Blood Group</label>
              <Field as={Input} name="bloodGroup" placeholder="O+" className="rounded-md" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number</label>
              <Field as={Input} name="roomNumber" placeholder="302" className="rounded-md" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Department Location</label>
              <Field as={Input} name="departmentLocation" placeholder="First Floor, Lab Block" className="rounded-md" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Residential Address</label>
              <Field as={Input} name="address" placeholder="Staff Quarters, NIHR New Delhi" className="rounded-md" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
              <Select value={values.status} onChange={(v) => setFieldValue('status', v)} className="w-full">
                <Option value="Active">Active</Option>
                <Option value="Left">Left</Option>
              </Select>
            </Col>

            {values.status === 'Left' && (
              <>
                <Col xs={12} md={8}>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Last Working Date</label>
                  <Field as={Input} type="date" name="lastWorkingDate" className="rounded-md w-full" />
                  <ErrorMessage name="lastWorkingDate" component="div" className="text-red-500 text-[10px] mt-0.5" />
                </Col>
                <Col xs={12} md={8} className="flex items-center pt-6">
                  <Checkbox 
                    checked={values.noDuesCleared} 
                    onChange={(e) => setFieldValue('noDuesCleared', e.target.checked)}
                  >
                    No Dues Clearance Completed
                  </Checkbox>
                </Col>
              </>
            )}

            <Col xs={24}>
              <Divider className="my-1 border-slate-100" />
            </Col>

            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Profile Photo (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setFieldValue('photoName', file.name);
                      setFieldValue('photoData', reader.result as string);
                      message.success(`${file.name} loaded successfully.`);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {values.photoUrl && <div className="text-[10px] text-green-600 mt-1">✔️ Current Photo: <a href={values.photoUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View uploaded photo</a></div>}
              {values.photoName && <div className="text-[10px] text-blue-600 mt-1">Pending: {values.photoName}</div>}
            </Col>
          </Row>

          <Divider className="my-4" />
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Scientist</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};


// ==========================================
// 2. PROJECT FORM WITH UTILIZATION CERTIFICATES
// ==========================================
interface ProjectFormProps {
  initialValues?: Partial<Project>;
  scientists: Scientist[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialValues,
  scientists,
  onSubmit,
  onCancel,
}) => {
  const { message } = App.useApp();
  const defaultValues = {
    name: '', shortName: '', type: 'ICMR', status: 'Yet to Start',
    startDate: '', endDate: '', budget: 0, piId: '',
    provisionalUCs: [], finalUC: null, finalReport: null,
    ...initialValues,
  };

  const handleFileUpload = (file: File, typeLabel: string, callback: (fileName: string, fileData: string) => void) => {
    if (file.type !== 'application/pdf') {
      message.error(`Only PDF documents are supported for ${typeLabel}.`);
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      callback(file.name, reader.result as string);
      message.success(`${file.name} loaded successfully.`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={projectValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <Row gutter={[16, 12]}>
            <Col xs={24}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Full Title</label>
              <Field as={Input.TextArea} rows={2} name="name" placeholder="Full scientific title of project..." className="rounded-md" />
              <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Short Code/Acronym</label>
              <Field as={Input} name="shortName" placeholder="Multi-Diag-Kits" className="rounded-md" />
              <ErrorMessage name="shortName" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Type</label>
              <Select value={values.type} onChange={(v) => setFieldValue('type', v)} className="w-full">
                {['Intramural', 'Extramural', 'ICMR', 'Other', 'NHRP'].map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Status</label>
              <Select value={values.status} onChange={(v) => setFieldValue('status', v)} className="w-full">
                {['Yet to Start', 'Ongoing', 'Completed'].map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Start Date</label>
              <Field as={Input} type="date" name="startDate" className="rounded-md w-full" />
              <ErrorMessage name="startDate" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">End Date</label>
              <Field as={Input} type="date" name="endDate" className="rounded-md w-full" />
              <ErrorMessage name="endDate" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Budget Allocation (INR)</label>
              <Field as={Input} type="number" name="budget" placeholder="Budget amount in Rupees" className="rounded-md" />
              <ErrorMessage name="budget" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Principal Investigator (PI)</label>
              <Select 
                value={values.piId} 
                onChange={(v) => setFieldValue('piId', v)} 
                placeholder="Select Scientist" 
                className="w-full"
              >
                {scientists.map(sci => (
                  <Option key={sci.id} value={sci.id}>{sci.name} ({sci.designation})</Option>
                ))}
              </Select>
              <ErrorMessage name="piId" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
          </Row>

          <Divider orientation={"left" as any} className="my-2"><span className="text-xs font-bold text-slate-700">Annual Statement of Accounts</span></Divider>

          {/* Provisional UCs FieldArray */}
          <Card size="small" title={<span className="text-xs font-bold">1. Provisional Utilization Certificates (Multiple entries)</span>}>
            <FieldArray name="provisionalUCs">
              {({ push, remove }) => (
                <div className="space-y-3">
                  {values.provisionalUCs.map((uc: any, index: number) => (
                    <Row gutter={12} key={uc.id || index} className="items-end bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                      <Col xs={24} sm={10}>
                        <label className="text-[10px] text-slate-500 block">Period (MM-YYYY to MM-YYYY)</label>
                        <Field as={Input} name={`provisionalUCs.${index}.period`} placeholder="e.g. 01-2025 to 12-2025" size="small" />
                      </Col>
                      <Col xs={18} sm={10}>
                        <label className="text-[10px] text-slate-500 block">Upload PDF Statement</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, 'Provisional UC', (fileName, fileData) => {
                                  setFieldValue(`provisionalUCs.${index}.fileName`, fileName);
                                  setFieldValue(`provisionalUCs.${index}.fileData`, fileData);
                                });
                              }
                            }}
                            className="text-xs"
                          />
                          {uc.fileName && <span className="text-[10px] text-emerald-600 font-bold truncate block max-w-[120px]">✔️ {uc.fileName}</span>}
                        </div>
                      </Col>
                      <Col xs={6} sm={4} className="text-right">
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(index)}>Remove</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => push({ id: `prov-${Date.now()}`, period: '', fileName: '', fileData: '' })}>
                    Add Provisional Statement
                  </Button>
                </div>
              )}
            </FieldArray>
          </Card>

          {/* Final UC */}
          <Card size="small" title={<span className="text-xs font-bold">2. Final Utilization Certificate</span>}>
            <Row gutter={12} className="items-end">
              <Col xs={24} sm={12}>
                <label className="text-[10px] text-slate-500 block">Final Period (MM-YYYY to MM-YYYY)</label>
                <Input 
                  placeholder="e.g. 01-2025 to 12-2027" 
                  value={values.finalUC?.period || ''} 
                  onChange={(e) => setFieldValue('finalUC', { ...values.finalUC, period: e.target.value })}
                  size="small"
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="text-[10px] text-slate-500 block">Upload Final Statement PDF</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'Final UC', (fileName, fileData) => {
                          setFieldValue('finalUC', {
                            period: values.finalUC?.period || '',
                            fileName,
                            fileData,
                          });
                        });
                      }
                    }}
                    className="text-xs"
                  />
                  {values.finalUC?.fileName && <span className="text-[10px] text-emerald-600 font-bold truncate block max-w-[120px]">✔️ {values.finalUC.fileName}</span>}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Final Project Report */}
          <Card size="small" title={<span className="text-xs font-bold">3. Final Project Report</span>}>
            <Row gutter={12} className="items-end">
              <Col xs={24} sm={12}>
                <label className="text-[10px] text-slate-500 block">Report Title</label>
                <Input 
                  placeholder="e.g. Phase III Clinical Evaluation Report" 
                  value={values.finalReport?.title || ''} 
                  onChange={(e) => setFieldValue('finalReport', { ...values.finalReport, title: e.target.value })}
                  size="small"
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="text-[10px] text-slate-500 block">Upload Report PDF Document</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'Final Project Report', (fileName, fileData) => {
                          setFieldValue('finalReport', {
                            title: values.finalReport?.title || '',
                            fileName,
                            fileData,
                          });
                        });
                      }
                    }}
                    className="text-xs"
                  />
                  {values.finalReport?.fileName && <span className="text-[10px] text-emerald-600 font-bold truncate block max-w-[120px]">✔️ {values.finalReport.fileName}</span>}
                </div>
              </Col>
            </Row>
          </Card>

          <Divider className="my-4" />
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Project</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
