/**
 * Theme lives in a cookie, not localStorage, so the server renders the same
 * `data-theme` the client hydrates with and there is no flash of the wrong
 * ground colour. Dark is the default and the one designed first; warm paper is
 * the considered alternate.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "kg_theme";

/** One year; long enough that a returning reader keeps their choice. */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export function parseTheme(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
