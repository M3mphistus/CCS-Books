// Utility functions shared across components

/**
 * Parse a denomination string to a float value.
 * @param {string} denomination
 * @param {string} currency
 * @returns {number}
 */
export function parseDenomination(denomination, currency) {
  let num = denomination.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.')
  return parseFloat(num)
}

/**
 * Check if a money type is a base type.
 * @param {string} type
 * @returns {boolean}
 */
export function isBaseType(type) {
  return ['Echt', 'Markiert', 'Falsch'].includes(type)
}
