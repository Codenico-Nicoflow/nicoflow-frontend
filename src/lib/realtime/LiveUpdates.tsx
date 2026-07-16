import { LiveUpdatesBanner } from './LiveUpdatesBanner';
import { useWebSocket } from './useWebSocket';

// LiveUpdates is the single mount point for the app's real-time connection: it runs
// the one WebSocket (for every logged-in user — WS is FREE) and renders the paused
// banner. Mounted once inside the private layout so exactly one socket exists.
export const LiveUpdates = () => {
  const { paused } = useWebSocket();
  return <LiveUpdatesBanner paused={paused} />;
};
