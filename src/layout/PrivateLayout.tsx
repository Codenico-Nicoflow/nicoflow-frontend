import { useEffect, useState } from 'react';

import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/features/BottomNav';
import { Rail } from '@/features/Rail';
import { SearchCommand } from '@/features/Search';
import { Topbar } from '@/features/Topbar';
import { useIsMobile } from '@/hooks';
import { cn } from '@/lib/utils';

import QuickAddButton from './QuickAddButton';

const PrivateLayout = () => {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

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
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Rail />}
        <main className={cn('flex-1 overflow-y-auto p-4', isMobile && 'pb-20')}>
          <Outlet />
        </main>
      </div>
      {isMobile && <BottomNav />}
      <QuickAddButton />
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default PrivateLayout;
