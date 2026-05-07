import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import Cell from './Cell.jsx';
import HeaderRow from './HeaderRow.jsx';
import RowLabel from './RowLabel.jsx';
import { generateColumnArray, generateRowArray } from '../utils/columnHelpers.js';
import { getCellReference, parseCellReference } from '../utils/cellHelpers.js';
import { isFormula } from '../utils/formulaHelpers.js';
import '../styles/spreadsheet.css';

const Grid = React.memo(({
  cells,
  selectedCell,
  editingCell,
  highlightedDependencies,
  highlightedDependents,
  colCount,
  rowCount,
  onSelectCell,
  onUpdateCell,
  onEditCell,
  onEndEdit,
  onNavigate
}) => {
  const columns = useMemo(() => generateColumnArray(colCount), [colCount]);
  const rows = useMemo(() => generateRowArray(rowCount), [rowCount]);
  
  const gridBodyRef = useRef(null);
  const headerRowRef = useRef(null);
  
  const handleScroll = useCallback(() => {
    if (gridBodyRef.current && headerRowRef.current) {
      headerRowRef.current.scrollLeft = gridBodyRef.current.scrollLeft;
    }
  }, []);
  
  // Attach scroll listener to grid body
  useEffect(() => {
    const gridBody = gridBodyRef.current;
    if (gridBody) {
      gridBody.addEventListener('scroll', handleScroll);
      return () => gridBody.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  const handleNavigate = useCallback((fromCell, direction) => {
    const parsed = parseCellReference(fromCell);
    if (!parsed) return;
    
    let newCol = parsed.col;
    let newRow = parsed.row;
    
    switch (direction) {
      case 'up':
        if (newRow > 1) newRow--;
        break;
      case 'down':
        if (newRow < rowCount) newRow++;
        break;
      case 'left':
        if (newCol > 0) newCol--;
        break;
      case 'right':
        if (newCol < colCount - 1) newCol++;
        break;
      default:
        return;
    }
    
    const newCell = getCellReference(newCol, newRow);
    onNavigate(newCell);
  }, [onNavigate, rowCount, colCount]);
  
  return (
    <div className="grid">
      <HeaderRow ref={headerRowRef} columns={columns} />
      
      <div className="grid__body" ref={gridBodyRef}>
        {rows.map((row) => (
          <div key={row} className="grid__row">
            <RowLabel row={row} />
            
            {columns.map((col, colIndex) => {
              const cellRef = getCellReference(colIndex, row);
              const cellValue = cells[cellRef];
              
              return (
                <Cell
                  key={cellRef}
                  cellRef={cellRef}
                  value={cellValue}
                  computed={cellValue.computed}
                  error={cellValue.error}
                  isSelected={cellRef === selectedCell}
                  isEditing={cellRef === editingCell}
                  isFormula={isFormula(cellValue.raw)}
                  isDependency={highlightedDependencies.has(cellRef)}
                  isDependent={highlightedDependents.has(cellRef)}
                  onSelect={onSelectCell}
                  onUpdate={onUpdateCell}
                  onEdit={onEditCell}
                  onEndEdit={onEndEdit}
                  onNavigate={(direction) => handleNavigate(cellRef, direction)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;
