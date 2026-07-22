import React from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Input, Select, Button, Space, Divider, Checkbox, Card, message, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProjectStaff, PermanentStaff, YPConsultant, Scientist, Project } from '../types';

const { Option } = Select;

// Helper to calculate total months from Experience lists
const calculateDynamicExperience = (entries: { fromDate: string; toDate: string }[]): number => {
  let totalDays = 0;
  entries.forEach(entry => {
    if (!entry.fromDate || !entry.toDate) return;
    const start = new Date(entry.fromDate);
    const end = new Date(entry.toDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      totalDays += Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    }
  });
  return Math.round(totalDays / 30.4); // convert to months
};

// Validation schemas
const projectStaffSchema = Yup.object().shape({
  name: Yup.string().optional(),
  dob: Yup.string().optional(),
  doj: Yup.string().optional(),
  designation: Yup.string().optional(),
  email: Yup.string().email('Invalid email').optional(),
  phone: Yup.string().optional(),
  gender: Yup.string().optional(),
  projectId: Yup.string().optional(),
  scientistId: Yup.string().optional(),
  aadhaarNumber: Yup.string().optional(),
  panNumber: Yup.string().optional(),
  accountNumber: Yup.string().optional(),
  ifscCode: Yup.string().optional(),
  bankName: Yup.string().optional(),
  contractPeriod: Yup.number().positive('Must be positive').optional(),
  motherName: Yup.string().optional(),
  motherPhone: Yup.string().optional(),
  fatherName: Yup.string().optional(),
  fatherPhone: Yup.string().optional(),
  maritalStatus: Yup.string().oneOf(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
  spouseName: Yup.string().optional(),
  spousePhone: Yup.string().optional(),
});

const permanentStaffSchema = Yup.object().shape({
  name: Yup.string().optional(),
  dob: Yup.string().optional(),
  doj: Yup.string().optional(),
  designation: Yup.string().optional(),
  govtEmail: Yup.string().email('Invalid email').optional(),
  personalEmail: Yup.string().email('Invalid email').optional(),
  phone: Yup.string().optional(),
  employeeCode: Yup.string().required('Employee Code is required'),
});

const ypConsultantSchema = Yup.object().shape({
  name: Yup.string().optional(),
  dob: Yup.string().optional(),
  doj: Yup.string().optional(),
  fullDesignation: Yup.string().optional(),
  designationType: Yup.string().oneOf(['Young Professional', 'Consultant']).optional(),
  email: Yup.string().email('Invalid email').optional(),
  phone: Yup.string().optional(),
});

// ==========================================
// 1. PROJECT STAFF FORM WITH ICMR EXPERIENCE
// ==========================================
interface ProjectStaffFormProps {
  initialValues?: Partial<ProjectStaff>;
  projects: Project[];
  scientists: Scientist[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const ProjectStaffForm: React.FC<ProjectStaffFormProps> = ({
  initialValues,
  projects,
  scientists,
  onSubmit,
  onCancel,
}) => {
  const { message } = App.useApp();
  const defaultValues = {
    projectId: '', scientistId: '', name: '', dob: '', doj: '', designation: '',
    email: '', phone: '', gender: 'Male', bloodGroup: '', emergencyContact: '',
    address: '', aadhaarNumber: '', panNumber: '', bankName: '', accountNumber: '', ifscCode: '',
    departmentLocation: '', roomNumber: '', educationalQualification: '', contractPeriod: 12,
    category: 'UR', status: 'Active', lastWorkingDate: '', leavingReason: '', noDuesCleared: false,
    employeeCode: '', previousIcmrExperience: [], previousNonIcmrExperience: [],
    motherName: '', motherPhone: '', fatherName: '', fatherPhone: '',
    maritalStatus: 'Single', spouseName: '', spousePhone: '',
    ...initialValues,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={projectStaffSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => {
        // Real-time calculation of previous experience
        const icmrMonths = calculateDynamicExperience(values.previousIcmrExperience || []);
        const nonIcmrMonths = calculateDynamicExperience(values.previousNonIcmrExperience || []);
        const totalMonths = icmrMonths + nonIcmrMonths;

        return (
          <Form className="space-y-4">
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                <Field as={Input} name="name" placeholder="John Doe" className="rounded-md" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Employee Code (Optional)</label>
                <Field as={Input} name="employeeCode" placeholder="Auto-generates if empty" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Contract Period (Months)</label>
                <Field as={Input} type="number" name="contractPeriod" className="rounded-md" />
                <ErrorMessage name="contractPeriod" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">DOB</label>
                <Field as={Input} type="date" name="dob" className="rounded-md w-full" />
                <ErrorMessage name="dob" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">DOJ</label>
                <Field as={Input} type="date" name="doj" className="rounded-md w-full" />
                <ErrorMessage name="doj" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Designation</label>
                <Field as={Input} name="designation" placeholder="Project Research Associate" className="rounded-md" />
                <ErrorMessage name="designation" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Project Link</label>
                <Select value={values.projectId} onChange={(v) => setFieldValue('projectId', v)} className="w-full">
                  {projects.map(p => (
                    <Option key={p.id} value={p.id}>{p.shortName}</Option>
                  ))}
                </Select>
                <ErrorMessage name="projectId" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Principal Investigator</label>
                <Select value={values.scientistId} onChange={(v) => setFieldValue('scientistId', v)} className="w-full">
                  {scientists.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
                <ErrorMessage name="scientistId" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email ID</label>
                <Field as={Input} name="email" placeholder="john.doe@gmail.com" className="rounded-md" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
                <Field as={Input} name="phone" placeholder="+91 98989 12345" className="rounded-md" />
                <ErrorMessage name="phone" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
                <Select value={values.gender} onChange={(v) => setFieldValue('gender', v)} className="w-full">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                <Select value={values.category} onChange={(v) => setFieldValue('category', v)} className="w-full">
                  {['SC', 'ST', 'OBC', 'PWD', 'EWS', 'UR'].map(c => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Blood Group</label>
                <Field as={Input} name="bloodGroup" placeholder="AB+" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Emergency Contact</label>
                <Field as={Input} name="emergencyContact" placeholder="+91 99999 55555" className="rounded-md" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Aadhaar Card Number</label>
                <Field as={Input} name="aadhaarNumber" placeholder="XXXX XXXX XXXX" className="rounded-md" />
                <ErrorMessage name="aadhaarNumber" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">PAN Card Number</label>
                <Field as={Input} name="panNumber" placeholder="ABCDE1234F" className="rounded-md" />
                <ErrorMessage name="panNumber" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
                <Field as={Input} name="bankName" placeholder="State Bank of India" className="rounded-md" />
                <ErrorMessage name="bankName" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Account Number</label>
                <Field as={Input} name="accountNumber" placeholder="320012546879" className="rounded-md" />
                <ErrorMessage name="accountNumber" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">IFSC Code</label>
                <Field as={Input} name="ifscCode" placeholder="SBIN0001234" className="rounded-md" />
                <ErrorMessage name="ifscCode" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Educational Qualifications</label>
                <Field as={Input.TextArea} rows={1} name="educationalQualification" placeholder="M.Sc Microbiology, Ph.D, etc." className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number</label>
                <Field as={Input} name="roomNumber" placeholder="12" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Department Location</label>
                <Field as={Input} name="departmentLocation" placeholder="Lab Block, Ground Floor" className="rounded-md" />
              </Col>
              <Col xs={24}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Permanent Residential Address</label>
                <Field as={Input} name="address" placeholder="Residential Town, Sector, State" className="rounded-md" />
              </Col>
              
              <Col xs={24}>
                <Divider orientation={"left" as any} className="m-0 text-xs font-bold text-slate-500 uppercase tracking-wider">👨‍👩‍👦 Family & Marital Status Details</Divider>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Father's Name</label>
                <Field as={Input} name="fatherName" placeholder="Father's Full Name" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Father's Mobile Number</label>
                <Field as={Input} name="fatherPhone" placeholder="Father's Mobile" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Mother's Name</label>
                <Field as={Input} name="motherName" placeholder="Mother's Full Name" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Mother's Mobile Number</label>
                <Field as={Input} name="motherPhone" placeholder="Mother's Mobile" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Marital Status</label>
                <Select value={values.maritalStatus || 'Single'} onChange={(v) => setFieldValue('maritalStatus', v)} className="w-full">
                  <Option value="Single">Single</Option>
                  <Option value="Married">Married</Option>
                  <Option value="Divorced">Divorced</Option>
                  <Option value="Widowed">Widowed</Option>
                </Select>
              </Col>
              {values.maritalStatus === 'Married' && (
                <>
                  <Col xs={12} md={9}>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Spouse Name</label>
                    <Field as={Input} name="spouseName" placeholder="Spouse's Full Name" className="rounded-md" />
                  </Col>
                  <Col xs={12} md={9}>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Spouse Phone Number</label>
                    <Field as={Input} name="spousePhone" placeholder="Spouse's Mobile" className="rounded-md" />
                  </Col>
                </>
              )}

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
                  </Col>
                  <Col xs={24} md={8}>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Leaving Reason</label>
                    <Field as={Input} name="leavingReason" placeholder="Contract Expired / New Job" className="rounded-md" />
                  </Col>
                  <Col xs={24} className="flex items-center pt-3">
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
                <label className="text-xs font-semibold text-slate-600 block mb-1">Profile Photo</label>
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

            <Divider className="my-2" />
            <div className="bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-600">Calculated Dynamic Total Experience:</span>
              <span className="text-xs font-bold text-blue-600">{totalMonths} Months (ICMR: {icmrMonths} | Non-ICMR: {nonIcmrMonths})</span>
            </div>

            {/* Previous ICMR Exp Array */}
            <Card size="small" title={<span className="text-xs font-bold">Previous ICMR Experience</span>} className="mb-4">
              <FieldArray name="previousIcmrExperience">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {values.previousIcmrExperience.map((exp: any, index: number) => (
                      <Row gutter={8} key={exp.id || index} className="items-end bg-slate-50/50 dark:bg-zinc-900/20 p-2 rounded-md border border-slate-100/30">
                        <Col xs={24} sm={8}>
                          <label className="text-[10px] text-slate-500 block">Institute Name</label>
                          <Field as={Input} name={`previousIcmrExperience.${index}.instituteName`} placeholder="ICMR-NIV, Pune" size="small" />
                        </Col>
                        <Col xs={12} sm={6}>
                          <label className="text-[10px] text-slate-500 block">Designation</label>
                          <Field as={Input} name={`previousIcmrExperience.${index}.designation`} placeholder="JRF" size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">From</label>
                          <Field as={Input} type="date" name={`previousIcmrExperience.${index}.fromDate`} size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">To</label>
                          <Field as={Input} type="date" name={`previousIcmrExperience.${index}.toDate`} size="small" />
                        </Col>
                        <Col xs={24} sm={2} className="text-right">
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => push({ id: `exp-${Date.now()}`, instituteName: '', designation: '', fromDate: '', toDate: '' })}>
                      Add Previous ICMR Entry
                    </Button>
                  </div>
                )}
              </FieldArray>
            </Card>

            {/* Previous Non-ICMR Exp Array */}
            <Card size="small" title={<span className="text-xs font-bold">Previous Non-ICMR Experience</span>}>
              <FieldArray name="previousNonIcmrExperience">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {values.previousNonIcmrExperience.map((exp: any, index: number) => (
                      <Row gutter={8} key={exp.id || index} className="items-end bg-slate-50/50 dark:bg-zinc-900/20 p-2 rounded-md border border-slate-100/30">
                        <Col xs={24} sm={8}>
                          <label className="text-[10px] text-slate-500 block">Institute Name</label>
                          <Field as={Input} name={`previousNonIcmrExperience.${index}.instituteName`} placeholder="AIIMS, New Delhi" size="small" />
                        </Col>
                        <Col xs={12} sm={6}>
                          <label className="text-[10px] text-slate-500 block">Designation</label>
                          <Field as={Input} name={`previousNonIcmrExperience.${index}.designation`} placeholder="Lab Assistant" size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">From</label>
                          <Field as={Input} type="date" name={`previousNonIcmrExperience.${index}.fromDate`} size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">To</label>
                          <Field as={Input} type="date" name={`previousNonIcmrExperience.${index}.toDate`} size="small" />
                        </Col>
                        <Col xs={24} sm={2} className="text-right">
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => push({ id: `exp-${Date.now()}`, instituteName: '', designation: '', fromDate: '', toDate: '' })}>
                      Add Previous Non-ICMR Entry
                    </Button>
                  </div>
                )}
              </FieldArray>
            </Card>

            <Divider className="my-4" />
            <div className="flex justify-end gap-2">
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Staff Member</Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};


// ==========================================
// 2. PERMANENT STAFF FORM COMPONENT
// ==========================================
interface PermanentStaffFormProps {
  initialValues?: Partial<PermanentStaff>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const PermanentStaffForm: React.FC<PermanentStaffFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { message } = App.useApp();
  const defaultValues = {
    name: '', dob: '', doj: '', designation: '', govtEmail: '', personalEmail: '',
    phone: '', employeeCode: '', gender: 'Male', bloodGroup: '', emergencyContact: '',
    address: '', aadhaarNumber: '', panNumber: '', departmentLocation: '', roomNumber: '',
    category: 'UR', accountNumber: '', ifscCode: '', bankName: '', status: 'Active',
    lastWorkingDate: '', leavingReason: '', noDuesCleared: false,
    ...initialValues,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={permanentStaffSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <Field as={Input} name="name" placeholder="John Doe" className="rounded-md" />
              <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Employee Code</label>
              <Field as={Input} name="employeeCode" placeholder="PERM-01" className="rounded-md" />
              <ErrorMessage name="employeeCode" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">DOB</label>
              <Field as={Input} type="date" name="dob" className="rounded-md w-full" />
              <ErrorMessage name="dob" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">DOJ</label>
              <Field as={Input} type="date" name="doj" className="rounded-md w-full" />
              <ErrorMessage name="doj" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Designation</label>
              <Field as={Input} name="designation" placeholder="Administrative Assistant" className="rounded-md" />
              <ErrorMessage name="designation" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Govt Email</label>
              <Field as={Input} name="govtEmail" placeholder="j.doe@nihr.res.in" className="rounded-md" />
              <ErrorMessage name="govtEmail" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={24} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Personal Email</label>
              <Field as={Input} name="personalEmail" placeholder="j.doe@gmail.com" className="rounded-md" />
              <ErrorMessage name="personalEmail" component="div" className="text-red-500 text-[10px] mt-0.5" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
              <Field as={Input} name="phone" placeholder="+91 95551 11222" className="rounded-md" />
              <ErrorMessage name="phone" component="div" className="text-red-500 text-[10px] mt-0.5" />
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
              <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
              <Select value={values.category} onChange={(v) => setFieldValue('category', v)} className="w-full">
                {['SC', 'ST', 'OBC', 'PWD', 'EWS', 'UR'].map(c => (
                  <Option key={c} value={c}>{c}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Blood Group</label>
              <Field as={Input} name="bloodGroup" placeholder="B+" className="rounded-md" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Emergency Contact</label>
              <Field as={Input} name="emergencyContact" placeholder="+91 99999 44444" className="rounded-md" />
            </Col>
            <Col xs={12} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Aadhaar Card Number</label>
              <Field as={Input} name="aadhaarNumber" placeholder="XXXX XXXX XXXX" className="rounded-md" />
            </Col>
            <Col xs={12} md={12}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">PAN Card Number</label>
              <Field as={Input} name="panNumber" placeholder="ABCDE1234F" className="rounded-md" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
              <Field as={Input} name="bankName" placeholder="ICICI Bank" className="rounded-md" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Account</label>
              <Field as={Input} name="accountNumber" placeholder="321045612348" className="rounded-md" />
            </Col>
            <Col xs={12} md={8}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Bank IFSC</label>
              <Field as={Input} name="ifscCode" placeholder="ICIC0000010" className="rounded-md" />
            </Col>
            <Col xs={12} md={6}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number</label>
              <Field as={Input} name="roomNumber" placeholder="104" className="rounded-md" />
            </Col>
            <Col xs={12} md={18}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Department Location</label>
              <Field as={Input} name="departmentLocation" placeholder="Administrative Wing, Ground Floor" className="rounded-md" />
            </Col>
            <Col xs={24}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Permanent Residential Address</label>
              <Field as={Input} name="address" placeholder="Residential Town, Sector, State" className="rounded-md" />
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
                </Col>
                <Col xs={24} md={8}>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Leaving Reason</label>
                  <Field as={Input} name="leavingReason" placeholder="Superannuation / Health Reasons" className="rounded-md" />
                </Col>
                <Col xs={24} className="flex items-center pt-3">
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
              <label className="text-xs font-semibold text-slate-600 block mb-1">Profile Photo</label>
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
            <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Permanent Staff</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};


// ==========================================
// 3. YP & CONSULTANT FORM COMPONENT
// ==========================================
interface YPConsultantFormProps {
  initialValues?: Partial<YPConsultant>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const YPConsultantForm: React.FC<YPConsultantFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { message } = App.useApp();
  const defaultValues = {
    name: '', dob: '', doj: '', fullDesignation: '', designationType: 'Young Professional',
    email: '', phone: '', gender: 'Male', bloodGroup: '', employeeCode: '',
    aadhaarNumber: '', panNumber: '', accountNumber: '', ifscCode: '', bankName: '',
    departmentLocation: '', roomNumber: '', address: '', emergencyContact: '',
    category: 'UR', status: 'Active', lastWorkingDate: '', leavingReason: '', noDuesCleared: false,
    previousIcmrExperience: [], previousNonIcmrExperience: [],
    ...initialValues,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={ypConsultantSchema}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue, isSubmitting }) => {
        // Calculate Dynamic Experience
        const icmrMonths = calculateDynamicExperience(values.previousIcmrExperience || []);
        const nonIcmrMonths = calculateDynamicExperience(values.previousNonIcmrExperience || []);
        
        // Current experience
        let currentMonths = 0;
        if (values.doj) {
          const start = new Date(values.doj);
          const endStr = values.status === 'Left' && values.lastWorkingDate
            ? values.lastWorkingDate
            : new Date().toISOString().split('T')[0];
          const end = new Date(endStr);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            currentMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4));
          }
        }

        const totalIcmrMonths = icmrMonths + currentMonths;
        const totalMonths = icmrMonths + nonIcmrMonths + currentMonths;

        return (
          <Form className="space-y-4">
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                <Field as={Input} name="name" placeholder="John Doe" className="rounded-md" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Designation Type</label>
                <Select value={values.designationType} onChange={(v) => setFieldValue('designationType', v)} className="w-full">
                  <Option value="Young Professional">Young Professional</Option>
                  <Option value="Consultant">Consultant</Option>
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Employee Code (Optional)</label>
                <Field as={Input} name="employeeCode" placeholder="Auto-generates if empty" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">DOB</label>
                <Field as={Input} type="date" name="dob" className="rounded-md w-full" />
                <ErrorMessage name="dob" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">DOJ</label>
                <Field as={Input} type="date" name="doj" className="rounded-md w-full" />
                <ErrorMessage name="doj" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={24} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Designation</label>
                <Field as={Input} name="fullDesignation" placeholder="Young Professional II (IT) or Consultant (Virology)" className="rounded-md" />
                <ErrorMessage name="fullDesignation" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Official Email</label>
                <Field as={Input} name="email" placeholder="john.doe@nihr.res.in" className="rounded-md" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
                <Field as={Input} name="phone" placeholder="+91 90001 20002" className="rounded-md" />
                <ErrorMessage name="phone" component="div" className="text-red-500 text-[10px] mt-0.5" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
                <Select value={values.gender} onChange={(v) => setFieldValue('gender', v)} className="w-full">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                <Select value={values.category} onChange={(v) => setFieldValue('category', v)} className="w-full">
                  {['SC', 'ST', 'OBC', 'PWD', 'EWS', 'UR'].map(c => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Blood Group</label>
                <Field as={Input} name="bloodGroup" placeholder="A+" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Emergency Contact</label>
                <Field as={Input} name="emergencyContact" placeholder="+91 99999 33333" className="rounded-md" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Aadhaar Card Number</label>
                <Field as={Input} name="aadhaarNumber" placeholder="XXXX XXXX XXXX" className="rounded-md" />
              </Col>
              <Col xs={12} md={12}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">PAN Card Number</label>
                <Field as={Input} name="panNumber" placeholder="ABCDE1234F" className="rounded-md" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
                <Field as={Input} name="bankName" placeholder="Axis Bank" className="rounded-md" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Account</label>
                <Field as={Input} name="accountNumber" placeholder="916000125438" className="rounded-md" />
              </Col>
              <Col xs={12} md={8}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank IFSC</label>
                <Field as={Input} name="ifscCode" placeholder="UTIB0000012" className="rounded-md" />
              </Col>
              <Col xs={12} md={6}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number</label>
                <Field as={Input} name="roomNumber" placeholder="G-12" className="rounded-md" />
              </Col>
              <Col xs={12} md={18}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Department Location</label>
                <Field as={Input} name="departmentLocation" placeholder="IT Cell, Ground Floor" className="rounded-md" />
              </Col>
              <Col xs={24}>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Permanent Residential Address</label>
                <Field as={Input} name="address" placeholder="Munirka, New Delhi" className="rounded-md" />
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
                  </Col>
                  <Col xs={24} md={8}>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Leaving Reason</label>
                    <Field as={Input} name="leavingReason" placeholder="Resigned / Contract Over" className="rounded-md" />
                  </Col>
                  <Col xs={24} className="flex items-center pt-3">
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
                <label className="text-xs font-semibold text-slate-600 block mb-1">Profile Photo</label>
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

            <Divider className="my-2" />
            <div className="bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Calculated Dynamic Experience:</span>
                <span className="text-xs font-bold text-blue-600">
                  Total ICMR Exp: {totalIcmrMonths} Months | Total Exp: {totalMonths} Months
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>(Prev ICMR: {icmrMonths}m | Prev Non-ICMR: {nonIcmrMonths}m | Current DOJ to Today: {currentMonths}m)</span>
              </div>
              {totalIcmrMonths >= 60 && (
                <div className="text-red-500 text-xs font-bold mt-1">
                  🚨 Warning: Total ICMR Experience exceeds or equals 5 Years (60 Months limit).
                </div>
              )}
            </div>

            {/* Previous ICMR Exp Array */}
            <Card size="small" title={<span className="text-xs font-bold">Previous ICMR Experience</span>} className="mb-4">
              <FieldArray name="previousIcmrExperience">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {(values.previousIcmrExperience || []).map((exp: any, index: number) => (
                      <Row gutter={8} key={exp.id || index} className="items-end bg-slate-50/50 dark:bg-zinc-900/20 p-2 rounded-md border border-slate-100/30">
                        <Col xs={24} sm={8}>
                          <label className="text-[10px] text-slate-500 block">Institute Name</label>
                          <Field as={Input} name={`previousIcmrExperience.${index}.instituteName`} placeholder="ICMR-NIV, Pune" size="small" />
                        </Col>
                        <Col xs={12} sm={6}>
                          <label className="text-[10px] text-slate-500 block">Designation</label>
                          <Field as={Input} name={`previousIcmrExperience.${index}.designation`} placeholder="JRF" size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">From</label>
                          <Field as={Input} type="date" name={`previousIcmrExperience.${index}.fromDate`} size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">To</label>
                          <Field as={Input} type="date" name={`previousIcmrExperience.${index}.toDate`} size="small" />
                        </Col>
                        <Col xs={24} sm={2} className="text-right">
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => push({ id: `exp-${Date.now()}`, instituteName: '', designation: '', fromDate: '', toDate: '' })}>
                      Add Previous ICMR Entry
                    </Button>
                  </div>
                )}
              </FieldArray>
            </Card>

            {/* Previous Non-ICMR Exp Array */}
            <Card size="small" title={<span className="text-xs font-bold">Previous Non-ICMR Experience</span>}>
              <FieldArray name="previousNonIcmrExperience">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {(values.previousNonIcmrExperience || []).map((exp: any, index: number) => (
                      <Row gutter={8} key={exp.id || index} className="items-end bg-slate-50/50 dark:bg-zinc-900/20 p-2 rounded-md border border-slate-100/30">
                        <Col xs={24} sm={8}>
                          <label className="text-[10px] text-slate-500 block">Institute Name</label>
                          <Field as={Input} name={`previousNonIcmrExperience.${index}.instituteName`} placeholder="AIIMS, New Delhi" size="small" />
                        </Col>
                        <Col xs={12} sm={6}>
                          <label className="text-[10px] text-slate-500 block">Designation</label>
                          <Field as={Input} name={`previousNonIcmrExperience.${index}.designation`} placeholder="Lab Assistant" size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">From</label>
                          <Field as={Input} type="date" name={`previousNonIcmrExperience.${index}.fromDate`} size="small" />
                        </Col>
                        <Col xs={6} sm={4}>
                          <label className="text-[10px] text-slate-500 block">To</label>
                          <Field as={Input} type="date" name={`previousNonIcmrExperience.${index}.toDate`} size="small" />
                        </Col>
                        <Col xs={24} sm={2} className="text-right">
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" block size="small" icon={<PlusOutlined />} onClick={() => push({ id: `exp-${Date.now()}`, instituteName: '', designation: '', fromDate: '', toDate: '' })}>
                      Add Previous Non-ICMR Entry
                    </Button>
                  </div>
                )}
              </FieldArray>
            </Card>

            <Divider className="my-4" />
            <div className="flex justify-end gap-2">
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>Save Member</Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};
