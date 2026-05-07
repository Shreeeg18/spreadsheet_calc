import React, { useState, useRef, useEffect } from 'react';
import '../styles/cell.css';

const Cell = React.memo(({
  cellRef,
  value,
  computed,
  error,
  isSelected,
  isEditing,
  isFormula,
  isDependency,
  isDependent,
  onSelect,
  onUpdate,
  onEdit,
  onEndEdit,
  onNavigate
}) => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(value.raw);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Update input when value changes from outside
  useEffect(() => {
    setInputValue(value.raw);
  }, [value.raw, isEditing]);
  
  const handleClick = () => {
    onSelect(cellRef);
  };
  
  const handleDoubleClick = () => {
    onEdit(cellRef);
  };
  
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (!isEditing) return;
    
    switch (e.key) {
      case 'Enter':
        onUpdate(cellRef, inputValue);
        onNavigate('down');
        e.preventDefault();
        break;
      case 'Tab':
        onUpdate(cellRef, inputValue);
        if (e.shiftKey) {
          onNavigate('left');
        } else {
          onNavigate('right');
        }
        e.preventDefault();
        break;
      case 'Escape':
        setInputValue(value.raw);
        onEndEdit();
        e.preventDefault();
        break;
      default:
        break;
    }
  };
  
  const handleBlur = () => {
    if (isEditing) {
      onUpdate(cellRef, inputValue);
      onEndEdit();
    }
  };
  
  // Determine cell styling
  let cellClassName = 'cell';
  if (isSelected) cellClassName += ' cell--selected';
  if (isEditing) cellClassName += ' cell--editing';
  if (isFormula && !isEditing) cellClassName += ' cell--formula';
  if (error) cellClassName += ' cell--error';
  if (isDependency) cellClassName += ' cell--dependency';
  if (isDependent) cellClassName += ' cell--dependent';
  
  // Display value
  const displayValue = isEditing ? inputValue : (error ? error : (computed ?? ''));
  
  return (
    <div
      className={cellClassName}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={error ? `Error: ${error}` : value.raw}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="cell__input"
        />
      ) : (
        <div className="cell__display">
          {displayValue}
        </div>
      )}
    </div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
