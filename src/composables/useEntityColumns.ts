/**
 * Composable for entity column presets.
 *
 * Provides formatters and status tag helpers driven by the centralized
 * ColumnPreset definitions in src/constants/field-descriptors.ts.
 */

import { lookup, type StatusTagMap } from '../utils/codec'
import type { ColumnPreset, ColumnMeta } from '../utils/field-descriptor'

export function useEntityColumns<T>(preset: ColumnPreset<T>) {
  /** Format a value using the column's fmt hint */
  function fmtCell(val: unknown, col?: ColumnMeta<T>): string {
    if (val === undefined || val === null) return '-'
    if (col?.fmt === 'datetime' && typeof val === 'number') {
      return new Date(val).toLocaleString()
    }
    if (col?.fmt === 'truncate' && typeof val === 'string') {
      return val.length > 16 ? val.slice(0, 16) + '…' : val
    }
    return String(val)
  }

  /** Get tag type for a status value using the column's statusMap */
  function statusTagType(val: string, col?: ColumnMeta<T>): string {
    if (col?.statusMap) {
      return lookup(col.statusMap as StatusTagMap<string>, val, 'info')
    }
    return 'info'
  }

  /** Find a column by prop name */
  function colByProp(prop: string): ColumnMeta<T> | undefined {
    return preset.find(c => c.prop === prop)
  }

  return { preset, fmtCell, statusTagType, colByProp }
}
