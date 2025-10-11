import { Outlet } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/useMobile';

import { AppSidebar } from '../sidebar/AppSidebar';

import { CustomSidebarTrigger } from './CustomSidebarTrigger';

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
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PrivateLayout;
