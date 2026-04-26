/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEstimationBoardData } from './useEstimationBoardData';
import type { EstimationBoardDataProvider, EstimationBoardItem } from '../types';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';

// ── Fake provider helpers ──────────────────────────────────────────────────────

const STORY: EstimationBoardItem = {
  ObjectID: 101,
  FormattedID: 'US101',
  Name: 'Add login page',
  PlanEstimate: 3,
  _type: 'hierarchicalrequirement',
  Blocked: false,
  Ready: true,
  Owner: { _ref: '/user/1', _refObjectName: 'Alice', ObjectID: 1 },
};

const DEFECT: EstimationBoardItem = {
  ObjectID: 202,
  FormattedID: 'DE202',
  Name: 'Crash on submit',
  PlanEstimate: null,
  _type: 'defect',
  Blocked: true,
  Ready: false,
  Owner: null,
};

const DEFAULT_TYPES: ArtifactTypeKey[] = ['hierarchicalrequirement', 'defect'];

function makeProvider(
  items: EstimationBoardItem[] = [STORY, DEFECT],
): EstimationBoardDataProvider {
  return {
    fetchItems: vi.fn().mockResolvedValue(items),
    updateItem: vi.fn().mockResolvedValue(undefined),
  };
}

function makeErrorProvider(message = 'Timeout'): EstimationBoardDataProvider {
  return {
    fetchItems: vi.fn().mockRejectedValue(new Error(message)),
    updateItem: vi.fn().mockResolvedValue(undefined),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useEstimationBoardData', () => {
  it('starts in loading state with no items', () => {
    const provider = makeProvider();
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('loads items from the provider and clears loading', async () => {
    const provider = makeProvider();
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].FormattedID).toBe('US101');
    expect(result.current.items[1].PlanEstimate).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('passes types and extraQuery through to fetchItems', async () => {
    const provider = makeProvider();
    const types: ArtifactTypeKey[] = ['hierarchicalrequirement'];
    renderHook(() =>
      useEstimationBoardData(provider, types, '(Blocked = true)'),
    );

    await waitFor(() =>
      expect(provider.fetchItems).toHaveBeenCalledWith(
        ['hierarchicalrequirement'],
        '(Blocked = true)',
      ),
    );
  });

  it('passes null extraQuery when no filter is set', async () => {
    const provider = makeProvider();
    renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() =>
      expect(provider.fetchItems).toHaveBeenCalledWith(DEFAULT_TYPES, null),
    );
  });

  it('surfaces errors from the provider and clears loading', async () => {
    const provider = makeErrorProvider('WSAPI unreachable');
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('WSAPI unreachable');
    expect(result.current.items).toHaveLength(0);
  });

  it('uses generic message for non-Error rejections', async () => {
    const provider: EstimationBoardDataProvider = {
      fetchItems: vi.fn().mockRejectedValue('string error'),
      updateItem: vi.fn(),
    };
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load items');
  });

  it('refresh() triggers a second fetchItems call', async () => {
    const provider = makeProvider();
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(provider.fetchItems).toHaveBeenCalledTimes(1);

    act(() => { result.current.refresh(); });

    await waitFor(() => expect(provider.fetchItems).toHaveBeenCalledTimes(2));
  });

  it('refresh() clears a prior error on successful retry', async () => {
    let callCount = 0;
    const provider: EstimationBoardDataProvider = {
      fetchItems: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('first fail'));
        return Promise.resolve([STORY]);
      }),
      updateItem: vi.fn(),
    };

    const { result } = renderHook(() =>
      useEstimationBoardData(provider, DEFAULT_TYPES, null),
    );

    await waitFor(() => expect(result.current.error).toBe('first fail'));

    act(() => { result.current.refresh(); });

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.items).toHaveLength(1);
  });

  it('re-fetches when types array changes (via serialized key)', async () => {
    const provider = makeProvider();
    let types: ArtifactTypeKey[] = ['hierarchicalrequirement'];
    const { result, rerender } = renderHook(() =>
      useEstimationBoardData(provider, types, null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(provider.fetchItems).toHaveBeenCalledTimes(1);

    types = ['hierarchicalrequirement', 'defect'];
    rerender();

    await waitFor(() => expect(provider.fetchItems).toHaveBeenCalledTimes(2));
  });

  it('preserves Blocked and Ready fields from provider results', async () => {
    const provider = makeProvider([DEFECT]);
    const { result } = renderHook(() =>
      useEstimationBoardData(provider, ['defect'], null),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items[0].Blocked).toBe(true);
    expect(result.current.items[0].Ready).toBe(false);
  });
});
