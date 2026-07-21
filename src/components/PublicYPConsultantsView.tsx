import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, message, Input, Select, Avatar } from 'antd';
import {
  FileAddOutlined, SearchOutlined, UserOutlined,
  SolutionOutlined, IdcardOutlined, BankOutlined, HistoryOutlined, FilterOutlined
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
      className: 'font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap',
      sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || ''),
      render: (code: string) => code || <span className="text-slate-300 dark:text-zinc-700">—</span>
    },
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
      className: 'font-semibold text-slate-800 dark:text-zinc-200',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Avatar
            size={26}
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`}
            className="border border-slate-200 dark:border-zinc-800 shrink-0"
          />
          {name}
        </span>
      )
    },
    {
      title: 'Designation Type',
      dataIndex: 'designationType',
      key: 'designationType',
      render: (val: string) => (
        <Tag color={val === 'Consultant' ? 'magenta' : 'cyan'} className="font-bold rounded-md border-0 whitespace-nowrap">{val}</Tag>
      )
    },
    {
      title: 'Full Designation',
      dataIndex: 'fullDesignation',
      key: 'fullDesignation',
      className: 'font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap'
    },
    {
      title: 'Total Exp (Y-M-D)',
      key: 'totalExpYMD',
      render: (_: any, rec: YPConsultant) => {
        const expYMD = calculateStaffExperienceYMD(rec);
        return (
          <Tag color="blue" className="rounded-md border-0 font-semibold" title={`${rec.totalExpMonths || 0} Months cumulative`}>
            {formatYMD(expYMD.total)}
          </Tag>
        );
      },
      sorter: (a: any, b: any) => (a.totalExpMonths || 0) - (b.totalExpMonths || 0)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'success' : 'error'} className="rounded-md font-bold border-0 px-2.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {status}
        </Tag>
      )
    }
  ];

  // Render expanded row details — compact two-column layout
  const renderExpandedRow = (consultant: YPConsultant) => {
    const status = calculateYPConsultantTenureStatus(consultant);

    return (
      <div
        style={{ width: 0, minWidth: '100%' }}
        className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-zinc-900/60 dark:to-zinc-950/60 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 m-1 sm:m-2 transition-all duration-200 shadow-inner box-border overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-w-0">

          {/* Left Column: Profile Card & Contacts & Identity */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200">
              {consultant.photoUrl ? (
                <img
                  src={consultant.photoUrl}
                  alt={consultant.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-950/40 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(consultant.name);
                  }}
                />
              ) : (
                <Avatar
                  size={64}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(consultant.name)}`}
                  className="border-2 border-indigo-500 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-950/40 shrink-0"
                />
              )}
              <div className="text-center sm:text-left space-y-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 m-0 truncate">{consultant.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 m-0 truncate">{consultant.fullDesignation}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Tag color={consultant.designationType === 'Consultant' ? 'magenta' : 'cyan'} className="m-0 text-[10px] font-bold border-0">{consultant.designationType}</Tag>
                  <Tag color={consultant.status === 'Active' ? 'success' : 'error'} className="m-0 text-[10px] font-bold border-0">{consultant.status}</Tag>
                </div>
              </div>
            </div>

            {/* Admin Specifications */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                <SolutionOutlined /> Administrative Placement & Secure Identity &amp; Communication
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Date of Joining (DOJ)</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.doj || 'Not registered'}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Employee Code</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono truncate block">{consultant.employeeCode || 'TEMP-CONS-CODE'}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Room Number</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.roomNumber ? `Room ${consultant.roomNumber}` : 'Not assigned'}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Division/Department</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate block">{consultant.departmentLocation || 'Main Block'}</span>
                </div>
                  <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Official Email</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 break-all">
                    {renderMaskedField(consultant.email, isAuthenticated || !!visibility?.fields.email)}
                  </span>
                </div>
                  <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Gender / Blood Group</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{consultant.gender || '-'} / {consultant.bloodGroup || '-'}</span>
                </div>
              </div>
            </div>
            {/* Bank details if authorized */}
            {(isAuthenticated || !!visibility?.fields.bankDetails) && consultant.accountNumber && (
              <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                  <BankOutlined /> Salary Account Banking Specs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Bank Name</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(consultant.bankName, true)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Account No.</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(consultant.accountNumber, true)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">IFSC Code</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(consultant.ifscCode, true)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tenure Constraints & Experience Timeline Lists */}
          <div className="space-y-3 sm:space-y-4">
            {/* Tenure Limits Assessment */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                ⏱️ ICMR Tenure Limit &amp; Warnings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Numbers */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between gap-2 font-medium">
                    <span className="text-slate-400 dark:text-zinc-500">Prior ICMR Exp:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{formatYMD(status.prevIcmrYMD)}</span>
                  </div>
                  <div className="flex justify-between gap-2 font-medium">
                    <span className="text-slate-400 dark:text-zinc-500">Current Term:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{formatYMD(status.currentIcmrYMD)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-zinc-800 my-1" />
                  <div className="flex justify-between gap-2 font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">Total ICMR Experience:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatYMD(status.totalIcmrYMD)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>Cumulative Total Mths:</span>
                    <span className="font-mono">{status.cumulativeTotalMonths.toFixed(1)} mths</span>
                  </div>
                </div>

                {/* assessment alert */}
                <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1.5 ${
                  status.isRedFlag
                    ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
                    : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-950/30'
                }`}>
                  {status.isRedFlag ? (
                    <>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider block">🚨 Red Flag Warning</span>
                      <span className="text-xs font-bold text-red-800 dark:text-red-300 leading-snug">
                        {status.remainingText} (Cut-off: {status.cutOffDateStr})
                      </span>
                      <span className="text-[9px] text-red-500 leading-tight">Reason: {status.cutOffReason}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider block">✅ Tenure Compliant</span>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-snug">
                        {status.remainingText} until cut-off.
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500">Scheduled cut-off: {status.cutOffDateStr}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Experience timelines list */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                <HistoryOutlined /> Prior Professional Experience Timelines
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase block mb-1.5">ICMR Experience Logs</span>
                  {consultant.previousIcmrExperience && consultant.previousIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {consultant.previousIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation || 'Fellow'}</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">{exp.institute || 'ICMR'}</span>
                          </div>
                          <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400 font-bold self-center whitespace-nowrap">{exp.fromDate} - {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-600 italic block">No previous ICMR experience logs</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase block mb-1.5">Non-ICMR Experience Logs</span>
                  {consultant.previousNonIcmrExperience && consultant.previousNonIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {consultant.previousNonIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between gap-2 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-700 dark:text-zinc-300 block truncate">{exp.designation}</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">{exp.institute || exp.organization}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 dark:text-zinc-400 font-bold self-center whitespace-nowrap">{exp.fromDate} - {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-600 italic block">No previous non-ICMR experience logs</span>
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
      <div className="space-y-5 sm:space-y-6 w-full max-w-full">
        {/* Search and Filters Header */}
        <Card
          variant="borderless"
          className="shadow-sm rounded-2xl border border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-900/20"
          styles={{ body: { padding: '20px' } }}
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl text-white shadow-lg shadow-purple-900/10 flex items-center justify-center shrink-0">
                <UserOutlined className="text-xl" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block truncate">
                  Specialized Advisors &amp; Fellows
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100 m-0 truncate">Young Professionals &amp; Consultants</h2>
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
          title={
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
              🌟 Young Professional &amp; Consultant Profiles <span className="hidden sm:inline font-normal text-slate-400 dark:text-zinc-500">— click a row to expand full details</span>
            </span>
          }
          variant="borderless"
          className="shadow-sm rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"
          styles={{ header: { borderBottom: '1px solid rgba(148,163,184,0.15)' }, body: { padding: 0 } }}
          extra={
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={() => setRegisterModalVisible(true)}
              className="rounded-lg text-xs font-semibold bg-[#005EB8] hover:bg-blue-700 shadow-md shadow-blue-900/10"
            >
              <span className="hidden sm:inline">📝 </span>Self-Registration
            </Button>
          }
        >
          <div className="p-2 sm:p-4">
            <Table
              columns={getYPConsultantColumns()}
              dataSource={filteredData}
              pagination={{
                pageSizeOptions: ['10', '25', '50', '100'],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total) => `Total ${total} staff`,
                responsive: true
              }}
              size="middle"
              rowKey="id"
              scroll={{ x: 'max-content' }}
              rowClassName={() => 'hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer'}
              expandable={{
                expandedRowRender: renderExpandedRow,
                expandRowByClick: true,
                expandedRowKeys,
                onExpand: onExpandRow
              }}
              className="responsive-table-expanded"
            />
          </div>
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-sm sm:text-base font-extrabold text-[#005EB8] dark:text-blue-400">📝 YP &amp; Consultant Staff Self-Registration Form</span>
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
        className="rounded-xl overflow-hidden"
        styles={{
    root: {
      borderRadius: 16,
    },
  }}
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