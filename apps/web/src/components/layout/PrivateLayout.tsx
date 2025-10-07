import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
