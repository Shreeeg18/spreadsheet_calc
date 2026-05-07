// Generate column labels dynamically (A-Z, then AA, AB, etc.)

export const generateColumnLabel = (index) => {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  }
  // AA, AB, AC, ...
  const firstLetter = String.fromCharCode(65 + Math.floor((index - 26) / 26));
  const secondLetter = String.fromCharCode(65 + ((index - 26) % 26));
  return firstLetter + secondLetter;
};

export const generateColumnArray = (count) => {
  const columns = [];
  for (let i = 0; i < count; i++) {
    columns.push(generateColumnLabel(i));
  }
  return columns;
};

export const generateRowArray = (count) => {
  const rows = [];
  for (let i = 1; i <= count; i++) {
    rows.push(i);
  }
  return rows;
};

export const getColumnIndex = (label) => {
  if (label.length === 1) {
    return label.charCodeAt(0) - 65;
  }
  // AA, AB, etc.
  const first = label.charCodeAt(0) - 65;
  const second = label.charCodeAt(1) - 65;
  return 26 + first * 26 + second;
};
