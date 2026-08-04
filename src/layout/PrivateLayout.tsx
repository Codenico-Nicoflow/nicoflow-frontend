import { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/features/BottomNav';
import { Rail } from '@/features/Rail';
import { SearchCommand, useRecentSearches, useSearchNavigation } from '@/features/Search';
import { Topbar } from '@/features/Topbar';
import { useIsMobile } from '@/hooks';
import { LiveUpdates } from '@/lib/realtime';
import { cn } from '@/lib/utils';

import QuickAddButton from './QuickAddButton';

const PrivateLayout = () => {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  const { recent, record } = useRecentSearches();
  const navigate = useSearchNavigation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <Topbar onSearchOpen={() => setSearchOpen(true)} />
      <LiveUpdates />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Rail />}
        <main className={cn('flex-1 overflow-y-auto p-4', isMobile && 'pb-20')}>
          <Outlet />
        </main>
      </div>
      {isMobile && <BottomNav />}
      <QuickAddButton />
      <SearchCommand
        open={searchOpen}
        onOpenChange={setSearchOpen}
        recent={recent}
        onSelect={payload => {
          // Tasks and notes are titled; projects and areas are named.
          const term = payload.kind === 'task' || payload.kind === 'note' ? payload.item.title : payload.item.name;
          record(term);
          navigate(payload);
        }}
      />
    </div>
  );
};

export default PrivateLayout;
