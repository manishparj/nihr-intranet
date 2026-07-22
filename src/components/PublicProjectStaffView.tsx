import { useState } from 'react';
import { Card, Table, Tag, Button, Modal, message, Input, Select, Avatar } from 'antd';
import {
  FileAddOutlined, SearchOutlined, UserOutlined,
  ProjectOutlined, ClockCircleOutlined, CalendarOutlined,
  IdcardOutlined, MailOutlined, UserSwitchOutlined,
  EnvironmentOutlined, ApartmentOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { ProjectStaff, Project, Scientist, VisibilityConfig } from '../types';
import {
  calculateStaffExperienceYMD, formatYMD, renderMaskedField,
  calculateIcmrTenureStatus
} from '../utils/experience';
import { ProjectStaffForm } from './StaffForms';
import { apiService } from '../services/api';

interface PublicProjectStaffViewProps {
  projectStaff: ProjectStaff[];
  projects: Project[];
  scientists: Scientist[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails?: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
}

export function PublicProjectStaffView({
  projectStaff,
  projects,
  scientists,
  visibility,
  isAuthenticated,
  onOpenDetails
}: PublicProjectStaffViewProps) {
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Filter staff
  const getFilteredStaff = () => {
    return projectStaff.filter(s => {
      const linkedProj = projects.find(p => p.id === s.projectId);
      const matchesSearch =
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (s.employeeCode || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (linkedProj?.shortName || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const filteredData = getFilteredStaff();

  const getProjectStaffColumns = () => [
    {
      title: 'Temp Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 110,
      className: 'font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || ''),
      render: (code: string) => code || <span className="text-slate-300 dark:text-zinc-700">—</span>
    },
    {
      title: 'Staff Member',
      key: 'staffMember',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (_: any, rec: ProjectStaff) => (
        <span className="flex items-center gap-2.5 min-w-0">
           {rec.photoUrl ? (
                <img
                  src={rec.photoUrl}
                  alt={rec.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#005EB8] shadow-sm ring-2 ring-blue-100 dark:ring-blue-950/40 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(rec.name);
                  }}
                />
              ) : (
                <Avatar
                  size={80}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rec.name)}`}
                  className="border-2 border-[#005EB8] shadow-sm ring-2 ring-blue-100 dark:ring-blue-950/40 shrink-0"
                />
              )}
          <span className="flex flex-col min-w-0 leading-tight">
            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{rec.name}</span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 truncate">{rec.designation}</span>
          </span>
        </span>
      )
    },
    {
      title: 'Project & PI',
      key: 'projectPi',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      render: (_: any, rec: ProjectStaff) => {
        const p = projects.find(proj => proj.id === rec.projectId);
        const pi = scientists.find(s => s.id === rec.scientistId);
        return (
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-lg shadow-sm px-2.5 py-1.5 flex flex-col gap-1 min-w-0 w-fit">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <ProjectOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Project:</span>
              {p
                ? <Tag color="blue" className="rounded-md font-bold border-0 m-0">{p.shortName}</Tag>
                : <span className="text-slate-400 dark:text-zinc-600 italic">Unassigned</span>}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <CalendarOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Start Date:</span>
              {p
                ? <Tag color="blue" className="rounded-md font-bold border-0 m-0">{p.startDate}</Tag>
                : <span className="text-slate-400 dark:text-zinc-600 italic">Unassigned</span>}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <CalendarOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">End Date:</span>
              {p
                ? <Tag color="blue" className="rounded-md font-bold border-0 m-0">{p.endDate}</Tag>
                : <span className="text-slate-400 dark:text-zinc-600 italic">Unassigned</span>}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <UserOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">PI:</span>
              <span className="font-medium text-slate-600 dark:text-zinc-400 truncate">
                {pi ? pi.name : <span className="text-slate-300 dark:text-zinc-700">—</span>}
              </span>
            </span>
          </div>
        );
      }
    },
    {
      title: 'Experience (Y-M-D)',
      key: 'experience',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      render: (_: any, rec: ProjectStaff) => {
        const linkedProj = projects.find(p => p.id === rec.projectId);
        const tenure = calculateIcmrTenureStatus(rec, linkedProj);
        return (
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-lg shadow-sm px-2.5 py-1.5 flex flex-col gap-1 min-w-0 w-fit">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
            <CalendarOutlined className="text-slate-400 text-[11px]" />
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">DOJ:</span>
            <span className="font-medium text-slate-700 dark:text-zinc-300">{rec.doj || 'Not registered'}</span>
          </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <ClockCircleOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Prior ICMR Exp:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{formatYMD(tenure.prevIcmrYMD)}</span>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <ClockCircleOutlined className="text-slate-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Current Project Exp:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{formatYMD(tenure.currentIcmrYMD)}</span>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <ClockCircleOutlined className="text-blue-400 text-[11px]" />
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">Total ICMR Experience:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatYMD(tenure.totalIcmrYMD)}</span>
            </span>
            <span className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] mt-0.5 pt-1 border-t border-slate-100 dark:border-zinc-900 ${
              tenure.isRedFlag ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {tenure.isRedFlag ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
              <span className="font-bold">{tenure.isRedFlag ? 'Tenure Cut-off Risk' : 'Tenure Profile Compliant'}</span>
            </span>
          </div>
        );
      },
      sorter: (a: ProjectStaff, b: ProjectStaff) => {
        const pa = projects.find(p => p.id === a.projectId);
        const pb = projects.find(p => p.id === b.projectId);
        return calculateIcmrTenureStatus(a, pa).cumulativeTotalMonths - calculateIcmrTenureStatus(b, pb).cumulativeTotalMonths;
      }
    },
    {
      title: 'Additional Details',
      key: 'additionalDetails',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      render: (_: any, rec: ProjectStaff) => (
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-lg shadow-sm px-2.5 py-1.5 flex flex-col gap-1 min-w-0 w-fit">
          
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
            <IdcardOutlined className="text-slate-400 text-[11px]" />
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Category / Gender:</span>
            <span className="font-medium text-slate-700 dark:text-zinc-300">{rec.category || 'General'} / {rec.gender || '-'}</span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
            <MailOutlined className="text-slate-400 text-[11px]" />
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Email:</span>
            <span className="font-mono text-slate-700 dark:text-zinc-300 break-all">
              {renderMaskedField(rec.email, isAuthenticated || !!visibility?.fields.email)}
            </span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
            <EnvironmentOutlined className="text-slate-400 text-[11px]" />
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Room No / Dept Location:</span>
            <span className="font-medium text-slate-700 dark:text-zinc-300">{rec.roomNumber || '-'} / {rec.departmentLocation || '-'}</span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs pt-1 border-t border-slate-100 dark:border-zinc-900">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${rec.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Status:</span>
            <Tag
              color={rec.status === 'Active' ? 'success' : 'error'}
              className="rounded-md font-bold border-0 m-0 text-[10px]"
            >
              {rec.status}
            </Tag>
          </span>
        </div>
      )
    }
  ];


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
              <div className="p-3 bg-gradient-to-br from-[#005EB8] to-[#003D7A] rounded-xl text-white shadow-lg shadow-blue-900/10 flex items-center justify-center shrink-0">
                <UserOutlined className="text-xl" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block truncate">
                  Contractual Research Manpower
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100 m-0 truncate">Project Research Staff</h2>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <Input
                placeholder="Search staff, code, designation, project..."
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
          title={
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
              👥 Project Research Staff Profiles
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
              columns={getProjectStaffColumns()}
              dataSource={filteredData}
              pagination={{
                pageSizeOptions: ['10', '25', '50', '100'],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total) => `Total ${total} project staff`,
                responsive: true
              }}
              size="middle"
              rowKey="id"
              scroll={{ x: 'max-content' }}
              rowClassName={() => 'hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors'}
              className="responsive-table-expanded"
            />
          </div>
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-sm sm:text-base font-extrabold text-[#005EB8] dark:text-blue-400">📝 Project Research Staff Self-Registration Form</span>
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
            Upon approval, you will be allocated a <strong>TEMP Employee Code</strong> and listed on the official research staff directory.
          </div>
          <ProjectStaffForm
            projects={projects}
            scientists={scientists}
            onSubmit={async (values) => {
              const hide = message.loading('Submitting registration...', 0);
              try {
                await apiService.submitPendingProjectStaff(values);
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