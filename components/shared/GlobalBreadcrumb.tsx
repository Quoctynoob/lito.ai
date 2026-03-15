'use client';

import { usePathname } from 'next/navigation';
import { House, Upload, ClipboardList, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type CrumbMeta = { label: string; icon?: React.ReactNode };

const SEGMENT_META: Record<string, CrumbMeta> = {
  'upload':         { label: 'Upload',           icon: <Upload className="w-3.5 h-3.5" /> },
  'results':        { label: 'Report',           icon: <ClipboardList className="w-3.5 h-3.5" /> },
};

const HOME: CrumbMeta = { label: 'All Projects', icon: <House className="w-3.5 h-3.5" /> };

function CrumbContent({ label, icon }: CrumbMeta) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  );
}

export default function GlobalBreadcrumb() {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const segments = pathname.split('/').filter(Boolean);

  const crumbs: (CrumbMeta & { href: string })[] = [
    { ...HOME, href: '/' },
    ...segments.map((seg, i) => ({
      ...(SEGMENT_META[seg] ?? { label: seg }),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <div className="flex items-center justify-between mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <BreadcrumbItem key={crumb.href}>
                {isLast ? (
                  <BreadcrumbPage><CrumbContent label={crumb.label} icon={crumb.icon} /></BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}><CrumbContent label={crumb.label} icon={crumb.icon} /></BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          }).reduce<React.ReactNode[]>((acc, item, i) => {
            if (i === 0) return [item];
            return [...acc, <BreadcrumbSeparator key={`sep-${i}`} />, item];
          }, [])}
        </BreadcrumbList>
      </Breadcrumb>

      <div
        className="flex items-center w-80 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 gap-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the app..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
        />
        <kbd className="shrink-0 inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
