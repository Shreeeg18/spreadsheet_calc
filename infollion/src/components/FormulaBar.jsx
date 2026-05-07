import React, { useState, useEffect } from 'react';
import '../styles/formulaBar.css';

const FormulaBar = React.memo(({
  selectedCell,
  cellValue,
  onUpdate
}) => {
  const [inputValue, setInputValue] = useState('');
  
  // Update input when selected cell changes
  useEffect(() => {
    if (cellValue) {
      setInputValue(cellValue.raw);
    }
  }, [selectedCell, cellValue]);
  
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onUpdate(selectedCell, inputValue);
    } else if (e.key === 'Escape') {
      setInputValue(cellValue?.raw || '');
    }
  };
  
  const handleBlur = () => {
    if (inputValue !== cellValue?.raw) {
      onUpdate(selectedCell, inputValue);
    }
  };
  
  return (
    <div className="formula-bar">
      <div className="formula-bar__cell-ref">
        {selectedCell}
      </div>
      <div className="formula-bar__input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="formula-bar__input"
          placeholder="Enter value or formula (=)"
        />
      </div>
    </div>
  );
});

FormulaBar.displayName = 'FormulaBar';

export default FormulaBar;
