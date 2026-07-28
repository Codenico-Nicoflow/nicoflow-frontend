import { useCallback, useState } from 'react';

const STORAGE_KEY = 'nicoflow-rail';

type RailState = {
  expanded: boolean;
  /** Ids of areas the user collapsed. Storing the *closed* set (not the open
   *  one) keeps "open" the default, so new areas appear expanded. */
  closedAreaIds: string[];
};

const DEFAULT_STATE: RailState = { expanded: false, closedAreaIds: [] };

// Rail width is device-shaped, not account-shaped — the same user wants a wide
// rail on a 27" display and icons on a laptop — so this stays in localStorage
// rather than syncing to the profile alongside theme/language.
const read = (): RailState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE;
    const { expanded, closedAreaIds } = parsed as Partial<RailState>;
    return {
      expanded: typeof expanded === 'boolean' ? expanded : DEFAULT_STATE.expanded,
      closedAreaIds: Array.isArray(closedAreaIds) ? closedAreaIds.filter(id => typeof id === 'string') : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
};

const write = (state: RailState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private-mode / quota failures must not break navigation.
  }
};

export const useRailState = () => {
  // Read in the initializer, not an effect: an effect would paint the collapsed
  // width first and then jump, which reads as a layout bug in persistent chrome.
  const [state, setState] = useState<RailState>(read);

  const toggleExpanded = useCallback(
    () =>
      setState(prev => {
        const next = { ...prev, expanded: !prev.expanded };
        write(next);
        return next;
      }),
    []
  );

  const toggleArea = useCallback(
    (areaId: string) =>
      setState(prev => {
        const closedAreaIds = prev.closedAreaIds.includes(areaId)
          ? prev.closedAreaIds.filter(id => id !== areaId)
          : [...prev.closedAreaIds, areaId];
        const next = { ...prev, closedAreaIds };
        write(next);
        return next;
      }),
    []
  );

  return { ...state, toggleExpanded, toggleArea };
};
