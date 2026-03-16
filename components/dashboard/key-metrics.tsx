import { Session } from '@/types/models';

interface KeyMetricsProps {
  sessions: Session[];
}

export function KeyMetrics({ sessions }: KeyMetricsProps) {
  // Calculate metrics
  const totalSessions = sessions.length;
  const avgConfidence = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.confidence, 0) / sessions.length)
    : 0;

  const metrics = [
    {
      label: 'Total Sessions',
      value: totalSessions.toString(),
      sublabel: 'analyzed',
    },
    {
      label: 'Avg Confidence',
      value: `${avgConfidence}%`,
      sublabel: 'performance score',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="flex flex-col rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {metric.label}
          </span>
          <span className="mt-1 text-xl font-semibold text-slate-900 truncate">
            {metric.value}
          </span>
          <span className="mt-0.5 text-[10px] text-slate-400">
            {metric.sublabel}
          </span>
        </div>
      ))}
    </div>
  );
}
