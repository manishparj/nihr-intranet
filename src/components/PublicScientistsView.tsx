import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Avatar, Space, Badge, Divider, Button } from 'antd';
import { 
  SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, 
  ProjectOutlined, TeamOutlined, SolutionOutlined, IdcardOutlined, BankOutlined
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
      className: 'font-mono font-bold text-indigo-600',
      sorter: (a: Scientist, b: Scientist) => a.employeeCode.localeCompare(b.employeeCode) 
    },
    { 
      title: 'Scientist Name', 
      dataIndex: 'name', 
      key: 'name', 
      className: 'font-bold text-slate-800 dark:text-zinc-200',
      sorter: (a: Scientist, b: Scientist) => a.name.localeCompare(b.name) 
    },
    { 
      title: 'Designation', 
      dataIndex: 'designation', 
      key: 'designation',
      className: 'font-medium text-slate-600 dark:text-zinc-300'
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
      render: (cat: string) => <Tag color="blue" className="rounded-md font-semibold">{cat}</Tag> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'} className="rounded-md font-bold">{status}</Tag> 
    }
  ];

  // Render the expanded row details (Left side details, Right side lists)
  const renderExpandedRow = (scientist: Scientist) => {
    const ledProjects = projects.filter(p => p.piId === scientist.id);
    const assignedStaff = projectStaff.filter(staff => 
      ledProjects.some(proj => proj.id === staff.projectId)
    );

    return (
      <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 m-2 transition-all duration-200">
        <div>
          
          {/* Left Column: Profile Card & Administrative Metadata */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 shadow-xs">
              {scientist.photoUrl ? (
                <img 
                  src={scientist.photoUrl} 
                  alt={scientist.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(scientist.name);
                  }}
                />
              ) : (
                <Avatar 
                  size={80} 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scientist.name)}`}
                  className="border-2 border-indigo-500 shadow-sm"
                />
              )}
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0">Dr. {scientist.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 m-0">{scientist.designation}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Tag color="purple" className="m-0 text-[10px] font-bold">Category: {scientist.category}</Tag>
                  <Tag color={scientist.status === 'Active' ? 'green' : 'red'} className="m-0 text-[10px] font-bold">{scientist.status}</Tag>
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
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Joining</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.doj || 'Not registered'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Assigned Room Number</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.roomNumber ? `Room ${scientist.roomNumber}` : 'Not assigned'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Division Location</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.departmentLocation || 'Main Block'}</span>
                </div>
              </div>
            </div>

            {/* Masked/Authenticated Identity & Contact Details */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <IdcardOutlined className="mr-1" /> Secure Profile Identity & Contacts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Govt Email</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(scientist.govtEmail, isAuthenticated || !!visibility?.fields.email)}
                  </span>
                </div>
                {isAuthenticated && (
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Personal Email</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">
                      {renderMaskedField(scientist.personalEmail, true)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Official Mobile</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(scientist.phone, isAuthenticated || !!visibility?.fields.phone)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(scientist.dob, true)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Gender / Blood Group</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {scientist.gender || '-'} / {scientist.bloodGroup || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank details if authorized */}
            {(isAuthenticated || (!!visibility?.fields.bankDetails && scientist.accountNumber)) && (
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  <BankOutlined className="mr-1" /> Direct Disbursement Salary Bank Account
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">Bank Name</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{renderMaskedField(scientist.bankName, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Account No.</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(scientist.accountNumber, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">IFSC Code</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(scientist.ifscCode, true)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Research Grants & Project Staff List */}
          <div className="space-y-5">
            {/* Projects list */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1 flex justify-between items-center">
                <span><ProjectOutlined className="mr-1" /> Led Research Schemes ({ledProjects.length})</span>
                <Badge count={ledProjects.length} color="#0284C7" />
              </span>
              {ledProjects.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ledProjects.map(proj => (
                    <div key={proj.id} className="p-2.5 bg-slate-50/80 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center">
                      <div className="space-y-0.5 truncate mr-3">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate">{proj.name}</span>
                        <div className="flex items-center gap-2">
                          <Tag color="blue" className="text-[9px] font-bold m-0 uppercase">{proj.shortName}</Tag>
                          <span className="text-[10px] text-slate-400">Budget: ₹{proj.budget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <Tag color={proj.status === 'Ongoing' ? 'processing' : 'success'}>{proj.status}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs italic text-slate-400 dark:text-zinc-500 block">No active or led research schemes found</span>
              )}
            </div>

            {/* Project Staff assigned to this PI's projects */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1 flex justify-between items-center">
                <span><TeamOutlined className="mr-1" /> Subordinate Research Staff ({assignedStaff.length})</span>
                <Badge count={assignedStaff.length} color="#4F46E5" />
              </span>
              {assignedStaff.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {assignedStaff.map(staff => {
                    const linkedProj = ledProjects.find(p => p.id === staff.projectId);
                    return (
                      <div key={staff.id} className="p-2.5 bg-slate-50/80 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 block">{staff.name}</span>
                          <span className="text-[10px] text-slate-500 block">{staff.designation} ({linkedProj?.shortName || 'Research Scheme'})</span>
                        </div>
                        <Tag color="purple" className="m-0 text-[10px] font-mono">{staff.employeeCode}</Tag>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs italic text-slate-400 dark:text-zinc-500 block">No subordinate research staff currently active</span>
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
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md flex items-center justify-center">
              <UserOutlined className="text-xl" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">ACADEMIC & SCIENTIFIC REGISTRY</span>
              <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Scientists Directory</h2>
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
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">SCIENTISTS LEDGER</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">🎓 Official Scientist Registry (Click any row to expand details below)</span>
          </div>
        } 
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800"
      >
        <Table 
          columns={getScientistColumns()} 
          dataSource={filteredData} 
          pagination={{ 
            pageSizeOptions: ['10', '25', '50', '100'],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total) => `Total ${total} scientists`
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
  );
}
