/**
 * Entity Field Descriptor System
 *
 * Provides compile-time type checking for table column definitions.
 * Every `prop` in a ColumnPreset is verified against the entity type,
 * so renaming a field in the .d.ts forces the column defs to be updated.
 *
 * Intended use:
 *   const columns = [{ prop: 'name', label: 'table.name' }, ...] satisfies ColumnPreset<MyEntity>
 */

import type { TagType, CodecMap } from './codec'

// ---- Column Metadata ----

export interface ColumnMeta<T, K extends keyof T = keyof T> {
  /** Field name — type-checked against T */
  prop: K & string
  /** Display label (i18n key or literal) */
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  showOverflowTooltip?: boolean
  sortable?: boolean | 'custom'
  align?: 'left' | 'center' | 'right'
  /** For status columns: maps status values to tag colors */
  statusMap?: CodecMap<string, TagType>
  /** Built-in formatter hint */
  fmt?: 'datetime' | 'truncate' | 'none'
}

// ---- Column Preset ----

/** A list of column definitions for entity T. Each `prop` must be a key of T. */
export type ColumnPreset<T> = ColumnMeta<T, keyof T>[]

// ---- Helpers ----

/** Extract column props from a preset for use in filter/export code */
export function columnProps<T>(preset: ColumnPreset<T>): string[] {
  return preset.map(c => c.prop)
}

/** Find a column meta by prop name */
export function getColumn<T>(preset: ColumnPreset<T>, prop: string): ColumnMeta<T> | undefined {
  return preset.find(c => c.prop === prop)
}
