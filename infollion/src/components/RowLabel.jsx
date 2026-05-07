import React from 'react';
import '../styles/spreadsheet.css';

const RowLabel = React.memo(({ row }) => {
  return (
    <div className="row-label">
      {row}
    </div>
  );
});

RowLabel.displayName = 'RowLabel';

export default RowLabel;
