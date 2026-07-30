import { useAppUser } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';

/**
 * Plan read from the auth state, matching the backend's JWT claim.
 *
 * UI-only: every Pro rule is enforced server-side, so this decides what to
 * render (teasers, lock affordances), never what a user is allowed to do. A
 * missing user is treated as not-Pro so nothing leaks before the session
 * restores.
 */
export const useIsPro = (): boolean => useAppUser()?.status === USER_STATUS.PREMIUM;
