import { useState } from 'react';
import { Card, Table, Tag, Button, Row, Col, Progress, Empty, Avatar } from 'antd';
import { 
  DownloadOutlined, UserOutlined, CalendarOutlined, FilePdfOutlined, 
  DownOutlined, RightOutlined, PhoneOutlined, MailOutlined, 
  HomeOutlined, BankOutlined, EnvironmentOutlined, EyeOutlined
} from '@ant-design/icons';
import { Scientist, Project, ProjectStaff, VisibilityConfig } from '../types';
import { 
  calculateStaffExperienceYMD, formatYMD, renderMaskedField, 
  calculateIcmrTenureStatus, calculateYPConsultantTenureStatus 
} from '../utils/experience';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// CUSTOM EXPANDABLE ACCORDION CARD COMPONENT
// ==========================================
interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  activeKey: string | null;
  onToggle: (id: string) => void;
  extra?: React.ReactNode;
}

export function AccordionItem({
  id,
  title,
  icon,
  children,
  activeKey,
  onToggle,
  extra
}: AccordionItemProps) {
  const isOpen = activeKey === id;

  return (
    <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs mb-3 transition-all duration-200">
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
          isOpen 
            ? 'bg-blue-50/40 dark:bg-blue-950/10 border-b border-slate-100 dark:border-zinc-800' 
            : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/20'
        }`}
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-blue-600 dark:text-blue-400 text-lg flex items-center justify-center">{icon}</span>}
          <div className="font-bold text-slate-800 dark:text-zinc-200 text-sm md:text-base">{title}</div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {extra}
          <span className="text-slate-400 dark:text-zinc-500 text-xs font-semibold flex items-center justify-center">
            {isOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="p-4 md:p-6 bg-white dark:bg-zinc-900/40 border-t-0 text-slate-700 dark:text-zinc-300">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 1. SCIENTIST DRILL DOWN ACCORDION
// ==========================================
interface ScientistDrillDownProps {
  scientist: Scientist;
  projects: Project[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onOpenStaffProfile: (staff: ProjectStaff) => void;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function ScientistDrillDown({
  scientist,
  projects,
  projectStaff,
  visibility,
  isAuthenticated,
  onClose,
  onOpenStaffProfile,
  handleDownloadBase64File
}: ScientistDrillDownProps) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('profile');
  const [innerSelectedProject, setInnerSelectedProject] = useState<Project | null>(null);

  const ledProjects = projects.filter(p => p.piId === scientist.id);
  const scientistExp = calculateStaffExperienceYMD(scientist);

  const handleToggle = (key: string) => {
    setActiveAccordion(activeAccordion === key ? null : key);
  };

  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs mb-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar 
            size={48} 
            src={scientist.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scientist.name)}`} 
            className="border-2 border-blue-500 shadow-xs"
          />
          <div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block">Drill-Down Explorer</span>
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0 flex items-center gap-2">
              {scientist.name}
              <Tag color="blue" className="text-[10px] uppercase font-bold m-0">{scientist.employeeCode}</Tag>
            </h3>
          </div>
        </div>
        <Button size="small" danger onClick={onClose} className="rounded-lg">Close Explorer</Button>
      </div>

      {/* Accordions */}
      <div className="space-y-1">
        {/* Accordion 1: Scientist Profile Details */}
        <AccordionItem
          id="profile"
          title="🎓 Scientist Profile & Administrative Specs"
          icon={<UserOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Side: Basic Profile & Contact */}
            <div className="md:col-span-5 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
              <div className="flex flex-col items-center text-center p-4 bg-slate-50/60 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-800">
                <Avatar 
                  size={96} 
                  src={scientist.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scientist.name)}`} 
                  className="border-2 border-blue-500 shadow-sm mb-3"
                />
                <h4 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 m-0">{scientist.name}</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold m-0">{scientist.designation}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  <Tag color="blue" className="text-[10px] uppercase font-bold m-0">Code: {scientist.employeeCode}</Tag>
                  <Tag color={scientist.status === 'Active' ? 'green' : 'red'} className="text-[10px] uppercase font-bold m-0">{scientist.status}</Tag>
                  {scientist.category && <Tag color="purple" className="text-[10px] uppercase font-bold m-0">Cat: {scientist.category}</Tag>}
                </div>
              </div>

              {/* Administrative specifications */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Date of Joining (DOJ):</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.doj || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Room Assigned:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Room No. {scientist.roomNumber || 'Not Allocated'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Division/Location:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{scientist.departmentLocation || 'Main Block'}</span>
                </div>
              </div>

              {/* Contact Info (Masked if applicable) */}
              <div className="p-3 bg-blue-50/30 dark:bg-zinc-950/20 rounded-xl border border-blue-50/50 dark:border-zinc-800/40 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <MailOutlined className="text-blue-500" />
                  <span className="text-slate-500 dark:text-zinc-400">Govt Email:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">
                    {renderMaskedField(scientist.govtEmail, isAuthenticated || !!visibility?.fields.email, '🔒 masked')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MailOutlined className="text-purple-400" />
                  <span className="text-slate-500 dark:text-zinc-400">Personal Email:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">
                    {renderMaskedField(scientist.personalEmail, isAuthenticated, '🔒 masked')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-green-500" />
                  <span className="text-slate-500 dark:text-zinc-400">Phone:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">
                    {renderMaskedField(scientist.phone, isAuthenticated || !!visibility?.fields.phone, '🔒 masked')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Academic & Experiences & Summary */}
            <div className="md:col-span-7 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/80 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">DATE OF BIRTH</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {renderMaskedField(scientist.dob, isAuthenticated || !!visibility?.fields.dob, '🔒 masked')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">GENDER / BLOOD GROUP</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {scientist.gender || 'N/A'} / {scientist.bloodGroup || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Cumulative Experience Summary */}
              <div className="p-4 bg-emerald-50/20 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block uppercase tracking-wider mb-2">Cumulative ICMR & Non-ICMR Experience</span>
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-emerald-50 dark:bg-zinc-900 rounded-lg border border-emerald-100/50 dark:border-zinc-800">
                    <span className="block text-[10px] text-slate-400">Total Y-M-D</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatYMD(scientistExp.total)}</span>
                  </div>
                  <div className="flex-1 text-xs text-slate-500 space-y-0.5">
                    <div>• Previous ICMR Exp: <strong className="text-slate-700 dark:text-zinc-300">{formatYMD(scientistExp.icmr)}</strong></div>
                    <div>• Previous Non-ICMR Exp: <strong className="text-slate-700 dark:text-zinc-300">{formatYMD(scientistExp.nonIcmr)}</strong></div>
                    <div>• Active Term Exp: <strong className="text-slate-700 dark:text-zinc-300">{formatYMD(scientistExp.current)}</strong></div>
                  </div>
                </div>
              </div>

              {/* Experiences lists */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Previous Experience Timeline (ICMR)</span>
                  {scientist.previousIcmrExperience && scientist.previousIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {scientist.previousIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{exp.designation || 'Research Fellow'}</span>
                            <span className="text-[10px] text-slate-400 block">{exp.institute || 'ICMR Institute'}</span>
                          </div>
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">{exp.fromDate} to {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No previous ICMR experience registered.</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Previous Experience Timeline (Non-ICMR)</span>
                  {scientist.previousNonIcmrExperience && scientist.previousNonIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {scientist.previousNonIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{exp.designation}</span>
                            <span className="text-[10px] text-slate-400 block">{exp.institute || exp.organization}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">{exp.fromDate} to {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No previous non-ICMR experience registered.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Accordion 2: Led Projects & Scheme Specs */}
        <AccordionItem
          id="projects"
          title={`🔬 Projects Led & Appointed Research Staff (${ledProjects.length})`}
          icon={<FilePdfOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          {ledProjects.length === 0 ? (
            <Empty description="No extramural research projects currently led by this scientist." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="space-y-4">
              <span className="text-xs text-slate-400 font-extrabold block uppercase tracking-wider mb-1">
                📂 SELECT A PROJECT TO VIEW DRILL-DOWN SPECIFICATIONS & STAFF DEPLOYED
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ledProjects.map((p) => (
                  <div 
                    key={p.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      innerSelectedProject?.id === p.id
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-800 shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
                    }`}
                    onClick={() => setInnerSelectedProject(innerSelectedProject?.id === p.id ? null : p)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">{p.shortName}</span>
                      <Tag color={p.status === 'Completed' ? 'green' : p.status === 'Ongoing' ? 'blue' : 'orange'} className="text-[9px] font-black uppercase tracking-wider rounded-md m-0 px-1.5">
                        {p.status}
                      </Tag>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1.5 line-clamp-2" title={p.name}>
                      {p.name}
                    </h4>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800/60 flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Outlay: <strong className="text-slate-600 dark:text-zinc-300">₹{p.budget.toLocaleString()}</strong></span>
                      <span>{p.pendingDays || 0} days remaining</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nesting Level 2: Project spec on LEFT, Staff table on RIGHT */}
              {innerSelectedProject && (
                <div className="p-4 md:p-5 mt-4 bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-inner animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800/80 mb-4">
                    <div>
                      <span className="text-[10px] text-indigo-500 font-bold uppercase block tracking-wider">PROJECT DEEP SPECIFICATION</span>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 m-0">
                        {innerSelectedProject.name} ({innerSelectedProject.shortName})
                      </h4>
                    </div>
                    <Button size="small" type="dashed" onClick={() => setInnerSelectedProject(null)}>Close Spec</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left details (specifications) */}
                    <div className="md:col-span-5 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
                      <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Scheme Administrative Details</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Funding Source:</span>
                            <strong className="text-slate-700 dark:text-zinc-200">{innerSelectedProject.type}</strong>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Total Outlay:</span>
                            <strong className="text-emerald-600">₹{(innerSelectedProject.budget || 0).toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Dates:</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono text-[11px]">{innerSelectedProject.startDate} to {innerSelectedProject.endDate}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Scheduled Duration:</span>
                            <strong className="text-slate-700 dark:text-zinc-300">{innerSelectedProject.durationDays || 0} Days</strong>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Days Left:</span>
                            <Tag color={(innerSelectedProject.pendingDays || 0) <= 60 ? 'red' : 'green'} className="font-bold m-0">{innerSelectedProject.pendingDays || 0} Days</Tag>
                          </div>
                        </div>

                        {/* Progress Bar representation */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            <span>Lifecycle Completion</span>
                            <span>
                              {innerSelectedProject.pendingDays && innerSelectedProject.durationDays ? (
                                `${Math.max(0, Math.round(((innerSelectedProject.durationDays - innerSelectedProject.pendingDays) / innerSelectedProject.durationDays) * 100))}%`
                              ) : '0%'}
                            </span>
                          </div>
                          {innerSelectedProject.pendingDays && innerSelectedProject.durationDays ? (
                            <Progress 
                              percent={Math.max(0, Math.min(100, Math.round(((innerSelectedProject.durationDays - innerSelectedProject.pendingDays) / innerSelectedProject.durationDays) * 100)))} 
                              strokeColor="#10B981"
                              showInfo={false}
                              className="m-0"
                            />
                          ) : <Progress percent={0} showInfo={false} />}
                        </div>
                      </div>

                      {/* Utilization Certificates and final report */}
                      <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">UCs & Final Project Report</span>
                        <div className="space-y-2 text-xs">
                          {innerSelectedProject.provisionalUCs && innerSelectedProject.provisionalUCs.length > 0 ? (
                            <div>
                              <span className="font-bold text-slate-400 block text-[9px] uppercase">Prov UCs:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {innerSelectedProject.provisionalUCs.map((uc, i) => (
                                  <Button key={i} type="link" size="small" className="p-0 h-auto text-xs font-semibold flex items-center gap-1 text-blue-600" onClick={() => handleDownloadBase64File(uc.fileName, uc.fileData)}>
                                    <DownloadOutlined /> {uc.period}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">No provisional UCs uploaded.</div>
                          )}

                          <div className="pt-1 border-t border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="font-bold text-slate-400 block text-[9px] uppercase">Final UC:</span>
                            {innerSelectedProject.finalUC ? (
                              <Button type="link" size="small" className="p-0 h-auto text-xs font-bold flex items-center gap-1 text-amber-600" onClick={() => handleDownloadBase64File(innerSelectedProject.finalUC?.fileName || 'final', innerSelectedProject.finalUC?.fileData || '')}>
                                <DownloadOutlined /> Final UC ({innerSelectedProject.finalUC.period})
                              </Button>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">No final UC uploaded.</div>
                            )}
                          </div>

                          <div className="pt-1 border-t border-dashed border-slate-100 dark:border-zinc-800">
                            <span className="font-bold text-slate-400 block text-[9px] uppercase">Final Report:</span>
                            {innerSelectedProject.finalReport ? (
                              <Button type="link" size="small" className="p-0 h-auto text-xs font-bold flex items-center gap-1 text-emerald-600" onClick={() => handleDownloadBase64File(innerSelectedProject.finalReport?.fileName || 'report', innerSelectedProject.finalReport?.fileData || '')}>
                                <DownloadOutlined /> {innerSelectedProject.finalReport.title || 'Final Project Report'}
                              </Button>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">No final report submitted.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right details (Assigned project staff list) */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-2">
                          Appointed Project Staff Deployed ({projectStaff.filter(s => s.projectId === innerSelectedProject.id).length})
                        </span>
                        {(() => {
                          const assocStaff = projectStaff.filter(s => s.projectId === innerSelectedProject.id);
                          if (assocStaff.length === 0) {
                            return <Empty description="No research staff assigned to this project ledger." image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                          }

                          return (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {assocStaff.map((staff) => {
                                const status = calculateIcmrTenureStatus(staff, innerSelectedProject);
                                return (
                                  <div 
                                    key={staff.id} 
                                    className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800 rounded-xl hover:bg-slate-100/50 dark:hover:bg-zinc-900/40 transition-colors flex flex-col md:flex-row justify-between gap-3 text-xs"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-800 dark:text-zinc-100">{staff.name}</span>
                                        <Tag color="blue" className="text-[9px] font-bold m-0">{staff.employeeCode}</Tag>
                                      </div>
                                      <div className="text-slate-400 text-[10px] font-medium">
                                        {staff.designation} • Join date: {staff.doj || 'N/A'}
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <Button 
                                          size="small" 
                                          type="link" 
                                          icon={<EyeOutlined />} 
                                          className="p-0 text-[10px] h-auto text-indigo-600 font-bold"
                                          onClick={() => onOpenStaffProfile(staff)}
                                        >
                                          View Full Profile Sheet
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Tenure limits on right */}
                                    <div className={`p-2 rounded-lg border text-[10px] max-w-xs md:w-56 space-y-0.5 ${
                                      status.isRedFlag 
                                        ? 'bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-200' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500 font-semibold">Total ICMR Exp:</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatYMD(status.totalIcmrYMD)}</span>
                                      </div>
                                      <div className="border-t border-dashed border-slate-200/60 dark:border-zinc-800 my-0.5" />
                                      {status.isRedFlag ? (
                                        <div className="font-bold text-red-600 dark:text-red-400">
                                          🚨 Warning: {status.remainingText} (Cut-off: {status.cutOffDateStr})
                                        </div>
                                      ) : (
                                        <div className="text-slate-500">
                                          ✅ Stable: {status.remainingText} until {status.cutOffDateStr}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AccordionItem>
      </div>
    </div>
  );
}

// ==========================================
// 2. PROJECT DRILL DOWN ACCORDION
// ==========================================
interface ProjectDrillDownProps {
  project: Project;
  scientists: Scientist[];
  projectStaff: ProjectStaff[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onOpenStaffProfile: (staff: ProjectStaff) => void;
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function ProjectDrillDown({
  project,
  scientists,
  projectStaff,
  visibility,
  isAuthenticated,
  onClose,
  onOpenStaffProfile,
  handleDownloadBase64File
}: ProjectDrillDownProps) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('specs');
  const [nestedSelectedStaff, setNestedSelectedStaff] = useState<ProjectStaff | null>(null);

  const piScientist = scientists.find(s => s.id === project.piId);
  const associatedStaff = projectStaff.filter(s => s.projectId === project.id);

  const handleToggle = (key: string) => {
    setActiveAccordion(activeAccordion === key ? null : key);
  };

  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs mb-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
        <div>
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest block">Drill-Down Project Spec</span>
          <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0 flex flex-wrap items-center gap-2">
            📂 {project.name}
            <Tag color="blue" className="text-xs uppercase font-extrabold rounded-md m-0">{project.shortName}</Tag>
          </h3>
        </div>
        <Button size="small" danger onClick={onClose} className="rounded-lg">Close explorer</Button>
      </div>

      <div className="space-y-1">
        {/* Accordion 1: Specifications & Documents */}
        <AccordionItem
          id="specs"
          title="🔬 Project Details & Official Ledger Specifications"
          icon={<CalendarOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Col: Project Metadata */}
            <div className="md:col-span-6 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-lg border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">FUNDING SCHEME</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{project.type} Scheme</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-lg border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">FINANCIAL OUTLAY</span>
                  <span className="text-xs font-black text-emerald-600">₹{(project.budget || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-lg border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">COMMENCEMENT DATE</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CalendarOutlined className="text-slate-400" /> {project.startDate}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-lg border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 font-bold block">SCHEDULED END DATE</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CalendarOutlined className="text-slate-400" /> {project.endDate}
                  </span>
                </div>
              </div>

              {/* Progress Bar representation */}
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-900/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Lifecycle Completion</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
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
                    className="m-0"
                  />
                ) : <Progress percent={0} showInfo={false} />}
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                  <span>Started: {project.startDate}</span>
                  <span>{project.pendingDays || 0} days remaining</span>
                </div>
              </div>

              {/* Principal Investigator Section */}
              <div className="p-4 bg-blue-50/20 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">Lead Scientist / Principal Investigator</span>
                {piScientist ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Avatar src={piScientist.photoUrl} icon={<UserOutlined />} className="bg-blue-600" />
                    <div>
                      <strong className="text-slate-800 dark:text-zinc-200">Dr. {piScientist.name}</strong>
                      <span className="block text-[10px] text-slate-400">{piScientist.designation} • {piScientist.employeeCode}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No PI assigned currently.</span>
                )}
              </div>
            </div>

            {/* Right Col: Documents, reports, UCs */}
            <div className="md:col-span-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3 text-xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">📋 Utilization Certificates (UCs) Ledger</span>
                
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Provisional Utilization Certificates</span>
                  {project.provisionalUCs && project.provisionalUCs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {project.provisionalUCs.map((uc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs">
                          <span className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[100px]" title={uc.period}>📅 {uc.period}</span>
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
                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No Provisional UCs uploaded yet</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-900">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Final Audited Utilization Certificate</span>
                  {project.finalUC ? (
                    <div className="flex items-center justify-between p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100/50 dark:border-amber-950/40 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-zinc-200">Period: {project.finalUC.period}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[130px]">{project.finalUC.fileName}</span>
                      </div>
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<DownloadOutlined />} 
                        className="text-[10px] h-7 px-3 rounded-md font-extrabold border-0 bg-amber-600 hover:bg-amber-500"
                        onClick={() => handleDownloadBase64File(project.finalUC?.fileName || 'final_uc.pdf', project.finalUC?.fileData || '')}
                      >
                        Download
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">Final UC has not been uploaded by the PI yet</span>
                  )}
                </div>
              </div>

              {/* Final Project Report Section */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">🏆 Final Project Report Document</span>
                {project.finalReport ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg border border-emerald-100/50 dark:border-emerald-950/40 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                        <FilePdfOutlined className="text-lg" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate max-w-[150px]" title={project.finalReport.title}>
                          {project.finalReport.title || 'Final Scientific Report'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[120px]">{project.finalReport.fileName}</span>
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<DownloadOutlined />} 
                      className="text-[10px] h-8 px-3.5 rounded-lg font-extrabold border-0 bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => handleDownloadBase64File(project.finalReport?.fileName || 'final_report.pdf', project.finalReport?.fileData || '')}
                    >
                      Report
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800">
                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No Final Project Report uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Accordion 2: Appointed Project Staff */}
        <AccordionItem
          id="staff"
          title={`👥 Appointed Research Project Staff Details (${associatedStaff.length})`}
          icon={<UserOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          {associatedStaff.length === 0 ? (
            <Empty description="No research project staff assigned to this project." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="space-y-4">
              <span className="text-xs text-slate-400 font-extrabold block uppercase tracking-wider mb-1">
                👥 CLICK A STAFF MEMBER TO VIEW DRILL-DOWN PERSONAL PROFILE, EXPERIENCE TIMELINE, & BANK DETAILS
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {associatedStaff.map((staff) => {
                  const status = calculateIcmrTenureStatus(staff, project);
                  return (
                    <div 
                      key={staff.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        nestedSelectedStaff?.id === staff.id
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-800 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
                      }`}
                      onClick={() => setNestedSelectedStaff(nestedSelectedStaff?.id === staff.id ? null : staff)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={staff.photoUrl} size="small" icon={<UserOutlined />} />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 m-0">{staff.name}</h4>
                          <span className="text-[10px] text-indigo-500 block">{staff.designation}</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-zinc-800/80 pt-2">
                        <div>Code: <strong className="text-slate-700 dark:text-zinc-300 font-mono">{staff.employeeCode}</strong></div>
                        <div>DOJ: <strong className="text-slate-700 dark:text-zinc-300">{staff.doj || 'N/A'}</strong></div>
                      </div>

                      <div className={`p-1.5 mt-2 rounded border text-[9px] ${
                        status.isRedFlag 
                          ? 'bg-red-50/80 border-red-100 text-red-900 dark:bg-red-950/15 dark:border-red-950/30' 
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-zinc-900/50 dark:border-zinc-800/60'
                      }`}>
                        {status.isRedFlag ? '🚨 Red Flag Warn' : '✅ Stable'}: {status.remainingText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nested Staff Details Left/Right Split */}
              {nestedSelectedStaff && (
                <div className="p-4 md:p-5 mt-4 bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-inner animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800/80 mb-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={nestedSelectedStaff.photoUrl} size="small" />
                      <div>
                        <span className="text-[10px] text-indigo-500 font-bold uppercase block tracking-wider">PROJECT STAFF EXPANDED DETAIL</span>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 m-0">
                          {nestedSelectedStaff.name} ({nestedSelectedStaff.employeeCode})
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="small" icon={<EyeOutlined />} className="text-xs font-semibold" onClick={() => onOpenStaffProfile(nestedSelectedStaff)}>Full Record Sheet</Button>
                      <Button size="small" danger type="dashed" onClick={() => setNestedSelectedStaff(null)}>Close Profile</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Personal Profile & Verification */}
                    <div className="md:col-span-6 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
                      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3 text-xs">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Personal & Contact Info</span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Date of Joining (DOJ)</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{nestedSelectedStaff.doj || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Gender / Blood Group</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{nestedSelectedStaff.gender || 'N/A'} / {nestedSelectedStaff.bloodGroup || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-100 dark:border-zinc-800 pt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <MailOutlined className="text-blue-500" />
                            <span className="text-slate-500 dark:text-zinc-400">Email Address:</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-200">
                              {renderMaskedField(nestedSelectedStaff.email, isAuthenticated || !!visibility?.fields.email, '🔒 masked')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneOutlined className="text-green-500" />
                            <span className="text-slate-500 dark:text-zinc-400">Phone Number:</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-200">
                              {renderMaskedField(nestedSelectedStaff.phone, isAuthenticated || !!visibility?.fields.phone, '🔒 masked')}
                            </span>
                          </div>
                        </div>

                        {/* Government Verification cards */}
                        <div className="border-t border-dashed border-slate-100 dark:border-zinc-800 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded">
                            <span className="text-slate-400 font-bold block text-[9px] uppercase">Aadhaar Card</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold">
                              {renderMaskedField(nestedSelectedStaff.aadhaarNumber, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 masked')}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded">
                            <span className="text-slate-400 font-bold block text-[9px] uppercase">PAN Card</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold">
                              {renderMaskedField(nestedSelectedStaff.panNumber, isAuthenticated || !!visibility?.fields.pan, '🔒 masked')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Banking Details */}
                      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3 text-xs">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">🏦 Salary Disbursement Bank Account</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/60">
                            <span className="text-slate-400">Bank Name:</span>
                            <strong className="text-slate-700 dark:text-zinc-300">
                              {renderMaskedField(nestedSelectedStaff.bankName, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked')}
                            </strong>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/60">
                            <span className="text-slate-400">Account Number:</span>
                            <strong className="font-mono text-slate-700 dark:text-zinc-300">
                              {renderMaskedField(nestedSelectedStaff.accountNumber, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked')}
                            </strong>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">IFSC Code:</span>
                            <strong className="font-mono text-slate-700 dark:text-zinc-300">
                              {renderMaskedField(nestedSelectedStaff.ifscCode, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Qualifications, Tenure & Experience History */}
                    <div className="md:col-span-6 space-y-4">
                      {/* Academic & Linked Spec */}
                      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Academic & Linked Project</span>
                        <div className="space-y-1">
                          <div>• Qualification: <strong className="text-slate-700 dark:text-zinc-300">{nestedSelectedStaff.educationalQualification || 'Not Registered'}</strong></div>
                          <div>• Linked Project: <strong className="text-blue-600 dark:text-blue-400">{project.shortName}</strong></div>
                          <div>• Principal Investigator: <strong className="text-slate-700 dark:text-zinc-300">Dr. {piScientist?.name || 'N/A'}</strong></div>
                        </div>
                      </div>

                      {/* Cumulative Experiences */}
                      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3 text-xs">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Experience Timeline Logs</span>
                        
                        {/* Experiences Lists */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Previous Experience (ICMR)</span>
                            {nestedSelectedStaff.previousIcmrExperience && nestedSelectedStaff.previousIcmrExperience.length > 0 ? (
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {nestedSelectedStaff.previousIcmrExperience.map((exp: any, i: number) => (
                                  <div key={i} className="p-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 rounded text-[11px] flex justify-between">
                                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{exp.designation || 'Research Fellow'}</span>
                                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">{exp.fromDate} to {exp.toDate}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block">No previous ICMR experience.</span>
                            )}
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Previous Experience (Non-ICMR)</span>
                            {nestedSelectedStaff.previousNonIcmrExperience && nestedSelectedStaff.previousNonIcmrExperience.length > 0 ? (
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {nestedSelectedStaff.previousNonIcmrExperience.map((exp: any, i: number) => (
                                  <div key={i} className="p-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 rounded text-[11px] flex justify-between">
                                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{exp.designation}</span>
                                    <span className="font-mono text-[10px] text-slate-500 font-bold">{exp.fromDate} to {exp.toDate}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block">No previous non-ICMR experience.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AccordionItem>
      </div>
    </div>
  );
}

// ==========================================
// 3. PROJECT STAFF DRILL DOWN ACCORDION
// ==========================================
interface ProjectStaffDrillDownProps {
  staff: ProjectStaff;
  projects: Project[];
  scientists: Scientist[];
  visibility: VisibilityConfig | null;
  isAuthenticated: boolean;
  onClose: () => void;
}

export function ProjectStaffDrillDown({
  staff,
  projects,
  scientists,
  visibility,
  isAuthenticated,
  onClose
}: ProjectStaffDrillDownProps) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('personal');

  const project = projects.find(p => p.id === staff.projectId);
  const piScientist = scientists.find(s => s.id === staff.scientistId);
  const status = calculateIcmrTenureStatus(staff, project);
  const expYMD = calculateStaffExperienceYMD(staff);

  const handleToggle = (key: string) => {
    setActiveAccordion(activeAccordion === key ? null : key);
  };

  return (
    <div className="bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs mb-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar 
            size={48} 
            src={staff.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`} 
            className="border-2 border-indigo-500 shadow-xs"
          />
          <div>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest block">Drill-Down Profile Viewer</span>
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 m-0 flex items-center gap-2">
              {staff.name}
              <Tag color="indigo" className="text-[10px] uppercase font-bold m-0">{staff.employeeCode}</Tag>
            </h3>
          </div>
        </div>
        <Button size="small" danger onClick={onClose} className="rounded-lg">Close Explorer</Button>
      </div>

      <div className="space-y-1">
        {/* Accordion 1: Personal & Verification Details */}
        <AccordionItem
          id="personal"
          title="👤 Personal Profile & Verification Documents"
          icon={<UserOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Side */}
            <div className="md:col-span-5 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
              <div className="flex flex-col items-center text-center p-4 bg-slate-50/60 dark:bg-zinc-950/30 rounded-xl border border-slate-100 dark:border-zinc-800">
                <Avatar 
                  size={80} 
                  src={staff.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`} 
                  className="border-2 border-indigo-500 shadow-sm mb-3"
                />
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 m-0">{staff.name}</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold m-0">{staff.designation}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  <Tag color="indigo" className="text-[10px] font-bold m-0">DOJ: {staff.doj || 'N/A'}</Tag>
                  <Tag color={staff.status === 'Active' ? 'green' : 'red'} className="text-[10px] font-bold m-0">{staff.status}</Tag>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Gender:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{staff.gender || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{staff.category || 'UR'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-400 font-medium">Linked Project:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{project ? project.shortName : 'None'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Principal Investigator:</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">{piScientist ? `Dr. ${piScientist.name}` : '-'}</span>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 rounded-xl border border-slate-100 dark:border-zinc-900 space-y-3 text-xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Contact & Verification Info</span>
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <MailOutlined className="text-blue-500" />
                    <span className="text-slate-500 dark:text-zinc-400 w-24">Email Address:</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {renderMaskedField(staff.email, isAuthenticated || !!visibility?.fields.email, '🔒 masked')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneOutlined className="text-green-500" />
                    <span className="text-slate-500 dark:text-zinc-400 w-24">Phone Number:</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {renderMaskedField(staff.phone, isAuthenticated || !!visibility?.fields.phone, '🔒 masked')}
                    </span>
                  </div>
                  {staff.emergencyContact && (
                    <div className="flex items-center gap-2">
                      <PhoneOutlined className="text-red-400" />
                      <span className="text-slate-500 dark:text-zinc-400 w-24">Emergency No:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">
                        {renderMaskedField(staff.emergencyContact, isAuthenticated || !!visibility?.fields.phone, '🔒 masked')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-purple-500" />
                    <span className="text-slate-500 dark:text-zinc-400 w-24">Date of Birth:</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {renderMaskedField(staff.dob, isAuthenticated || !!visibility?.fields.dob, '🔒 masked')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HomeOutlined className="text-amber-500" />
                    <span className="text-slate-500 dark:text-zinc-400 w-24">Home Address:</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {renderMaskedField(staff.address, isAuthenticated || !!visibility?.fields.address, '🔒 masked')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Identity Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Aadhaar Card Number</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 font-extrabold">
                    {renderMaskedField(staff.aadhaarNumber, isAuthenticated || !!visibility?.fields.aadhaar, '🔒 masked')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Permanent Account Number (PAN)</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300 font-extrabold">
                    {renderMaskedField(staff.panNumber, isAuthenticated || !!visibility?.fields.pan, '🔒 masked')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Accordion 2: Academic & Experiences */}
        <AccordionItem
          id="experience"
          title="🎓 Qualifications & Research Experience Timeline"
          icon={<FilePdfOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Side */}
            <div className="md:col-span-5 space-y-4 border-r border-slate-100 dark:border-zinc-800/60 pr-0 md:pr-6">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block">EDUCATIONAL QUALIFICATION</span>
                <p className="font-extrabold text-slate-800 dark:text-zinc-200 m-0 leading-relaxed">
                  🎓 {staff.educationalQualification || 'Not Registered'}
                </p>
              </div>

              {/* Experience Summary */}
              <div className="p-3.5 bg-indigo-50/30 dark:bg-zinc-950/30 border border-indigo-100/50 dark:border-zinc-800 rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black block uppercase tracking-wider">Experience Summary Stats</span>
                <div>Total cumulative: <strong className="text-slate-800 dark:text-zinc-200">{formatYMD(expYMD.total)}</strong></div>
                <div className="border-t border-dashed border-slate-200 dark:border-zinc-800/60 my-1" />
                <div>• Previous ICMR: <strong className="text-slate-600 dark:text-zinc-400">{formatYMD(expYMD.icmr)}</strong></div>
                <div>• Previous Non-ICMR: <strong className="text-slate-600 dark:text-zinc-400">{formatYMD(expYMD.nonIcmr)}</strong></div>
                <div>• Current Post: <strong className="text-slate-600 dark:text-zinc-400">{formatYMD(expYMD.current)}</strong></div>
              </div>

              {/* Tenure remaining active countdown */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-1 text-xs ${
                status.isRedFlag 
                  ? 'bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-300'
              }`}>
                {status.isRedFlag ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">🚨 RED FLAG WARNING</span>
                    <p className="font-bold text-red-700 dark:text-red-300 m-0">{status.remainingText} until Cut-off date: <strong>{status.cutOffDateStr}</strong></p>
                    <span className="text-[9px] text-red-500 block">Based on: {status.cutOffReason}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider block">✅ Tenure Stable</span>
                    <p className="m-0 font-medium">{status.remainingText} until Cut-off ({status.cutOffDateStr})</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Previous Experience Timeline (ICMR)</span>
                  {staff.previousIcmrExperience && staff.previousIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {staff.previousIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{exp.designation || 'Research Fellow'}</span>
                            <span className="text-[10px] text-slate-400 block">{exp.institute || 'ICMR Institute'}</span>
                          </div>
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">{exp.fromDate} to {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No previous ICMR experience registered.</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Previous Experience Timeline (Non-ICMR)</span>
                  {staff.previousNonIcmrExperience && staff.previousNonIcmrExperience.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {staff.previousNonIcmrExperience.map((exp: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 rounded-lg text-xs flex justify-between">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{exp.designation}</span>
                            <span className="text-[10px] text-slate-400 block">{exp.institute || exp.organization}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">{exp.fromDate} to {exp.toDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No previous non-ICMR experience registered.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Accordion 3: Salary Bank Account Specs */}
        <AccordionItem
          id="bank"
          title="🏦 Official Salary Disbursement Bank Account Specifications"
          icon={<BankOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl text-xs space-y-1.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Salary Bank Specifications</span>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-400">Official Bank:</span>
                <strong className="text-slate-800 dark:text-zinc-200">
                  {renderMaskedField(staff.bankName, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked')}
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">IFSC Routing Code:</span>
                <strong className="font-mono text-slate-800 dark:text-zinc-200">
                  {renderMaskedField(staff.ifscCode, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 masked')}
                </strong>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl text-xs flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-2">Salary Deposit Account Number</span>
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800 font-mono text-base font-extrabold text-slate-700 dark:text-zinc-300 text-center">
                {renderMaskedField(staff.accountNumber, isAuthenticated || !!visibility?.fields.bankDetails, '🔒 Account Masked')}
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Accordion 4: Emergency & Family Credentials */}
        <AccordionItem
          id="family"
          title="👪 Emergency & Family Credentials"
          icon={<EnvironmentOutlined />}
          activeKey={activeAccordion}
          onToggle={handleToggle}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Father / Mother */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Parental Specifications</span>
              {staff.fatherName && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-400">Father's Name:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{staff.fatherName}</strong>
                </div>
              )}
              {staff.fatherPhone && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-400">Father's Mobile:</span>
                  <strong className="font-mono text-slate-800 dark:text-zinc-200">{staff.fatherPhone}</strong>
                </div>
              )}
              {staff.motherName && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-400">Mother's Name:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{staff.motherName}</strong>
                </div>
              )}
              {staff.motherPhone && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Mother's Mobile:</span>
                  <strong className="font-mono text-slate-800 dark:text-zinc-200">{staff.motherPhone}</strong>
                </div>
              )}
            </div>

            {/* Marital status & spouse */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Marital Specifications</span>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400">Marital Status:</span>
                <strong className="text-slate-800 dark:text-zinc-200">{staff.maritalStatus || 'Single'}</strong>
              </div>
              {staff.maritalStatus === 'Married' && (
                <>
                  {staff.spouseName && (
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-zinc-800">
                      <span className="text-slate-400">Spouse Name:</span>
                      <strong className="text-slate-800 dark:text-zinc-200">{staff.spouseName}</strong>
                    </div>
                  )}
                  {staff.spousePhone && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Spouse Contact No:</span>
                      <strong className="font-mono text-slate-800 dark:text-zinc-200">{staff.spousePhone}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}
