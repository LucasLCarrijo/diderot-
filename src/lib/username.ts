/**
 * Utility functions for username normalization.
 * The canonical route format is /{username} (without @)
 * The @ symbol should only be used for display purposes.
 */

/**
 * Normalizes a username by removing @ prefix and converting to lowercase.
 * This function MUST be used in all links, redirects, fetches, and SEO.
 */
export function normalizeUsername(username: string | null | undefined): string {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
}

/**
 * Formats a username for display purposes (with @).
 */
export function formatUsernameDisplay(username: string | null | undefined): string {
  if (!username) return "";
  const normalized = normalizeUsername(username);
  return `@${normalized}`;
}

/**
 * Creates the canonical URL path for a creator profile.
 * Always returns /{username} (without @)
 */
export function getCreatorProfilePath(username: string | null | undefined): string {
  return `/${normalizeUsername(username)}`;
}
