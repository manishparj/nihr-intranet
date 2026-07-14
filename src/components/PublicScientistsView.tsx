import { useState } from 'react';
import { Card, Table, Tag, Button, Empty, Row, Col } from 'antd';
import { 
  UserOutlined, DownloadOutlined, EditOutlined, DeleteOutlined 
} from '@ant-design/icons';
import { 
  Scientist, Project, ProjectStaff, VisibilityConfig 
} from '../types';
import { 
  calculateStaffExperienceYMD, formatYMD, renderMaskedField 
} from '../utils/experience';

interface PublicScientistsViewProps {
  scientists: Scientist[];
  projects: Project[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onOpenDetails: (record: any, type: 'scientist' | 'pstaff' | 'perm' | 'ypc') => void;
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
  const [selectedScientist, setSelectedScientist] = useState<Scientist | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getScientistColumns = () => [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => a.employeeCode.localeCompare(b.employeeCode) },
    { title: 'Scientist Name', dataIndex: 'name', key: 'name', className: 'font-bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    ...(isAuthenticated || !!visibility?.fields.email ? [{ title: 'Govt Email', dataIndex: 'govtEmail', key: 'govtEmail', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') }] : []),
    ...(isAuthenticated ? [{ title: 'Personal Email', dataIndex: 'personalEmail', key: 'personalEmail', render: (val: string) => renderMaskedField(val, isAuthenticated, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.phone ? [{ title: 'Phone Number', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') }] : []),
    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => <Tag color="blue">{cat}</Tag> },
    ...(isAuthenticated || !!visibility?.fields.dob ? [{ title: 'DOB', dataIndex: 'dob', key: 'dob', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.dob, '🔒 masked') }] : []),
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
  ];

  const getProjectColumns = () => [
    { title: 'Short Code', dataIndex: 'shortName', key: 'shortName', sorter: (a: any, b: any) => a.shortName.localeCompare(b.shortName) },
    { title: 'Full Scientific Name', dataIndex: 'name', key: 'name', width: 300 },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="orange">{t}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Completed' ? 'green' : s === 'Ongoing' ? 'blue' : 'gray'}>{s}</Tag> },
    { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (b: number) => `₹${b.toLocaleString()}`, sorter: (a: any, b: any) => a.budget - b.budget },
    { title: 'PI Name', dataIndex: 'piId', key: 'piId', render: (id: string) => scientists.find(s => s.id === id)?.name || 'Unknown' },
    { title: 'Duration', dataIndex: 'durationDays', key: 'durationDays', render: (val: number) => `${val || 0} days` },
    { title: 'Days Left', dataIndex: 'pendingDays', key: 'pendingDays', render: (val: number) => <Tag color={val === 0 ? 'red' : 'green'}>{val || 0} days</Tag> },
    {
      title: 'Utilization Certificates',
      key: 'uc',
      render: (_: any, p: Project) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.provisionalUCs && p.provisionalUCs.length > 0 && (
            <div>
              <span className="font-bold block text-[10px] text-slate-400">Prov UCs:</span>
              {p.provisionalUCs.map((uc, i) => (
                <Button key={uc.id || i} type="link" size="small" className="p-0 h-auto text-xs flex items-center gap-1" onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}>
                  <DownloadOutlined /> {uc.period}
                </Button>
              ))}
            </div>
          )}
          {p.finalUC && (
            <div>
              <span className="font-bold block text-[10px] text-slate-400">Final UC:</span>
              <Button type="link" size="small" className="p-0 h-auto text-xs flex items-center gap-1" onClick={() => handleDownloadBase64File(p.finalUC?.fileName || 'final', p.finalUC?.fileData || '')}>
                <DownloadOutlined /> {p.finalUC.period}
              </Button>
            </div>
          )}
        </div>
      )
    }
  ];

  const getProjectStaffColumns = () => [
    { title: 'Temp Code', dataIndex: 'employeeCode', key: 'employeeCode', sorter: (a: any, b: any) => (a.employeeCode || '').localeCompare(b.employeeCode || '') },
    { title: 'Staff Member', dataIndex: 'name', key: 'name', className: 'font-bold', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Linked Project', dataIndex: 'projectId', key: 'projectId', render: (id: string) => projects.find(p => p.id === id)?.shortName || 'None' },
    { title: 'Principal Investigator', dataIndex: 'scientistId', key: 'scientistId', render: (id: string) => scientists.find(s => s.id === id)?.name || '-' },
    ...(isAuthenticated || !!visibility?.fields.email ? [{ title: 'Email Address', dataIndex: 'email', key: 'email', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.email, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.phone ? [{ title: 'Phone Number', dataIndex: 'phone', key: 'phone', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.phone, '🔒 masked') }] : []),
    ...(isAuthenticated || !!visibility?.fields.dob ? [{ title: 'Date of Birth', dataIndex: 'dob', key: 'dob', render: (val: string) => renderMaskedField(val, isAuthenticated || !!visibility?.fields.dob, '🔒 masked') }] : []),
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Total Exp (Y-M-D)', key: 'totalExpYMD', render: (_: any, rec: ProjectStaff) => {
      const expYMD = calculateStaffExperienceYMD(rec);
      return <Tag color="blue" title={`${rec.totalExpMonths || 0} Months cumulative`}>{formatYMD(expYMD.total)}</Tag>;
    }, sorter: (a: any, b: any) => (a.totalExpMonths || 0) - (b.totalExpMonths || 0) },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="purple">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag> }
  ];

  return (
    <div className="space-y-6">
      <Card 
        title={
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-1">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">SCIENTISTS DIRECTORY & DEPARTMENTS</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">🎓 Scientists Registry (Click row to view led projects)</span>
            </div>
          </div>
        } 
        variant="borderless" 
        className="shadow-sm rounded-xl overflow-hidden"
      >
        <Table 
          columns={getScientistColumns()} 
          dataSource={scientists} 
          pagination={{ pageSize: 8 }} 
          size="middle" 
          rowKey="id" 
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onClick: (e: any) => {
              if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
              setSelectedScientist(selectedScientist?.id === record.id ? null : record);
              setSelectedProject(null);
            },
            className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedScientist?.id === record.id ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 font-semibold' : ''}`
          })}
        />
      </Card>

      {/* Drill Down Level 1: Projects led by selected scientist */}
      {selectedScientist && (
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Drill-Down Level 1: Scientific Leadership</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                🔬 Projects led by Dr. {selectedScientist.name} 
                <Tag color="blue" className="ml-1 text-[10px] uppercase font-bold">{selectedScientist.employeeCode}</Tag>
              </h4>
            </div>
            <Button size="small" danger onClick={() => { setSelectedScientist(null); setSelectedProject(null); }}>Clear Selection</Button>
          </div>

          {(() => {
            const scientistProjects = projects.filter(p => p.piId === selectedScientist.id);
            if (scientistProjects.length === 0) {
              return (
                <Empty 
                  description="This scientist is not leading any extramural research projects currently." 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              );
            }

            return (
              <Table
                columns={getProjectColumns().filter(col => col.key !== 'piId')}
                dataSource={scientistProjects}
                pagination={{ pageSize: 5 }}
                size="small"
                rowKey="id"
                scroll={{ x: 'max-content' }}
                onRow={(projectRecord) => ({
                  onClick: (e: any) => {
                    if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                    setSelectedProject(selectedProject?.id === projectRecord.id ? null : projectRecord);
                  },
                  className: `cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200 ${selectedProject?.id === projectRecord.id ? 'bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500 font-semibold' : ''}`
                })}
              />
            );
          })()}
        </div>
      )}

      {/* Drill Down Level 2: Project details & staff list */}
      {selectedScientist && selectedProject && (
        <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block">Drill-Down Level 2: Administrative Details & Team Appointed</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                📂 Scheme Ledger: {selectedProject.name} ({selectedProject.shortName})
              </h4>
            </div>
            <Button size="small" onClick={() => setSelectedProject(null)}>Close Project View</Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" title="Project Specifications" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                <div className="space-y-2 text-xs">
                  <div><strong className="text-slate-400">Type:</strong> <Tag color="orange" className="ml-1">{selectedProject.type}</Tag></div>
                  <div><strong className="text-slate-400">Status:</strong> <Tag color={selectedProject.status === 'Completed' ? 'green' : 'blue'} className="ml-1">{selectedProject.status}</Tag></div>
                  <div><strong className="text-slate-400">Budget Limit:</strong> <span className="font-semibold text-green-600">₹{selectedProject.budget.toLocaleString()}</span></div>
                  <div><strong className="text-slate-400">Duration Scheduled:</strong> {selectedProject.durationDays} days</div>
                  <div><strong className="text-slate-400">Pending Days Left:</strong> {selectedProject.pendingDays} days</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={16}>
              <Card size="small" title="👥 Appointed Research Project Staff (Click row for full profile)" variant="borderless" className="shadow-none bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                {(() => {
                  const associatedStaff = projectStaff.filter(s => s.projectId === selectedProject.id);
                  if (associatedStaff.length === 0) {
                    return <Empty description="No research staff registered or appointed to this project." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                  }

                  return (
                    <Table
                      columns={getProjectStaffColumns().filter(col => col.key !== 'projectId')}
                      dataSource={associatedStaff}
                      pagination={{ pageSize: 5 }}
                      size="small"
                      rowKey="id"
                      scroll={{ x: 'max-content' }}
                      onRow={(staffRecord) => ({
                        onClick: (e: any) => {
                          if (e.target.closest('.ant-btn') || e.target.closest('.ant-space')) return;
                          onOpenDetails(staffRecord, 'pstaff');
                        },
                        className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-all duration-200'
                      })}
                    />
                  );
                })()}
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
