/**
 * Only a same-origin path may be used as a post-authentication redirect;
 * anything else is an open redirect waiting to be pasted into a phishing mail.
 */
export function safeNext(
  value: string | string[] | undefined,
  fallback = "/create",
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
