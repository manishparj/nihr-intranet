import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, message, Input, Select, Avatar, Space } from 'antd';
import { 
  FileAddOutlined, SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, 
  SolutionOutlined, IdcardOutlined, BankOutlined, HistoryOutlined
} from '@ant-design/icons';
import { YPConsultant, VisibilityConfig } from '../types';
import { 
  renderMaskedField, calculateStaffExperienceYMD, formatYMD, 
  calculateYPConsultantTenureStatus 
} from '../utils/experience';
import { YPConsultantForm } from './StaffForms';
import { apiService } from '../services/api';

interface PublicYPConsultantsViewProps {
  ypConsultants: YPConsultant[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails?: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicYPConsultantsView({
  ypConsultants,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicYPConsultantsViewProps) {
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Filter YPs & Consultants
  const getFilteredConsultants = () => {
    return ypConsultants.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (s.employeeCode || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.fullDesignation || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesType = typeFilter === 'All' || s.designationType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredData = getFilteredConsultants();

  const getYPConsultantColumns = () => [
    { 
      title: 'Temp/CONS Code', 
      dataIndex: 'employeeCode', 
      key: 'employeeCode', 
      className: 'font-mono font-bold text-indigo-600',
      sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || '') 
    },
    { 
      title: 'Staff Member', 
      dataIndex: 'name', 
      key: 'name', 
      className: 'font-bold text-slate-800 dark:text-zinc-200',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name) 
    },
    { 
      title: 'Designation Type', 
      dataIndex: 'designationType', 
      key: 'designationType', 
      render: (val: string) => <Tag color={val === 'Consultant' ? 'magenta' : 'cyan'} className="font-bold rounded-md">{val}</Tag> 
    },
    { 
      title: 'Full Designation', 
      dataIndex: 'fullDesignation', 
      key: 'fullDesignation',
      className: 'font-medium text-slate-600 dark:text-zinc-300'
    },
    { 
      title: 'Total Exp (Y-M-D)', 
      key: 'totalExpYMD', 
      render: (_: any, rec: YPConsultant) => {
        const expYMD = calculateStaffExperienceYMD(rec);
        return <Tag color="blue" title={`${rec.totalExpMonths || 0} Months cumulative`}>{formatYMD(expYMD.total)}</Tag>;
      }, 
      sorter: (a: any, b: any) => (a.totalExpMonths || 0) - (b.totalExpMonths || 0) 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'} className="rounded-md font-bold">{status}</Tag> 
    }
  ];

  // Render expanded row details (Left side details, Right side lists/experience)
  const renderExpandedRow = (consultant: YPConsultant) => {
    const status = calculateYPConsultantTenureStatus(consultant);

    return (
      <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 m-2 transition-all duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Profile Card & Contacts & Identity */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 shadow-xs">
              {consultant.photoUrl ? (
                <img 
                  src={consultant.photoUrl} 
                  alt={consultant.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(consultant.name);
                  }}
                />
              ) : (
                <Avatar 
                  size={80} 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(consultant.name)}`}
                  className="border-2 border-indigo-500 shadow-sm"
                />
              )}
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0">{consultant.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 m-0">{consultant.fullDesignation}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Tag color={consultant.designationType === 'Consultant' ? 'magenta' : 'cyan'} className="m-0 text-[10px] font-bold">{consultant.designationType}</Tag>
                  <Tag color={consultant.status === 'Active' ? 'green' : 'red'} className="m-0 text-[10px] font-bold">{consultant.status}</Tag>
                </div>
              </div>
            </div>

            {/* Admin Specifications */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <SolutionOutlined className="mr-1" /> Administrative Placement Details
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Joining (DOJ)</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.doj || 'Not registered'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Employee Code</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{consultant.employeeCode || 'TEMP-CONS-CODE'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Assigned Room Number</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.roomNumber ? `Room ${consultant.roomNumber}` : 'Not assigned'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Division/Department</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.departmentLocation || 'Main Block'}</span>
                </div>
              </div>
            </div>

            {/* Secure Identity & Contacts */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <IdcardOutlined className="mr-1" /> Secure Identity & Communication Channels
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Official Email</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(consultant.email, isAuthenticated || !!visibility?.fields.email)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Mobile Number</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(consultant.phone, isAuthenticated || !!visibility?.fields.phone)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(consultant.dob, isAuthenticated || !!visibility?.fields.dob)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Gender / Blood Group</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.gender || '-'} / {consultant.bloodGroup || '-'}</span>
                </div>
                {(isAuthenticated || !!visibility?.fields.aadhaar) && (
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Aadhaar Card</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.aadhaarNumber, true)}</span>
                  </div>
                )}
                {(isAuthenticated || !!visibility?.fields.pan) && (
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">PAN Card</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.panNumber, true)}</span>
                  </div>
                )}
                {(isAuthenticated || !!visibility?.fields.address) && consultant.address && (
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-400 font-medium">Home Address</span>
                    <span className="text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.address, true)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank details if authorized */}
            {(isAuthenticated || !!visibility?.fields.bankDetails) && consultant.accountNumber && (
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  <BankOutlined className="mr-1" /> Salary Account Banking Specs
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">Bank Name</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.bankName, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Account No.</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.accountNumber, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">IFSC Code</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(consultant.ifscCode, true)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tenure Constraints & Experience Timeline Lists */}
          <div className="space-y-5">
            {/* Tenure Limits Assessment */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                ⏱️ ICMR Tenure Limit & Warnings Status Assessment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Numbers */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Prior ICMR Exp:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{formatYMD(status.prevIcmrYMD)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Current Consultant Term:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{formatYMD(status.currentIcmrYMD)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-zinc-800 my-1" />
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">Total ICMR Experience:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatYMD(status.totalIcmrYMD)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Cumulative Total Mths:</span>
                    <span className="font-mono">{status.cumulativeTotalMonths.toFixed(1)} mths</span>
                  </div>
                </div>

                {/* assessment alert */}
                <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1.5 ${
                  status.isRedFlag 
                    ? 'bg-red-50/55 border-red-200 dark:bg-red-950/20 dark:border-red-900/40' 
                    : 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-950/30'
                }`}>
                  {status.isRedFlag ? (
                    <>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider block">🚨 RED FLAG WARNING</span>
                      <span className="text-xs font-bold text-red-800 dark:text-red-300 leading-snug">
                        {status.remainingText} (Cut-off: {status.cutOffDateStr})
                      </span>
                      <span className="text-[9px] text-red-500 leading-tight">Reason: {status.cutOffReason}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-wider block">✅ TENURE COMPLIANT</span>
                      <span className="text-xs font-semibold text-green-800 dark:text-green-300 leading-snug">
                        {status.remainingText} until Cut-off.
                      </span>
                      <span className="text-[9px] text-slate-400">Scheduled Cut-off: {status.cutOffDateStr}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Experience timelines list */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-4">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <HistoryOutlined className="mr-1" /> Prior Professional Experience Timelines
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">ICMR Experience logs</span>
                  {consultant.previousIcmrExperience && consultant.previousIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {consultant.previousIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div className="max-w-[110px] truncate">
                            <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation || 'Fellow'}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{exp.institute || 'ICMR'}</span>
                          </div>
                          <span className="font-mono text-[9px] text-blue-600 font-bold self-center">{exp.fromDate} - {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">No previous ICMR experience logs</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Non-ICMR Experience logs</span>
                  {consultant.previousNonIcmrExperience && consultant.previousNonIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {consultant.previousNonIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div className="max-w-[110px] truncate">
                            <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{exp.institute || exp.organization}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 font-bold self-center">{exp.fromDate} - {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">No previous non-ICMR experience logs</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const onExpandRow = (expanded: boolean, record: YPConsultant) => {
    setExpandedRowKeys(expanded ? [record.id] : []);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters Header */}
        <Card 
          variant="borderless" 
          className="shadow-sm rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-3 bg-purple-600 rounded-xl text-white shadow-md flex items-center justify-center">
                <UserOutlined className="text-xl" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">SPECIALIZED ADVISORS & FELLOWS</span>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Young Professionals & Consultants</h2>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <Input 
                placeholder="Search staff, code, full designation..." 
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-lg h-10 w-full sm:w-64"
                allowClear
              />
              <Select
                placeholder="Filter Designation Type"
                value={typeFilter}
                onChange={setTypeFilter}
                className="rounded-lg h-10 w-full sm:w-44"
                options={[
                  { value: 'All', label: 'All Designations' },
                  { value: 'Young Professional', label: 'Young Professional' },
                  { value: 'Consultant', label: 'Consultant' }
                ]}
              />
              <Select
                placeholder="Filter Status"
                value={statusFilter}
                onChange={setStatusFilter}
                className="rounded-lg h-10 w-full sm:w-36"
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Left', label: 'Left' }
                ]}
              />
            </div>
          </div>
        </Card>

        <Card 
          title="🌟 Young Professional & Consultant Profiles (Click row to expand details)" 
          variant="borderless" 
          className="shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800"
          extra={
            <Button 
              type="primary" 
              icon={<FileAddOutlined />} 
              onClick={() => setRegisterModalVisible(true)}
              className="rounded-lg text-xs font-semibold bg-[#005EB8] hover:bg-blue-700"
            >
              📝 Self-Registration Form
            </Button>
          }
        >
          <Table 
            columns={getYPConsultantColumns()} 
            dataSource={filteredData} 
            pagination={{ 
              pageSizeOptions: ['10', '25', '50', '100'],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total) => `Total ${total} staff`
            }} 
            size="middle" 
            rowKey="id" 
            scroll={{ x: 'max-content' }}
            expandable={{
              expandedRowRender: renderExpandedRow,
              expandRowByClick: true,
              expandedRowKeys,
              onExpand: onExpandRow
            }}
            className="responsive-table-expanded"
          />
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-base font-extrabold text-[#005EB8] dark:text-blue-400">📝 YP & CONSULTANT STAFF SELF-REGISTRATION FORM</span>
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
        className="rounded-xl overflow-hidden"
      >
        <div className="py-2 max-h-[75vh] overflow-y-auto px-1">
          <div className="text-xs text-blue-800 dark:text-blue-300 mb-4 bg-blue-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-blue-100 dark:border-zinc-800/40">
            📌 Fill out this registration form. Once submitted, your profile will be reviewed by the Super Administrator. 
            Upon approval, you will be allocated a <strong>Temp/CONS Employee Code</strong> and listed on the official directory.
          </div>
          <YPConsultantForm
            onSubmit={async (values) => {
              const hide = message.loading('Submitting registration...', 0);
              try {
                await apiService.submitPendingYPConsultant(values);
                message.success('Registration submitted successfully! It is now pending administrative approval.');
                setRegisterModalVisible(false);
              } catch (err: any) {
                message.error('Failed to submit registration. Please try again.');
                console.error(err);
              } finally {
                hide();
              }
            }}
            onCancel={() => setRegisterModalVisible(false)}
          />
        </div>
      </Modal>
    </>
  );
}
