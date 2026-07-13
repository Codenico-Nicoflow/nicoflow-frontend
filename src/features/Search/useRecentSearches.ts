import { useCallback, useState } from 'react';

import { addRecentSearch, getRecentSearches } from './recentSearches';

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(getRecentSearches);

  const record = useCallback((term: string) => {
    addRecentSearch(term);
    setRecent(getRecentSearches());
  }, []);

  return { recent, record };
}
