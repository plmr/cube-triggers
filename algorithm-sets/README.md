# Algorithm Sets

This directory contains curated algorithm collections for speedcubing analysis and trigger identification.

## File Format

All algorithm files should follow this format:

```
# Algorithm Set Name
# Source: URL or reference
# Description: Brief description of the algorithm set
# Format: Case Name: Algorithm moves
# Comments start with # and are ignored during import
#
# Last updated: Date

Case Name: Algorithm moves
Case Name: Algorithm moves
...
```

## Supported Comment Styles

- `#` - Hash/pound comments
- `//` - Double slash comments  
- `/*` - C-style block comments
- `*` - Asterisk comments
- `<!--` - HTML-style comments

## Current Algorithm Sets

### JPermFullOll.txt
- **Source**: https://jperm.net/algs/oll
- **Description**: Complete set of 57 OLL (Orientation of Last Layer) algorithms
- **Cases**: OLL 1-57
- **Total Algorithms**: 57 algorithms

### JPermFullPll.txt
- **Source**: https://jperm.net/algs/pll
- **Description**: Complete set of 21 PLL (Permutation of Last Layer) algorithms
- **Cases**: All standard PLL cases (Aa, Ab, E, F, Ga-Gd, H, Ja-Jb, Na-Nb, Ra-Rb, T, Ua-Ub, V, Y, Z)
- **Total Algorithms**: 21 algorithms

## Adding New Algorithm Sets

When adding new algorithm files:

1. Use descriptive filenames (e.g., `PLLAlgorithms.txt`, `F2LCases.txt`)
2. Include proper header comments with source and description
3. Use standard case naming conventions (OLL 1, PLL A-Perm, F2L 1, etc.)
4. Test import to ensure proper parsing and classification
5. Update this README with the new file information

## Import Instructions

1. Copy the entire file content (including comments)
2. Paste into the CubeTriggers import form
3. Comments will be automatically ignored
4. Algorithms will be classified by case name prefix (OLL, PLL, F2L, etc.)