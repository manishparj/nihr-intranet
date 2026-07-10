import React from 'react';
import { Card, Row, Col, Statistic, Avatar, Tag, Space, Calendar, Empty, Typography } from 'antd';
import { 
  UserOutlined, ProjectOutlined, SolutionOutlined, FilePdfOutlined, 
  NotificationOutlined, GiftOutlined, StarOutlined, CalendarOutlined, 
  EnvironmentOutlined, ClockCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { Scientist, Project, ProjectStaff, PermanentStaff, YPConsultant, Event, VisibilityConfig } from '../types';

interface DashboardOverviewProps {
  scientists: Scientist[];
  projects: Project[];
  projectStaff: ProjectStaff[];
  permanentStaff: PermanentStaff[];
  ypConsultants: YPConsultant[];
  events: Event[];
  visibility: VisibilityConfig;
  isAdmin: boolean;
  statsOnly?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  scientists,
  projects,
  projectStaff,
  permanentStaff,
  ypConsultants,
  events,
  visibility,
  isAdmin,
  statsOnly = false,
}) => {
  // Helper to check if a date (YYYY-MM-DD) falls in the current week (Sun-Sat)
  const isDateInCurrentWeek = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    
    // Start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // End of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Construct the event date for the current year
    const eventThisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    
    return eventThisYear >= startOfWeek && eventThisYear <= endOfWeek;
  };

  // Extract weekly celebrations
  const getWeeklyBirthdays = () => {
    const list: { name: string; designation: string; category: string; date: string; type: string }[] = [];

    scientists.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Scientist', date: s.dob, type: 'birthday' });
    });

    projectStaff.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Project Staff', date: s.dob, type: 'birthday' });
    });

    permanentStaff.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Permanent Staff', date: s.dob, type: 'birthday' });
    });

    ypConsultants.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.fullDesignation, category: s.designationType, date: s.dob, type: 'birthday' });
    });

    return list;
  };

  const getWeeklyAnniversaries = () => {
    const list: { name: string; designation: string; category: string; date: string; years: number }[] = [];
    const currentYear = new Date().getFullYear();

    const addAnniversary = (emp: { name: string; doj: string; designation: string; category: string }) => {
      if (isDateInCurrentWeek(emp.doj)) {
        const joinYear = new Date(emp.doj).getFullYear();
        const years = currentYear - joinYear;
        if (years > 0) {
          list.push({
            name: emp.name,
            designation: emp.designation,
            category: emp.category,
            date: emp.doj,
            years,
          });
        }
      }
    };

    scientists.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Scientist' }));
    projectStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Project Staff' }));
    permanentStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Permanent Staff' }));
    ypConsultants.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.fullDesignation, category: s.designationType }));

    return list;
  };

  const birthdays = getWeeklyBirthdays();
  const anniversaries = getWeeklyAnniversaries();

  // Stats Counters
  const activeScientists = scientists.filter(s => s.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status === 'Ongoing').length;
  const activeProjectStaff = projectStaff.filter(s => s.status === 'Active').length;
  const activePermanentStaff = permanentStaff.filter(s => s.status === 'Active').length;
  const activeYpCons = ypConsultants.filter(s => s.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Card - Clean Minimalism Edition */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 border-l-4 border-l-[#005EB8] p-5 rounded-xl shadow-sm transition-all">
        <div className="flex items-center gap-2">
          <span className="text-base md:text-lg font-bold tracking-tight text-slate-800 dark:text-zinc-100">National Institute of Health Research (NIHR) Intranet</span>
          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#005EB8] dark:text-blue-300 rounded text-[9px] font-bold tracking-wide uppercase">Institutional Registry</span>
        </div>
        <p className="mt-1.5 text-slate-500 dark:text-zinc-400 text-xs max-w-3xl leading-relaxed">
          The centralized administrative platform for secure scientist credentials, extramural research projects, provisional & final utilization certificates (UCs), and active institutional bulletins.
        </p>
      </div>

      {/* 2. Numerical KPI Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm rounded-xl border border-slate-200 dark:border-zinc-800">
            <Statistic
              title={<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Scientists</span>}
              value={activeScientists}
              prefix={<UserOutlined className="text-[#005EB8] mr-2" />}
              styles={{ content: { fontWeight: 800, fontSize: '24px', color: '#005EB8' } }}
            />
            <div className="text-[10px] text-slate-400 mt-1 font-medium">Verified Profiles</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm rounded-xl border border-slate-200 dark:border-zinc-800">
            <Statistic
              title={<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Ongoing Projects</span>}
              value={activeProjects}
              prefix={<ProjectOutlined className="text-indigo-600 mr-2" />}
              styles={{ content: { fontWeight: 800, fontSize: '24px', color: '#1e293b' } }}
            />
            <div className="text-[10px] text-indigo-600 font-bold mt-1">Active Ledger</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm rounded-xl border border-slate-200 dark:border-zinc-800">
            <Statistic
              title={<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Research Staff</span>}
              value={activeProjectStaff}
              prefix={<SolutionOutlined className="text-slate-600 mr-2" />}
              styles={{ content: { fontWeight: 800, fontSize: '24px', color: '#1e293b' } }}
            />
            <div className="text-[10px] text-slate-400 mt-1 font-medium">ICMR Supported</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" className="shadow-sm rounded-xl border border-slate-200 dark:border-zinc-800">
            <Statistic
              title={<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">YP & Consultants</span>}
              value={activeYpCons}
              prefix={<StarOutlined className="text-teal-600 mr-2" />}
              styles={{ content: { fontWeight: 800, fontSize: '24px', color: '#1e293b' } }}
            />
            <div className="text-[10px] text-teal-600 font-bold mt-1">Contract Term</div>
          </Card>
        </Col>
      </Row>

      {/* 3. Birthday, Anniversary & Events Cards Layout */}
      {!statsOnly && (
        <Row gutter={[16, 16]}>
          {/* Weekly Birthdays Card */}
          {(!visibility.modules.birthdays && !isAdmin) ? null : (
            <Col xs={24} md={12} lg={8}>
              <Card 
                title={<span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span> Birthdays & Celebrations</span>}
                variant="outlined"
                className="shadow-sm rounded-xl h-full border border-slate-200 dark:border-zinc-800"
              >
                {birthdays.length === 0 ? (
                  <Empty description="No employee birthdays this week" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {birthdays.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-900 last:border-b-0 py-2.5 gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar icon={<UserOutlined />} className="bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-xs text-slate-800 dark:text-zinc-200">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.designation}</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-pink-600 flex items-center gap-1 flex-shrink-0">
                          🎈 {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          )}

          {/* Weekly Work Anniversaries Card */}
          {(!visibility.modules.workAnniversaries && !isAdmin) ? null : (
            <Col xs={24} md={12} lg={8}>
              <Card 
                title={<span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Service Milestones</span>}
                variant="outlined"
                className="shadow-sm rounded-xl h-full border border-slate-200 dark:border-zinc-800"
              >
                {anniversaries.length === 0 ? (
                  <Empty description="No work anniversaries this week" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {anniversaries.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-900 last:border-b-0 py-2.5 gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar icon={<StarOutlined />} className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-xs text-slate-800 dark:text-zinc-200">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.designation}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Tag color="orange" className="font-bold border-0 text-[9px]">{item.years} Yr Milestone</Tag>
                          <div className="text-[9px] text-slate-400 mt-0.5">Joined {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          )}

          {/* Today's Events Card */}
          {(!visibility.modules.events && !isAdmin) ? null : (
            <Col xs={24} lg={8}>
              <Card 
                title={<span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#005EB8] rounded-full"></span> Scientific Events & Seminars</span>}
                variant="outlined"
                className="shadow-sm rounded-xl h-full border border-slate-200 dark:border-zinc-800"
              >
                {events.length === 0 ? (
                  <Empty description="No events scheduled today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {events.map((ev, index) => (
                      <div key={ev.id || index} className="flex flex-col items-start gap-1 py-3 border-b border-slate-50 dark:border-zinc-900 last:border-b-0 w-full">
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="font-bold text-xs text-[#005EB8] dark:text-blue-400">{ev.title}</span>
                          <Tag color="blue" className="m-0 text-[9px] border-0">{ev.time}</Tag>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-500 dark:text-zinc-400">
                            {ev.date ? new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                          </span>
                          <span className="flex items-center gap-1">
                            <EnvironmentOutlined className="text-slate-400" /> <span className="font-medium">{ev.venue}</span>
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed m-0 italic">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};
