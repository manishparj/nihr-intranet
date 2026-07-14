import { useState } from 'react';
import { Row, Col } from 'antd';
import { NotificationOutlined, FilePdfOutlined } from '@ant-design/icons';
import { 
  VisibilityConfig, Announcement, BroadcastMessage, Event as EventType, 
  Scientist, ProjectStaff, PermanentStaff, YPConsultant, Circular, 
  FormDocument 
} from '../types';
import { BroadcastFeed } from './BroadcastFeed';

// Modular Subcomponents
import { SeminarsEvents } from './dashboard/SeminarsEvents';
import { CelebrationsMilestones } from './dashboard/CelebrationsMilestones';
import { OfficeCirculars } from './dashboard/OfficeCirculars';
import { FormsTemplates } from './dashboard/FormsTemplates';

interface HomeDashboardProps {
  visibility: VisibilityConfig | null;
  announcements: Announcement[];
  broadcasts: BroadcastMessage[];
  events: EventType[];
  scientists: Scientist[];
  projectStaff: ProjectStaff[];
  permanentStaff: PermanentStaff[];
  ypConsultants: YPConsultant[];
  circulars: Circular[];
  forms: FormDocument[];
  handleDownloadBase64File: (fileName: string, fileData: string) => void;
}

export function HomeDashboard({
  visibility,
  announcements,
  broadcasts,
  events,
  scientists,
  projectStaff,
  permanentStaff,
  ypConsultants,
  circulars,
  forms,
  handleDownloadBase64File
}: HomeDashboardProps) {
  const [circularSearchText, setCircularSearchText] = useState('');
  const [circularPage, setCircularPage] = useState(1);
  const [formSearchText, setFormSearchText] = useState('');
  const [formPage, setFormPage] = useState(1);

  const isDateInCurrentWeekLocal = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const eventThisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    return eventThisYear >= startOfWeek && eventThisYear <= endOfWeek;
  };

  const getWeeklyBirthdaysLocal = () => {
    const list: { name: string; designation: string; category: string; date: string }[] = [];
    scientists.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Scientist', date: s.dob });
    });
    projectStaff.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Project Research Staff', date: s.dob });
    });
    permanentStaff.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Permanent Staff', date: s.dob });
    });
    ypConsultants.filter(s => s.status === 'Active' && isDateInCurrentWeekLocal(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.fullDesignation, category: s.designationType, date: s.dob });
    });
    return list;
  };

  const getWeeklyAnniversariesLocal = () => {
    const list: { name: string; designation: string; category: string; date: string; years: number }[] = [];
    const currentYear = new Date().getFullYear();
    const addAnniversary = (emp: { name: string; doj: string; designation: string; category: string }) => {
      if (isDateInCurrentWeekLocal(emp.doj)) {
        const joinYear = new Date(emp.doj).getFullYear();
        const years = currentYear - joinYear;
        if (years > 0) {
          list.push({ name: emp.name, designation: emp.designation, category: emp.category, date: emp.doj, years });
        }
      }
    };
    scientists.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Scientist' }));
    projectStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Project Research Staff' }));
    permanentStaff.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.designation, category: 'Permanent Staff' }));
    ypConsultants.filter(s => s.status === 'Active').forEach(s => addAnniversary({ name: s.name, doj: s.doj, designation: s.fullDesignation, category: s.designationType }));
    return list;
  };

  const localBirthdays = getWeeklyBirthdaysLocal();
  const localAnniversaries = getWeeklyAnniversariesLocal();

  const filteredCirculars = circulars.filter(c => 
    c.title.toLowerCase().includes(circularSearchText.toLowerCase()) ||
    (c.fileName && c.fileName.toLowerCase().includes(circularSearchText.toLowerCase()))
  );
  const paginatedCirculars = filteredCirculars.slice((circularPage - 1) * 5, circularPage * 5);

  const filteredForms = forms.filter(f => 
    f.title.toLowerCase().includes(formSearchText.toLowerCase()) ||
    (f.fileName && f.fileName.toLowerCase().includes(formSearchText.toLowerCase()))
  );
  const paginatedForms = filteredForms.slice((formPage - 1) * 5, formPage * 5);

  return (
    <div className="space-y-6">
      {/* 1. Latest Announcements left to right marquee */}
      {visibility?.modules.announcements && (
        <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-2.5 flex items-center gap-3 overflow-hidden shadow-sm">
          <div className="flex-shrink-0 flex items-center gap-2 bg-[#075E54] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
            <NotificationOutlined /> Official Board Ticker
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee-rtl hover:[animation-play-state:paused] whitespace-nowrap inline-flex gap-12">
              {announcements.map((ann, idx) => (
                <span key={ann.id || idx} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {ann.title}
                  {ann.fileName && (
                    <a href={ann.fileData} target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-extrabold ml-1">
                      <FilePdfOutlined /> View Doc
                    </a>
                  )}
                </span>
              ))}
              {announcements.length === 0 && (
                <span className="text-xs text-slate-400 font-medium">No active institutional announcements listed today.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top-Level Layout Grid (Broadcast, Today's Seminars, Birthdays/Milestones) */}
      <Row gutter={[16, 16]} className="items-stretch">
        {/* Left: WhatsApp-theme Broadcast Bulletin Channel */}
        {visibility?.modules.broadcast && (
          <Col xs={24} lg={12} className="flex flex-col">
            <BroadcastFeed
              messages={broadcasts}
              isAdmin={false}
              onSendMessage={async () => {}}
              onDeleteMessage={async () => {}}
              isWhatsAppTheme={true}
            />
          </Col>
        )}

        {/* Middle: Today's Events (Scientific Events & Seminars) */}
        <Col xs={24} md={12} lg={6} className="flex flex-col">
          <SeminarsEvents 
            events={events} 
            visible={!!visibility?.modules.events} 
          />
        </Col>

        {/* Right: Birthdays & Celebrations & Service Milestones */}
        <Col xs={24} md={12} lg={6} className="flex flex-col">
          <CelebrationsMilestones
            localBirthdays={localBirthdays}
            localAnniversaries={localAnniversaries}
            birthdaysVisible={!!visibility?.modules.birthdays}
            anniversariesVisible={!!visibility?.modules.workAnniversaries}
          />
        </Col>
      </Row>

      {/* 3. Standalone Institutional Office Circulars & Office Forms & Templates Card Row */}
      {(visibility?.modules.circulars || visibility?.modules.forms) && (
        <Row gutter={[16, 16]} className="items-stretch">
          <Col xs={24} lg={12} className="flex flex-col">
            <OfficeCirculars
              filteredCirculars={filteredCirculars}
              paginatedCirculars={paginatedCirculars}
              circularSearchText={circularSearchText}
              setCircularSearchText={setCircularSearchText}
              circularPage={circularPage}
              setCircularPage={setCircularPage}
              handleDownloadBase64File={handleDownloadBase64File}
              visible={!!visibility?.modules.circulars}
            />
          </Col>

          <Col xs={24} lg={12} className="flex flex-col">
            <FormsTemplates
              filteredForms={filteredForms}
              paginatedForms={paginatedForms}
              formSearchText={formSearchText}
              setFormSearchText={setFormSearchText}
              formPage={formPage}
              setFormPage={setFormPage}
              handleDownloadBase64File={handleDownloadBase64File}
              visible={!!visibility?.modules.forms}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}
