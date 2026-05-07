import { stripFormulaPrefix, isFormula, hasValidFormulaCharacters } from '../utils/formulaHelpers.js';
import { extractCellReferences, isCellInBounds } from '../utils/cellHelpers.js';
import { ERROR_TYPES, DEFAULT_COLS, DEFAULT_ROWS } from '../utils/constants.js';
import { tokenize, isValidTokenSequence } from './tokenizer.js';

export const parseFormula = (value, maxCols = DEFAULT_COLS, maxRows = DEFAULT_ROWS) => {
  // If not a formula, return empty references
  if (!isFormula(value)) {
    return {
      formula: '',
      references: [],
      error: null
    };
  }
  
  const formula = stripFormulaPrefix(value);
  
  // Validate formula structure
  if (formula.length === 0) {
    return {
      formula: '',
      references: [],
      error: ERROR_TYPES.SYNTAX
    };
  }
  
  // Check for valid characters
  if (!hasValidFormulaCharacters(formula)) {
    return {
      formula,
      references: [],
      error: ERROR_TYPES.SYNTAX
    };
  }
  
  // Extract references
  const references = extractCellReferences(formula);
  
  // Validate all references are in bounds
  for (const ref of references) {
    if (!isCellInBounds(ref, maxCols, maxRows)) {
      return {
        formula,
        references: [],
        error: ERROR_TYPES.REF
      };
    }
  }
  
  // Tokenize and validate token sequence
  const tokens = tokenize(formula);
  if (!isValidTokenSequence(tokens)) {
    return {
      formula,
      references,
      error: ERROR_TYPES.SYNTAX
    };
  }
  
  return {
    formula,
    references,
    error: null
  };
};

/**
 * Validates raw input value
 * @param {string} value - User input
 * @returns {object} { valid, error, isFormula }
 */
export const validateInput = (value) => {
  if (typeof value !== 'string') {
    return { valid: false, error: null, isFormula: false };
  }
  
  const trimmed = value.trim();
  
  if (trimmed === '') {
    return { valid: true, error: null, isFormula: false };
  }
  
  // Check if it's a formula
  if (isFormula(trimmed)) {
    const parsed = parseFormula(trimmed);
    return {
      valid: !parsed.error,
      error: parsed.error,
      isFormula: true
    };
  }
  
  // It's a plain value (text or number)
  return { valid: true, error: null, isFormula: false };
};
