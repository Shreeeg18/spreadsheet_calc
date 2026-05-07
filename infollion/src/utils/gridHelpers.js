import { GRID_COLUMNS, GRID_ROWS } from './constants.js';

export const getColumnLabel = (colIndex) => {
  return GRID_COLUMNS[colIndex];
};

export const getColumnLabels = () => {
  return GRID_COLUMNS;
};

export const getRowNumbers = () => {
  return GRID_ROWS;
};

export const getGridDimensions = () => {
  return {
    cols: GRID_COLUMNS.length,
    rows: GRID_ROWS.length
  };
};
