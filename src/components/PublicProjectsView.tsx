import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Badge, Progress } from 'antd';
import {
  ProjectOutlined, SearchOutlined, UserOutlined, TeamOutlined,
  WalletOutlined, TagsOutlined, FlagOutlined, PieChartOutlined,
  UserSwitchOutlined
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

  const statusTagColor = (s: string) => {
    if (s === 'Ongoing') return 'processing';
    if (s === 'Completed') return 'success';
    if (s === 'Yet to Start') return 'warning';
    return 'default';
  };

  const getProjectColumns = () => [
    {
      title: 'Short Code',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 100,
      fixed: 'left' as const,
      className: 'font-extrabold text-[#005EB8] dark:text-blue-400 whitespace-nowrap',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      sorter: (a: Project, b: Project) => a.shortName.localeCompare(b.shortName)
    },
    {
      title: 'Project Details & Lifecycle',
      key: 'projectDetails',
      onCell: () => ({ style: { verticalAlign: 'middle' } }),
      render: (_: any, p: Project) => {
        const sci = scientists.find(s => s.id === p.piId);
        const pct = p.pendingDays && p.durationDays
          ? Math.max(0, Math.min(100, Math.round(((p.durationDays - p.pendingDays) / p.durationDays) * 100)))
          : 0;
        return (
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-xl shadow-sm p-2.5 sm:p-3 w-full min-w-0">
            <span className="font-semibold text-slate-800 dark:text-zinc-200 whitespace-normal break-words leading-snug text-xs block mb-2">
              {p.name}
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs border-t border-slate-100 dark:border-zinc-900 pt-2">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <TagsOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Type:</span>
                <Tag className="rounded-md px-2 py-0.5 border-0 font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 whitespace-nowrap m-0">
                  {p.type}
                </Tag>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <FlagOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Status:</span>
                <Tag color={statusTagColor(p.status)} className="font-extrabold uppercase text-[9px] rounded-md tracking-wider px-2 py-0.5 border-0 whitespace-nowrap m-0">
                  {p.status}
                </Tag>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <WalletOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Budget:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(p.budget || 0).toLocaleString('en-IN')}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <UserOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">PI:</span>
                <span className="font-medium text-slate-600 dark:text-zinc-400">
                  {sci ? sci.name : <em className="text-slate-400 dark:text-zinc-600 not-italic">Unassigned</em>}
                </span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <UserSwitchOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Staff Count:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{(p.staffCount || 0).toLocaleString('en-IN')}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <PieChartOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Lifecycle:</span>
                <Progress
                  type="circle"
                  percent={pct}
                  size={30}
                  strokeColor={{ '0%': '#10B981', '100%': '#3B82F6' }}
                  strokeWidth={12}
                  format={() => ''}
                />
                <span className="font-bold text-slate-700 dark:text-zinc-300">{pct}%</span>
                <span className="text-slate-400 dark:text-zinc-500 font-mono text-[10px]">({p.pendingDays || 0}d left)</span>
              </span>
            </div>
          </div>
        );
      }
    }
  ];


  // Render project expanded row — full list of associated project staff
  const renderExpandedRow = (project: Project) => {
    const assignedStaff = projectStaff.filter(s => s.projectId === project.id);

    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-zinc-900/60 dark:to-zinc-950/60 p-3 sm:p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800/80 m-1 transition-all duration-200 shadow-inner box-border overflow-hidden">
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-900 shadow-sm p-3 sm:p-3.5 min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-900 pb-1.5 mb-2.5">
            <span className="flex items-center gap-1.5"><TeamOutlined /> Associated Project Staff</span>
            <Badge count={assignedStaff.length} showZero color="#6366F1" />
          </span>
          {assignedStaff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {assignedStaff.map(staff => (
                <div key={staff.id} className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 rounded-md border border-slate-100 dark:border-zinc-800 text-[11px] flex justify-between items-center gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-colors min-w-0">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 truncate">{staff.name}</span>
                  <Tag color="cyan" className="m-0 text-[9px] font-medium border-0 shrink-0 leading-4">{staff.designation}</Tag>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-zinc-600 italic block">No staff appointed to this project</span>
          )}
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
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
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