/**
 * Standardized Indian Rupee (INR) Currency Utilities for Sinka Admin.
 * Formats numbers and numeric strings according to Indian numbering system (en-IN).
 *
 * Rules:
 * - Whole rupee amounts display with 0 decimals (e.g. ₹45,000, ₹1,25,000, ₹10,00,000).
 * - Amounts with fractional rupees display with 2 decimals (e.g. ₹45,000.50).
 * - Null, undefined, empty, or non-finite inputs gracefully return '₹0'.
 */

/**
 * Parses monetary inputs (numbers, clean strings, comma-formatted strings, or currency symbols)
 * into a valid numeric float. Returns NaN if invalid.
 *
 * @param {number|string} value - The input value to parse
 * @returns {number} Parsed numeric value or NaN
 */
export function parseCurrencyInput(value) {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') {
      return NaN;
    }
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Formats a numerical amount into Indian Rupee (INR) currency string.
 *
 * Expected behavior:
 * - 45000 -> ₹45,000
 * - 18500 -> ₹18,500
 * - 125000 -> ₹1,25,000
 * - 1000000 -> ₹10,00,000
 * - 999 -> ₹999
 * - 45000.50 -> ₹45,000.50
 *
 * @param {number|string} amount - The numerical amount to format
 * @param {Object} [options] - Optional formatting parameters
 * @param {boolean} [options.includeDecimals] - Explicitly force or hide decimals
 * @returns {string} Formatted INR currency string (e.g., '₹45,000', '₹45,000.50', or '₹0')
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0';
  }

  const numericValue = parseCurrencyInput(amount);

  if (!Number.isFinite(numericValue)) {
    return '₹0';
  }

  const hasDecimals = numericValue % 1 !== 0;
  const showDecimals =
    typeof options.includeDecimals === 'boolean'
      ? options.includeDecimals
      : hasDecimals;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(numericValue);
}

export default formatCurrency;

