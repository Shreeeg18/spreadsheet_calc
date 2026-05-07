// Tokenizes formula expressions into discrete tokens

const CELL_REF_SINGLE = /^[A-Z]+\d+$/;

export const TOKEN_TYPES = {
  NUMBER: 'NUMBER',
  CELL_REF: 'CELL_REF',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  UNKNOWN: 'UNKNOWN'
};

export const tokenize = (expression) => {
  const tokens = [];
  let i = 0;
  
  while (i < expression.length) {
    const char = expression[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Parentheses
    if (char === '(') {
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: '(' });
      i++;
      continue;
    }
    
    if (char === ')') {
      tokens.push({ type: TOKEN_TYPES.RPAREN, value: ')' });
      i++;
      continue;
    }
    
    // Operators
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: char });
      i++;
      continue;
    }
    
    // Numbers (including decimals)
    if (/\d/.test(char)) {
      let numStr = '';
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        numStr += expression[i];
        i++;
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: parseFloat(numStr) });
      continue;
    }
    
    // Cell references (A1, B10, AA5, etc.)
    if (/[A-Z]/.test(char)) {
      let cellRef = '';
      const start = i;
      
      while (i < expression.length && /[A-Z0-9]/.test(expression[i])) {
        cellRef += expression[i];
        i++;
      }
      
      if (CELL_REF_SINGLE.test(cellRef)) {
        tokens.push({ type: TOKEN_TYPES.CELL_REF, value: cellRef });
      } else {
        // Invalid cell reference
        tokens.push({ type: TOKEN_TYPES.UNKNOWN, value: cellRef });
      }
      continue;
    }
    
    // Unknown character
    tokens.push({ type: TOKEN_TYPES.UNKNOWN, value: char });
    i++;
  }
  
  return tokens;
};

/**
 * Validates token stream structure
 * @param {object[]} tokens - Token array
 * @returns {boolean} True if valid
 */
export const isValidTokenSequence = (tokens) => {
  if (tokens.length === 0) return false;
  
  // Check for unknown tokens
  if (tokens.some(t => t.type === TOKEN_TYPES.UNKNOWN)) {
    return false;
  }
  
  // Check for balanced parentheses
  let parenDepth = 0;
  for (const token of tokens) {
    if (token.type === TOKEN_TYPES.LPAREN) parenDepth++;
    if (token.type === TOKEN_TYPES.RPAREN) parenDepth--;
    if (parenDepth < 0) return false;
  }
  if (parenDepth !== 0) return false;
  
  // Check for valid operator positioning
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === TOKEN_TYPES.OPERATOR) {
      // Operator must have operand before and after
      if (i === 0 || i === tokens.length - 1) return false;
      
      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];
      
      // Previous must be operand or closing paren
      if (![TOKEN_TYPES.NUMBER, TOKEN_TYPES.CELL_REF, TOKEN_TYPES.RPAREN].includes(prevToken.type)) {
        return false;
      }
      
      // Next must be operand or opening paren
      if (![TOKEN_TYPES.NUMBER, TOKEN_TYPES.CELL_REF, TOKEN_TYPES.LPAREN].includes(nextToken.type)) {
        return false;
      }
    }
  }
  
  return true;
};
