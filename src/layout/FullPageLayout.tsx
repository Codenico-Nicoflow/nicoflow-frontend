import { Outlet } from 'react-router-dom';

import { LiveUpdates } from '@/lib/realtime';

// Auth-gated but chrome-free: no Topbar/Rail/BottomNav, for routes that own the full viewport (e.g. /notes/:id).
const FullPageLayout = () => (
  <div className="h-dvh overflow-y-auto">
    <LiveUpdates />
    <Outlet />
  </div>
);

export default FullPageLayout;
