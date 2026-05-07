import React from 'react';
import '../styles/spreadsheet.css';

const HeaderRow = React.memo(React.forwardRef(({ columns }, ref) => {
  return (
    <div className="header-row">
      <div className="header-row__corner"></div>
      <div className="header-row__scroll" ref={ref}>
        {columns.map((col) => (
          <div key={col} className="header-row__cell">
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}));

HeaderRow.displayName = 'HeaderRow';

export default HeaderRow;
