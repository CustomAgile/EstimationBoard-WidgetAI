/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SizesEditor } from './SizesEditor';
import type { EstimationSize } from '../types';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const DEFAULT_SIZES: EstimationSize[] = [
  { text: 'No Estimate', value: null },
  { text: 'XS', value: 1 },
  { text: 'S', value: 2 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderEditor(
  sizes: EstimationSize[] = DEFAULT_SIZES,
  onChange = vi.fn(),
) {
  render(<SizesEditor value={sizes} onChange={onChange} />);
  return onChange;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SizesEditor', () => {
  describe('rendering', () => {
    it('renders one label input per size row', () => {
      renderEditor();
      // Each row has an aria-labelled text input for the column label
      const labelInputs = screen.getAllByRole('textbox');
      expect(labelInputs).toHaveLength(DEFAULT_SIZES.length);
    });

    it('renders one Plan Estimate input per row', () => {
      renderEditor();
      // number inputs — one per row
      const numberInputs = screen.getAllByRole('spinbutton');
      expect(numberInputs).toHaveLength(DEFAULT_SIZES.length);
    });

    it('shows empty string for null Plan Estimate value', () => {
      renderEditor([{ text: 'No Estimate', value: null }]);
      const spinbutton = screen.getByRole('spinbutton');
      expect((spinbutton as HTMLInputElement).value).toBe('');
    });

    it('shows numeric value when Plan Estimate is set', () => {
      renderEditor([{ text: 'S', value: 2 }]);
      const spinbutton = screen.getByRole('spinbutton');
      expect((spinbutton as HTMLInputElement).value).toBe('2');
    });
  });

  describe('label editing', () => {
    it('calls onChange with updated text when label input changes', () => {
      const onChange = renderEditor();
      const labelInputs = screen.getAllByRole('textbox');
      // Change the first row's label
      fireEvent.change(labelInputs[0], { target: { value: 'None' } });

      expect(onChange).toHaveBeenCalledOnce();
      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated[0].text).toBe('None');
      // Other rows unchanged
      expect(updated[1].text).toBe('XS');
    });
  });

  describe('value editing', () => {
    it('calls onChange with updated numeric value when spinbutton changes', () => {
      const onChange = renderEditor();
      const spinbuttons = screen.getAllByRole('spinbutton');
      fireEvent.change(spinbuttons[1], { target: { value: '5' } });

      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated[1].value).toBe(5);
    });

    it('calls onChange with null when spinbutton is cleared', () => {
      const onChange = renderEditor();
      const spinbuttons = screen.getAllByRole('spinbutton');
      fireEvent.change(spinbuttons[1], { target: { value: '' } });

      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated[1].value).toBeNull();
    });
  });

  describe('add row', () => {
    it('calls onChange with an extra row inserted after the clicked row', () => {
      const onChange = renderEditor();
      // "Add row after this" buttons — one per row
      const addButtons = screen.getAllByRole('button', { name: /add row after this/i });
      // Click the add button on the first row (index 0) → new row inserted at index 1
      fireEvent.click(addButtons[0]);

      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated).toHaveLength(DEFAULT_SIZES.length + 1);
      // New row is blank
      expect(updated[1]).toEqual({ text: '', value: null });
      // Original second row (XS, 1) moved to index 2
      expect(updated[2].text).toBe('XS');
    });

    it('inserts at the end when the last row add button is clicked', () => {
      const onChange = renderEditor();
      const addButtons = screen.getAllByRole('button', { name: /add row after this/i });
      fireEvent.click(addButtons[addButtons.length - 1]);

      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated).toHaveLength(DEFAULT_SIZES.length + 1);
      expect(updated[updated.length - 1]).toEqual({ text: '', value: null });
    });
  });

  describe('remove row', () => {
    it('calls onChange with the row removed', () => {
      const onChange = renderEditor();
      const removeButtons = screen.getAllByRole('button', { name: /remove this row/i });
      // Remove the middle row (index 1 = XS)
      fireEvent.click(removeButtons[1]);

      const updated: EstimationSize[] = onChange.mock.calls[0][0];
      expect(updated).toHaveLength(DEFAULT_SIZES.length - 1);
      expect(updated.find((s) => s.text === 'XS')).toBeUndefined();
    });

    it('does not call onChange when only one row remains', () => {
      const onChange = vi.fn();
      render(<SizesEditor value={[{ text: 'Only', value: 1 }]} onChange={onChange} />);
      const removeButton = screen.getByRole('button', { name: /remove this row/i });
      // Button should be disabled
      expect(removeButton).toBeDisabled();
      fireEvent.click(removeButton);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
