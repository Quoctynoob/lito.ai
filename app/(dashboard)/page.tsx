'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  LogOut,
  ArrowUpDown,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FolderCode,
} from 'lucide-react';
import { getUser, logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type Session = {
  id: string;
  createdAt: string;
  intake: {
    company: string;
    industry: string;
    fundingStage: string;
    primaryRegion?: string;
    revenueModel?: string;
    decision?: string;
    status?: string;
  };
  confidence: number;
  riskLevel: string;
};

const RISK_COLORS: Record<string, string> = {
  Low:    'bg-green-50 text-green-700 border border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  High:   'bg-red-50 text-red-700 border border-red-200',
};

type SortKey = 'industry' | 'confidence' | 'createdAt';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [5, 10, 20, 30];
const COLS = 11;

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('litoAi_sessions');
    if (stored) setSessions(JSON.parse(stored));

    getUser().then((u) => {
      if (u) setUserEmail(u.signInDetails?.loginId ?? null);
    });
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push('/login');
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleRiskChange(val: string) {
    setRiskFilter(val);
    setPage(1);
  }

  function handlePageSizeChange(val: string) {
    setPageSize(Number(val));
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = [...sessions];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.intake.company.toLowerCase().includes(q) ||
          s.intake.industry.toLowerCase().includes(q),
      );
    }
    if (riskFilter !== 'all') {
      rows = rows.filter((s) => s.riskLevel === riskFilter);
    }
    rows.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === 'industry') { av = a.intake.industry; bv = b.intake.industry; }
      else if (sortKey === 'confidence') { av = a.confidence; bv = b.confidence; }
      else { av = a.createdAt; bv = b.createdAt; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [sessions, search, riskFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {/* Heading */}
      <div className="mb-6 flex items-start justify-between">
        <h1 className="m-0 text-[22px] font-bold text-slate-900">Recent Research</h1>
        <div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5 text-slate-600">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          {userEmail && (
            <p className="mt-1 text-sm text-slate-500">
              Signed in as <span className="font-medium text-slate-700">{userEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by startup name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={riskFilter} onValueChange={handleRiskChange}>
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/project-intake">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Sessions table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('industry')}>
                  Industry <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
                </Button>
              </TableHead>
              <TableHead>Primary Region</TableHead>
              <TableHead>Revenue Model</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('confidence')}>
                  AI Confidence <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
                </Button>
              </TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => toggleSort('createdAt')}>
                  Last Updated <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
                </Button>
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLS} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <span className='bg-slate-100 p-3 rounded-md inline-flex'><FolderCode className="w-5 h-5 text-slate-800" /></span>
                    <h1 className="text-base font-semibold text-slate-800">No Projects Yet</h1>
                    <div className='text-gray-500 text-sm'>Import your first pitch deck to get started</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLS} className="text-center text-slate-400 py-10">
                  No results match your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.intake.company}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.fundingStage}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.industry}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.primaryRegion ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.revenueModel ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RISK_COLORS[s.riskLevel] ?? RISK_COLORS.Medium}`}>
                      {s.riskLevel}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{s.confidence}%</TableCell>
                  <TableCell className="text-slate-500">{s.intake.decision ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.status ?? '—'}</TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/results?id=${s.id}`}>View</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
