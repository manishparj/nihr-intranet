import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Badge, Progress } from 'antd';
import {
  ProjectOutlined, SearchOutlined, UserOutlined, TeamOutlined, FilterOutlined
} from '@ant-design/icons';
import { Project, Scientist, VisibilityConfig, ProjectStaff } from '../types';

interface PublicProjectsViewProps {
  projects: Project[];
  scientists: Scientist[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails?: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function PublicProjectsView({
  projects,
  scientists,
  projectStaff,
  visibility,
  isAuthenticated,
  onOpenDetails,
  handleDownloadBase64File
}: PublicProjectsViewProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const getFilteredProjects = () => {
    return projects.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.shortName.toLowerCase().includes(searchText.toLowerCase()) ||
        (scientists.find(s => s.id === p.piId)?.name || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesType = typeFilter === 'All' || p.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filteredData = getFilteredProjects();

  const getProjectColumns = () => [
    {
      title: 'Short Code',
      dataIndex: 'shortName',
      key: 'shortName',
      className: 'font-extrabold text-[#005EB8] dark:text-blue-400 whitespace-nowrap',
      sorter: (a: Project, b: Project) => a.shortName.localeCompare(b.shortName)
    },
    {
      title: 'Full Scientific Name',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      className: 'font-semibold text-slate-800 dark:text-zinc-200'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag className="rounded-md px-2 py-0.5 border-0 font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 whitespace-nowrap">{t}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        let color = 'default';
        if (s === 'Ongoing') color = 'processing';
        if (s === 'Completed') color = 'success';
        if (s === 'Yet to Start') color = 'warning';
        return <Tag color={color} className="font-extrabold uppercase text-[10px] rounded-md tracking-wider px-2 py-0.5 border-0 whitespace-nowrap">{s}</Tag>;
      }
    },
    {
      title: 'Budget Allocated',
      dataIndex: 'budget',
      key: 'budget',
      render: (b: number) => <span className="font-bold text-slate-700 dark:text-zinc-300 whitespace-nowrap">₹{(b || 0).toLocaleString('en-IN')}</span>,
      sorter: (a: Project, b: Project) => a.budget - b.budget
    },
    {
      title: 'Principal Investigator',
      dataIndex: 'piId',
      key: 'piId',
      className: 'whitespace-nowrap',
      render: (id: string) => {
        const sci = scientists.find(s => s.id === id);
        return sci ? (
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
            <UserOutlined className="text-slate-400 text-xs" /> {sci.name}
          </span>
        ) : <span className="text-slate-400 dark:text-zinc-600 italic text-xs">Unassigned PI</span>;
      }
    },
    {
      title: 'Days Remaining',
      dataIndex: 'pendingDays',
      key: 'pendingDays',
      render: (val: number) => {
        const days = val || 0;
        return days <= 30 ? (
          <Tag color="error" className="font-bold rounded-md border-0 whitespace-nowrap">{days} Days</Tag>
        ) : days <= 90 ? (
          <Tag color="warning" className="font-bold rounded-md border-0 whitespace-nowrap">{days} Days</Tag>
        ) : (
          <Tag color="success" className="font-bold rounded-md border-0 whitespace-nowrap">{days} Days</Tag>
        );
      },
      sorter: (a: Project, b: Project) => (a.pendingDays || 0) - (b.pendingDays || 0)
    },
    {
      title: 'Staff Appointed',
      dataIndex: 'staffCount',
      key: 'staffCount',
      align: 'center' as const,
      render: (val: number) => <Badge count={val || 0} showZero className="font-bold text-[11px]" color="#4F46E5" />
    }
  ];

  // Render project expanded row details (Left side details, Right side lists)
  const renderExpandedRow = (project: Project) => {
    const assignedStaff = projectStaff.filter(s => s.projectId === project.id);
    const piScientist = scientists.find(s => s.id === project.piId);
    const pct = project.pendingDays && project.durationDays
      ? Math.max(0, Math.min(100, Math.round(((project.durationDays - project.pendingDays) / project.durationDays) * 100)))
      : 0;

    return (
      <div
        style={{ width: 0, minWidth: '100%' }}
        className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-zinc-900/60 dark:to-zinc-950/60 p-3 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 m-1 sm:m-2 transition-all duration-200 shadow-inner box-border overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0">

          {/* Left Column: Specifications & Timeline Progress */}
          <div className="space-y-4 sm:space-y-5">

            {/* Financial and Timeline Info */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-2">
               Project Administrative Specification &  🔬 Funding &amp; Timeline
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">

                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Project Name</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">📂 {project.name}</span>
                </div>

                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Project Status</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300"> <Tag
                  color={project.status === 'Completed' ? 'success' : project.status === 'Ongoing' ? 'processing' : 'default'}
                  className="border-0 font-semibold"
                >
                  {project.status}
                </Tag></span>
                </div>

                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Funding Scheme</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.type} Scheme</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Financial Outlay</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(project.budget || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Commencement</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.startDate}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Scheduled End</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.endDate}</span>
                </div>
                <div className="col-span-2 min-w-0">
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Principal Investigator</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 truncate block">
                    {piScientist ? `${piScientist.name}` : `ID: ${project.piId}`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-900">
                <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                  <span>Project Lifecycle Completion</span>
                  <span className="text-slate-700 dark:text-zinc-300">{pct}%</span>
                </div>
                <Progress
                  percent={pct}
                  strokeColor={{ '0%': '#10B981', '100%': '#3B82F6' }}
                  showInfo={false}
                  className="m-0 h-2"
                />
                <div className="flex justify-between items-center mt-1 text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                  <span>Start: {project.startDate}</span>
                  <span>{project.pendingDays || 0} days remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: UCs, Reports & Assigned Staff list */}
          <div className="space-y-4 sm:space-y-5">

            {/* Associated Project Staff */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-2">
                <span className="flex items-center gap-1.5"><TeamOutlined /> Associated Project Staff</span>
                <Badge count={assignedStaff.length} color="#6366F1" />
              </span>
              {assignedStaff.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {assignedStaff.map(staff => (
                    <div key={staff.id} className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                      <span className="font-bold text-slate-700 dark:text-zinc-300 truncate">{staff.name}</span>
                      <Tag color="cyan" className="m-0 text-[10px] font-medium border-0 shrink-0">{staff.designation}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-zinc-600 italic block pl-1">No staff appointed to this project</span>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const onExpandRow = (expanded: boolean, record: Project) => {
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
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white shadow-lg shadow-blue-900/10 flex items-center justify-center shrink-0">
              <ProjectOutlined className="text-xl" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100 m-0 truncate">Projects Ledger</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <Input 
              placeholder="Search project code, PI, or scientific title..." 
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-lg h-10 w-full sm:w-64"
              allowClear
            />
            <Select
              placeholder="Filter Status"
              value={statusFilter}
              onChange={setStatusFilter}
              className="rounded-lg h-10 w-full sm:w-40"
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Ongoing', label: 'Ongoing' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Yet to Start', label: 'Yet to Start' }
              ]}
            />
            <Select
              placeholder="Filter Type"
              value={typeFilter}
              onChange={setTypeFilter}
              className="rounded-lg h-10 w-full sm:w-36"
              options={[
                { value: 'All', label: 'All Funding' },
                { value: 'Intramural', label: 'Intramural' },
                { value: 'Extramural', label: 'Extramural' },
                { value: 'ICMR', label: 'ICMR' },
                { value: 'Other', label: 'Other' },
                { value: 'NHRP', label: 'NHRP' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="py-1">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Research Projects List</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              📂 Extramural Projects <span className="hidden sm:inline font-normal text-slate-400 dark:text-zinc-500">— click any row to expand documents &amp; certificates</span>
            </span>
          </div>
        }
        variant="borderless"
        className="shadow-sm rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"
        styles={{ header: { borderBottom: '1px solid rgba(148,163,184,0.15)' }, body: { padding: 0 } }}
      >
        <div className="p-2 sm:p-4">
          <Table
            columns={getProjectColumns()}
            dataSource={filteredData}
            pagination={{
              pageSizeOptions: ['10', '25', '50', '100'],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total) => `Total ${total} projects`,
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