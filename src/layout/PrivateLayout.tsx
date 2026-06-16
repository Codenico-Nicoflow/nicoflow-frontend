import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/features/BottomNav';
import { Rail } from '@/features/Rail';
import { Topbar } from '@/features/Topbar';
import { useIsMobile } from '@/hooks';
import { cn } from '@/lib/utils';

import QuickAddButton from './QuickAddButton';

const PrivateLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Rail />}
        <main className={cn('flex-1 overflow-y-auto p-4', isMobile && 'pb-20')}>
          <Outlet />
        </main>
      </div>
      {isMobile && <BottomNav />}
      <QuickAddButton />
    </div>
  );
};

export default PrivateLayout;
