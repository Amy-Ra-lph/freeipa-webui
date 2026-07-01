/**
 * Utility helpers for RealmDomains page.
 * RealmDomains is a simple list of domain strings, not a complex IPA object,
 * so this utility is minimal.
 */

/**
 * Validate that a domain string is well-formed.
 * Basic check: non-empty, contains at least one dot, no spaces.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.trim().length === 0) {
    return false;
  }
  const trimmed = domain.trim();
  // Basic domain pattern: at least one dot, no spaces
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
    trimmed
  );
}
