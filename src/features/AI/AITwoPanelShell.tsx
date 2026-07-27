import { useState } from 'react';

import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks';

import { AIDisabledBanner } from './components/QuotaIndicator/AIDisabledBanner';
import { QuotaIndicator } from './components/QuotaIndicator/QuotaIndicator';
import { AIChatPanel } from './AIChatPanel';
import { AISessionList } from './AISessionList';
import { useAIQuota } from './hooks';

interface AITwoPanelShellProps {
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDeleted?: (id: string) => void;
  isCreating?: boolean;
}

// Two-panel layout: a fixed 280px conversation list beside the flex chat area on
// desktop; on mobile the chat is the default view and the list lives in a
// left-side drawer opened from the header. Selecting a session on mobile closes
// the drawer so the chat is immediately visible.
export const AITwoPanelShell = ({
  activeId,
  onSelect,
  onCreate,
  onDeleted,
  isCreating = false,
}: AITwoPanelShellProps) => {
  const { t } = useTranslation('ai');
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { quota, isLoading: quotaLoading, featureDisabled } = useAIQuota();

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
  };

  const handleCreate = () => {
    onCreate();
    setDrawerOpen(false);
  };

  // Assistant off server-side (AI_UNAVAILABLE): replace the whole surface — there
  // are no sessions to list and nothing to send. Renders instead of crashing.
  if (featureDisabled) return <AIDisabledBanner />;

  if (isMobile) {
    return (
      <div className="flex h-full flex-col" data-testid="ai-shell-mobile">
        <div className="flex items-center gap-2 border-b p-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('sessions.openList')} data-testid="ai-drawer-trigger">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{t('sessions.heading')}</SheetTitle>
              </SheetHeader>
              <AISessionList
                activeId={activeId}
                onSelect={handleSelect}
                onCreate={handleCreate}
                onDeleted={onDeleted}
                isCreating={isCreating}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold text-foreground">{t('page.heading')}</span>
        </div>
        <div className="min-h-0 flex-1">
          <AIChatPanel sessionId={activeId} />
        </div>
        {/* On mobile the rail is a drawer, so the quota footer anchors to the chat. */}
        <QuotaIndicator quota={quota} isLoading={quotaLoading} />
      </div>
    );
  }

  return (
    <div className="flex h-full" data-testid="ai-shell-desktop">
      <aside className="flex w-[280px] shrink-0 flex-col border-e">
        <div className="min-h-0 flex-1">
          <AISessionList
            activeId={activeId}
            onSelect={onSelect}
            onCreate={onCreate}
            onDeleted={onDeleted}
            isCreating={isCreating}
          />
        </div>
        <QuotaIndicator quota={quota} isLoading={quotaLoading} />
      </aside>
      <div className="min-w-0 flex-1">
        <AIChatPanel sessionId={activeId} />
      </div>
    </div>
  );
};
