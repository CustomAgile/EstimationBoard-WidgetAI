/** Copyright (c) 2026 Custom Agile LLC. All rights reserved. */

import React, { useCallback } from 'react';
import type { EstimationSize } from '../types';

export interface SizesEditorProps {
  /** Current list of size/column definitions */
  value: EstimationSize[];
  /** Called with the updated list whenever sizes change */
  onChange: (sizes: EstimationSize[]) => void;
}

/**
 * Edit the board's column definitions (Name + Plan Estimate value).
 * Mirrors the legacy `SizesField` ExtJS component in React.
 *
 * Renders a row per size with + / – buttons to add/remove rows,
 * a text input for the column label, and a number input for PlanEstimate value.
 */
export function SizesEditor({ value, onChange }: SizesEditorProps) {
  const handleLabelChange = useCallback(
    (index: number, text: string) => {
      const next = value.map((s, i) => (i === index ? { ...s, text } : s));
      onChange(next);
    },
    [value, onChange],
  );

  const handleValueChange = useCallback(
    (index: number, raw: string) => {
      const parsed = raw === '' ? null : Number(raw);
      const next = value.map((s, i) =>
        i === index ? { ...s, value: isNaN(parsed as number) ? null : parsed } : s,
      );
      onChange(next);
    },
    [value, onChange],
  );

  const handleAdd = useCallback(
    (afterIndex: number) => {
      const next = [...value];
      next.splice(afterIndex + 1, 0, { text: '', value: null });
      onChange(next);
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (value.length <= 1) return; // keep at least one row
      const next = value.filter((_, i) => i !== index);
      onChange(next);
    },
    [value, onChange],
  );

  const cellStyle: React.CSSProperties = {
    padding: '2px var(--ca-space-1)',
    fontSize: 'var(--ca-font-size-sm)',
    color: 'var(--ca-text-primary)',
    backgroundColor: 'var(--ca-surface-raised)',
    border: '1px solid var(--ca-border-default)',
    borderRadius: 'var(--ca-radius-xs)',
  };

  return (
    <div>
      {/* Column header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 28px 1fr 80px',
          gap: 'var(--ca-space-1)',
          marginBottom: 'var(--ca-space-1)',
          paddingLeft: 4,
        }}
      >
        <span />
        <span />
        <span
          style={{
            fontSize: 'var(--ca-font-size-xs)',
            fontWeight: 700,
            color: 'var(--ca-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          Name
        </span>
        <span
          style={{
            fontSize: 'var(--ca-font-size-xs)',
            fontWeight: 700,
            color: 'var(--ca-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          Plan Est.
        </span>
      </div>

      {value.map((size, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 28px 1fr 80px',
            gap: 'var(--ca-space-1)',
            marginBottom: 'var(--ca-space-1)',
            alignItems: 'center',
          }}
        >
          {/* Add row button */}
          <button
            type="button"
            title="Add row after this"
            aria-label="Add row after this"
            onClick={() => handleAdd(i)}
            style={{
              width: 24,
              height: 24,
              border: 'none',
              borderRadius: 'var(--ca-radius-xs)',
              backgroundColor: 'transparent',
              color: 'var(--ca-text-link)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            +
          </button>

          {/* Remove row button */}
          <button
            type="button"
            title="Remove this row"
            aria-label="Remove this row"
            onClick={() => handleRemove(i)}
            disabled={value.length <= 1}
            style={{
              width: 24,
              height: 24,
              border: 'none',
              borderRadius: 'var(--ca-radius-xs)',
              backgroundColor: 'transparent',
              color: value.length <= 1 ? 'var(--ca-text-tertiary)' : 'var(--ca-text-secondary)',
              fontSize: 18,
              lineHeight: 1,
              cursor: value.length <= 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            −
          </button>

          {/* Column label */}
          <input
            type="text"
            value={size.text}
            onChange={(e) => handleLabelChange(i, e.target.value)}
            placeholder="Label"
            aria-label={`Column ${i + 1} label`}
            style={{ ...cellStyle, width: '100%', boxSizing: 'border-box' }}
          />

          {/* Plan Estimate value */}
          <input
            type="number"
            value={size.value === null ? '' : size.value}
            onChange={(e) => handleValueChange(i, e.target.value)}
            placeholder="(none)"
            min={0}
            aria-label={`Column ${i + 1} plan estimate`}
            style={{ ...cellStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      ))}
    </div>
  );
}
