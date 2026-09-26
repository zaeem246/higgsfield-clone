/**
 * Key-case translation between Django (snake_case) and the browser (camelCase).
 *
 * Only object *keys* are rewritten. Values — including strings that happen to
 * look like identifiers, such as a prompt or a media URL — are passed through
 * untouched.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue | undefined };

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function camelToSnakeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function mapKeysDeep(value: JsonValue, rename: (key: string) => string): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeysDeep(item, rename));
  }

  // `typeof null === "object"`, and Date/Map never survive JSON, so a plain
  // object check is enough here.
  if (value !== null && typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [key, item] of Object.entries(value)) {
      // Mirror JSON.stringify: an absent optional field is simply not sent.
      if (item === undefined) continue;
      out[rename(key)] = mapKeysDeep(item, rename);
    }
    return out;
  }

  return value;
}

/** Django → browser. */
export function toCamelCase(value: JsonValue): JsonValue {
  return mapKeysDeep(value, snakeToCamelKey);
}

/** Browser → Django. */
export function toSnakeCase(value: JsonValue): JsonValue {
  return mapKeysDeep(value, camelToSnakeKey);
}
