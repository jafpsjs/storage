/**
 * Check if storage key contains only valid characters.
 */
export function isValidKey(key: string): boolean {
  const regex = /^[\w\-.()]+$/ug;
  return regex.test(key);
}


export function assertValidKey(key: string): void {
  if (!isValidKey(key)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
}
