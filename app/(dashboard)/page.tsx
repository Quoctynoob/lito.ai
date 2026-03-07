'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, LogOut } from 'lucide-react';
import { getUser, logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type Session = {
  id: string;
  createdAt: string;
  intake: { startupName: string; industry: string; fundingStage: string };
  confidence: number;
  riskLevel: string;
};

const RISK_COLORS: Record<string, string> = {
  Low:    'bg-green-50 text-green-700 border border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  High:   'bg-red-50 text-red-700 border border-red-200',
};

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('litoAi_sessions');
    if (stored) setSessions(JSON.parse(stored));

    // Get logged in user
    getUser().then((u) => {
      if (u) setUserEmail(u.signInDetails?.loginId ?? null);
    });
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push('/login');
  }

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
              <p className="mt-1 text-sm text-slate-500">Signed in as <span className="font-medium text-slate-700">{userEmail}</span></p>
            )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">Recent Research</h3>
        <Link href="/project-intake"><Button><Plus />New Projects</Button></Link>
      </div>

      {/* Sessions table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Startup Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                  No research yet. Click "New Projects" to get started.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.intake.startupName}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.industry}</TableCell>
                  <TableCell className="text-slate-500">{s.intake.fundingStage}</TableCell>
                  <TableCell className="font-semibold">{s.confidence}%</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RISK_COLORS[s.riskLevel] ?? RISK_COLORS.Medium}`}>
                      {s.riskLevel}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/results?id=${s.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}