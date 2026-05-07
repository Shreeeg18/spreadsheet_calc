import { useReducer, useCallback, useEffect } from 'react';
import { createEmptySpreadsheet, getCellReference, parseCellReference } from '../utils/cellHelpers.js';
import { isFormula, stripFormulaPrefix, getFormulaReferences } from '../utils/formulaHelpers.js';
import { STORAGE_KEY, MAX_HISTORY, ERROR_TYPES, DEFAULT_COLS, DEFAULT_ROWS } from '../utils/constants.js';
import { createDependencyGraph, updateDependencies, clearCellDependencies, getDependents, getDependencies } from '../engine/dependencyGraph.js';
import { wouldCreateCycle, detectAllCycles } from '../engine/cycleDetector.js';
import { parseFormula } from '../engine/parser.js';
import { computeCellValue, evaluateExpression } from '../engine/evaluator.js';
import { recalculateDownstream, buildValueMap, markCellAndDependentsAsError } from '../engine/recalculate.js';

export const ACTIONS = {
  INIT: 'INIT',
  UPDATE_CELL: 'UPDATE_CELL',
  SELECT_CELL: 'SELECT_CELL',
  UNDO: 'UNDO',
  REDO: 'REDO',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  RESET: 'RESET',
  HIGHLIGHT_DEPENDENCIES: 'HIGHLIGHT_DEPENDENCIES',
  CLEAR_HIGHLIGHTS: 'CLEAR_HIGHLIGHTS',
  ADD_ROW: 'ADD_ROW',
  ADD_COLUMN: 'ADD_COLUMN'
};

const initialState = {
  cells: createEmptySpreadsheet(DEFAULT_COLS, DEFAULT_ROWS),
  graph: createDependencyGraph(),
  selectedCell: 'A1',
  history: [],
  historyIndex: -1,
  highlightedDependencies: new Set(),
  highlightedDependents: new Set(),
  colCount: DEFAULT_COLS,
  rowCount: DEFAULT_ROWS
};

const spreadsheetReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INIT:
      return initialState;
    
    case ACTIONS.UPDATE_CELL: {
      const { cellRef, value } = action.payload;
      
      // Deep copy cells to ensure proper state updates
      const newCells = {};
      Object.keys(state.cells).forEach(key => {
        newCells[key] = { ...state.cells[key] };
      });
      
      const newGraph = {
        dependencies: { ...state.graph.dependencies },
        dependents: { ...state.graph.dependents }
      };
      
      // Save current state to history
      const historyState = JSON.parse(JSON.stringify({
        cells: state.cells,
        graph: {
          dependencies: state.graph.dependencies,
          dependents: state.graph.dependents
        }
      }));
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(historyState);
      
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      // Parse formula if it's a formula
      const parsed = parseFormula(value, state.colCount, state.rowCount);
      
      // Preserve current downstream dependents before clearing links
      const preservedDependents = (newGraph.dependents && newGraph.dependents[cellRef])
        ? [...newGraph.dependents[cellRef]]
        : [];
      
      // Clear old dependencies first
      clearCellDependencies(newGraph, cellRef);
      
      let hasCycleError = false;
      
      // Check for circular references
      if (!parsed.error && parsed.references.length > 0) {
        for (const ref of parsed.references) {
          if (wouldCreateCycle(newGraph, cellRef, ref)) {
            hasCycleError = true;
            break;
          }
        }
      }
      
      // Update cell value
      newCells[cellRef] = {
        raw: value,
        computed: null,
        dependencies: parsed.references || [],
        dependents: newCells[cellRef].dependents || [],
        error: null
      };
      
      if (hasCycleError) {
        // Mark as circular reference
        newCells[cellRef].computed = null;
        newCells[cellRef].error = ERROR_TYPES.CIRCULAR;
        markCellAndDependentsAsError(cellRef, newCells, newGraph, ERROR_TYPES.CIRCULAR);
      } else if (parsed.error) {
        // Parsing error
        newCells[cellRef].computed = null;
        newCells[cellRef].error = parsed.error;
      } else {
        // Valid formula or plain value - compute it
        const valueMap = buildValueMap(newCells);
        const result = computeCellValue(value, valueMap);
        newCells[cellRef].computed = result.computed;
        newCells[cellRef].error = result.error;
        
        // Update dependencies in graph
        if (parsed.references.length > 0) {
          updateDependencies(newGraph, cellRef, parsed.references);
        }
      }
      
      // Recalculate downstream cells using preserved dependents for the edited cell
      recalculateDownstream(cellRef, newCells, newGraph, preservedDependents);
      
      return {
        ...state,
        cells: newCells,
        graph: newGraph,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        highlightedDependencies: new Set(),
        highlightedDependents: new Set()
      };
    }
    
    case ACTIONS.SELECT_CELL: {
      return {
        ...state,
        selectedCell: action.payload,
        highlightedDependencies: new Set(),
        highlightedDependents: new Set()
      };
    }
    
    case ACTIONS.HIGHLIGHT_DEPENDENCIES: {
      const { cell, dependencies, dependents } = action.payload;
      return {
        ...state,
        highlightedDependencies: new Set(dependencies),
        highlightedDependents: new Set(dependents)
      };
    }
    
    case ACTIONS.CLEAR_HIGHLIGHTS: {
      return {
        ...state,
        highlightedDependencies: new Set(),
        highlightedDependents: new Set()
      };
    }
    
    case ACTIONS.UNDO: {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const previousState = state.history[newIndex];
      return {
        ...state,
        cells: JSON.parse(JSON.stringify(previousState.cells)),
        graph: JSON.parse(JSON.stringify(previousState.graph)),
        historyIndex: newIndex,
        highlightedDependencies: new Set(),
        highlightedDependents: new Set()
      };
    }
    
    case ACTIONS.REDO: {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];
      return {
        ...state,
        cells: JSON.parse(JSON.stringify(nextState.cells)),
        graph: JSON.parse(JSON.stringify(nextState.graph)),
        historyIndex: newIndex,
        highlightedDependencies: new Set(),
        highlightedDependents: new Set()
      };
    }
    
    case ACTIONS.LOAD_FROM_STORAGE: {
      const { cells, graph, colCount, rowCount } = action.payload;
      return {
        ...state,
        cells,
        graph,
        colCount: colCount || DEFAULT_COLS,
        rowCount: rowCount || DEFAULT_ROWS,
        history: [],
        historyIndex: -1
      };
    }
    
    case ACTIONS.RESET:
      return initialState;
    
    case ACTIONS.ADD_ROW: {
      const newRowCount = state.rowCount + 1;
      const newCells = { ...state.cells };
      
      for (let col = 0; col < state.colCount; col++) {
        const cellRef = getCellReference(col, newRowCount);
        newCells[cellRef] = {
          raw: '',
          computed: '',
          dependencies: [],
          dependents: [],
          error: null
        };
      }
      
      return {
        ...state,
        cells: newCells,
        rowCount: newRowCount
      };
    }
    
    case ACTIONS.ADD_COLUMN: {
      const newColCount = state.colCount + 1;
      const newCells = { ...state.cells };
      
      for (let row = 1; row <= state.rowCount; row++) {
        const cellRef = getCellReference(newColCount - 1, row);
        newCells[cellRef] = {
          raw: '',
          computed: '',
          dependencies: [],
          dependents: [],
          error: null
        };
      }
      
      return {
        ...state,
        cells: newCells,
        colCount: newColCount
      };
    }
    
    default:
      return state;
  }
};

/**
 * Custom hook for spreadsheet state management
 */
export const useSpreadsheet = () => {
  const [state, dispatch] = useReducer(spreadsheetReducer, initialState);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({
          type: ACTIONS.LOAD_FROM_STORAGE,
          payload: {
            cells: parsed.cells,
            graph: parsed.graph,
            colCount: parsed.colCount,
            rowCount: parsed.rowCount
          }
        });
      } catch (err) {
        console.warn('Failed to load spreadsheet from storage:', err);
      }
    }
  }, []);
  
  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cells: state.cells,
      graph: state.graph,
      colCount: state.colCount,
      rowCount: state.rowCount
    }));
  }, [state.cells, state.graph, state.colCount, state.rowCount]);
  
  // Update cell value
  const updateCell = useCallback((cellRef, value) => {
    dispatch({
      type: ACTIONS.UPDATE_CELL,
      payload: { cellRef, value }
    });
  }, []);
  
  // Select a cell
  const selectCell = useCallback((cellRef) => {
    dispatch({
      type: ACTIONS.SELECT_CELL,
      payload: cellRef
    });
  }, []);
  
  // Undo action
  const undo = useCallback(() => {
    dispatch({ type: ACTIONS.UNDO });
  }, []);
  
  // Redo action
  const redo = useCallback(() => {
    dispatch({ type: ACTIONS.REDO });
  }, []);
  
  // Highlight cell dependencies
  const highlightDependencies = useCallback((cellRef) => {
    const dependencies = getDependencies(state.graph, cellRef);
    const dependents = getDependents(state.graph, cellRef);
    
    dispatch({
      type: ACTIONS.HIGHLIGHT_DEPENDENCIES,
      payload: { cell: cellRef, dependencies, dependents }
    });
  }, [state.graph]);
  
  // Clear highlights
  const clearHighlights = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_HIGHLIGHTS });
  }, []);
  
  // Reset spreadsheet
  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);
  
  // Add a row
  const addRow = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_ROW });
  }, []);
  
  // Add a column
  const addColumn = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_COLUMN });
  }, []);
  
  // Get cell value
  const getCell = useCallback((cellRef) => {
    return state.cells[cellRef];
  }, [state.cells]);
  
  // Get all cells
  const getCells = useCallback(() => {
    return state.cells;
  }, [state.cells]);
  
  // Can undo
  const canUndo = state.historyIndex > 0;
  
  // Can redo
  const canRedo = state.historyIndex < state.history.length - 1;
  
  return {
    // State
    selectedCell: state.selectedCell,
    cells: state.cells,
    graph: state.graph,
    highlightedDependencies: state.highlightedDependencies,
    highlightedDependents: state.highlightedDependents,
    colCount: state.colCount,
    rowCount: state.rowCount,
    
    // Actions
    updateCell,
    selectCell,
    undo,
    redo,
    highlightDependencies,
    clearHighlights,
    reset,
    addRow,
    addColumn,
    getCell,
    getCells,
    
    // State queries
    canUndo,
    canRedo
  };
};
