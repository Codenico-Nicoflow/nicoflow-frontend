import { afterEach, describe, expect, it } from 'vitest';

import { addRecentSearch, clearRecentSearches, getRecentSearches } from './recentSearches';

const STORAGE_KEY = 'nicoflow:recent-searches';

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe('getRecentSearches', () => {
  it('returns [] when storage is empty', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('returns [] when storage value is corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(getRecentSearches()).toEqual([]);
  });

  it('returns [] when stored value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(getRecentSearches()).toEqual([]);
  });

  it('filters out non-string items from a mixed array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['term', 42, null, 'other']));
    expect(getRecentSearches()).toEqual(['term', 'other']);
  });
});

describe('addRecentSearch', () => {
  it('adds a term to an empty list', () => {
    addRecentSearch('alpha');
    expect(getRecentSearches()).toEqual(['alpha']);
  });

  it('newest term appears first', () => {
    addRecentSearch('first');
    addRecentSearch('second');
    expect(getRecentSearches()[0]).toBe('second');
  });

  it('deduplicates: re-adding an existing term moves it to the front', () => {
    addRecentSearch('a');
    addRecentSearch('b');
    addRecentSearch('c');
    addRecentSearch('a');
    const recent = getRecentSearches();
    expect(recent[0]).toBe('a');
    expect(recent.filter(t => t === 'a')).toHaveLength(1);
  });

  it('caps the list at 5 entries', () => {
    ['one', 'two', 'three', 'four', 'five', 'six'].forEach(t => addRecentSearch(t));
    expect(getRecentSearches()).toHaveLength(5);
  });

  it('drops the oldest entry when the cap is exceeded', () => {
    ['one', 'two', 'three', 'four', 'five', 'six'].forEach(t => addRecentSearch(t));
    expect(getRecentSearches()).not.toContain('one');
  });

  it('ignores blank / whitespace-only terms', () => {
    addRecentSearch('   ');
    expect(getRecentSearches()).toEqual([]);
  });
});

describe('clearRecentSearches', () => {
  it('empties the list', () => {
    addRecentSearch('x');
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });
});
