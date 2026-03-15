'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Upload, Database, Settings, CircleQuestionMark, LayoutDashboard, Users, LayoutList, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUser, logoutUser } from '@/lib/auth';


export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getUser().then((u) => {
      if (u) setUserEmail(u.signInDetails?.loginId ?? null);
    });
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push('/login');
  }

  const initial = userEmail?.[0]?.toUpperCase() ?? '?';

  function isActive(path: string) {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  }

  function navClass(path: string) {
    return `flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] rounded-lg mx-2 transition-colors ${
      isActive(path)
        ? 'bg-gray-bar font-bold text-white'
        : 'text-white hover:bg-gray-bar hover:text-white'
    }`;
  }

  function iconStroke(path: string) {
    return isActive(path) ? 2 : 1;
  }

  return (
    <aside className="w-20 bg-gray-bg border-r border-slate-200 flex flex-col shrink-0">

      {/* Brand */}
      <div className="px-2 pt-3 pb-2">
        <div className="flex items-center justify-center">
          <Link href="/"><img src="/favicon.ico" alt="lito.ai" className="w-7 h-7 border" /></Link>
        </div>
        <div className='text-white text-center text-[10px]'>lito.ai</div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 py-2 flex-1">
        <Link href="/" className={navClass('/')}><LayoutDashboard size={16} strokeWidth={iconStroke('/')} /> Dashboard</Link>
        <Link href="/upload" className={navClass('/upload')}><Upload size={16} strokeWidth={iconStroke('/upload')} /> Upload</Link>
        <Link href="/portfolio" className={navClass('/portfolio')}><LayoutList size={16} strokeWidth={iconStroke('/portfolio')} /> Portfolio</Link>
        <Link href="/library" className={navClass('/library')}><Database size={16} strokeWidth={iconStroke('/library')} /> Library</Link>

        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 mx-2 rounded-lg text-white hover:bg-gray-bar transition-colors outline-none">
              <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600">{initial}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="w-52 mb-1 ml-3 bg-gray-bg border-slate-400 border">
            <DropdownMenuLabel className="text-xs text-white font-normal truncate">{userEmail ?? 'Account'}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="text-white focus:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="text-white focus:text-white">
                <CircleQuestionMark className="w-4 h-4 mr-2" />
                Get Help
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team" className="text-white focus:text-white">
                <Users className="w-4 h-4 mr-2" />
                Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem onClick={handleLogout} className="text-white cursor-pointer focus:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

    </aside>
  );
}
