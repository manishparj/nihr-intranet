import { Card, Tag, Avatar } from 'antd';
import { UserOutlined, StarOutlined } from '@ant-design/icons';
import { Event } from '../../types';
import { useMemo } from 'react';

interface SeminarsEventsCelebrationsProps {
  events: Event[];
  localBirthdays: any[];
  localAnniversaries: any[];
  eventsVisible: boolean;
  birthdaysVisible: boolean;
  anniversariesVisible: boolean;
}

// Tailwind's JIT compiler cannot resolve class names built from template
// literals (e.g. `text-${color}-600`), so every color variant used anywhere
// in this file must exist here as a literal, static string.
const COLOR_THEMES = {
  blue: {
    header: 'text-blue-700 dark:text-blue-300',
    headerBorder: 'border-blue-100 dark:border-blue-900/30',
    badge: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    section: 'bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-100 dark:border-blue-900/30',
    itemBorder: 'border-blue-50 dark:border-blue-900/20',
    accentText: 'text-blue-700 dark:text-blue-300',
  },
  pink: {
    header: 'text-pink-700 dark:text-pink-300',
    headerBorder: 'border-pink-100 dark:border-pink-900/30',
    badge: 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300',
    section: 'bg-gradient-to-br from-pink-50/70 to-rose-50/40 dark:from-pink-950/20 dark:to-rose-950/10 border-pink-100 dark:border-pink-900/30',
    itemBorder: 'border-pink-50 dark:border-pink-900/20',
    avatarBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600',
    accentText: 'text-pink-600 dark:text-pink-400',
  },
  amber: {
    header: 'text-amber-700 dark:text-amber-300',
    headerBorder: 'border-amber-100 dark:border-amber-900/30',
    badge: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    section: 'bg-gradient-to-br from-amber-50/70 to-yellow-50/40 dark:from-amber-950/20 dark:to-yellow-950/10 border-amber-100 dark:border-amber-900/30',
    itemBorder: 'border-amber-50 dark:border-amber-900/20',
    avatarBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
} as const;

type ThemeKey = keyof typeof COLOR_THEMES;

const SectionHeader = ({ icon, title, count, theme }: { icon: string; title: string; count: number; theme: ThemeKey }) => {
  const t = COLOR_THEMES[theme];
  return (
    <div className={`text-[10px] sm:text-[11px] font-bold ${t.header} uppercase tracking-widest mb-2 pb-1.5 border-b ${t.headerBorder} flex items-center justify-between gap-1.5`}>
      <span className="flex items-center gap-1.5 truncate">
        <span aria-hidden="true">{icon}</span>
        <span className="truncate">{title}</span>
      </span>
      <span className={`shrink-0 px-1.5 py-0.5 ${t.badge} rounded text-[9px] font-bold`}>
        {count}
      </span>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-4 text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500">
    {message}
  </div>
);

const EventItem = ({ event }: { event: Event }) => (
  <div className={`p-2.5 bg-white dark:bg-zinc-900/60 rounded-lg border ${COLOR_THEMES.blue.itemBorder} flex flex-col gap-1 transition-colors hover:border-blue-200 dark:hover:border-blue-800`}>
    <div className="flex items-center gap-2 w-full justify-between">
      <span className="font-bold text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 line-clamp-1 min-w-0">{event.title}</span>
      <Tag color="blue" className="m-0 shrink-0 text-[8px] font-extrabold border-0 px-1.5 py-0 rounded">{event.time}</Tag>
    </div>
    <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 min-w-0">
      <span className="shrink-0">{event.date ? new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}</span>
      <span className="shrink-0 text-slate-300 dark:text-zinc-600">•</span>
      <span className="truncate">{event.venue}</span>
    </div>
  </div>
);

const PersonItem = ({
  item,
  icon,
  theme,
  showYears = false,
}: {
  item: any;
  icon: React.ReactNode;
  theme: ThemeKey;
  showYears?: boolean;
}) => {
  const t = COLOR_THEMES[theme];
  return (
    <div className={`flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/60 p-2 rounded-lg border ${t.itemBorder} transition-colors hover:shadow-sm`}>
      <div className="flex items-center gap-2 min-w-0">
        <Avatar icon={icon} size="small" className={`${t.avatarBg} flex-shrink-0`} />
        <div className="min-w-0">
          <div className="font-bold text-[10px] sm:text-[11px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
          <div className="text-[8px] sm:text-[9px] text-slate-400 dark:text-zinc-500 truncate">{item.designation}</div>
        </div>
      </div>
      {showYears ? (
        <Tag color="orange" className="shrink-0 font-extrabold border-0 text-[8px] m-0 px-1.5 py-0 rounded">
          {item.years} Yrs
        </Tag>
      ) : (
        <span className={`shrink-0 text-[9px] font-extrabold ${t.accentText}`}>
          {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
};

export function SeminarsEventsCelebrations({
  events,
  localBirthdays,
  localAnniversaries,
  eventsVisible,
  birthdaysVisible,
  anniversariesVisible,
}: SeminarsEventsCelebrationsProps) {
  const visibleEvents = useMemo(() => events.slice(0, 3), [events]);
  const hasMoreEvents = useMemo(() => events.length > 3, [events]);
  const remainingEvents = useMemo(() => events.length - 3, [events]);

  const showAnySection = useMemo(
    () => eventsVisible || birthdaysVisible || anniversariesVisible,
    [eventsVisible, birthdaysVisible, anniversariesVisible]
  );

  if (!showAnySection) return null;

  return (
    <Card
      title={
        <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2 leading-snug">
          <span className="w-2 h-2 shrink-0 bg-[#075E54] rounded-full animate-pulse" />
          <span className="line-clamp-2 sm:line-clamp-1">Seminars, Events &amp; Celebrations</span>
        </span>
      }
      variant="outlined"
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
      styles={{ body: { flex: 1, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0 } }}
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4 max-h-[60vh] sm:max-h-[420px]">
        {eventsVisible && (
          <div className={`rounded-xl border p-3 ${COLOR_THEMES.blue.section}`}>
            <SectionHeader icon="📅" title="Seminars / Events / Meetings" count={events.length} theme="blue" />
            <div className="space-y-2">
              {events.length === 0 ? (
                <EmptyState message="No events scheduled today" />
              ) : (
                <>
                  {visibleEvents.map((ev, index) => (
                    <EventItem key={ev.id || index} event={ev} />
                  ))}
                  {hasMoreEvents && (
                    <div className="text-center text-[9px] text-blue-600 dark:text-blue-400 font-bold pt-0.5">
                      +{remainingEvents} more
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {birthdaysVisible && (
          <div className={`rounded-xl border p-3 ${COLOR_THEMES.pink.section}`}>
            <SectionHeader icon="🎈" title="Birthdays This Week" count={localBirthdays.length} theme="pink" />
            <div className="space-y-1.5">
              {localBirthdays.length === 0 ? (
                <EmptyState message="No birthdays this week" />
              ) : (
                localBirthdays.map((item, index) => (
                  <PersonItem key={index} item={item} icon={<UserOutlined />} theme="pink" />
                ))
              )}
            </div>
          </div>
        )}

        {anniversariesVisible && (
          <div className={`rounded-xl border p-3 ${COLOR_THEMES.amber.section}`}>
            <SectionHeader icon="🌟" title="Service Milestones" count={localAnniversaries.length} theme="amber" />
            <div className="space-y-1.5">
              {localAnniversaries.length === 0 ? (
                <EmptyState message="No milestones this week" />
              ) : (
                localAnniversaries.map((item, index) => (
                  <PersonItem key={index} item={item} icon={<StarOutlined />} theme="amber" showYears />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}