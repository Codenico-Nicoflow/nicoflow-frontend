import { Outlet } from 'react-router-dom';

import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/useMobile';

import { CustomSidebarTrigger } from './CustomSidebarTrigger';
import QuickAddButton from './QuickAddButton';

const PrivateLayout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <CustomSidebarTrigger />
        <div className={isMobile ? 'flex-1 p-4 pt-20' : 'flex-1 p-4'}>
          <Outlet />
        </div>
        <QuickAddButton />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PrivateLayout;
