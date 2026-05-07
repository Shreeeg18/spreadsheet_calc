import React from 'react';
import '../styles/spreadsheet.css';

const HeaderRow = React.memo(React.forwardRef(({ columns }, ref) => {
  return (
    <div className="header-row" ref={ref}>
      <div className="header-row__corner"></div>
      {columns.map((col) => (
        <div key={col} className="header-row__cell">
          {col}
        </div>
      ))}
    </div>
  );
}));

HeaderRow.displayName = 'HeaderRow';

export default HeaderRow;
