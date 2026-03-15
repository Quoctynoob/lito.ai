import { getSessions } from '@/lib/actions/sessions';
import { filterAndSortSessions, parseSearchParams } from '@/lib/session-utils';
import { SessionsToolbar } from '@/components/sessions/sessions-toolbar';
import { SessionsTable } from '@/components/sessions/sessions-table';
import { PaginationControls } from '@/components/sessions/pagination-controls';
import { PipelineBar } from '@/components/dashboard/pipeline-bar';
import { AlertFeed } from '@/components/dashboard/alert-feed';

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

          {/* Main Graph + Stat A / Stat B */}
          <div className="flex h-80 gap-4">
            <div className="flex h-full flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Main Graph</span>
            </div>
            <div className="flex h-full w-40 flex-col gap-4">
              <div className="flex flex-1 items-center justify-center rounded-lg bg-slate-200">
                <span className="text-sm font-medium text-slate-500">Stat A</span>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg bg-slate-200">
                <span className="text-sm font-medium text-slate-500">Stat B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle area */}
        <div className="-mt-16 flex flex-1 flex-col gap-4">
          {/* Metric 1 / 2 / 3 */}
          <div className="mt-auto flex gap-3">
            <div className="flex h-32 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Metric 1</span>
            </div>
            <div className="flex h-32 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Metric 2</span>
            </div>
            <div className="flex h-32 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Metric 3</span>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="flex h-32 w-full items-center justify-center rounded-lg bg-slate-200">
            <span className="text-sm font-medium text-slate-500">Summary Bar</span>
          </div>

          {/* Tag 1 / 2 / 3 */}
          <div className="flex gap-3">
            <div className="flex h-44 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Tag 1</span>
            </div>
            <div className="flex h-44 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Tag 2</span>
            </div>
            <div className="flex h-44 flex-1 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-sm font-medium text-slate-500">Tag 3</span>
            </div>
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
