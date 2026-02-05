/**
 * Slugify utility functions for generating IDs from names
 */

/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns A slugified string (lowercase, hyphen-separated, alphanumeric)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert a string to uppercase slug for references
 * @param text - The text to slugify
 * @returns A slugified string (uppercase, hyphen-separated, alphanumeric)
 */
export function slugifyUpper(text: string): string {
  return slugify(text).toUpperCase();
}

/**
 * Generate a unique ID based on a name with optional suffix
 * @param name - The base name to slugify
 * @param existingIds - Array of existing IDs to check against
 * @param suffix - Optional suffix to add before counter
 * @returns A unique ID that doesn't exist in existingIds
 */
export function generateUniqueId(
  name: string,
  existingIds: string[],
  suffix?: string
): string {
  const baseSlug = slugify(name);
  let finalSlug = suffix ? `${baseSlug}-${suffix}` : baseSlug;

  // If the base slug is unique, return it
  if (!existingIds.includes(finalSlug)) {
    return finalSlug;
  }

  // Otherwise, append a counter until we find a unique ID
  let counter = 2;
  let candidateId = `${finalSlug}-${counter}`;

  while (existingIds.includes(candidateId)) {
    counter++;
    candidateId = `${finalSlug}-${counter}`;
  }

  return candidateId;
}

/**
 * Generate a reference ID (similar to slug but can include underscores)
 * @param name - The name to convert to reference
 * @returns A reference string
 */
export function generateReference(name: string): string {
  return slugify(name).replace(/-/g, '_').toUpperCase();
}

/**
 * Generate organization reference (ORG-<NAME>)
 * @param name - The organization name
 * @returns Organization reference like ORG-MY-COMPANY
 */
export function generateOrganizationReference(name: string): string {
  return `ORG-${slugifyUpper(name)}`;
}

/**
 * Generate establishment reference (ETB-<NAME>)
 * @param name - The establishment name
 * @returns Establishment reference like ETB-MAIN-STORE
 */
export function generateEstablishmentReference(name: string): string {
  return `ETB-${slugifyUpper(name)}`;
}
