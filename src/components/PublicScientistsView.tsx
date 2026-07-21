import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Avatar, Badge } from 'antd';
import {
  SearchOutlined, UserOutlined, ProjectOutlined, TeamOutlined,
  SolutionOutlined, IdcardOutlined, BankOutlined, FilterOutlined
} from '@ant-design/icons';
import { Scientist, Project, ProjectStaff, VisibilityConfig } from '../types';
import { renderMaskedField } from '../utils/experience';

interface PublicScientistsViewProps {
  scientists: Scientist[];
  projects: Project[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails?: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function PublicScientistsView({
  scientists,
  projects,
  projectStaff,
  visibility,
  isAuthenticated,
  onOpenDetails,
  handleDownloadBase64File
}: PublicScientistsViewProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Filter scientists
  const getFilteredScientists = () => {
    return scientists.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const filteredData = getFilteredScientists();

  const getScientistColumns = () => [
    {
      title: 'Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      className: 'font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap',
      sorter: (a: Scientist, b: Scientist) => a.employeeCode.localeCompare(b.employeeCode)
    },
    {
      title: 'Scientist Name',
      dataIndex: 'name',
      key: 'name',
      className: 'font-semibold text-slate-800 dark:text-zinc-200',
      sorter: (a: Scientist, b: Scientist) => a.name.localeCompare(b.name),
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
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      className: 'font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap'
    },
    ...(isAuthenticated || !!visibility?.fields.email ? [{
      title: 'Govt Email',
      dataIndex: 'govtEmail',
      key: 'govtEmail',
      render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked')
    }] : []),
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue" className="rounded-md font-semibold border-0 whitespace-nowrap">{cat}</Tag>
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

  // Render the expanded row details — compact two-column layout
  const renderExpandedRow = (scientist: Scientist) => {
    const ledProjects = projects.filter(p => p.piId === scientist.id);
    const assignedStaff = projectStaff.filter(staff =>
      ledProjects.some(proj => proj.id === staff.projectId)
    );

    return (
      <div
        style={{ width: 0, minWidth: '100%' }}
        className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-zinc-900/60 dark:to-zinc-950/60 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 m-1 sm:m-2 transition-all duration-200 shadow-inner box-border overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-w-0">

          {/* Left Column: Profile Card & Administrative Metadata */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200">
              {scientist.photoUrl ? (
                <img
                  src={scientist.photoUrl}
                  alt={scientist.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-950/40 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(scientist.name);
                  }}
                />
              ) : (
                <Avatar
                  size={64}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scientist.name)}`}
                  className="border-2 border-indigo-500 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-950/40 shrink-0"
                />
              )}
              <div className="text-center sm:text-left space-y-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 m-0 truncate">{scientist.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 m-0 truncate">{scientist.designation}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Tag color="purple" className="m-0 text-[10px] font-bold border-0">{scientist.category}</Tag>
                  <Tag color={scientist.status === 'Active' ? 'success' : 'error'} className="m-0 text-[10px] font-bold border-0">{scientist.status}</Tag>
                </div>
              </div>
            </div>

            {/* Masked/Authenticated Identity & Contact Details */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                <IdcardOutlined /> Administrative Placement Secure Identity &amp; Contacts
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Date of Joining</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.doj || 'Not registered'}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Room Number</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.roomNumber ? `Room ${scientist.roomNumber}` : 'Not assigned'}</span>
                </div>
                <div className="min-w-0 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Division Location</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate block">{scientist.departmentLocation || 'Scientists Block'}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Govt Email</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 break-all">
                    {renderMaskedField(scientist.govtEmail, true)}
                  </span>
                </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Personal Email</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300 break-all">
                      {renderMaskedField(scientist.personalEmail, true)}
                    </span>
                  </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Date of Birth</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(scientist.dob, true)}
                  </span>
                </div>
                <div className="min-w-0 col-span-2">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Gender / Blood Group</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {scientist.gender || '-'} / {scientist.bloodGroup || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank details if authorized */}
            {(isAuthenticated || (!!visibility?.fields.bankDetails && scientist.accountNumber)) && (
              <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                  <BankOutlined /> Salary Bank Account
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Bank Name</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(scientist.bankName, true)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Account No.</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(scientist.accountNumber, true)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">IFSC Code</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300 truncate block">{renderMaskedField(scientist.ifscCode, true)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Research Grants & Project Staff List */}
          <div className="space-y-3 sm:space-y-4">
            {/* Projects list */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                <span className="flex items-center gap-1.5"><ProjectOutlined /> Led Research Schemes</span>
                <Badge count={ledProjects.length} color="#0284C7" />
              </span>
              {ledProjects.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {ledProjects.map(proj => (
                    <div key={proj.id} className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate">{proj.name}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag color="blue" className="text-[9px] font-bold m-0 uppercase border-0">{proj.shortName}</Tag>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">₹{proj.budget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <Tag color={proj.status === 'Ongoing' ? 'processing' : 'success'} className="border-0 shrink-0">{proj.status}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs italic text-slate-400 dark:text-zinc-600 block">No active or led research schemes found</span>
              )}
            </div>

            {/* Project Staff assigned to this PI's projects */}
            <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                <span className="flex items-center gap-1.5"><TeamOutlined /> Subordinate Research Staff</span>
                <Badge count={assignedStaff.length} color="#4F46E5" />
              </span>
              {assignedStaff.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {assignedStaff.map(staff => {
                    const linkedProj = ledProjects.find(p => p.id === staff.projectId);
                    return (
                      <div key={staff.id} className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center gap-2 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate">{staff.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-500 block truncate">{staff.designation} ({linkedProj?.shortName || 'Research Scheme'})</span>
                        </div>
                        <Tag color="purple" className="m-0 text-[10px] font-mono border-0 shrink-0">{staff.employeeCode}</Tag>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs italic text-slate-400 dark:text-zinc-600 block">No subordinate research staff currently active</span>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const onExpandRow = (expanded: boolean, record: Scientist) => {
    setExpandedRowKeys(expanded ? [record.id] : []);
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full">
      {/* Search and Filters Header */}
      <Card
        variant="borderless"
        className="shadow-sm rounded-2xl border border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-900/20"
        styles={{ body: { padding: '20px' } }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl text-white shadow-lg shadow-indigo-900/10 flex items-center justify-center shrink-0">
              <UserOutlined className="text-xl" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block truncate">
                Academic &amp; Scientific Registry
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100 m-0 truncate">Scientists Directory</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Input 
              placeholder="Search scientist code, designation or name..." 
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-lg h-10 w-full sm:w-64"
              allowClear
            />
            <Select
              placeholder="Filter Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="rounded-lg h-10 w-full sm:w-40"
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Scientist B', label: 'Scientist B' },
                { value: 'Scientist C', label: 'Scientist C' },
                { value: 'Scientist D', label: 'Scientist D' },
                { value: 'Scientist E', label: 'Scientist E' },
                { value: 'Scientist F', label: 'Scientist F' },
                { value: 'Scientist G', label: 'Scientist G' }
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
          <div className="py-1">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Scientists Ledger</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              🎓 Official Scientist Registry <span className="hidden sm:inline font-normal text-slate-400 dark:text-zinc-500">— click any row to expand details</span>
            </span>
          </div>
        }
        variant="borderless"
        className="shadow-sm rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"
        styles={{ header: { borderBottom: '1px solid rgba(148,163,184,0.15)' }, body: { padding: 0 } }}
      >
        <div className="p-2 sm:p-4">
          <Table
            columns={getScientistColumns()}
            dataSource={filteredData}
            pagination={{
              pageSizeOptions: ['10', '25', '50', '100'],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total) => `Total ${total} scientists`,
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
  );
}