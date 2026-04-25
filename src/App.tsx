/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import React, { useState, useMemo, useCallback } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';
import { CardBoard } from '@customagile/widget-ai/components/CardBoard';
import type { CardBoardColumn } from '@customagile/widget-ai/components/CardBoard';
import { AddNew } from '@customagile/widget-ai/components/AddNew';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
import { CheckboxGroup } from '@customagile/widget-ai/components/CheckboxGroup';
import type { CheckboxGroupOption } from '@customagile/widget-ai/components/CheckboxGroup';
import {
  useWidgetSettings,
  defineWidgetSettings,
} from '@customagile/widget-ai/components/settings';

import type { EstimationBoardDataProvider, EstimationBoardSettings, EstimationSize } from './types';
import { useEstimationBoardData } from './hooks/useEstimationBoardData';
import { EstimationCard } from './components/EstimationCard';
import { SizesEditor } from './components/SizesEditor';

// ── Type color stripe — token-aligned hex values ──────────────────────
// These match the palette in RallyCard's TYPE_INFO and the card tokens.
// Used as the `_typeColor` field fed to CardBoard's colorField prop.
const TYPE_COLOR: Record<string, string> = {
  hierarchicalrequirement: '#4a90d9',
  userstory:               '#4a90d9',
  defect:                  '#f44336',
  defectsuite:             '#e67e22',
  task:                    '#00a89d',
  testcase:                '#8dc63f',
};

function getTypeColor(type: string): string {
  return TYPE_COLOR[type.toLowerCase()] ?? '#6B7280';
}

// ── Constants ─────────────────────────────────────────────────────────

const DEFAULT_SIZES: EstimationSize[] = [
  { text: 'No Estimate', value: null },
  { text: 'XS', value: 1 },
  { text: 'S', value: 2 },
  { text: 'M', value: 3 },
  { text: 'L', value: 5 },
  { text: 'XL', value: 8 },
];

const DEFAULT_TYPES: ArtifactTypeKey[] = [
  'hierarchicalrequirement',
  'defect',
  'defectsuite',
];

const TYPE_OPTIONS: CheckboxGroupOption[] = [
  { value: 'hierarchicalrequirement', label: 'User Story' },
  { value: 'defect', label: 'Defect' },
  { value: 'defectsuite', label: 'Defect Suite' },
];

const SETTINGS_DEFAULTS = defineWidgetSettings<EstimationBoardSettings>({
  sizes: JSON.stringify(DEFAULT_SIZES),
  showRows: false,
  rowsField: '',
  types: DEFAULT_TYPES,
  query: '',
});

// ── Helpers ────────────────────────────────────────────────────────────

function parseSizes(raw: string): EstimationSize[] {
  try {
    const parsed = JSON.parse(raw) as EstimationSize[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* fall through */ }
  return DEFAULT_SIZES;
}

/** Convert EstimationSize[] → CardBoardColumn[] */
function sizesToColumns(sizes: EstimationSize[]): CardBoardColumn[] {
  return sizes.map((s) => ({
    value: s.value === null ? '' : String(s.value),
    label: s.text,
  }));
}

/**
 * Normalize PlanEstimate for CardBoard columnField comparison.
 * CardBoard compares item[columnField] as a string to column.value.
 * We store a computed string field '_planEstimateKey' for this purpose.
 */
function planEstimateKey(pe: number | null | undefined): string {
  if (pe === null || pe === undefined) return '';
  return String(pe);
}

// ── App component ──────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: EstimationBoardDataProvider;
}

export default function App({ rallyContext, data }: AppProps) {
  // ── Settings ───────────────────────────────────────────────────────
  const { settings, updateSetting, updateSettings } = useWidgetSettings<EstimationBoardSettings>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── Derived settings ───────────────────────────────────────────────
  const sizes = useMemo(() => parseSizes(settings.sizes), [settings.sizes]);
  const columns: CardBoardColumn[] = useMemo(() => sizesToColumns(sizes), [sizes]);
  const activeTypes = useMemo(
    () =>
      (settings.types ?? DEFAULT_TYPES).filter(
        (t): t is ArtifactTypeKey =>
          t === 'hierarchicalrequirement' || t === 'defect' || t === 'defectsuite',
      ),
    [settings.types],
  );

  // ── Data ───────────────────────────────────────────────────────────
  const extraQuery = settings.query || null;
  const { items, loading, error, refresh } = useEstimationBoardData(
    data,
    activeTypes,
    extraQuery,
  );

  // Augment items with the string key for CardBoard's columnField
  // and the type color hex for CardBoard's colorField (drives the left border stripe).
  const boardItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        _planEstimateKey: planEstimateKey(item.PlanEstimate),
        _typeColor: getTypeColor(item._type),
      })),
    [items],
  );

  // ── EditMode settings state (for SizesEditor) ──────────────────────
  const [draftSizes, setDraftSizes] = useState<EstimationSize[] | null>(null);
  const effectiveDraftSizes = draftSizes ?? sizes;

  // ── Event handlers ────────────────────────────────────────────────

  const handleCardMove = useCallback(
    async (
      item: (typeof boardItems)[number],
      _fromColumn: string,
      toColumn: string,
    ) => {
      const newValue = toColumn === '' ? null : Number(toColumn);
      await data.updateItem(item._type as ArtifactTypeKey, item.ObjectID, {
        PlanEstimate: newValue,
      });
      refresh();
    },
    [data, refresh],
  );

  const handleAddNewCreate = useCallback(() => {
    refresh();
  }, [refresh]);

  // ── EditMode render ────────────────────────────────────────────────

  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="Estimation Board"
        version="1.0.1"
        appSlug="estimation-board"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<EstimationBoardSettings>) => {
          if (draftSizes !== null) {
            updateSettings({
              ...dirty,
              sizes: JSON.stringify(draftSizes),
            });
            setDraftSizes(null);
          } else {
            updateSettings(dirty);
          }
        }}
        onClose={() => { /* Rally controls EditMode exit */ }}
      >
        {/* Columns (sizes) editor */}
        <SettingRow label="Columns" settingKey="sizes">
          <SizesEditor
            value={effectiveDraftSizes}
            onChange={(next) => setDraftSizes(next)}
          />
        </SettingRow>

        {/* Artifact types */}
        <SettingRow label="Artifact Types" settingKey="types">
          <CheckboxGroup
            legend="Types to show"
            options={TYPE_OPTIONS}
            value={activeTypes}
            onChange={(vals) =>
              updateSetting('types', vals as ArtifactTypeKey[])
            }
            orientation="horizontal"
          />
        </SettingRow>

        {/* Query filter */}
        <SettingRow label="Additional Filter" settingKey="query">
          <input
            type="text"
            value={settings.query}
            onChange={(e) => updateSetting('query', e.target.value)}
            placeholder='e.g. (Owner.UserName = "jsmith")'
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '4px 8px',
              fontSize: 'var(--ca-font-size-sm)',
              color: 'var(--ca-text-primary)',
              backgroundColor: 'var(--ca-surface-raised)',
              border: '1px solid var(--ca-border-default)',
              borderRadius: 'var(--ca-radius-xs)',
            }}
          />
        </SettingRow>
      </EditModePanel>
    );
  }

  // ── Normal view ────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--ca-font-family)',
        backgroundColor: 'var(--ca-surface-page)',
        color: 'var(--ca-text-primary)',
        overflow: 'hidden',
      }}
    >
      <AppHeader
        title="Estimation Board"
        help={{
          content: (
            <>
              <p>
                The Estimation Board groups user stories, defects, and defect suites by their
                Plan Estimate. Drag cards between columns to update estimates.
              </p>
              <p>
                Use Edit Mode to configure column sizes, artifact types, and optional filters.
              </p>
            </>
          ),
        }}
      />

      {/* AddNew bar */}
      <div style={{ padding: 'var(--ca-space-2) var(--ca-space-2) 0' }}>
        <AddNew
          recordTypes={activeTypes}
          collapseOnCreate
          onCreate={handleAddNewCreate}
        />
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            margin: 'var(--ca-space-2)',
            padding: 'var(--ca-space-2)',
            backgroundColor: 'var(--ca-status-red-bg)',
            color: 'var(--ca-status-red)',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          ⚠ Error loading items: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          aria-live="polite"
          aria-busy="true"
          style={{
            padding: 'var(--ca-space-4)',
            textAlign: 'center',
            color: 'var(--ca-text-secondary)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          Loading…
        </div>
      )}

      {/* Board */}
      {!loading && (
        <div style={{ flex: 1, overflow: 'hidden', padding: 'var(--ca-space-2)' }}>
          <CardBoard<(typeof boardItems)[number]>
            items={boardItems}
            columns={columns}
            columnField="_planEstimateKey"
            colorField="_typeColor"
            renderCard={(item, isDragging) => (
              <EstimationCard item={item} isDragging={isDragging} />
            )}
            onCardMove={handleCardMove}
            swimLaneField={settings.showRows && settings.rowsField
              ? settings.rowsField as keyof (typeof boardItems)[number] & string
              : undefined}
          />
        </div>
      )}
    </div>
  );
}
