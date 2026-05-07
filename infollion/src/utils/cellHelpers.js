import { DEFAULT_COLS, DEFAULT_ROWS } from './constants.js';
import { generateColumnLabel, getColumnIndex } from './columnHelpers.js';

export const getCellReference = (colIndex, row) => {
  return `${generateColumnLabel(colIndex)}${row}`;
};

export const parseCellReference = (cellRef) => {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const col = getColumnIndex(match[1]);
  const row = parseInt(match[2], 10);
  
  return { col, row };
};

export const isValidCellReference = (ref) => {
  return /^[A-Z]+\d+$/.test(ref);
};

export const extractCellReferences = (formula) => {
  const matches = formula.match(/[A-Z]+\d+/g) || [];
  return [...new Set(matches)];
};

export const createEmptySpreadsheet = (colCount = DEFAULT_COLS, rowCount = DEFAULT_ROWS) => {
  const data = {};
  
  for (let row = 1; row <= rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellRef = getCellReference(col, row);
      data[cellRef] = {
        raw: '',
        computed: '',
        dependencies: [],
        dependents: [],
        error: null
      };
    }
  }
  
  return data;
};

export const getDependents = (cellRef, data) => {
  return Object.keys(data).filter(
    cell => data[cell].dependencies.includes(cellRef)
  );
};

export const isCellInBounds = (cellRef, maxCols = DEFAULT_COLS, maxRows = DEFAULT_ROWS) => {
  const parsed = parseCellReference(cellRef);
  if (!parsed) return false;
  
  const { col, row } = parsed;
  return col >= 0 && col < maxCols && row >= 1 && row <= maxRows;
};
