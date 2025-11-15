import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useTheme } from '../ThemeProvider';

export const Toaster = ({ 'data-testid': testId, ...props }: ToasterProps & { 'data-testid'?: string }) => {
  const { theme } = useTheme();

  return (
    <Sonner
      data-testid={testId || 'toaster'}
      theme={theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};
