'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';

export function SessionsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const riskFilter = searchParams.get('risk') || 'all';

  function updateSearchParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filter by startup name..."
            value={search}
            onChange={(e) => updateSearchParams('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskFilter} onValueChange={(val) => updateSearchParams('risk', val)}>
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
      <Link href="/upload">
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Add New Company
        </Button>
      </Link>
    </div>
  );
}
