import React, { useState, useCallback, useEffect } from 'react';
import { useSpreadsheet } from '../hooks/useSpreadsheet.js';
import Grid from './Grid.jsx';
import FormulaBar from './FormulaBar.jsx';
import '../styles/spreadsheet.css';

const Spreadsheet = () => {
  const spreadsheet = useSpreadsheet();
  const [editingCell, setEditingCell] = useState(null);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        spreadsheet.undo();
      }
      
      // Ctrl+Y - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        spreadsheet.redo();
      }
      
      // Arrow keys for navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!editingCell) {
          e.preventDefault();
          const directionMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
          };
          // Navigation is handled by Grid component
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, spreadsheet]);
  
  const handleSelectCell = useCallback((cellRef) => {
    spreadsheet.selectCell(cellRef);
    setEditingCell(null);
    spreadsheet.highlightDependencies(cellRef);
  }, [spreadsheet]);
  
  const handleEditCell = useCallback((cellRef) => {
    spreadsheet.selectCell(cellRef);
    setEditingCell(cellRef);
  }, [spreadsheet]);
  
  const handleUpdateCell = useCallback((cellRef, value) => {
    spreadsheet.updateCell(cellRef, value);
    setEditingCell(null);
  }, [spreadsheet]);
  
  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);
  
  const handleNavigate = useCallback((cellRef) => {
    spreadsheet.selectCell(cellRef);
    setEditingCell(null);
  }, [spreadsheet]);
  
  const selectedCellValue = spreadsheet.getCell(spreadsheet.selectedCell);
  
  return (
    <div className="spreadsheet">
      <div className="spreadsheet__toolbar">
        <div className="spreadsheet__title-container">
          <svg className="spreadsheet__icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2H3V4zm0 3h18v10H3V7zm0 11a1 1 0 001 1h16a1 1 0 001-1v-1H3v1z" />
            <rect x="5" y="9" width="2" height="2" fill="white" />
            <rect x="10" y="9" width="2" height="2" fill="white" />
          </svg>
          <div className="spreadsheet__title">
            Spreadsheet Engine
          </div>
        </div>
        
        <div className="spreadsheet__controls">
          <button
            className="button button--secondary"
            onClick={() => spreadsheet.undo()}
            disabled={!spreadsheet.canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          
          <button
            className="button button--secondary"
            onClick={() => spreadsheet.redo()}
            disabled={!spreadsheet.canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          
          <button
            className="button button--secondary"
            onClick={() => spreadsheet.reset()}
            title="Clear all data"
          >
            ↻ Reset
          </button>
          
          <div className="spreadsheet__divider"></div>
          
          <button
            className="button button--secondary"
            onClick={() => spreadsheet.addRow()}
            title="Add row"
          >
            + Row
          </button>
          
          <button
            className="button button--secondary"
            onClick={() => spreadsheet.addColumn()}
            title="Add column"
          >
            + Column
          </button>
        </div>
      </div>
      
      <FormulaBar
        selectedCell={spreadsheet.selectedCell}
        cellValue={selectedCellValue}
        onUpdate={handleUpdateCell}
      />
      
      <Grid
        cells={spreadsheet.cells}
        selectedCell={spreadsheet.selectedCell}
        editingCell={editingCell}
        highlightedDependencies={spreadsheet.highlightedDependencies}
        highlightedDependents={spreadsheet.highlightedDependents}
        colCount={spreadsheet.colCount}
        rowCount={spreadsheet.rowCount}
        onSelectCell={handleSelectCell}
        onUpdateCell={handleUpdateCell}
        onEditCell={handleEditCell}
        onEndEdit={handleEndEdit}
        onNavigate={handleNavigate}
      />
      
      <div className="spreadsheet__info">
        <span>Selected: {spreadsheet.selectedCell}</span>
        <span>Editing: {editingCell ? editingCell : 'None'}</span>
        <span>Undo: {spreadsheet.canUndo ? 'Yes' : 'No'}</span>
      </div>
    </div>
  );
};

export default Spreadsheet;
