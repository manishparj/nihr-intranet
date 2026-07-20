import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Avatar, Space, Divider } from 'antd';
import { 
  SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, 
  SolutionOutlined, IdcardOutlined, BankOutlined, HeartOutlined
} from '@ant-design/icons';
import { PermanentStaff, VisibilityConfig } from '../types';
import { renderMaskedField } from '../utils/experience';

interface PublicPermanentStaffViewProps {
  permanentStaff: PermanentStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails?: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicPermanentStaffView({
  permanentStaff,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicPermanentStaffViewProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Filter permanent staff
  const getFilteredStaff = () => {
    return permanentStaff.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const filteredData = getFilteredStaff();

  const getPermanentStaffColumns = () => [
    { 
      title: 'Perm Code', 
      dataIndex: 'employeeCode', 
      key: 'employeeCode', 
      className: 'font-mono font-bold text-indigo-600',
      sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) 
    },
    { 
      title: 'Staff Member', 
      dataIndex: 'name', 
      key: 'name', 
      className: 'font-bold text-slate-800 dark:text-zinc-200',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name) 
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
      render: (c: string) => <Tag color="purple" className="rounded-md font-semibold">{c}</Tag> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'} className="rounded-md font-bold">{status}</Tag> 
    }
  ];

  // Render expanded row details (Left side details, Right side secure info/bank details/family details)
  const renderExpandedRow = (record: PermanentStaff) => {
    return (
      <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 m-2 transition-all duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Basic Details & Secure Identifiers */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 shadow-xs">
              {record.photoUrl ? (
                <img 
                  src={record.photoUrl} 
                  alt={record.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(record.name);
                  }}
                />
              ) : (
                <Avatar 
                  size={80} 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.name)}`}
                  className="border-2 border-indigo-500 shadow-sm"
                />
              )}
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0">{record.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 m-0">{record.designation}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Tag color="purple" className="m-0 text-[10px] font-bold">Category: {record.category}</Tag>
                  <Tag color={record.status === 'Active' ? 'green' : 'red'} className="m-0 text-[10px] font-bold">{record.status}</Tag>
                </div>
              </div>
            </div>

            {/* Admin specs */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <SolutionOutlined className="mr-1" /> Administrative Spec Sheet
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Joining (DOJ)</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.doj || 'Not registered'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Employee Code</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold">{record.employeeCode}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Room Assigned</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.roomNumber ? `Room ${record.roomNumber}` : 'Not assigned'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Division/Location</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.departmentLocation || 'Main Campus Block'}</span>
                </div>
              </div>
            </div>

            {/* Secure Identity & Contacts */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                <IdcardOutlined className="mr-1" /> Secure Identity details & Contacts
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Government Official Email</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.govtEmail, isAuthenticated || !!visibility?.fields.email)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Personal Contact</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.phone, isAuthenticated || !!visibility?.fields.phone)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(record.dob, isAuthenticated || !!visibility?.fields.dob)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Gender / Blood Group</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.gender || '-'} / {record.bloodGroup || '-'}</span>
                </div>
                {(isAuthenticated || !!visibility?.fields.aadhaar) && (
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Aadhaar Card</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(record.aadhaarNumber, true)}</span>
                  </div>
                )}
                {(isAuthenticated || !!visibility?.fields.pan) && (
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">PAN Card</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(record.panNumber, true)}</span>
                  </div>
                )}
                {(isAuthenticated || !!visibility?.fields.address) && record.address && (
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-400 font-medium">Home Address</span>
                    <span className="text-slate-700 dark:text-zinc-300">{renderMaskedField(record.address, true)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Bank Details & Family Details */}
          <div className="space-y-5">
            {/* Secure Banking Specs */}
            {(isAuthenticated || !!visibility?.fields.bankDetails) && record.accountNumber && (
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                  <BankOutlined className="mr-1" /> Direct Disbursement Salary Bank Account
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">Bank Name</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{renderMaskedField(record.bankName, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Account No.</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(record.accountNumber, true)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">IFSC Code</span>
                    <span className="font-semibold font-mono text-slate-700 dark:text-zinc-300">{renderMaskedField(record.ifscCode, true)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Family Details */}
            {(record.fatherName || record.motherName || record.maritalStatus) && (
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                  <HeartOutlined className="mr-1" /> Family & Emergency Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {record.fatherName && (
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Father's Name</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.fatherName}</span>
                    </div>
                  )}
                  {record.motherName && (
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Mother's Name</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.motherName}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Marital Status</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.maritalStatus || 'Single'}</span>
                  </div>
                  {record.maritalStatus === 'Married' && record.spouseName && (
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Spouse Name</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{record.spouseName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  const onExpandRow = (expanded: boolean, record: PermanentStaff) => {
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
            <div className="p-3 bg-purple-700 rounded-xl text-white shadow-md flex items-center justify-center">
              <UserOutlined className="text-xl" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">ADMINISTRATIVE & REGULAR STAFF</span>
              <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Permanent Staff Directory</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Input 
              placeholder="Search staff code, designation, or name..." 
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
                { value: 'SC', label: 'SC' },
                { value: 'ST', label: 'ST' },
                { value: 'OBC', label: 'OBC' },
                { value: 'General', label: 'General' }
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
        title="💼 Permanent Staff Directory (Click row to expand details)" 
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800"
      >
        <Table 
          columns={getPermanentStaffColumns()} 
          dataSource={filteredData} 
          pagination={{ 
            pageSizeOptions: ['10', '25', '50', '100'],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total) => `Total ${total} permanent staff`
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
