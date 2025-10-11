import React, { lazy, Suspense, useMemo } from 'react';

import { ICON_IMPORTS,type IconId } from '@my-monorepo/utils';

interface LazyIconProps {
  iconId: IconId;
  className?: string;
}

// Cache for lazy components to prevent recreation on every render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconCache = new Map<IconId, React.LazyExoticComponent<React.ComponentType<any>>>();

export const LazyIcon: React.FC<LazyIconProps> = ({ iconId, className }) => {
  const LazyIconComponent = useMemo(() => {
    // Check if we already have this icon cached
    if (iconCache.has(iconId)) {
      return iconCache.get(iconId)!;
    }

    // Create new lazy component and cache it
    const lazyComponent = lazy(() =>
      ICON_IMPORTS[iconId]().then(module => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        default: (props: any) => <module.default {...props} />,
      }))
    );

    iconCache.set(iconId, lazyComponent);
    return lazyComponent;
  }, [iconId]);

  return (
    <Suspense fallback={<div className="w-6 h-6 bg-gray-200 rounded" />}>
      <LazyIconComponent className={className} />
    </Suspense>
  );
};
