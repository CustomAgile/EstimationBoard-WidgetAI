/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import React from 'react';
import { RallyCard } from '@customagile/widget-ai/components/RallyCard';
import type { RallyCardItem } from '@customagile/widget-ai/components/RallyCard';
import type { EstimationBoardItem } from '../types';

// ── EstimationCard ─────────────────────────────────────────────────────

export interface EstimationCardProps {
  item: EstimationBoardItem;
  isDragging?: boolean;
  /** Toggle the Ready flag — wired to wsapiUpdate in live mode. */
  onToggleReady?: (item: EstimationBoardItem) => void;
  /** Toggle the Blocked flag — wired to wsapiUpdate in live mode. */
  onToggleBlocked?: (item: EstimationBoardItem) => void;
}

/**
 * Card renderer for the Estimation Board.
 *
 * Wraps the SDK's `<RallyCard>` component so cards match Rally's native
 * card design exactly — type icon, FormattedID link, name, owner avatar
 * (photo + initials fallback), Ready/Blocked buttons, and Blocked banner.
 *
 * The type-color left stripe is provided by `CardBoard` via `colorField="_typeColor"`.
 * Estimation-specific extras (e.g. size badge) are not rendered here because
 * the column header already communicates the estimate value.
 */
export function EstimationCard({
  item,
  onToggleReady,
  onToggleBlocked,
}: EstimationCardProps) {
  // EstimationBoardItem is structurally compatible with RallyCardItem —
  // both require ObjectID, FormattedID, Name, Owner, Blocked, BlockedReason,
  // Ready, PlanEstimate, DisplayColor.
  const rallyItem = item as unknown as RallyCardItem;

  return (
    <RallyCard
      item={rallyItem}
      onToggleReady={onToggleReady ? () => onToggleReady(item) : undefined}
      onToggleBlocked={onToggleBlocked ? () => onToggleBlocked(item) : undefined}
    />
  );
}
