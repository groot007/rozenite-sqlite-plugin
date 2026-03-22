/**
 * Escape a value for safe SQL string interpolation.
 * Handles NULL, numbers, booleans, and strings with proper quoting.
 */
export function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  // Escape single quotes by doubling them
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}
