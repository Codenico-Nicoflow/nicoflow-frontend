import React, { lazy, Suspense, useMemo } from 'react';

import type { LucideIcon } from 'lucide-react';

import { ICON_IMPORTS, type IconId } from '@/lib/utils';

interface LazyIconProps {
  iconId: IconId;
  className?: string;
  style?: React.CSSProperties;
}

const iconCache = new Map<IconId, React.LazyExoticComponent<React.ComponentType<React.ComponentProps<LucideIcon>>>>();

export const LazyIcon: React.FC<LazyIconProps> = ({ iconId, className, style }) => {
  const LazyIconComponent = useMemo(() => {
    if (!iconId || !ICON_IMPORTS[iconId]) {
      console.error(`Invalid iconId: ${iconId}`);
      return null;
    }

    if (iconCache.has(iconId)) {
      return iconCache.get(iconId)!;
    }

    const iconImport = ICON_IMPORTS[iconId];
    if (!iconImport) {
      return null;
    }

    const lazyComponent = lazy(() =>
      iconImport().then(module => ({
        default: (props: React.ComponentProps<LucideIcon>) => <module.default {...props} />,
      }))
    );

    iconCache.set(iconId, lazyComponent);
    return lazyComponent;
  }, [iconId]);

  if (!LazyIconComponent) {
    return <div className="w-6 h-6 bg-muted rounded animate-pulse" />;
  }

  return (
    <Suspense fallback={<div className="w-6 h-6 bg-muted rounded animate-pulse" />}>
      <LazyIconComponent className={className} style={style} />
    </Suspense>
  );
};
