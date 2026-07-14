import { Card, Avatar, Tag } from 'antd';
import { UserOutlined, StarOutlined } from '@ant-design/icons';

interface CelebrationsMilestonesProps {
  localBirthdays: any[];
  localAnniversaries: any[];
  birthdaysVisible: boolean;
  anniversariesVisible: boolean;
}

export function CelebrationsMilestones({
  localBirthdays,
  localAnniversaries,
  birthdaysVisible,
  anniversariesVisible
}: CelebrationsMilestonesProps) {
  if (!birthdaysVisible && !anniversariesVisible) return null;

  return (
    <Card 
      title={
        <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span> 
          CELEBRATIONS & MILESTONES
        </span>
      }
      variant="outlined"
      className="shadow-md rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden animate-fadeIn"
      styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px', maxHeight: '520px' } }}
    >
      <div className="space-y-4 pr-1">
        {/* Birthdays Section */}
        {birthdaysVisible && (
          <div>
            <div className="text-[9px] font-bold text-pink-500 uppercase tracking-widest mb-2 border-b border-pink-100 dark:border-pink-950/40 pb-1 flex items-center gap-1.5">
              <span>🎈 Active Birthdays This Week</span>
              <span className="px-1.5 py-0.5 bg-pink-50 dark:bg-pink-950 text-pink-600 rounded text-[8px] font-bold">{localBirthdays.length}</span>
            </div>
            {localBirthdays.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No birthdays this week</div>
            ) : (
              <div className="space-y-2">
                {localBirthdays.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar icon={<UserOutlined />} size="small" className="bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{item.designation}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold text-pink-600 flex-shrink-0">
                      {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Service Milestones Section */}
        {anniversariesVisible && (
          <div>
            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2 border-b border-amber-100 dark:border-amber-950/40 pb-1 flex items-center gap-1.5">
              <span>🌟 Service Milestones</span>
              <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded text-[8px] font-bold">{localAnniversaries.length}</span>
            </div>
            {localAnniversaries.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-lg">No milestones this week</div>
            ) : (
              <div className="space-y-2">
                {localAnniversaries.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 rounded-lg gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar icon={<StarOutlined />} size="small" className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[10px] text-slate-800 dark:text-zinc-200 truncate">{item.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{item.designation}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Tag color="orange" className="font-extrabold border-0 text-[8px] m-0 px-1 py-0">{item.years} Yrs</Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
