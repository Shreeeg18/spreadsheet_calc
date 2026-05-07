# Spreadsheet Engine

A working spreadsheet with a formula evaluation engine, dependency tracking, circular reference detection, and optimized recalculation. Built with React and vanilla JavaScript.

## Features

- 10×10 spreadsheet grid (A-J, 1-10)
- Formula support (+, -, *, /, parentheses)
- Automatic dependency updates
- Circular reference detection (#CIRCULAR error)
- Keyboard navigation (arrow keys, Tab, Enter)
- Formula bar for editing
- Undo/Redo (Ctrl+Z, Ctrl+Y)
- Local storage auto-save
- Dependency highlighting

## Tech

- React 18.2.0
- Vite 4.3.0
- Vanilla JS (no formula libraries)

## Quick Start

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`

## Build

```bash
npm run build
```

## How It Works

The engine is independent from React. When you update a cell:

1. **Parser** - Checks if it's a formula, extracts cell references
2. **Tokenizer** - Breaks the formula into tokens (+, -, numbers, etc.)
3. **Evaluator** - Evaluates safely (no `eval()`)
4. **Dependency Graph** - Tracks which cells depend on which
5. **Cycle Detector** - DFS to catch circular references
6. **Recalculate** - Propagates changes through dependents

### Structure

```
src/
├── components/    # UI components
├── engine/        # Calculation logic
├── hooks/         # React state management
├── utils/         # Helpers and constants
└── styles/        # CSS
```

### Cell Format

```javascript
{
  A1: {
    raw: "5",           // What you typed
    computed: 5,        // Calculated result
    dependencies: [],   // Cells it references
    dependents: ["B1"], // Cells that use it
    error: null
  }
}
```

## Usage

1. Click on a cell to select it
2. Type a value or formula
3. Press Enter to confirm
4. Use arrow keys to navigate
5. Double-click to edit a cell
6. Press Escape to cancel editing

### Formula Examples

- `=A1+B1` - Add two cells
- `=A1*2` - Multiply by 2
- `=(A1+B1)/C1` - Complex expression
- `=((A1+5)*2)/B1` - Nested parentheses

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate cells |
| Enter | Move down |
| Tab | Move right |
| Shift+Tab | Move left |
| Double-click | Edit cell |
| Escape | Cancel edit |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

## Error Handling

The spreadsheet displays spreadsheet-style errors:

- `#ERROR` - Invalid syntax or malformed expression
- `#REF` - Unknown cell reference
- `#DIV/0` - Division by zero
- `#CIRCULAR` - Circular dependency detected

## Performance

- Only affected cells recalculate (not the entire grid)
- React.memo optimizes cell rendering
- Efficient dependency graph traversal
- Safe recursion handling prevents stack overflow

## Advanced Features

- **Dependency Visualization** - Blue highlight for dependencies, green for dependents
- **Undo/Redo History** - Full state restoration
- **Local Storage Persistence** - Auto-save on every change
- **Cell Styling** - Visual distinction for formulas and errors

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
