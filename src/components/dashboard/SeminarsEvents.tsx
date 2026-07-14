import { Card, Empty, Tag } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { Event } from '../../types';

interface SeminarsEventsProps {
  events: Event[];
  visible: boolean;
}

export function SeminarsEvents({ events, visible }: SeminarsEventsProps) {
  if (!visible) return null;

  return (
    <Card 
      title={
        <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> 
          TODAY'S SEMINARS & EVENTS
        </span>
      }
      variant="outlined"
      className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-fadeIn"
      styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px', maxHeight: '520px' } }}
    >
      {events.length === 0 ? (
        <Empty description="No events scheduled today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="space-y-4 pr-1">
          {events.map((ev, index) => (
            <div key={ev.id || index} className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col gap-1.5 transition-all hover:bg-white dark:hover:bg-zinc-850 hover:shadow-sm">
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 line-clamp-1">{ev.title}</span>
                <Tag color="blue" className="m-0 text-[8px] font-extrabold border-0 px-1 py-0.5">{ev.time}</Tag>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                <span className="bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-zinc-400">
                  {ev.date ? new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarOutlined className="text-slate-400 text-[9px]" /> <span className="font-semibold truncate">{ev.venue}</span>
                </span>
              </div>
              {ev.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed m-0 italic line-clamp-2">
                  {ev.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
