import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import Areas from '@/features/Sidebar/Areas/components/Areas';

import { SidebarFooter as SidebarFooterComponent } from '../../Footer';
import { QuickAccess } from '../../QuickAccess';
import SidebarHeader from '../SidebarHeader';

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-gradient-to-b from-background to-muted/10">
      {!isCollapsed && <SidebarHeader />}

      <SidebarContent className="p-2 space-y-4">
        <QuickAccess />
        <Areas />
      </SidebarContent>

      <SidebarFooter>
        <SidebarFooterComponent />
      </SidebarFooter>
    </Sidebar>
  );
}
