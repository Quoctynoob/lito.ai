import { Session } from '@/types/models';

interface RecentSessionsProps {
  sessions: Session[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const days = Math.floor(diffHours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  // Get the most recent sessions
  const recentSessions = sessions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent Sessions</h2>
      </div>

      {/* Sessions List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
        {recentSessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            No sessions yet
          </div>
        ) : (
          recentSessions.map((session) => (
            <div
              key={session.id}
              className="cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-medium text-slate-900">
                    {session.intake.company}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {session.intake.industry} • {session.intake.fundingStage}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-medium text-slate-700">
                    {session.confidence}%
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {formatTimeAgo(session.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
