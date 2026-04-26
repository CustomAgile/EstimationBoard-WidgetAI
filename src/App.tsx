/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import React, { useState, useMemo, useCallback } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';
import './App.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { ArtifactTypeKey } from '@customagile/widget-ai/types/rally-registry';
import { CardBoard } from '@customagile/widget-ai/components/CardBoard';
import type { CardBoardColumn } from '@customagile/widget-ai/components/CardBoard';
import type { FilterFieldDef } from '@customagile/widget-ai/components/filter/types';
import { AddNew } from '@customagile/widget-ai/components/AddNew';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
import { useDevHarness } from '@customagile/widget-ai/components/DevHarness';
import { CheckboxGroup } from '@customagile/widget-ai/components/CheckboxGroup';
import type { CheckboxGroupOption } from '@customagile/widget-ai/components/CheckboxGroup';
import {
  useWidgetSettings,
  defineWidgetSettings,
} from '@customagile/widget-ai/components/settings';

import type { EstimationBoardDataProvider, EstimationBoardItem, EstimationSize } from './types';
import { useEstimationBoardData } from './hooks/useEstimationBoardData';
import { SizesEditor } from './components/SizesEditor';

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

const SETTINGS_DEFAULTS = defineWidgetSettings<EstimationBoardSettingsShape>({
  sizes: JSON.stringify(DEFAULT_SIZES),
  showRows: false,
  rowsField: '',
  types: DEFAULT_TYPES,
  query: '',
});

// Local alias to avoid an extra type-import line.
type EstimationBoardSettingsShape = import('./types').EstimationBoardSettings;

// ── Helpers ────────────────────────────────────────────────────────────

function parseSizes(raw: string): EstimationSize[] {
  try {
    const parsed = JSON.parse(raw) as EstimationSize[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* fall through */ }
  return DEFAULT_SIZES;
}

// ── App component ──────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: EstimationBoardDataProvider;
}

type Overrides = Partial<Pick<EstimationBoardItem, 'Ready' | 'Blocked'>>;

export default function App({ rallyContext, data }: AppProps) {
  const dev = useDevHarness();
  const { settings, updateSetting, updateSettings } = useWidgetSettings<EstimationBoardSettingsShape>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── Derived settings ───────────────────────────────────────────────
  const sizes = useMemo(() => parseSizes(settings.sizes), [settings.sizes]);
  const columns: CardBoardColumn[] = useMemo(
    () => sizes.map((s) => ({ value: s.value === null ? '' : String(s.value), label: s.text })),
    [sizes],
  );
  const activeTypes = useMemo(
    () =>
      (settings.types ?? DEFAULT_TYPES).filter(
        (t): t is ArtifactTypeKey =>
          t === 'hierarchicalrequirement' || t === 'defect' || t === 'defectsuite',
      ),
    [settings.types],
  );

  // ── Data + optimistic Ready/Blocked overrides ─────────────────────
  const { items, loading, error, refresh } = useEstimationBoardData(
    data,
    activeTypes,
    settings.query || null,
  );
  const [overrides, setOverrides] = useState<Record<number, Overrides>>({});

  const boardItems = useMemo(
    () => items.map((item) => ({ ...item, ...(overrides[item.ObjectID] ?? {}) })),
    [items, overrides],
  );

  // ── Filter fields ─────────────────────────────────────────────────
  // Derive option lists from loaded items so multiselect chips reflect
  // what's actually on the board.
  const filterFields = useMemo<FilterFieldDef[]>(() => {
    const types = Array.from(
      new Set(items.map((i) => i._type).filter((t): t is string => !!t)),
    ).sort();
    const owners = Array.from(
      new Set(
        items
          .map((i) => i.Owner?._refObjectName)
          .filter((s): s is string => !!s),
      ),
    ).sort();
    return [
      { field: 'FormattedID', label: 'Formatted ID', type: 'text' },
      { field: 'Name', label: 'Name', type: 'text' },
      {
        field: '_type',
        label: 'Type',
        type: 'multiselect',
        config: { options: types },
      },
      {
        field: 'Owner._refObjectName',
        label: 'Owner',
        type: 'multiselect',
        config: { options: owners },
      },
    ];
  }, [items]);

  // ── Event handlers ────────────────────────────────────────────────
  const toggleField = useCallback(
    (field: 'Ready' | 'Blocked') => (item: EstimationBoardItem) => {
      const next = !(overrides[item.ObjectID]?.[field] ?? item[field]);
      setOverrides((prev) => ({
        ...prev,
        [item.ObjectID]: { ...prev[item.ObjectID], [field]: next },
      }));
      data.updateItem(item._type as ArtifactTypeKey, item.ObjectID, { [field]: next })
        .catch(() => {});
    },
    [data, overrides],
  );

  const handleCardMove = useCallback(
    async (item: EstimationBoardItem, _from: string, to: string) => {
      await data.updateItem(item._type as ArtifactTypeKey, item.ObjectID, {
        PlanEstimate: to === '' ? null : Number(to),
      });
      refresh();
    },
    [data, refresh],
  );

  // ── EditMode ──────────────────────────────────────────────────────
  const [draftSizes, setDraftSizes] = useState<EstimationSize[] | null>(null);

  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="Estimation Board"
        version="1.0.1"
        appSlug="estimation-board"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<EstimationBoardSettingsShape>) => {
          updateSettings(
            draftSizes !== null ? { ...dirty, sizes: JSON.stringify(draftSizes) } : dirty,
          );
          setDraftSizes(null);
        }}
        onClose={() => dev?.setEditMode(false)}
      >
        <SettingRow label="Columns" settingKey="sizes">
          <SizesEditor value={draftSizes ?? sizes} onChange={setDraftSizes} />
        </SettingRow>

        <SettingRow label="Artifact Types" settingKey="types">
          <CheckboxGroup
            legend="Types to show"
            options={TYPE_OPTIONS}
            value={activeTypes}
            onChange={(vals) => updateSetting('types', vals as ArtifactTypeKey[])}
            orientation="horizontal"
          />
        </SettingRow>

        <SettingRow label="Additional Filter" settingKey="query">
          <input
            type="text"
            value={settings.query}
            onChange={(e) => updateSetting('query', e.target.value)}
            placeholder='e.g. (Owner.UserName = "jsmith")'
            className="ca-eb-query-input"
          />
        </SettingRow>
      </EditModePanel>
    );
  }

  // ── Normal view ────────────────────────────────────────────────────
  return (
    <div className="ca-eb-shell">
      <AppHeader
        title="Estimation Board"
        help={{
          content: (
            <>
              <p>
                The Estimation Board groups user stories, defects, and defect suites by their
                Plan Estimate. Drag cards between columns to update estimates.
              </p>
              <p>Use Edit Mode to configure column sizes, artifact types, and optional filters.</p>
            </>
          ),
        }}
      />

      <div className="ca-eb-addnew">
        <AddNew recordTypes={activeTypes} collapseOnCreate onCreate={refresh} />
      </div>

      {error && <div role="alert" className="ca-eb-error">⚠ Error loading items: {error}</div>}
      {loading && <div aria-live="polite" aria-busy="true" className="ca-eb-loading">Loading…</div>}

      {!loading && (
        <div className="ca-eb-board">
          <CardBoard<EstimationBoardItem>
            items={boardItems}
            columns={columns}
            columnField="PlanEstimate"
            onToggleReady={toggleField('Ready')}
            onToggleBlocked={toggleField('Blocked')}
            onCardMove={handleCardMove}
            swimLaneField={
              settings.showRows && settings.rowsField
                ? (settings.rowsField as keyof EstimationBoardItem & string)
                : undefined
            }
            filters={{
              fields: filterFields,
              searchPlaceholder: 'Search work items',
            }}
          />
        </div>
      )}
    </div>
  );
}
