/// <reference types="vite/client" />

interface ImportMetaEnv {
  // REST API base, e.g. http://localhost:8080/v1. Also the WS-URL fallback source.
  readonly VITE_API_URL?: string;
  // Optional explicit WebSocket URL override (host differs from the REST API).
  readonly VITE_WS_URL?: string;
  // VAPID public key (base64url) for PushManager.subscribe. Absent ⇒ Web Push is
  // unavailable and the tab-closed toggle stays off (mirrors the backend no-op).
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  import React from 'react';

  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module '*.svg?react' {
  import React from 'react';

  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
