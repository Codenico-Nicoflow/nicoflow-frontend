import { useCallback, useEffect, useState } from 'react';

import { useAppUser, useSubscribePushMutation, useUnsubscribePushMutation } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';

import { enableDesktopNotifications } from '../desktop/useDesktopNotification';

import {
  createPushSubscription,
  isPushSupported,
  registerServiceWorker,
  removePushSubscription,
  toSubscribePayload,
} from './pushSupport';

// The outcome of a subscribe attempt, so the UI can react precisely: an upgrade
// prompt for free users, a permission hint when the browser blocks it, a toast on
// a real failure — never a generic error for an expected gate.
export type PushEnableResult = 'subscribed' | 'needs-upgrade' | 'permission-denied' | 'unsupported' | 'error';

export interface UsePushSubscription {
  supported: boolean;
  enabled: boolean;
  busy: boolean;
  enable: () => Promise<PushEnableResult>;
  disable: () => Promise<void>;
}

// usePushSubscription owns the tab-closed Web Push toggle: capability + Pro gate,
// OS permission, service-worker registration, PushManager subscribe, and the
// backend sync. `enabled` reflects whether a live browser subscription exists.
export const usePushSubscription = (): UsePushSubscription => {
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;
  const supported = isPushSupported();

  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(supported);
  const [subscribePush, { isLoading: isSubscribing }] = useSubscribePushMutation();
  const [unsubscribePush, { isLoading: isUnsubscribing }] = useUnsubscribePushMutation();

  // Reflect the actual browser subscription on mount, so a returning user sees the
  // toggle in its real state rather than a default-off flash. Use getRegistration
  // (resolves immediately — undefined when none) NOT serviceWorker.ready, which
  // never resolves until some worker is registered: we register sw.js lazily on
  // subscribe, so a Pro user who never subscribed would otherwise hang here with the
  // toggle stuck disabled.
  useEffect(() => {
    if (!supported) {
      setChecking(false);
      return;
    }
    let active = true;
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then(reg => reg?.pushManager.getSubscription())
      .then(sub => {
        if (active) setEnabled(Boolean(sub));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [supported]);

  const enable = useCallback(async (): Promise<PushEnableResult> => {
    if (!supported) return 'unsupported';
    // Pro gate FIRST — never request permission or create a subscription for a free
    // user; the UI turns this into an upgrade prompt.
    if (!isPro) return 'needs-upgrade';

    const granted = await enableDesktopNotifications(true);
    if (!granted) return 'permission-denied';

    try {
      const registration = await registerServiceWorker();
      const sub = await createPushSubscription(registration);
      const payload = toSubscribePayload(sub);
      if (!payload) return 'error';
      await subscribePush(payload).unwrap();
      setEnabled(true);
      return 'subscribed';
    } catch {
      return 'error';
    }
  }, [supported, isPro, subscribePush]);

  const disable = useCallback(async (): Promise<void> => {
    try {
      const endpoint = await removePushSubscription();
      if (endpoint) await unsubscribePush({ endpoint }).unwrap();
    } catch {
      // Best-effort: even if the backend call fails, the local subscription is gone.
    } finally {
      setEnabled(false);
    }
  }, [unsubscribePush]);

  return {
    supported,
    enabled,
    busy: checking || isSubscribing || isUnsubscribing,
    enable,
    disable,
  };
};
