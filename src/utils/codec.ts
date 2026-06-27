/**
 * Type-Codec Integrity Contract Pattern
 *
 * Compile-time enforcement that every member of a union type is mapped
 * in conversion dictionaries. Adding a new value to the source type
 * produces a TS error until every CodecMap is updated.
 *
 * Philosophy: the TypeScript type is the single source of truth.
 * No more "I forgot to update the constant array" bugs.
 */

// ---- Core Types ----

/** Element Plus tag effect types */
export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | ''

/**
 * A complete mapping from every member of K to V.
 * Use with union types to enforce exhaustiveness at compile time.
 *
 * @example
 *   type Role = 'admin' | 'viewer'
 *   const roleTags: CodecMap<Role, TagType> = {
 *     admin: 'danger',
 *     viewer: 'info',
 *   } // Adding 'editor' to Role makes this a compile error
 */
export type CodecMap<K extends string, V = string> = Record<K, V>

/**
 * Status → Element Plus tag type map.
 * Every status in S must map to a valid tag type.
 */
export type StatusTagMap<S extends string> = CodecMap<S, TagType>

// ---- Runtime Helpers ----

/** Typed lookup with required default — never returns undefined. */
export function lookup<K extends string, V>(
  map: CodecMap<K, V>,
  key: string,
  defaultVal: V,
): V {
  return (map as Record<string, V>)[key] ?? defaultVal
}

// ---- Dev-Mode Integrity Validation ----

/**
 * Runtime defense-in-depth: verifies that a codec map contains
 * exactly the expected keys. Guards against `as any` casts and
 * reflective property manipulation. Only runs in dev mode.
 */
export function validateCodec<K extends string>(
  map: Record<string, unknown>,
  keys: readonly K[],
): void {
  if (process.env.NODE_ENV === 'production') return
  const mapKeys = Object.keys(map).sort()
  const expected = [...keys].sort()
  const extra = mapKeys.filter(k => !expected.includes(k as K))
  const missing = expected.filter(k => !mapKeys.includes(k))
  if (missing.length) console.error('[Codec] missing keys:', missing)
  if (extra.length) console.error('[Codec] extra keys:', extra)
}
