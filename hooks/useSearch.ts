/**
 * useSearch Hook
 *
 * A custom hook for managing search state with debouncing.
 * Provides loading state, results management, and cleanup.
 *
 * Features:
 * - Debounced search query (configurable delay)
 * - Loading state during search
 * - Results state management
 * - Automatic cleanup on unmount
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSearchOptions<T> {
  /** Search function that takes a query and returns results */
  searchFn: (query: string) => T[];
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Minimum characters required before searching (default: 0) */
  minChars?: number;
  /** Initial results to show when search is empty */
  initialResults?: T[];
}

interface UseSearchResult<T> {
  /** Current search query (immediate) */
  query: string;
  /** Debounced search query (after delay) */
  debouncedQuery: string;
  /** Whether search is currently in progress */
  isSearching: boolean;
  /** Search results */
  results: T[];
  /** Whether there are results */
  hasResults: boolean;
  /** Whether search query is empty */
  isEmpty: boolean;
  /** Update the search query */
  setQuery: (query: string) => void;
  /** Clear the search */
  clearSearch: () => void;
}

export function useSearch<T>({
  searchFn,
  debounceMs = 300,
  minChars = 0,
  initialResults = [],
}: UseSearchOptions<T>): UseSearchResult<T> {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<T[]>(initialResults);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < minChars) {
      setResults(initialResults);
      return;
    }

    setIsSearching(true);

    // Execute search synchronously (SQLite queries are sync)
    try {
      const searchResults = searchFn(debouncedQuery);
      if (isMountedRef.current) {
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (isMountedRef.current) {
        setResults([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [debouncedQuery, searchFn, minChars, initialResults]);

  // Update query with debouncing
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If query is empty, update immediately
      if (newQuery.length === 0) {
        setDebouncedQuery('');
        setResults(initialResults);
        setIsSearching(false);
        return;
      }

      // Show searching state immediately
      setIsSearching(true);

      // Debounce the actual search
      debounceTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setDebouncedQuery(newQuery);
        }
      }, debounceMs);
    },
    [debounceMs, initialResults]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setResults(initialResults);
    setIsSearching(false);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [initialResults]);

  return {
    query,
    debouncedQuery,
    isSearching,
    results,
    hasResults: results.length > 0,
    isEmpty: query.length === 0,
    setQuery,
    clearSearch,
  };
}

/**
 * useFilter Hook
 *
 * A simpler hook for managing filter state (no debouncing needed).
 */
interface UseFilterOptions<T> {
  /** Function to get items for a specific filter ID (null for all) */
  getItemsFn: (filterId: string | null) => T[];
  /** Initial items to show */
  initialItems?: T[];
}

interface UseFilterResult<T> {
  /** Currently selected filter ID (null = all) */
  selectedId: string | null;
  /** Filtered items */
  items: T[];
  /** Whether filter is active (not "All") */
  isFiltered: boolean;
  /** Set the selected filter */
  setSelectedId: (id: string | null) => void;
  /** Reset to show all */
  clearFilter: () => void;
}

export function useFilter<T>({
  getItemsFn,
  initialItems = [],
}: UseFilterOptions<T>): UseFilterResult<T> {
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>(initialItems);

  // Update items when filter changes
  useEffect(() => {
    try {
      const filteredItems = getItemsFn(selectedId);
      setItems(filteredItems);
    } catch (error) {
      console.error('Filter error:', error);
      setItems([]);
    }
  }, [selectedId, getItemsFn]);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedIdState(null);
  }, []);

  return {
    selectedId,
    items,
    isFiltered: selectedId !== null,
    setSelectedId,
    clearFilter,
  };
}

export default useSearch;
