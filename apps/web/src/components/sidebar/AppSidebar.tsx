import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from '@/components/ui/sidebar';

import Categories from './categories/categories';
import SidebarFooterComponent from './footer/SidebarFooter';
import { QuickAccess } from './quick-access/QuickAccess';
import SidebarHeader from './SidebarHeader';

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-gradient-to-b from-background to-muted/10">
      {!isCollapsed && <SidebarHeader />}

      <SidebarContent className="p-2 space-y-4">
        <QuickAccess />
        <Categories />
      </SidebarContent>

      <SidebarFooter>
        <SidebarFooterComponent />
      </SidebarFooter>
    </Sidebar>
  );
}
