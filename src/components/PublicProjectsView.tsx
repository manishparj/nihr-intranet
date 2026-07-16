import { useState } from 'react';
import { Card, Table, Tag, Button, Empty, Row, Col, Input, Select, Space, Badge, Progress } from 'antd';
import { 
  ProjectOutlined, SearchOutlined, DownloadOutlined, FilePdfOutlined, CalendarOutlined, BankOutlined, UserOutlined
} from '@ant-design/icons';
import { Project, Scientist, VisibilityConfig, ProjectStaff } from '../types';
import { calculateIcmrTenureStatus, formatYMD } from '../utils/experience';

interface PublicProjectsViewProps {
  projects: Project[];
  scientists: Scientist[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function PublicProjectsView({
  projects,
  scientists,
  projectStaff,
  visibility,
  isAuthenticated,
  handleDownloadBase64File
}: PublicProjectsViewProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
              <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 m-0">Projects Ledger & Documents</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
                { value: 'ICMR', label: 'ICMR Funded' },
                { value: 'Non-ICMR', label: 'Non-ICMR' },
                { value: 'International', label: 'International' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main projects grid/table */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800"
      >
        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider mb-3 px-1">
          💡 Pro tip: Click any row to view full project documents, reports, and utilization certificates.
        </div>
        <Table 
          columns={getProjectColumns()} 
          dataSource={filteredData} 
          pagination={{ pageSize: 8 }} 
          size="middle" 
          rowKey="id" 
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onClick: (e: any) => {
              if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
              setSelectedProject(selectedProject?.id === record.id ? null : record);
            },
            className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedProject?.id === record.id ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 font-semibold' : ''}`
          })}
        />
      </Card>

      {/* Selected Project Drawer / Details panel */}
      {selectedProject && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Project Deep-Dive Documentation</span>
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                📂 {selectedProject.name} 
                <Tag color="blue" className="text-xs uppercase font-extrabold rounded-md">{selectedProject.shortName}</Tag>
              </h3>
            </div>
            <Button size="small" danger type="dashed" onClick={() => setSelectedProject(null)} className="rounded-lg">Close Details</Button>
          </div>

          <Row gutter={[24, 24]}>
            {/* Left Col: Project Metadata */}
            <Col xs={24} md={12} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-900">
                  <span className="text-[10px] text-slate-400 font-bold block">FUNDING SCHEME</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{selectedProject.type} Scheme</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-900">
                  <span className="text-[10px] text-slate-400 font-bold block">FINANCIAL OUTLAY</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{(selectedProject.budget || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-900">
                  <span className="text-[10px] text-slate-400 font-bold block">COMMENCEMENT DATE</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CalendarOutlined className="text-slate-400" /> {selectedProject.startDate}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-900">
                  <span className="text-[10px] text-slate-400 font-bold block">SCHEDULED END DATE</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CalendarOutlined className="text-slate-400" /> {selectedProject.endDate}
                  </span>
                </div>
              </div>

              {/* Progress Bar representation */}
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-900/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Lifecycle Completion</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {selectedProject.pendingDays && selectedProject.durationDays ? (
                      `${Math.max(0, Math.round(((selectedProject.durationDays - selectedProject.pendingDays) / selectedProject.durationDays) * 100))}%`
                    ) : '0%'}
                  </span>
                </div>
                {selectedProject.pendingDays && selectedProject.durationDays ? (
                  <Progress 
                    percent={Math.max(0, Math.min(100, Math.round(((selectedProject.durationDays - selectedProject.pendingDays) / selectedProject.durationDays) * 100)))} 
                    strokeColor={{ '0%': '#10B981', '100%': '#3B82F6' }}
                    showInfo={false}
                    className="m-0"
                  />
                ) : <Progress percent={0} showInfo={false} />}
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                  <span>Started: {selectedProject.startDate}</span>
                  <span>{selectedProject.pendingDays || 0} days remaining</span>
                </div>
              </div>
            </Col>

            {/* Right Col: Documents, reports, UCs */}
            <Col xs={24} md={12} className="space-y-4">
              <Card 
                size="small" 
                title={<span className="text-xs font-black text-slate-800 dark:text-zinc-200">📋 Official Project Utilization Certificates (UCs)</span>}
                variant="borderless"
                className="bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-900"
              >
                <div className="space-y-3">
                  {/* Provisional UCs */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Provisional Utilization Certificates</span>
                    {selectedProject.provisionalUCs && selectedProject.provisionalUCs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProject.provisionalUCs.map((uc, idx) => (
                          <div key={uc.id || idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs">
                            <span className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[130px]" title={uc.period}>📅 {uc.period}</span>
                            <Button 
                              type="primary" 
                              size="small" 
                              icon={<DownloadOutlined />} 
                              className="text-[10px] h-6 px-2.5 rounded-md font-extrabold border-0 bg-blue-600 hover:bg-blue-500"
                              onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}
                            >
                              Download PDF
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No Provisional UCs uploaded yet</span>
                    )}
                  </div>

                  {/* Final UC */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-900">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Final Audited Utilization Certificate</span>
                    {selectedProject.finalUC ? (
                      <div className="flex items-center justify-between p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100/50 dark:border-amber-950/40 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">Period: {selectedProject.finalUC.period}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[180px]">{selectedProject.finalUC.fileName}</span>
                        </div>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<DownloadOutlined />} 
                          className="text-[10px] h-7 px-3 rounded-md font-extrabold border-0 bg-amber-600 hover:bg-amber-500"
                          onClick={() => handleDownloadBase64File(selectedProject.finalUC?.fileName || 'final_uc.pdf', selectedProject.finalUC?.fileData || '')}
                        >
                          Download Final UC
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">Final UC has not been uploaded by the PI yet</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Final Project Report Section */}
              <Card 
                size="small" 
                title={<span className="text-xs font-black text-slate-800 dark:text-zinc-200">🏆 Final Project Report Document</span>}
                variant="borderless"
                className="bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-900"
              >
                {selectedProject.finalReport ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg border border-emerald-100/50 dark:border-emerald-950/40 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                        <FilePdfOutlined className="text-lg" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate max-w-[200px]" title={selectedProject.finalReport.title}>
                          {selectedProject.finalReport.title || 'Final Scientific Report'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[150px]">{selectedProject.finalReport.fileName}</span>
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<DownloadOutlined />} 
                      className="text-[10px] h-8 px-3.5 rounded-lg font-extrabold border-0 bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => handleDownloadBase64File(selectedProject.finalReport?.fileName || 'final_report.pdf', selectedProject.finalReport?.fileData || '')}
                    >
                      Download Report
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800">
                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No Final Project Report uploaded</span>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Associated Project Staff Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                  <UserOutlined className="text-base" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 m-0">Associated Project Staff</h4>
                  <p className="text-[10px] text-slate-400 m-0">List of personnel appointed or working under this project</p>
                </div>
              </div>
              <Badge 
                count={(projectStaff || []).filter(ps => ps.projectId === selectedProject.id).length} 
                showZero 
                className="font-bold text-xs" 
                color="#6366F1" 
              />
            </div>

            {(projectStaff || []).filter(ps => ps.projectId === selectedProject.id).length > 0 ? (
              <Table
                size="small"
                pagination={{ pageSize: 5 }}
                dataSource={(projectStaff || []).filter(ps => ps.projectId === selectedProject.id)}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Employee Code',
                    dataIndex: 'employeeCode',
                    key: 'employeeCode',
                    className: 'font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400'
                  },
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    className: 'font-bold text-slate-800 dark:text-zinc-200'
                  },
                  {
                    title: 'Designation',
                    dataIndex: 'designation',
                    key: 'designation',
                    className: 'font-medium text-slate-600 dark:text-zinc-400'
                  },
                  {
                    title: 'Date of Joining',
                    dataIndex: 'doj',
                    key: 'doj',
                    render: (date: string) => <span className="text-xs text-slate-500 dark:text-zinc-500">{date || 'N/A'}</span>
                  },
                  {
                    title: 'Category',
                    dataIndex: 'category',
                    key: 'category',
                    render: (cat: string) => <Tag className="rounded-md font-semibold text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">{cat || 'UR'}</Tag>
                  },
                  {
                    title: 'ICMR Experience & Red Flag Status',
                    key: 'icmrExpLimit',
                    render: (_: any, rec: ProjectStaff) => {
                      const status = calculateIcmrTenureStatus(rec, selectedProject);
                      
                      return (
                        <div className={`p-2 rounded-lg border flex flex-col gap-1 text-xs max-w-xs ${
                          status.isRedFlag 
                            ? 'bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-200' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-300'
                        }`}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Prev ICMR Exp:</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{formatYMD(status.prevIcmrYMD)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">Current Exp:</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{formatYMD(status.currentIcmrYMD)}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-300/60 dark:border-zinc-700/60 my-0.5" />
                            <div className="flex justify-between gap-4 font-semibold">
                              <span className="text-[10px] text-slate-600 dark:text-zinc-300">Total ICMR EXP:</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{formatYMD(status.totalIcmrYMD)}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-[10px] text-slate-500 dark:text-zinc-400">
                              <span>Cumulative Mths (ICMR+Non-ICMR):</span>
                              <span className="font-mono font-semibold">{status.cumulativeTotalMonths.toFixed(1)} mths</span>
                            </div>
                          </div>
                          
                          <div className="border-t border-dashed border-slate-300/60 dark:border-zinc-700/60 my-0.5" />
                          
                          {status.isRedFlag ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1">
                                🚨 RED FLAG LIMIT WARNING
                              </span>
                              <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                                {status.remainingText} (Cut-off: {status.cutOffDateStr})
                              </span>
                              <span className="text-[9px] text-red-500/90 dark:text-red-400/80">
                                Based on: {status.cutOffReason}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                                ✅ Tenure Status Stable
                              </span>
                              <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                                {status.remainingText} until Cut-off ({status.cutOffDateStr})
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    title: 'Qualification',
                    dataIndex: 'educationalQualification',
                    key: 'educationalQualification',
                    className: 'text-xs text-slate-500 dark:text-zinc-400'
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (s: string) => (
                      <Tag 
                        color={s === 'Active' ? 'success' : 'default'} 
                        className="font-bold text-[10px] uppercase rounded-md tracking-wider px-2 py-0"
                      >
                        {s}
                      </Tag>
                    )
                  }
                ]}
              />
            ) : (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-zinc-950/20 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Empty description={<span className="text-xs text-slate-400">No project staff currently assigned to this project</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
