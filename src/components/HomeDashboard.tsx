import { useCallback, useMemo, useState } from 'react';
import { Row, Col } from 'antd';
import { NotificationOutlined, FilePdfOutlined } from '@ant-design/icons';
import {
  VisibilityConfig, Announcement, BroadcastMessage, Event as EventType,
  Scientist, ProjectStaff, PermanentStaff, YPConsultant, Circular,
  FormDocument
} from '../types';
import { BroadcastFeed } from './BroadcastFeed';

// Modular Subcomponents
import { SeminarsEventsCelebrations } from './dashboard/SeminarsEventsCelebrations';
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

const PAGE_SIZE = 5;

// Pure helper — lives outside the component so it isn't recreated every render
// and so it never accidentally captures stale props/state.
const isDateInCurrentWeek = (dateStr?: string): boolean => {
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

  // ---- Derived data, memoized against the actual inputs that can change it ----
  // Previously these ran on every render (including keystrokes in unrelated
  // search boxes); now they only recompute when the underlying rosters change.
  const localBirthdays = useMemo(() => {
    const list: { name: string; designation: string; category: string; date: string }[] = [];
    scientists.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Scientist', date: s.dob });
    });
    projectStaff.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Project Research Staff', date: s.dob });
    });
    permanentStaff.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.designation, category: 'Permanent Staff', date: s.dob });
    });
    ypConsultants.filter(s => s.status === 'Active' && isDateInCurrentWeek(s.dob)).forEach(s => {
      list.push({ name: s.name, designation: s.fullDesignation, category: s.designationType, date: s.dob });
    });
    return list;
  }, [scientists, projectStaff, permanentStaff, ypConsultants]);

  const localAnniversaries = useMemo(() => {
    const list: { name: string; designation: string; category: string; date: string; years: number }[] = [];
    const currentYear = new Date().getFullYear();
    const addAnniversary = (emp: { name: string; doj: string; designation: string; category: string }) => {
      if (isDateInCurrentWeek(emp.doj)) {
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
  }, [scientists, projectStaff, permanentStaff, ypConsultants]);

  const filteredCirculars = useMemo(() => {
    const q = circularSearchText.toLowerCase();
    return circulars.filter(c =>
      c.title.toLowerCase().includes(q) || (c.fileName && c.fileName.toLowerCase().includes(q))
    );
  }, [circulars, circularSearchText]);

  const paginatedCirculars = useMemo(
    () => filteredCirculars.slice((circularPage - 1) * PAGE_SIZE, circularPage * PAGE_SIZE),
    [filteredCirculars, circularPage]
  );

  const filteredForms = useMemo(() => {
    const q = formSearchText.toLowerCase();
    return forms.filter(f =>
      f.title.toLowerCase().includes(q) || (f.fileName && f.fileName.toLowerCase().includes(q))
    );
  }, [forms, formSearchText]);

  const paginatedForms = useMemo(
    () => filteredForms.slice((formPage - 1) * PAGE_SIZE, formPage * PAGE_SIZE),
    [filteredForms, formPage]
  );

  // Reset to page 1 whenever a search narrows the result set, so users never
  // land on an empty "page 3 of 1" state after typing.
  const onCircularSearch = useCallback((value: string) => {
    setCircularSearchText(value);
    setCircularPage(1);
  }, []);

  const onFormSearch = useCallback((value: string) => {
    setFormSearchText(value);
    setFormPage(1);
  }, []);

  const noOpAsync = useCallback(async () => {}, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Official Board Ticker */}
      {visibility?.modules.announcements && (
        <div className="relative bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-emerald-50 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-emerald-950/20
                        border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl
                        p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 overflow-hidden shadow-sm">
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-[#075E54] text-white
                          px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold
                          uppercase tracking-wider shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <NotificationOutlined />
            <span className="hidden xs:inline">Official Board Ticker</span>
            <span className="xs:hidden">Ticker</span>
          </div>

          <div className="flex-1 overflow-hidden relative min-w-0">
            {/* Edge fades give the marquee a polished, "content continues" cue */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 z-10
                            bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 z-10
                            bg-gradient-to-l from-emerald-50 dark:from-emerald-950/30 to-transparent" />

            <div className="animate-marquee-rtl hover:[animation-play-state:paused] whitespace-nowrap inline-flex gap-8 sm:gap-12">
              {announcements.map((ann, idx) => (
                <span
                  key={ann.id || idx}
                  className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-zinc-200"
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  {ann.title}
                  {ann.fileName && (
                    <button
                      onClick={() => handleDownloadBase64File(ann.fileName!, ann.fileData!)}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1
                                 font-extrabold ml-1 cursor-pointer bg-transparent border-0 p-0
                                 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-sm"
                    >
                      <FilePdfOutlined /> View Doc
                    </button>
                  )}
                </span>
              ))}
              {announcements.length === 0 && (
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  No active institutional announcements listed today.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Broadcast / Seminars & Events / Office Circulars */}
      <Row gutter={[16, 16]} className="items-stretch">
        {visibility?.modules.broadcast && (
          <Col xs={24} md={12} xl={8} className="flex flex-col min-w-0">
            <BroadcastFeed
              messages={broadcasts}
              isAdmin={false}
              onSendMessage={noOpAsync}
              onDeleteMessage={noOpAsync}
              isWhatsAppTheme={true}
            />
          </Col>
        )}

        <Col xs={24} md={12} xl={8} className="flex flex-col min-w-0">
          <SeminarsEventsCelebrations
            events={events}
            localBirthdays={localBirthdays}
            localAnniversaries={localAnniversaries}
            eventsVisible={!!visibility?.modules.events}
            birthdaysVisible={!!visibility?.modules.birthdays}
            anniversariesVisible={!!visibility?.modules.workAnniversaries}
          />
        </Col>

        <Col xs={24} md={24} xl={8} className="flex flex-col min-w-0">
          <OfficeCirculars
            filteredCirculars={filteredCirculars}
            paginatedCirculars={paginatedCirculars}
            circularSearchText={circularSearchText}
            setCircularSearchText={onCircularSearch}
            circularPage={circularPage}
            setCircularPage={setCircularPage}
            handleDownloadBase64File={handleDownloadBase64File}
            visible={!!visibility?.modules.circulars}
          />
        </Col>
      </Row>

      {/* 3. Office Forms & Templates */}
      {/* {visibility?.modules.forms && (
        <Row gutter={[16, 16]} className="items-stretch">
          <Col xs={24} className="flex flex-col min-w-0">
            <FormsTemplates
              filteredForms={filteredForms}
              paginatedForms={paginatedForms}
              formSearchText={formSearchText}
              setFormSearchText={onFormSearch}
              formPage={formPage}
              setFormPage={setFormPage}
              handleDownloadBase64File={handleDownloadBase64File}
              visible={!!visibility?.modules.forms}
            />
          </Col>
        </Row>
      )} */}
    </div>
  );
}