import { Outlet } from 'react-router-dom';

import { SidebarInset,SidebarProvider } from '@/components/ui/sidebar';

import { AppSidebar } from '../sidebar/AppSidebar';

import { CustomSidebarTrigger } from './CustomSidebarTrigger';

const PrivateLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 p-2">
          <CustomSidebarTrigger />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PrivateLayout;
