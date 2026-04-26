/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';
import type { EstimationBoardDataProvider, EstimationBoardItem } from '../types';

export interface UseEstimationBoardDataResult {
  items: EstimationBoardItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetch estimation board items via the injected DataProvider.
 *
 * @param data      The DataProvider injected from main.tsx
 * @param types     Artifact type keys to fetch
 * @param extraQuery  Optional WSAPI query filter string
 */
export function useEstimationBoardData(
  data: EstimationBoardDataProvider,
  types: ArtifactTypeKey[],
  extraQuery: string | null,
): UseEstimationBoardDataResult {
  const [items, setItems] = useState<EstimationBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Stable serialized keys so useEffect deps stay stable
  const typesKey = useMemo(() => types.slice().sort().join(','), [types]);
  const queryKey = extraQuery ?? '';

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    data
      .fetchItems(types, extraQuery)
      .then((results) => {
        if (!cancelled) {
          setItems(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load items');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, typesKey, queryKey, tick]);

  return { items, loading, error, refresh };
}
