import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import SidebarHeader from './SidebarHeader';
import SidebarFooterComponent from './footer/SidebarFooter';
import { QuickAccess } from './quick-access/QuickAccess';
import Categories from './categories/categories';
import { useIsMobile } from '@/hooks/useMobile';

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === 'collapsed';

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-gradient-to-b from-background to-muted/10">
      {!isCollapsed && <SidebarHeader />}

      <SidebarContent className="p-2 space-y-4" onClick={handleMobileClick}>
        <QuickAccess />
        <Categories />
      </SidebarContent>

      <SidebarFooter onClick={handleMobileClick}>
        <SidebarFooterComponent />
      </SidebarFooter>
    </Sidebar>
  );
}
