import { getSessions } from '@/lib/actions/sessions';
import { filterAndSortSessions, parseSearchParams } from '@/lib/session-utils';
import { SessionsToolbar } from '@/components/sessions/sessions-toolbar';
import { SessionsTable } from '@/components/sessions/sessions-table';
import { PaginationControls } from '@/components/sessions/pagination-controls';
import { PipelineBar } from '@/components/dashboard/pipeline-bar';
import { AlertFeed } from '@/components/dashboard/alert-feed';
import { BellCurveChart } from '@/components/dashboard/bell-curve-chart';
import { KeyMetrics } from '@/components/dashboard/key-metrics';
import { RecentSessions } from '@/components/dashboard/recent-sessions';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseSearchParams(params);

  // Fetch sessions from server action
  const allSessions = await getSessions();

  // Filter and paginate
  const { sessions, totalSessions, totalPages, currentPage } = filterAndSortSessions(
    allSessions,
    filters
  );

  // Check if there are any sessions at all
  const hasNoSessions = allSessions.length === 0;
  const hasNoResults = !hasNoSessions && sessions.length === 0;

  return (
    <>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="m-0 text-3xl font-semibold text-slate-900">Current Batch</h1>
      </div>

      {/* Dashboard layout */}
      <div className="mb-6 flex gap-6">

        {/* Left area */}
        <div className="flex w-1/2 flex-col gap-4">
          {/* Pipeline Bar */}
          <PipelineBar sessions={allSessions} />

          {/* Main Graph */}
          <div className="h-80 w-full">
            <BellCurveChart />
          </div>
        </div>

        {/* Middle area */}
        <div className="-mt-16 flex flex-1 flex-col gap-4 self-end" style={{ height: '464px' }}>
          {/* Key Metrics */}
          <div>
            <KeyMetrics sessions={allSessions} />
          </div>

          {/* Recent Sessions */}
          <div className="flex-1 min-h-0">
            <RecentSessions sessions={allSessions} />
          </div>
        </div>

        {/* Alert Feed */}
        <div className="-mt-16 w-64 self-end" style={{ height: '464px' }}>
          <AlertFeed />
        </div>

      </div>

      {/* Toolbar */}
      <SessionsToolbar />

      {/* Sessions table */}
      {hasNoResults ? (
        <div className="rounded-md border bg-white p-10 text-center text-slate-400">
          No results match your filters.
        </div>
      ) : (
        <SessionsTable
          sessions={sessions}
          sortKey={filters.sortKey || 'createdAt'}
          sortDir={filters.sortDir || 'desc'}
        />
      )}

      {/* Pagination */}
      {!hasNoSessions && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={filters.pageSize || 5}
          totalItems={totalSessions}
        />
      )}
    </>
  );
}
