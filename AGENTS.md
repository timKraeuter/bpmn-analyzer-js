# AGENTS.md

Guidance for AI coding agents working in the `bpmn-analyzer-js` repository.

## Project Overview

BPMN modeler with integrated control-flow analysis. Extends bpmn-js with WASM-powered
analysis of four properties (Safeness, Option To Complete, Proper Completion, No Dead
Activities), error overlays, counter-example animation, and automated quick fixes.

JavaScript project (ES Modules) with one TypeScript file for type definitions.
Uses Vite for bundling and the bpmn-js dependency injection module system.

## Build / Lint / Test Commands

```bash
npm run all            # Lint + prettier check + test + build (CI pipeline)
npm run build          # Vite production build
npm run lint           # ESLint
npm run pCheck         # Prettier format check
npm run pWrite         # Prettier format write (auto-fix)
npm run test           # Vitest in watch mode
npm run test:run       # Vitest single run (all tests)
npm run test:e2e       # Playwright end-to-end tests (starts dev server)
npm run start          # Vite dev server
npm run dev            # Vite dev server (alias)
```

### Running a Single Test

```bash
npx vitest run src/test/quick-fixes/QuickFixes.spec.js          # Single test file
npx vitest run -t "should register event handlers"               # By test name
npx vitest run src/test/quick-fixes/cmd/                         # Directory of tests
```

### Test Locations

- Unit tests: `src/test/**/*.spec.js`
- E2E tests: `e2e/app.spec.js` (Playwright, Chromium only)
- Test utilities: `src/test/**/test-utils.js`

## Code Style

Formatting is enforced by **Prettier** (default config) and **ESLint** (eslint-config-prettier only).
Always run `npm run pWrite` before committing to auto-format.

### Quotes, Semicolons, Indentation

- **Double quotes** everywhere (`"`, never `'`)
- **Semicolons** always
- **2-space indentation** (no tabs)
- **Trailing commas** in all multi-line constructs (parameters, arrays, objects, imports)
- **Line length** ~80 characters (Prettier default wrapping)
- **LF line endings** enforced via `.gitattributes`

### Imports

ES Modules only (`import`/`export`). No `require()`.

```js
// 1. External/third-party imports first
import { some } from "min-dash";
import { is } from "bpmn-js/lib/util/ModelUtil";

// 2. Local/relative imports second
import { TOGGLE_MODE_EVENT } from "../counter-example-visualization/util/EventHelper";
```

No blank line between the two groups. Multi-name imports use one-per-line with trailing comma:

```js
import {
  AddSubsequentExclusiveGatewayCommand,
  previewSubsequentExclusiveGateway,
} from "./cmd/AddSubsequentExclusiveGatewayCommand";
```

### Exports

- **Modules/constructors**: `export default function ModuleName(...) { ... }`
- **Named constants/helpers**: `export function helperName() { ... }` or bulk `export { A, B, C };`
- **Entry points**: `export { default } from "./src/lib/modeler";`
- Named constants can be exported inline: `export const ANALYSIS_NOTE_TYPE = "analysis-note";`

### Naming Conventions

| Category                     | Convention               | Examples                                        |
| ---------------------------- | ------------------------ | ----------------------------------------------- |
| Constructor functions        | `PascalCase`             | `QuickFixes`, `AnalysisOverlays`                |
| Regular/helper functions     | `camelCase`              | `startAnalysis`, `findNearestConnectedFlowNode` |
| Constants                    | `UPPER_SNAKE_CASE`       | `TOGGLE_MODE_EVENT`, `QUICK_FIX_NOTE_TYPE`      |
| Local variables, parameters  | `camelCase`              | `eventBus`, `diagramXML`, `startTime`           |
| Private instance members     | `_camelCase`             | `this._canvas`, `this._init()`                  |
| WASM/Rust backend properties | `snake_case` (preserved) | `property_results`, `dead_activity_ids`         |

### Functions and Classes

**No ES6 `class` keyword.** Use constructor functions exclusively:

```js
export default function MyModule(eventBus, overlays) {
  // Store dependencies
  this._overlays = overlays;

  // Subscribe to events
  eventBus.on("analysis.done", handleAnalysis);

  // Private inner functions
  function handleAnalysis(result) {
    // ...
  }
}

// Prototype methods for public/shared behavior
MyModule.prototype._init = function () {
  // ...
};

// $inject MUST be the last statement in the file
MyModule.$inject = ["eventBus", "overlays"];
```

**Arrow functions** are for callbacks and lambdas only. Never use them for top-level
function definitions or exports.

### Dependency Injection (`$inject`)

Every module receiving dependencies must declare a `$inject` static array matching
parameter names exactly, in the same order. This is always the last line in the file.

### Event Handling

- Event names use dot-namespaced strings: `"analysis.start"`, `"analysis.done"`
- Custom event names are stored as `UPPER_SNAKE_CASE` constants in `EventHelper.js`
- Event payloads are object literals with shorthand properties: `{ propertyResult }`
- Subscribe via `eventBus.on(eventName, handler)`
- Fire via `eventBus.fire(eventName, payload)`

### Error Handling

- Use **guard clauses with early return** instead of try/catch:
  ```js
  if (!result || !result.property_results) {
    return;
  }
  ```
- No custom error classes or `throw` statements in the codebase

### Comments and Documentation

- Single-line comments: `// Comment text` (space after `//`)
- JSDoc `@typedef` imports at file top for diagram-js types:
  ```js
  /**
   * @typedef {import('diagram-js/lib/model/Types').Shape} Shape
   */
  ```
- JSDoc `@param` / `@returns` on functions with non-obvious types
- Inline `@param` in event callbacks:
  ```js
  eventBus.on("analysis.done", (/** @param {CheckingResponse} result */ result) => { ... });
  ```

### TypeScript Types

The file `src/lib/analysis/Types.ts` contains interface-only type definitions matching
the Rust/WASM backend (snake_case properties). These are referenced via JSDoc `@typedef`
imports in JavaScript files. There is no TypeScript compilation step.

### Module File Structure

Follow this order within each module file:

1. Imports (external, then local)
2. JSDoc `@typedef` block (if needed)
3. Module-level constants (`UPPER_SNAKE_CASE`)
4. `export default function ConstructorName(dep1, dep2, ...) { ... }`
5. Prototype methods
6. `ConstructorName.$inject = [...]` (always last line)

## Testing Conventions

**Framework:** Vitest with global test APIs.

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import QuickFixes from "../../lib/quick-fixes/QuickFixes";
import { createMockShape } from "./test-utils";
```

- Nested `describe` blocks with `it` assertions
- `beforeEach` for test setup / mock re-creation
- `vi.fn()` for mock functions
- Factory functions in `test-utils.js` for creating mock objects
- **AAA pattern** with explicit comments: `// Arrange`, `// Act`, `// Assert`
- Test files use `*.spec.js` suffix
- Test helper files use `test-utils.js` naming

## Architecture

Uses the **bpmn-js DI module system**:

- Each feature is a DI module with `__init__` and `__depends__` arrays
- Modules are composed in `src/lib/modeler.js`
- Inter-module communication via `eventBus` events
- Key events: `analysis.start`, `analysis.done`, plus visualization events in `EventHelper.js`

### Key Directories

```
src/lib/analysis/           # WASM analysis engine + TypeScript type definitions
src/lib/analysis-overlays/  # Error overlay rendering on diagram elements
src/lib/properties-summary/ # UI panel showing property check results
src/lib/quick-fixes/        # Automated fix proposals and commands
src/lib/counter-example-visualization/  # Token animation for counter-examples
  util/EventHelper.js       # Event name constants
  util/ElementHelper.js     # BPMN element type utilities
resources/                  # Sample .bpmn files for examples/testing
```

## CI

GitHub Actions runs on push/PR across macOS, Ubuntu, and Windows with Node.js 22.
The pipeline runs `npm run all` (lint, prettier check, test, build) plus separate
Playwright E2E tests in a dedicated container.
