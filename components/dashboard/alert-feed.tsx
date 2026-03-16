'use client';

interface Alert {
  id: string;
  title: string;
  description: string;
  hoursAgo: number;
  type: 'info' | 'warning' | 'success' | 'error';
}

// Dummy data
const DUMMY_ALERTS: Alert[] = [
  {
    id: '1',
    title: 'Market volatility detected',
    description: 'Increased volatility in SaaS sector affecting portfolio companies.',
    hoursAgo: 2,
    type: 'warning',
  },
  {
    id: '2',
    title: 'Builder.ai funding round',
    description: 'Competitor raised $50M Series B at $200M valuation.',
    hoursAgo: 5,
    type: 'info',
  },
  {
    id: '3',
    title: 'Strong traction metrics',
    description: 'Acme Corp exceeded growth targets by 40% this quarter.',
    hoursAgo: 8,
    type: 'success',
  },
  {
    id: '4',
    title: 'Regulatory changes',
    description: 'New AI regulations may impact 3 portfolio companies.',
    hoursAgo: 12,
    type: 'warning',
  },
  {
    id: '5',
    title: 'Due diligence complete',
    description: 'TechStart analysis completed - ready for review.',
    hoursAgo: 18,
    type: 'info',
  },
  {
    id: '6',
    title: 'Revenue milestone',
    description: 'DataFlow reached $1M ARR, 2 months ahead of schedule.',
    hoursAgo: 24,
    type: 'success',
  },
];

function formatTimeAgo(hours: number): string {
  if (hours < 1) return 'Just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function AlertFeed() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Alerts</h2>
      </div>

      {/* Scrollable Alert List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {DUMMY_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <h3 className="text-xs font-medium text-slate-900 mb-1">
                {alert.title}
              </h3>
              <p className="text-[11px] text-slate-600 mb-2 line-clamp-2">
                {alert.description}
              </p>
              <p className="text-[9px] text-slate-400">
                {formatTimeAgo(alert.hoursAgo)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
