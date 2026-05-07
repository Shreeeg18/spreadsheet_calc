// Evaluates formulas safely without using eval()

import { TOKEN_TYPES, tokenize } from './tokenizer.js';
import { ERROR_TYPES } from '../utils/constants.js';
export const evaluateExpression = (expression, cellValues) => {
  try {
    // Tokenize the expression
    const tokens = tokenize(expression);
    
    if (tokens.length === 0) {
      return { result: null, error: ERROR_TYPES.SYNTAX };
    }
    
    // Log for debugging
    if (typeof window !== 'undefined' && window.DEBUG_SPREADSHEET) {
      console.log('evaluateExpression', { expression, cellValues, tokens });
    }
    
    // Replace cell references with their values
    const replacedTokens = tokens.map(token => {
      if (token.type === TOKEN_TYPES.CELL_REF) {
        const value = cellValues[token.value];
        
        // Debug log
        if (typeof window !== 'undefined' && window.DEBUG_SPREADSHEET) {
          console.log(`  ${token.value} = ${value}`);
        }
        
        // Unknown reference
        if (value === undefined || value === null || value === '') {
          return { type: TOKEN_TYPES.NUMBER, value: 0 };
        }
        
        // Handle numeric values
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return { type: TOKEN_TYPES.NUMBER, value: numValue };
        }
        
        // Non-numeric reference
        return { type: TOKEN_TYPES.NUMBER, value: 0 };
      }
      
      return token;
    });
    
    // Build and evaluate the expression
    const result = evaluateTokens(replacedTokens);
    
    if (result.error) {
      return result;
    }
    
    return { result: result.value, error: null };
  } catch (err) {
    return { result: null, error: ERROR_TYPES.SYNTAX };
  }
};

/**
 * Converts tokens to postfix notation and evaluates (avoids eval())
 * @param {object[]} tokens - Token array with type and value
 * @returns {object} { value, error }
 */
const evaluateTokens = (tokens) => {
  try {
    // Handle simple case of single number
    if (tokens.length === 1 && tokens[0].type === TOKEN_TYPES.NUMBER) {
      return { value: tokens[0].value, error: null };
    }
    
    // Convert to postfix notation and evaluate
    const postfix = infixToPostfix(tokens);
    return evaluatePostfix(postfix);
  } catch (err) {
    return { value: null, error: ERROR_TYPES.SYNTAX };
  }
};

/**
 * Converts infix tokens to postfix notation (Shunting Yard algorithm)
 * @param {object[]} tokens - Infix tokens
 * @returns {object[]} Postfix tokens
 */
const infixToPostfix = (tokens) => {
  const output = [];
  const operatorStack = [];
  
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  
  for (const token of tokens) {
    if (token.type === TOKEN_TYPES.NUMBER) {
      output.push(token);
    } else if (token.type === TOKEN_TYPES.OPERATOR) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === TOKEN_TYPES.OPERATOR &&
        precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
      ) {
        output.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token.type === TOKEN_TYPES.LPAREN) {
      operatorStack.push(token);
    } else if (token.type === TOKEN_TYPES.RPAREN) {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== TOKEN_TYPES.LPAREN) {
        output.push(operatorStack.pop());
      }
      if (operatorStack.length > 0) {
        operatorStack.pop(); // Remove the LPAREN
      }
    }
  }
  
  while (operatorStack.length > 0) {
    output.push(operatorStack.pop());
  }
  
  return output;
};

/**
 * Evaluates postfix notation
 * @param {object[]} postfixTokens - Postfix tokens
 * @returns {object} { value, error }
 */
const evaluatePostfix = (postfixTokens) => {
  const stack = [];
  
  for (const token of postfixTokens) {
    if (token.type === TOKEN_TYPES.NUMBER) {
      stack.push(token.value);
    } else if (token.type === TOKEN_TYPES.OPERATOR) {
      if (stack.length < 2) {
        return { value: null, error: ERROR_TYPES.SYNTAX };
      }
      
      const b = stack.pop();
      const a = stack.pop();
      
      let result;
      switch (token.value) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          if (b === 0) {
            return { value: null, error: ERROR_TYPES.DIV_ZERO };
          }
          result = a / b;
          break;
        default:
          return { value: null, error: ERROR_TYPES.SYNTAX };
      }
      
      stack.push(result);
    }
  }
  
  if (stack.length !== 1) {
    return { value: null, error: ERROR_TYPES.SYNTAX };
  }
  
  return { value: stack[0], error: null };
};

/**
 * Computes a cell value from raw input
 * @param {string} rawValue - Raw cell value
 * @param {object} cellValues - Map of all cell computed values
 * @returns {object} { computed, error }
 */
export const computeCellValue = (rawValue, cellValues) => {
  if (typeof rawValue !== 'string') {
    return { computed: '', error: null };
  }
  
  const trimmed = rawValue.trim();
  
  // Empty cell
  if (trimmed === '') {
    return { computed: '', error: null };
  }
  
  // Plain value (text or number)
  if (!trimmed.startsWith('=')) {
    // Try to parse as number
    const numValue = parseFloat(trimmed);
    if (!isNaN(numValue)) {
      return { computed: numValue, error: null };
    }
    // It's text
    return { computed: trimmed, error: null };
  }
  
  // Formula - evaluate it
  const formula = trimmed.slice(1).trim();
  
  if (formula === '') {
    return { computed: null, error: ERROR_TYPES.SYNTAX };
  }
  
  const result = evaluateExpression(formula, cellValues);
  return {
    computed: result.error ? null : result.result,
    error: result.error
  };
};
