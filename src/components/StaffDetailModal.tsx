import { Modal, Avatar, Tag, Row, Col, Button, Table, Divider } from 'antd';
import { UserOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Project, ProjectStaff, VisibilityConfig } from '../types';
import { 
  renderMaskedField, calculateIcmrTenureStatus, calculateYPConsultantTenureStatus, formatYMD 
} from '../utils/experience';

interface StaffDetailModalProps {
  open: boolean;
  onCancel: () => void;
  record: any;
  type: 'scientist' | 'pstaff' | 'perm' | 'ypc' | 'project' | null;
  projects: Project[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function StaffDetailModal({
  open,
  onCancel,
  record,
  type,
  projects,
  projectStaff,
  visibility,
  isAuthenticated,
  handleDownloadBase64File
}: StaffDetailModalProps) {
  if (!record) return null;

  const isProject = type === 'project';

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Avatar icon={isProject ? <FilePdfOutlined /> : <UserOutlined />} className="bg-blue-600" />
          <div>
            <span className="font-bold text-base text-slate-800 dark:text-zinc-100">
              {record.name || (isProject ? 'Project Details' : 'Staff Member Profile')}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium">
              {type === 'scientist' ? 'Scientist Registry' : 
               type === 'pstaff' ? 'Project Research Staff Registry' :
               type === 'perm' ? 'Permanent Staff Directory' :
               type === 'ypc' ? 'Young Professional / Consultant' :
               'Project Administrative Ledger'}
            </span>
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel} className="rounded-lg">
          Close Profile View
        </Button>
      ]}
      width={700}
      className="rounded-xl overflow-hidden"
    >
      {isProject ? (
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Project Title Block */}
          <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Project Administrative Specification</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 m-0 mt-1 flex flex-wrap items-center gap-2">
              📂 {record.name}
            </h3>
            <div className="mt-2">
              <Tag color="blue" className="text-xs uppercase font-extrabold rounded-md m-0">{record.shortName}</Tag>
            </div>
          </div>

          {/* Specifications & Dates */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                🔬 Funding and Timeline
              </h4>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Funding Type</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.type} Scheme</span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Financial Outlay</span>
                  <span className="text-xs font-semibold text-emerald-600">₹{(record.budget || 0).toLocaleString()}</span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Scheduled Duration</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.durationDays} days</span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Commencement Date</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.startDate}</span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Scheduled End Date</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.endDate}</span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Timeline Remaining</span>
                  <Tag color={record.pendingDays <= 30 ? 'red' : 'green'} className="m-0 font-bold text-[10px]">
                    {record.pendingDays} days
                  </Tag>
                </Col>
              </Row>
            </Col>

            {/* Documentations */}
            <Col xs={24} sm={12}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                📅 Provisional UCs
              </h4>
              {record.provisionalUCs && record.provisionalUCs.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {record.provisionalUCs.map((uc: any, idx: number) => (
                    <div key={uc.id || idx} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs">
                      <span className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[130px]" title={uc.period}>📅 {uc.period}</span>
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<DownloadOutlined />} 
                        className="text-[10px] p-0 h-auto font-bold"
                        onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No Provisional UCs uploaded</span>
              )}
            </Col>

            <Col xs={24} sm={12}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                🏆 Final Documentation Reports
              </h4>
              <div className="space-y-2">
                {record.finalUC ? (
                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100/50 dark:border-amber-950/40 text-xs flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">Period: {record.finalUC.period}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">{record.finalUC.fileName}</span>
                    </div>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<DownloadOutlined />} 
                      className="text-[10px] p-0 h-auto font-bold text-amber-600"
                      onClick={() => handleDownloadBase64File(record.finalUC?.fileName || 'final_uc.pdf', record.finalUC?.fileData || '')}
                    >
                      Final UC
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">Final UC not uploaded</span>
                )}

                {record.finalReport ? (
                  <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg border border-emerald-100/50 dark:border-emerald-950/40 text-xs flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[140px]" title={record.finalReport.title}>
                        {record.finalReport.title || 'Scientific Report'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">{record.finalReport.fileName}</span>
                    </div>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<DownloadOutlined />} 
                      className="text-[10px] p-0 h-auto font-bold text-emerald-600"
                      onClick={() => handleDownloadBase64File(record.finalReport?.fileName || 'final_report.pdf', record.finalReport?.fileData || '')}
                    >
                      Report
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">Final Report not uploaded</span>
                )}
              </div>
            </Col>
          </Row>
        </div>
      ) : (
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Profile Header Block */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
            {record.photoUrl ? (
              <img 
                src={record.photoUrl} 
                alt={record.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(record.name);
                }}
              />
            ) : (
              <Avatar 
                size={80} 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.name)}`}
                className="border-2 border-blue-500 shadow-sm"
              />
            )}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 m-0">{record.name}</h3>
              <p className="text-xs font-semibold text-blue-600 m-0">{record.designation || record.fullDesignation || 'Officer'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag color="blue" className="m-0 text-[10px] uppercase font-bold">{record.employeeCode || 'TEMP-CODE'}</Tag>
                <Tag color={record.status === 'Active' ? 'green' : 'red'} className="m-0 text-[10px] uppercase font-bold">
                  {record.status || 'Active'}
                </Tag>
                {record.category && (
                  <Tag color="purple" className="m-0 text-[10px] uppercase font-bold">Category: {record.category}</Tag>
                )}
              </div>
            </div>
          </div>

          {/* Categorized Fields Grid */}
          <Row gutter={[16, 16]}>
            {/* Section 1: Professional & Academic */}
            <Col xs={24}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                💼 Professional & Placement Details
              </h4>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Joining</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {record.doj || 'Not Registered'}
                  </span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Room Number</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {record.roomNumber || 'Not Assigned'}
                  </span>
                </Col>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Department Location</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {record.departmentLocation || 'Main Campus Block'}
                  </span>
                </Col>
                {record.projectId && (
                  <Col xs={24} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Associated Extramural Scheme</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      📂 {projects.find(p => p.id === record.projectId)?.name || 'Research Scheme'}
                    </span>
                  </Col>
                )}
                {record.educationalQualification && (
                  <Col xs={24} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Highest Educational Qualification</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      🎓 {record.educationalQualification}
                    </span>
                  </Col>
                )}
              </Row>
            </Col>

            {/* Section 2: Contact Information */}
            <Col xs={24}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                📞 Contact & Communication Channels
              </h4>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <span className="block text-[10px] text-slate-400 font-medium">Government Official Email</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.govtEmail || record.email, true)}
                  </span>
                </Col>
                {(isAuthenticated || record.personalEmail) && isAuthenticated && (
                  <Col xs={24} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Personal Email</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.personalEmail, true)}
                    </span>
                  </Col>
                )}
                <Col xs={12} sm={12}>
                  <span className="block text-[10px] text-slate-400 font-medium">Official Mobile Number</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.phone, true)}
                  </span>
                </Col>
                {(isAuthenticated || (!!visibility?.fields.phone && record.emergencyContact)) && (
                  <Col xs={12} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Emergency Contact</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.emergencyContact, true)}
                    </span>
                  </Col>
                )}
              </Row>
            </Col>

            {/* Section 3: Identity & Demographics */}
            <Col xs={24}>
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                🔒 Identity Verification & Demographics
              </h4>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Birth</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.dob, true)}
                  </span>
                </Col>
                <Col xs={6} sm={4}>
                  <span className="block text-[10px] text-slate-400 font-medium">Gender</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {record.gender || '-'}
                  </span>
                </Col>
                <Col xs={6} sm={4}>
                  <span className="block text-[10px] text-slate-400 font-medium">Blood Group</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {record.bloodGroup || '-'}
                  </span>
                </Col>
                {(isAuthenticated || (!!visibility?.fields.aadhaar && record.aadhaarNumber)) && (
                  <Col xs={24} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Aadhaar Card Number</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.aadhaarNumber, true)}
                    </span>
                  </Col>
                )}
                {(isAuthenticated || (!!visibility?.fields.pan && record.panNumber)) && (
                  <Col xs={24} sm={12}>
                    <span className="block text-[10px] text-slate-400 font-medium">Permanent Account Number (PAN)</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.panNumber, true)}
                    </span>
                  </Col>
                )}
                {(isAuthenticated || (!!visibility?.fields.address && record.address)) && (
                  <Col xs={24}>
                    <span className="block text-[10px] text-slate-400 font-medium">Residential Home Address</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.address, true)}
                    </span>
                  </Col>
                )}
              </Row>
            </Col>

            {/* Section 4: Bank Details */}
            {(isAuthenticated || (!!visibility?.fields.bankDetails && record.accountNumber)) && (
              <Col xs={24}>
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                  🏦 Official Salary Disbursement Bank Account
                </h4>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={8}>
                    <span className="block text-[10px] text-slate-400 font-medium">Bank Name</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(record.bankName, true)}
                    </span>
                  </Col>
                  <Col xs={12} sm={8}>
                    <span className="block text-[10px] text-slate-400 font-medium">Disbursement Account Number</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">
                      {renderMaskedField(record.accountNumber, true)}
                    </span>
                  </Col>
                  <Col xs={12} sm={8}>
                    <span className="block text-[10px] text-slate-400 font-medium">Bank IFSC Branch Routing Code</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">
                      {renderMaskedField(record.ifscCode, true)}
                    </span>
                  </Col>
                </Row>
              </Col>
            )}

            {/* Section 5: Family Details */}
            {type === 'pstaff' && (record.fatherName || record.motherName || record.maritalStatus) && (
              <Col xs={24}>
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                  👪 Emergency Family Credentials
                </h4>
                <Row gutter={[12, 12]}>
                  {record.fatherName && (
                    <Col xs={12} sm={6}>
                      <span className="block text-[10px] text-slate-400 font-medium">Father's Name</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.fatherName}</span>
                    </Col>
                  )}
                  {record.fatherPhone && (
                    <Col xs={12} sm={6}>
                      <span className="block text-[10px] text-slate-400 font-medium">Father's Contact</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.fatherPhone}</span>
                    </Col>
                  )}
                  {record.motherName && (
                    <Col xs={12} sm={6}>
                      <span className="block text-[10px] text-slate-400 font-medium">Mother's Name</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.motherName}</span>
                    </Col>
                  )}
                  {record.motherPhone && (
                    <Col xs={12} sm={6}>
                      <span className="block text-[10px] text-slate-400 font-medium">Mother's Contact</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.motherPhone}</span>
                    </Col>
                  )}
                  <Col xs={12} sm={6}>
                    <span className="block text-[10px] text-slate-400 font-medium">Marital Status</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.maritalStatus || 'Single'}</span>
                  </Col>
                  {record.maritalStatus === 'Married' && (
                    <>
                      {record.spouseName && (
                        <Col xs={12} sm={6}>
                          <span className="block text-[10px] text-slate-400 font-medium">Spouse Name</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.spouseName}</span>
                        </Col>
                      )}
                      {record.spousePhone && (
                        <Col xs={12} sm={6}>
                          <span className="block text-[10px] text-slate-400 font-medium">Spouse Contact</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{record.spousePhone}</span>
                        </Col>
                      )}
                    </>
                  )}
                </Row>
              </Col>
            )}

            {/* Section 6: ICMR Experience Limits */}
            {(type === 'pstaff' || type === 'ypc') && (
              <Col xs={24}>
                <h4 className="text-xs font-bold text-[#005EB8] dark:text-blue-400 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">
                  ⏱️ Official ICMR Tenure Constraints & Red Flag Limit Status
                </h4>
                {(() => {
                  const tenure = type === 'ypc'
                    ? calculateYPConsultantTenureStatus(record)
                    : calculateIcmrTenureStatus(record, projects.find(p => p.id === record.projectId));

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Grid Item 1: Summary Numbers */}
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Prior ICMR Experience:</span>
                          <strong className="font-mono text-slate-700 dark:text-zinc-300">
                            {formatYMD(tenure.prevIcmrYMD)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Current Assignment Term:</span>
                          <strong className="font-mono text-slate-700 dark:text-zinc-300">
                            {formatYMD(tenure.currentIcmrYMD)}
                          </strong>
                        </div>
                        <div className="border-t border-dashed border-slate-200 dark:border-zinc-800/80 my-1" />
                        <div className="flex justify-between">
                          <span className="text-slate-700 dark:text-zinc-300 font-bold">Total ICMR Experience:</span>
                          <strong className="font-mono text-blue-600 dark:text-blue-400 font-black">
                            {formatYMD(tenure.totalIcmrYMD)}
                          </strong>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Cumulative Mths (ICMR+Non-ICMR):</span>
                          <strong className="font-mono">
                            {tenure.cumulativeTotalMonths.toFixed(1)} mths
                          </strong>
                        </div>
                      </div>

                      {/* Grid Item 2: Status Assessment Card */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1.5 ${
                        tenure.isRedFlag 
                          ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-950/40' 
                          : 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-950/30'
                      }`}>
                        {tenure.isRedFlag ? (
                          <>
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest block">🚨 RED FLAG VIOLATION WARNING</span>
                            <span className="text-xs font-bold text-red-800 dark:text-red-300">
                              {tenure.remainingText} (Cut-off Date: {tenure.cutOffDateStr})
                            </span>
                            <span className="text-[10px] text-red-600/90 dark:text-red-400/80 leading-tight">
                              Trigger Reason: {tenure.cutOffReason}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest block">✅ TENURE PROFILE COMPLIANT</span>
                            <span className="text-xs font-semibold text-green-800 dark:text-green-300">
                              {tenure.remainingText} until Cut-off date.
                            </span>
                            <span className="text-[10px] text-slate-400 leading-tight">
                              Scheduled Cut-off: {tenure.cutOffDateStr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Col>
            )}

            {/* Section 7: Prior Non-ICMR & Experience Timeline Lists */}
            {(type === 'pstaff' || type === 'ypc') && (
              <Col xs={24}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Previous Experience Timeline (ICMR)</span>
                    {record.previousIcmrExperience && record.previousIcmrExperience.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {record.previousIcmrExperience.map((exp: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                            <div className="max-w-[150px] truncate">
                              <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation || 'Research Fellow'}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{exp.institute || 'ICMR Institute'}</span>
                            </div>
                            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold self-center">{exp.fromDate} to {exp.toDate}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">No previous ICMR experience logs</span>
                    )}
                  </Col>
                  <Col xs={24} sm={12}>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Previous Experience Timeline (Non-ICMR)</span>
                    {record.previousNonIcmrExperience && record.previousNonIcmrExperience.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {record.previousNonIcmrExperience.map((exp: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                            <div className="max-w-[150px] truncate">
                              <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{exp.institute || exp.organization}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 font-bold self-center">{exp.fromDate} to {exp.toDate}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">No previous non-ICMR experience logs</span>
                    )}
                  </Col>
                </Row>
              </Col>
            )}

            {/* Section 8: Resignation Details */}
            {record.status === 'Left' && (
              <Col xs={24}>
                <div className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/40 rounded-xl">
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block uppercase tracking-wider mb-2">🚪 Resignation & No Dues Clearance Status</span>
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">Last Working Date</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {record.lastWorkingDate || '-'}
                      </span>
                    </Col>
                    <Col xs={12} sm={8}>
                      <span className="block text-[10px] text-slate-400 font-medium">No Dues Clearance Certificate</span>
                      <Tag color={record.noDuesCleared ? 'green' : 'orange'}>
                        {record.noDuesCleared ? '✔️ CLEARED & ARCHIVED' : '❌ PENDING SUBMISSION'}
                      </Tag>
                    </Col>
                    <Col xs={24} sm={8}>
                      <span className="block text-[10px] text-red-500 font-medium">Leaving Reason</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {record.leavingReason || 'Not stated'}
                      </span>
                    </Col>
                  </Row>
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}
    </Modal>
  );
}
