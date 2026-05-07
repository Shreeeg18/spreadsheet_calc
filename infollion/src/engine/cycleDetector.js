// Detects cycles in the dependency graph using DFS

import { getDependencies } from './dependencyGraph.js';

export const wouldCreateCycle = (graph, fromCell, toCell) => {
  // Self-reference is a cycle
  if (fromCell === toCell) return true;
  
  // Check if toCell already depends on fromCell (direct or indirect)
  return canReach(graph, toCell, fromCell);
};

// DFS to check if startCell can reach targetCell in the dependency graph
export const canReach = (graph, startCell, targetCell, visited = new Set()) => {
  // Prevent infinite recursion
  if (visited.has(startCell)) return false;
  visited.add(startCell);
  
  const dependencies = getDependencies(graph, startCell);
  
  for (const dep of dependencies) {
    if (dep === targetCell) return true;
    if (canReach(graph, dep, targetCell, visited)) return true;
  }
  
  return false;
};

/**
 * Detects all cycles in the current dependency graph
 * @param {object} graph - Dependency graph
 * @returns {string[]} Array of cells involved in cycles
 */
export const detectAllCycles = (graph) => {
  const cellsInCycles = new Set();
  
  for (const cell of Object.keys(graph.dependencies)) {
    if (hasCycle(graph, cell)) {
      cellsInCycles.add(cell);
    }
  }
  
  return Array.from(cellsInCycles);
};

/**
 * Checks if a cell is part of a cycle
 * @param {object} graph - Dependency graph
 * @param {string} cellRef - Target cell
 * @returns {boolean}
 */
export const hasCycle = (graph, cellRef) => {
  return canReach(graph, cellRef, cellRef, new Set());
};

/**
 * Gets the cycle path if one exists
 * @param {object} graph - Dependency graph
 * @param {string} cellRef - Starting cell
 * @returns {string[]} Path of cycle or empty array
 */
export const getCyclePath = (graph, cellRef) => {
  const path = [];
  const visited = new Set();
  
  const dfs = (cell) => {
    if (visited.has(cell)) {
      // Found cycle
      const cycleStart = path.indexOf(cell);
      if (cycleStart >= 0) {
        return path.slice(cycleStart).concat(cell);
      }
      return [];
    }
    
    visited.add(cell);
    path.push(cell);
    
    const dependencies = getDependencies(graph, cell);
    for (const dep of dependencies) {
      const result = dfs(dep);
      if (result.length > 0) return result;
    }
    
    path.pop();
    return [];
  };
  
  return dfs(cellRef);
};
