import { extractCellReferences } from './cellHelpers.js';

export const isFormula = (value) => {
  return typeof value === 'string' && value.trim().startsWith('=');
};

export const stripFormulaPrefix = (formula) => {
  return formula.trim().slice(1).trim();
};

export const isValidFormulaStructure = (value) => {
  if (!isFormula(value)) return true; // Not a formula
  const content = stripFormulaPrefix(value);
  return content.length > 0;
};

export const getFormulaReferences = (formula) => {
  const stripped = isFormula(formula) ? stripFormulaPrefix(formula) : formula;
  return extractCellReferences(stripped);
};

export const hasValidFormulaCharacters = (formula) => {
  // Allow: cell references, operators, numbers, parentheses, spaces, decimal points
  const validPattern = /^[A-J0-9\+\-\*\/\(\)\.\s]+$/;
  return validPattern.test(formula);
};
