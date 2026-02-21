# @dvashim/biome-config

## 1.2.1

### Patch Changes

- [#60](https://github.com/dvashim/biome-config/pull/60) [`f760e69`](https://github.com/dvashim/biome-config/commit/f760e6986f11da997bd78acde2e962cd1946b313) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update Biome to the latest version (currently 2.4.4)

  - add nursery rules to the react strict/balanced configuration
    - ✔ lint/nursery/noConditionalExpect
    - ✔ lint/nursery/noPlaywrightElementHandle
    - ✔ lint/nursery/noPlaywrightEval
    - ✔ lint/nursery/noPlaywrightForceOption
    - ✔ lint/nursery/noPlaywrightMissingAwait
    - ✔ lint/nursery/noPlaywrightNetworkidle
    - ✔ lint/nursery/noPlaywrightPagePause
    - ✔ lint/nursery/noPlaywrightUselessAwait
    - ✔ lint/nursery/noPlaywrightWaitForNavigation
    - ✔ lint/nursery/noPlaywrightWaitForSelector
    - ✔ lint/nursery/noPlaywrightWaitForTimeout
    - ✔ lint/nursery/useExpect
    - ✔ lint/nursery/usePlaywrightValidDescribeCallback

## 1.2.0

### Minor Changes

- [#58](https://github.com/dvashim/biome-config/pull/58) [`714931b`](https://github.com/dvashim/biome-config/commit/714931b44a49ff6ab2ed50bd48b3d0b7bf7fe818) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update Biome to the latest version (currently 2.4.0)

  - json: apply useSortedKeys with groupByNesting

  - assist/source/noDuplicateClasses = true
  - javascript.experimentalEmbeddedSnippetsEnabled = on

  - promote nursery rules to stable groups, making them production-ready

## 1.1.13

### Patch Changes

- [#56](https://github.com/dvashim/biome-config/pull/56) [`c5c5a79`](https://github.com/dvashim/biome-config/commit/c5c5a79b2dc2d055deeb1f699e2b338fde1f9442) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update Biome to the latest version (currently 2.3.15)

  React strict configuration:

  - add rule [lint/nursery/noNestedPromises](https://biomejs.dev/linter/rules/no-nested-promises/) `warn`
  - add rule [lint/nursery/noUselessReturn](https://biomejs.dev/linter/rules/no-useless-return/) `warn`

## 1.1.12

### Patch Changes

- [#54](https://github.com/dvashim/biome-config/pull/54) [`8e8082e`](https://github.com/dvashim/biome-config/commit/8e8082e7ac02ba90ce395c9337489219c06f0c22) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Bump version

## 1.1.11

### Patch Changes

- [#49](https://github.com/dvashim/biome-config/pull/49) [`8c9fbe5`](https://github.com/dvashim/biome-config/commit/8c9fbe5676668e662cd6e852d8fd9f2e6f6dd0c5) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update react-balanced config - set noExcessiveLinesPerFunction.maxLines = 100

## 1.1.10

### Patch Changes

- [#45](https://github.com/dvashim/biome-config/pull/45) [`3c3e9db`](https://github.com/dvashim/biome-config/commit/3c3e9db35f525841825e4afd0b6541984e777700) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Add workflow job dependency

## 1.1.9

### Patch Changes

- [#43](https://github.com/dvashim/biome-config/pull/43) [`52efeb2`](https://github.com/dvashim/biome-config/commit/52efeb27a387649b3bf9d73848eec1a716506bfe) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update workflow job names

## 1.1.8

### Patch Changes

- [`c324fd6`](https://github.com/dvashim/biome-config/commit/c324fd67e14c7b9ea271e7cbfd6b7d4b3d9482ee) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update Biome to v2.3.14, overhaul some rules, improve readme

## 1.1.7

### Patch Changes

- [#40](https://github.com/dvashim/biome-config/pull/40) [`be687a6`](https://github.com/dvashim/biome-config/commit/be687a628e89fb2c05486e3028ee88dbb45ac0b6) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Add new nursery rules for react domain, add balanced config

## 1.1.6

### Patch Changes

- [#38](https://github.com/dvashim/biome-config/pull/38) [`aa1b589`](https://github.com/dvashim/biome-config/commit/aa1b589d62ea9012fdb63a076adcdb07cca2e533) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update biome version

## 1.1.5

### Patch Changes

- [#36](https://github.com/dvashim/biome-config/pull/36) [`711429b`](https://github.com/dvashim/biome-config/commit/711429b90ca3532367c401cc9ab216d6041227c3) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Minor readme improvements

## 1.1.4

### Patch Changes

- [#34](https://github.com/dvashim/biome-config/pull/34) [`451bc25`](https://github.com/dvashim/biome-config/commit/451bc25e1dfd7b376610648b1c914f3d79fe737e) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Minor readme improvements

## 1.1.3

### Patch Changes

- [#32](https://github.com/dvashim/biome-config/pull/32) [`642618f`](https://github.com/dvashim/biome-config/commit/642618fd03b84175e6dcb7025796b450dbc74ea9) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Minor readme improvements

## 1.1.2

### Patch Changes

- [#30](https://github.com/dvashim/biome-config/pull/30) [`f3d8bc4`](https://github.com/dvashim/biome-config/commit/f3d8bc49ad73fb14b8637c99d007ea5134312cbd) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Fix readme typo

## 1.1.1

### Patch Changes

- [#28](https://github.com/dvashim/biome-config/pull/28) [`2fbe8c8`](https://github.com/dvashim/biome-config/commit/2fbe8c8250411a87ea37ceb506eeff7e5e2700f5) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Minor readme improvements

## 1.1.0

### Minor Changes

- [#26](https://github.com/dvashim/biome-config/pull/26) [`d9503f8`](https://github.com/dvashim/biome-config/commit/d9503f83cc0668e75c00a1b4ae16f063db63e5de) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Improve readme, update exports

## 1.0.9

### Patch Changes

- [#24](https://github.com/dvashim/biome-config/pull/24) [`d4522f4`](https://github.com/dvashim/biome-config/commit/d4522f498e410d1874ba4e1d7656fc70a99a4c5a) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Reorganise files, add testing, update ci/cd

## 1.0.8

### Patch Changes

- [#21](https://github.com/dvashim/biome-config/pull/21) [`e85cfd3`](https://github.com/dvashim/biome-config/commit/e85cfd363ae32f727f9da3ad134f7afbc01dffe2) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Update JSON expanding (set to auto)

## 1.0.7

### Patch Changes

- [#19](https://github.com/dvashim/biome-config/pull/19) [`6cfee2d`](https://github.com/dvashim/biome-config/commit/6cfee2d7252268143d668a5cf8bbf7e50c95b68b) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Finalize publishing (2)

## 1.0.6

### Patch Changes

- [#17](https://github.com/dvashim/biome-config/pull/17) [`2398ba6`](https://github.com/dvashim/biome-config/commit/2398ba669dd116c5adecc732cd5a9023de5ace30) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Finalize publishing (2)

## 1.0.5

### Patch Changes

- [`4b42e8a`](https://github.com/dvashim/biome-config/commit/4b42e8ab81815b1e76418df032c984303e7ba307) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Finalize publishing

## 1.0.4

### Patch Changes

- [#13](https://github.com/dvashim/biome-config/pull/13) [`3be32ce`](https://github.com/dvashim/biome-config/commit/3be32ce70e7d42105269e5b2b56aff7321b80162) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Optimize workflow

## 1.0.3

### Patch Changes

- [#11](https://github.com/dvashim/biome-config/pull/11) [`4e1e33a`](https://github.com/dvashim/biome-config/commit/4e1e33afa4381a36b6637868a0c76f7c56c79ffa) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Implement publishing

## 1.0.2

### Patch Changes

- [#9](https://github.com/dvashim/biome-config/pull/9) [`be19e6d`](https://github.com/dvashim/biome-config/commit/be19e6df357b29c82c8c991f5de27b2fe886aa41) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - optimize github workflow

## 1.0.1

### Patch Changes

- [#5](https://github.com/dvashim/biome-config/pull/5) [`445ee17`](https://github.com/dvashim/biome-config/commit/445ee17478ab2b66d4a05a38be29be1a4b70fe58) Thanks [@aleksei-reznichenko](https://github.com/aleksei-reznichenko)! - Implement changeset workflows
