// Propagates updates through the dependency graph when a cell changes

import { computeCellValue } from './evaluator.js';
import { getAllDownstreamDependents } from './dependencyGraph.js';
import { ERROR_TYPES } from '../utils/constants.js';

export const recalculateDownstream = (changedCell, cellData, graph, preservedDependents = null) => {
  const recalculated = new Set();
  const toProcess = [changedCell];
  
  while (toProcess.length > 0) {
    const currentCell = toProcess.shift();
    
    if (recalculated.has(currentCell)) continue;
    recalculated.add(currentCell);
    
    // Use preserved dependents for the starting edited cell if provided,
    // otherwise fall back to the live graph.
    const dependents = (currentCell === changedCell && preservedDependents && preservedDependents.length > 0)
      ? preservedDependents
      : (graph.dependents[currentCell] || []);
    
    for (const dependentCell of dependents) {
      // Compute the value of the dependent cell
      const cellValue = cellData[dependentCell];
      const result = computeCellValue(cellValue.raw, buildValueMap(cellData));
      
      cellValue.computed = result.computed;
      cellValue.error = result.error;
      
      // Add to processing queue
      if (!recalculated.has(dependentCell)) {
        toProcess.push(dependentCell);
      }
    }
  }
  
  return recalculated;
};

/**
 * Builds a map of cell references to their computed values for evaluation
 * @param {object} cellData - Spreadsheet data
 * @returns {object} Map of cellRef -> computed value
 */
export const buildValueMap = (cellData) => {
  const valueMap = {};
  
  for (const [cellRef, cellValue] of Object.entries(cellData)) {
    // If cell has an error, use 0 as fallback value
    if (cellValue.error) {
      valueMap[cellRef] = 0;
    } else {
      valueMap[cellRef] = cellValue.computed;
    }
  }
  
  return valueMap;
};

/**
 * Recalculates entire spreadsheet (used when reloading from storage)
 * @param {object} cellData - Spreadsheet data
 * @param {object} graph - Dependency graph
 */
export const recalculateAll = (cellData, graph) => {
  // Build initial value map with non-formula values
  const valueMap = {};
  
  for (const [cellRef, cellValue] of Object.entries(cellData)) {
    if (!cellValue.raw.trim().startsWith('=')) {
      const numValue = parseFloat(cellValue.raw);
      valueMap[cellRef] = !isNaN(numValue) && cellValue.raw.trim() !== '' 
        ? numValue 
        : cellValue.raw;
    }
  }
  
  // Iteratively recalculate formulas until convergence
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (const [cellRef, cellValue] of Object.entries(cellData)) {
      if (cellValue.raw.trim().startsWith('=')) {
        const formula = cellValue.raw.trim().slice(1).trim();
        
        // Compute based on current value map
        const { result, error } = computeCellValue(cellValue.raw, valueMap);
        
        if (result !== cellValue.computed || error !== cellValue.error) {
          cellValue.computed = result;
          cellValue.error = error;
          valueMap[cellRef] = result;
          changed = true;
        }
      }
    }
  }
};

/**
 * Marks a cell and its dependents as invalid (for circular reference handling)
 * @param {string} cellRef - Cell to mark
 * @param {object} cellData - Spreadsheet data
 * @param {object} graph - Dependency graph
 * @param {string} errorType - Error type to set
 */
export const markCellAndDependentsAsError = (cellRef, cellData, graph, errorType = ERROR_TYPES.CIRCULAR) => {
  const affectedCells = getAllDownstreamDependents(graph, cellRef, new Set());
  affectedCells.add(cellRef);
  
  for (const cell of affectedCells) {
    cellData[cell].computed = null;
    cellData[cell].error = errorType;
  }
};

/**
 * Clears error from a cell
 * @param {string} cellRef - Cell to clear
 * @param {object} cellData - Spreadsheet data
 */
export const clearCellError = (cellRef, cellData) => {
  cellData[cellRef].error = null;
};
