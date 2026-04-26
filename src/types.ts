/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import type { WidgetSettings } from '@customagile/widget-ai/components/settings';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';

// ── Estimation Board data shape ────────────────────────────────────────

/** A single artifact displayed on the Estimation Board. */
export interface EstimationBoardItem {
  ObjectID: number;
  FormattedID: string;
  Name: string;
  /** Numeric plan estimate; null = "No Estimate" column */
  PlanEstimate: number | null;
  /** The artifact type key (lowercase WSAPI path) */
  _type: string;
  Blocked?: boolean;
  BlockedReason?: string;
  Ready?: boolean;
  Owner?: {
    _ref: string;
    _refObjectName: string;
    ObjectID?: number;
  } | null;
  DisplayColor?: string;
  /** Swim-lane field value (string, object ref, or boolean) */
  [key: string]: unknown;
}

// ── Column size definition ────────────────────────────────────────────

/** One column on the board (e.g. { text: "XS", value: 1 }). */
export interface EstimationSize {
  /** Column header label */
  text: string;
  /** PlanEstimate value (null for "No Estimate") */
  value: number | null;
}

// ── App settings ────────────────────────────────────────────────────

/**
 * Settings persisted by the Estimation Board.
 * Extends WidgetSettings (open index signature — no theme field).
 */
export interface EstimationBoardSettings extends WidgetSettings {
  /** JSON-encoded EstimationSize[] — the column definitions */
  sizes: string;
  /** Whether swim-lane grouping is enabled */
  showRows: boolean;
  /** Field used for swim-lane grouping (when showRows=true) */
  rowsField: string;
  /** Artifact types to show on the board */
  types: ArtifactTypeKey[];
  /** Optional user-defined WSAPI query filter */
  query: string;
}

// ── DataProvider interface ────────────────────────────────────────────

export interface EstimationBoardDataProvider {
  /**
   * Fetch items of the given types for the current project scope.
   * @param types  Array of WSAPI type keys
   * @param extraQuery  Optional additional WSAPI query filter string
   */
  fetchItems(
    types: ArtifactTypeKey[],
    extraQuery: string | null,
  ): Promise<EstimationBoardItem[]>;

  /**
   * Update a single field on an artifact (e.g. move card to new PlanEstimate column).
   * @param type  Lowercase WSAPI type key
   * @param oid   ObjectID of the artifact
   * @param fields  Partial field map to update
   */
  updateItem(
    type: ArtifactTypeKey,
    oid: number,
    fields: Record<string, unknown>,
  ): Promise<void>;
}
