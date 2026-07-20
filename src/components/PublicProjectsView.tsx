import { useState } from 'react';
import { Card, Table, Tag, Input, Select, Badge, Progress, Row, Col, Button, Avatar } from 'antd';
import { 
  ProjectOutlined, SearchOutlined, UserOutlined, CalendarOutlined, 
  DownloadOutlined, FilePdfOutlined, TeamOutlined, DollarCircleOutlined
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
      className: 'font-extrabold text-blue-600 dark:text-blue-400',
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
      render: (t: string) => <Tag className="rounded-lg px-2 py-0.5 border-0 font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">{t}</Tag> 
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
        return <Tag color={color} className="font-extrabold uppercase text-[10px] rounded-lg tracking-wider px-2 py-0.5">{s}</Tag>;
      }
    },
    { 
      title: 'Budget Allocated', 
      dataIndex: 'budget', 
      key: 'budget', 
      render: (b: number) => <span className="font-bold text-slate-700 dark:text-zinc-300">₹{(b || 0).toLocaleString('en-IN')}</span>,
      sorter: (a: Project, b: Project) => a.budget - b.budget 
    },
    { 
      title: 'Principal Investigator', 
      dataIndex: 'piId', 
      key: 'piId', 
      render: (id: string) => {
        const sci = scientists.find(s => s.id === id);
        return sci ? (
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
            <UserOutlined className="text-slate-400 text-xs" /> Dr. {sci.name}
          </span>
        ) : <span className="text-slate-400 italic">Unassigned PI</span>;
      }
    },
    { 
      title: 'Days Remaining', 
      dataIndex: 'pendingDays', 
      key: 'pendingDays', 
      render: (val: number) => {
        const days = val || 0;
        return days <= 30 ? (
          <Tag color="red" className="font-bold rounded-lg">{days} Days</Tag>
        ) : days <= 90 ? (
          <Tag color="warning" className="font-bold rounded-lg">{days} Days</Tag>
        ) : (
          <Tag color="success" className="font-bold rounded-lg">{days} Days</Tag>
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

    return (
      <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 m-2 transition-all duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{display: 'flex'}}>
          
          {/* Left Column: Specifications & Timeline Progress */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Project Administrative Specification</span>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 m-0 mt-1">
                📂 {project.name}
              </h3>
              <div className="flex items-center gap-2">
                <Tag color="blue" className="text-xs uppercase font-extrabold rounded-md m-0">{project.shortName}</Tag>
                <Tag color={project.status === 'Completed' ? 'green' : project.status === 'Ongoing' ? 'blue' : 'gray'}>
                  {project.status}
                </Tag>
              </div>
            </div>

            {/* Financial and Timeline Info */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                🔬 Funding & Timeline
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Funding Scheme</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.type} Scheme</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Financial Outlay</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(project.budget || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Commencement</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.startDate}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Scheduled End</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{project.endDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-400 font-medium">Principal Investigator</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {piScientist ? `Dr. ${piScientist.name}` : `ID: ${project.piId}`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-900">
                <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase">
                  <span>Project Lifecycle Completion</span>
                  <span className="text-slate-700 dark:text-zinc-300">
                    {project.pendingDays && project.durationDays ? (
                      `${Math.max(0, Math.round(((project.durationDays - project.pendingDays) / project.durationDays) * 100))}%`
                    ) : '0%'}
                  </span>
                </div>
                {project.pendingDays && project.durationDays ? (
                  <Progress 
                    percent={Math.max(0, Math.min(100, Math.round(((project.durationDays - project.pendingDays) / project.durationDays) * 100)))} 
                    strokeColor={{ '0%': '#10B981', '100%': '#3B82F6' }}
                    showInfo={false}
                    className="m-0 h-2"
                  />
                ) : <Progress percent={0} showInfo={false} />}
                <div className="flex justify-between items-center mt-1 text-[9px] text-slate-400 font-mono">
                  <span>Start: {project.startDate}</span>
                  <span>{project.pendingDays || 0} days remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: UCs, Reports & Assigned Staff list */}
          <div className="space-y-5">
            {/* Utilization Certificates */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 dark:border-zinc-900 pb-1">
                📋 Official Project Utilization Certificates (UCs)
              </span>
              <div className="space-y-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Provisional UCs</span>
                  {project.provisionalUCs && project.provisionalUCs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {project.provisionalUCs.map((uc, idx) => (
                        <div key={uc.id || idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs">
                          <span className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[120px]" title={uc.period}>📅 {uc.period}</span>
                          <Button 
                            type="primary" 
                            size="small" 
                            icon={<DownloadOutlined />} 
                            className="text-[10px] h-6 px-2.5 rounded-md font-extrabold border-0 bg-blue-600 hover:bg-blue-500"
                            onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}
                          >
                            PDF
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block pl-1">No provisional UCs registered</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-900">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Final Audited UC</span>
                  {project.finalUC ? (
                    <div className="flex items-center justify-between p-2 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100/50 dark:border-amber-950/40 text-xs">
                      <div className="flex flex-col truncate mr-2">
                        <span className="font-bold text-slate-800 dark:text-zinc-200">Period: {project.finalUC.period}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[180px] font-mono">{project.finalUC.fileName}</span>
                      </div>
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<DownloadOutlined />} 
                        className="text-[10px] h-6 px-2.5 rounded-md font-extrabold border-0 bg-amber-600 hover:bg-amber-500"
                        onClick={() => handleDownloadBase64File(project.finalUC?.fileName || 'final_uc.pdf', project.finalUC?.fileData || '')}
                      >
                        UC
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block pl-1">Final Audited UC not uploaded yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Scientific Reports */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                🏆 Final Project Report Document
              </span>
              {project.finalReport ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg border border-emerald-100/50 dark:border-emerald-950/40 text-xs">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <FilePdfOutlined className="text-emerald-600 text-base" />
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[180px]">{project.finalReport.title || 'Final Report'}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[150px] font-mono">{project.finalReport.fileName}</span>
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<DownloadOutlined />} 
                    className="text-[10px] h-6 px-2.5 rounded-md font-extrabold border-0 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleDownloadBase64File(project.finalReport?.fileName || 'final_report.pdf', project.finalReport?.fileData || '')}
                  >
                    Report
                  </Button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic block pl-1">No Final scientific report uploaded yet</span>
              )}
            </div>

            {/* Associated Project Staff */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex justify-between items-center">
                <span><TeamOutlined className="mr-1" /> Associated Project Staff ({assignedStaff.length})</span>
                <Badge count={assignedStaff.length} color="#6366F1" />
              </span>
              {assignedStaff.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {assignedStaff.map(staff => (
                    <div key={staff.id} className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{staff.name}</span>
                      <Tag color="cyan" className="m-0 text-[10px] font-medium">{staff.designation}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic block pl-1">No staff appointed to this project</span>
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
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md flex items-center justify-center">
              <ProjectOutlined className="text-xl" />
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">EXTRAMURAL RESEARCH & GRANTS</span>
              <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Projects Ledger</h2>
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
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block font-sans">RESEARCH PROJECTS LIST</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">📂 Extramural Projects (Click any row to expand documents & certificates)</span>
          </div>
        }
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800"
      >
        <Table 
          columns={getProjectColumns()} 
          dataSource={filteredData} 
          pagination={{ 
            pageSizeOptions: ['10', '25', '50', '100'],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total) => `Total ${total} projects`
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
