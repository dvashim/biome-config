---
"@dvashim/biome-config": minor
---

Bump Biome from 2.4.13 to 2.4.14. Update `$schema` URLs across all configs, `biome.json`, and README. Add four new nursery rules to `react-strict` and `react-balanced` configs:

- `noExcessiveNestedCallbacks` — disallow callbacks nested deeper than the configured maximum, reducing hard-to-follow "callback hell" patterns.
- `noReactStringRefs` — disallow legacy React string refs (`ref="hello"`, `this.refs.hello`) and template-literal refs (`` ref={`hello`} ``); prefer callback refs, `createRef()`, or `useRef()` since string refs are deprecated.
- `useMathMinMax` — prefer `Math.min()` / `Math.max()` over equivalent ternary comparisons (e.g. `a < b ? a : b` → `Math.min(a, b)`) for readability.
- `useTestHooksOnTop` — flag lifecycle hooks (`beforeEach`, `beforeAll`, `afterEach`, `afterAll`) that appear after test cases in the same block; ensures hooks are defined before any test for clearer setup ordering.
