/**
 * Checksif a value is a non-null object.
 * @param   {unknown} value The value to check.
 * @returns {boolean} `true` if the value is a non-null object.
 */
export function isNonNullObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Checks if a value is a non-null non-array object.
 * @param   {unknown} value The value to check.
 * @returns {boolean} `true` if the value is a non-null non-array object.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
