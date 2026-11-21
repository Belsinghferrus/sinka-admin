/**
 * Safely extracts a clean display string from a value that may be a string,
 * number, null, or a MongoDB embedded subdocument/object (such as dimensions or weight).
 * Prevents [object Object] and unhandled TypeErrors during string operations.
 *
 * @param {any} val
 * @returns {string}
 */
export function extractString(val) {
  if (val == null) return '';
  if (typeof val === 'string') {
    return val === '[object Object]' ? '' : val.trim();
  }
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    // 1. Check formatted string property
    if (typeof val.formatted === 'string' && val.formatted.trim() && val.formatted.trim() !== '[object Object]') {
      return val.formatted.trim();
    }
    // 2. Check dimensions object { length, width, height, unit }
    const dimParts = [val.length, val.width, val.height].filter((p) => p != null && p !== '');
    if (dimParts.length > 0) {
      return `${dimParts.join(' x ')}${val.unit ? ` ${val.unit}` : ''}`;
    }
    // 3. Check weight object { value, unit }
    if (val.value != null && val.value !== '') {
      return `${val.value}${val.unit ? ` ${val.unit}` : ' kg'}`;
    }
    return '';
  }
  return '';
}

export default {
  extractString,
};
