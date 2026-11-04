import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, parseCurrencyInput } from '../src/utils/formatCurrency.js';

test('Indian Rupee Formatting — matches canonical specification table', () => {
  // Test cases required by specification
  assert.equal(formatCurrency(45000), '₹45,000');
  assert.equal(formatCurrency(18500), '₹18,500');
  assert.equal(formatCurrency(125000), '₹1,25,000');
  assert.equal(formatCurrency(1000000), '₹10,00,000');
  assert.equal(formatCurrency(999), '₹999');
  assert.equal(formatCurrency(45000.5), '₹45,000.50');
  assert.equal(formatCurrency(45000.50), '₹45,000.50');
});

test('Indian Rupee Formatting — handles string numbers and formatted strings', () => {
  assert.equal(formatCurrency('45000'), '₹45,000');
  assert.equal(formatCurrency('18500'), '₹18,500');
  assert.equal(formatCurrency('125000'), '₹1,25,000');
  assert.equal(formatCurrency('1000000'), '₹10,00,000');
  assert.equal(formatCurrency('999'), '₹999');
  assert.equal(formatCurrency('45000.50'), '₹45,000.50');
  assert.equal(formatCurrency('₹1,25,000'), '₹1,25,000');
});

test('Indian Rupee Formatting — handles zero and edge cases gracefully', () => {
  assert.equal(formatCurrency(0), '₹0');
  assert.equal(formatCurrency('0'), '₹0');
  assert.equal(formatCurrency(null), '₹0');
  assert.equal(formatCurrency(undefined), '₹0');
  assert.equal(formatCurrency(''), '₹0');
  assert.equal(formatCurrency(NaN), '₹0');
  assert.equal(formatCurrency('invalid'), '₹0');
});

test('Indian Rupee Formatting — supports explicit includeDecimals option', () => {
  assert.equal(formatCurrency(45000, { includeDecimals: true }), '₹45,000.00');
  assert.equal(formatCurrency(45000.5, { includeDecimals: false }), '₹45,001');
});

test('parseCurrencyInput — cleans and extracts valid numeric amounts for API payloads', () => {
  assert.equal(parseCurrencyInput(45000), 45000);
  assert.equal(parseCurrencyInput('45000'), 45000);
  assert.equal(parseCurrencyInput('45,000'), 45000);
  assert.equal(parseCurrencyInput('₹1,25,000'), 125000);
  assert.equal(parseCurrencyInput('45000.50'), 45000.5);
  assert.ok(Number.isNaN(parseCurrencyInput(null)));
  assert.ok(Number.isNaN(parseCurrencyInput(undefined)));
  assert.ok(Number.isNaN(parseCurrencyInput('')));
  assert.ok(Number.isNaN(parseCurrencyInput('abc')));
});

