---
"@dvashim/biome-config": minor
---

Bump Biome from 2.5.4 to 2.5.5. Update the `$schema` URL across all six dist configs, `biome.json`, and the README. Add one new nursery rule to `react-strict` and `react-balanced`:

- `noNegationInEqualityCheck` — flags a negated operand on the left of a strict equality check (`!foo === bar`). Operator precedence evaluates that as `(!foo) === bar`, which is almost always a mistake for `foo !== bar`. The rule ships an unsafe fix that flips the operator.

It is the only rule Biome 2.5.5 adds — none were renamed, graduated out of nursery, or removed. `react-strict` and `react-balanced` now enumerate 254 rules each; the `-stable` variants are unchanged apart from the `$schema` bump, since nursery rules are stripped from them.
