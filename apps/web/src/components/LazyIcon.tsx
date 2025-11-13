import React, { lazy, Suspense, useMemo } from 'react';

import type { LucideIcon } from 'lucide-react';

import { ICON_IMPORTS, type IconId } from '@my-monorepo/utils';

interface LazyIconProps {
  iconId: IconId;
  className?: string;
}

const iconCache = new Map<IconId, React.LazyExoticComponent<React.ComponentType<React.ComponentProps<LucideIcon>>>>();

export const LazyIcon: React.FC<LazyIconProps> = ({ iconId, className }) => {
  const LazyIconComponent = useMemo(() => {
    if (!iconId || !ICON_IMPORTS[iconId]) {
      console.error(`Invalid iconId: ${iconId}`);
      return null;
    }

    if (iconCache.has(iconId)) {
      return iconCache.get(iconId)!;
    }

    const lazyComponent = lazy(() =>
      ICON_IMPORTS[iconId]().then(module => ({
        default: (props: React.ComponentProps<LucideIcon>) => <module.default {...props} />,
      }))
    );

    iconCache.set(iconId, lazyComponent);
    return lazyComponent;
  }, [iconId]);

  if (!LazyIconComponent) {
    return <div className="w-6 h-6 bg-gray-200 rounded" />;
  }

  return (
    <Suspense fallback={<div className="w-6 h-6 bg-gray-300 rounded" />}>
      <LazyIconComponent className={className} />
    </Suspense>
  );
};
