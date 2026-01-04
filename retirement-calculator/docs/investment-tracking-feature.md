# Investment Tracking Feature Design

## Overview

This document outlines the architectural changes needed to support tracking actual investments (e.g., VTSAX, VBTLX) as percentages within each account, rather than applying a single global return rate to all accounts.

## Current Architecture

The system currently uses a **single global return distribution** that applies to all accounts equally:

```javascript
// MonteCarloSimulator.js:84-87
const annualReturn = randomLogNormal(
    params.returnDistribution.mean,
    params.returnDistribution.stdDev
);
```

This one return value is applied to every account in that simulation year.

## Proposed Changes

### 1. Account Data Model (Account.js)

Add a `holdings` or `allocation` property to the Account class:

```javascript
holdings: [
  { fund: 'VTSAX', assetClass: 'US_STOCKS', percentage: 70 },
  { fund: 'VBTLX', assetClass: 'BONDS', percentage: 20 },
  { fund: 'VTIAX', assetClass: 'INTL_STOCKS', percentage: 10 }
]
```

**Validation requirements:**
- Percentages must sum to 100%
- Each percentage must be >= 0
- Holdings array can be empty (defaults to global return)

### 2. Asset Class Return Distributions (SimulationParams.js)

Define return characteristics for different asset classes:

```javascript
ASSET_CLASS_RETURNS = {
  US_STOCKS: { mean: 0.09, stdDev: 0.18, name: 'US Stocks' },
  INTL_STOCKS: { mean: 0.08, stdDev: 0.20, name: 'International Stocks' },
  BONDS: { mean: 0.04, stdDev: 0.06, name: 'Bonds' },
  REAL_ESTATE: { mean: 0.08, stdDev: 0.15, name: 'Real Estate/REITs' },
  CASH: { mean: 0.02, stdDev: 0.01, name: 'Cash/Money Market' }
}
```

Historical references (approximate):
- US Stocks (S&P 500): ~10% annual return, ~18% volatility
- International Stocks: ~8% annual return, ~20% volatility
- Investment-Grade Bonds: ~4% annual return, ~6% volatility

### 3. Simulation Logic Changes (MonteCarloSimulator.js)

**Current approach** (line 82-103):
```javascript
for (let year = 0; year < years; year++) {
    const annualReturn = randomLogNormal(...);  // One return for all

    for (const account of accounts) {
        const newBalance = (currentBalance + contribution + match) * (1 + annualReturn);
    }
}
```

**Proposed approach**:
```javascript
for (let year = 0; year < years; year++) {
    // Generate returns for each asset class
    const assetReturns = {
        US_STOCKS: randomLogNormal(RETURNS.US_STOCKS.mean, RETURNS.US_STOCKS.stdDev),
        INTL_STOCKS: randomLogNormal(RETURNS.INTL_STOCKS.mean, RETURNS.INTL_STOCKS.stdDev),
        BONDS: randomLogNormal(RETURNS.BONDS.mean, RETURNS.BONDS.stdDev),
        REAL_ESTATE: randomLogNormal(RETURNS.REAL_ESTATE.mean, RETURNS.REAL_ESTATE.stdDev),
        CASH: randomLogNormal(RETURNS.CASH.mean, RETURNS.CASH.stdDev)
    };

    for (const account of accounts) {
        // Calculate weighted return based on account allocation
        let accountReturn;

        if (account.holdings && account.holdings.length > 0) {
            accountReturn = 0;
            for (const holding of account.holdings) {
                accountReturn += (holding.percentage / 100) * assetReturns[holding.assetClass];
            }
        } else {
            // Fallback to global return if no holdings specified
            accountReturn = assetReturns.GLOBAL || randomLogNormal(params.returnDistribution.mean, params.returnDistribution.stdDev);
        }

        const newBalance = (currentBalance + contribution + match) * (1 + accountReturn);
    }
}
```

### 4. Asset Correlation (Advanced)

**Current limitation**: The proposed approach generates independent returns for each asset class, but real-world asset classes are correlated.

**Example correlations**:
- US Stocks ↔ International Stocks: ~0.7 (positive correlation)
- Stocks ↔ Bonds: ~-0.2 (weak negative correlation)
- Different stocks: ~0.8-0.9 (high positive correlation)

**Why this matters**:
- Independent returns overestimate diversification benefits
- During market crashes, correlated assets fall together
- During recoveries, correlated assets rise together

**Implementation approach** (if needed):
Use a correlation matrix and Cholesky decomposition to generate correlated returns:

```javascript
// Correlation matrix
const correlations = [
  [1.00, 0.70, -0.20, 0.50],  // US Stocks
  [0.70, 1.00, -0.15, 0.45],  // Intl Stocks
  [-0.20, -0.15, 1.00, 0.10], // Bonds
  [0.50, 0.45, 0.10, 1.00]    // Real Estate
];

// Generate correlated returns
const uncorrelated = [normalRandom(), normalRandom(), normalRandom(), normalRandom()];
const correlated = choleskyDecomposition(correlations, uncorrelated);
```

This is mathematically complex but provides more realistic modeling.

### 5. UI Changes

**Account Manager (AccountManager.js)**:
- Add "Allocation" section for each account
- Fund/asset class picker (dropdown or searchable)
- Percentage input with live validation
- Visual indicator when percentages don't sum to 100%
- "Auto-fill common allocations" presets:
  - Conservative: 30% stocks, 70% bonds
  - Moderate: 60% stocks, 40% bonds
  - Aggressive: 80% stocks, 20% bonds
  - Three-fund: 40% US, 20% Intl, 40% Bonds

**Fund Library** (new):
Create a reference library of common funds:
```javascript
FUND_LIBRARY = {
  VTSAX: { name: 'Vanguard Total Stock Market', assetClass: 'US_STOCKS' },
  VFIAX: { name: 'Vanguard 500 Index', assetClass: 'US_STOCKS' },
  VTIAX: { name: 'Vanguard Total International', assetClass: 'INTL_STOCKS' },
  VBTLX: { name: 'Vanguard Total Bond Market', assetClass: 'BONDS' },
  VGSLX: { name: 'Vanguard Real Estate Index', assetClass: 'REAL_ESTATE' }
}
```

**Results Display (ResultsDisplay.js)**:
- Show allocation breakdown in hover tooltips
- Per-account allocation pie charts (optional)
- Weighted average return by account

## Benefits

1. **More Accurate Diversification Modeling**: Captures real portfolio behavior across asset classes
2. **Tax-Location Optimization**: Can model strategies like:
   - Bonds in taxable accounts (lower tax on interest)
   - Growth stocks in Roth IRA (tax-free growth)
   - International stocks in taxable (foreign tax credit)
3. **Rebalancing Strategies**: Could simulate periodic rebalancing
4. **Better Risk Assessment**: Different accounts can have different risk profiles
5. **Scenario Testing**: Compare 60/40 vs 80/20 allocations, etc.

## Trade-offs

### Pros:
- More realistic and accurate modeling
- Enables sophisticated tax optimization strategies
- Better represents actual investor behavior

### Cons:
- **Complexity**: Much more complex to implement and maintain
- **Data Maintenance**: Need to maintain/update asset class return assumptions
- **Performance**: Generating multiple returns (especially correlated) is slower
- **User Friction**: More inputs required, steeper learning curve
- **Analysis Paralysis**: Users might spend too much time tweaking allocations

## Implementation Approach

### Phase 1: Simple Weighted Returns (Recommended Starting Point)
1. Add holdings array to Account model
2. Define asset class return characteristics
3. Implement weighted return calculation (no correlation)
4. Basic UI for allocation input
5. Make feature optional - keep simple mode as default

### Phase 2: Enhanced Features
1. Add fund library with searchable UI
2. Pre-populated allocation templates
3. Allocation visualization (pie charts)
4. Validation and warnings for unusual allocations

### Phase 3: Advanced Modeling (Optional)
1. Implement correlation matrix
2. Add rebalancing simulation options
3. Tax-location optimization suggestions
4. Historical backtesting against real data

## Backward Compatibility

To maintain backward compatibility:
- If `holdings` is undefined or empty, use global return distribution
- Existing configurations continue to work without changes
- Add "Advanced: Custom Allocation" toggle in UI to opt-in

## Data Model Example

```javascript
// Example account with investment tracking
{
  id: "abc-123",
  name: "Roth IRA",
  type: "roth_ira",
  currentBalance: 50000,
  annualContribution: 7000,
  taxTreatment: "post_tax",
  holdings: [
    { fund: "VTSAX", assetClass: "US_STOCKS", percentage: 60 },
    { fund: "VTIAX", assetClass: "INTL_STOCKS", percentage: 30 },
    { fund: "VBTLX", assetClass: "BONDS", percentage: 10 }
  ]
}
```

## Open Questions

1. Should we track specific funds or just asset classes?
   - **Asset classes**: Simpler, more maintainable
   - **Specific funds**: More detailed, requires expense ratio tracking

2. How often should allocations rebalance?
   - Annually? Never? User-configurable?

3. Should we model contribution allocation separately from rebalancing?
   - New contributions could go to different allocations than current holdings

4. Should we support target-date fund modeling?
   - These automatically shift allocation over time (glide path)

5. How to handle expense ratios?
   - Could subtract from returns (e.g., 0.04% for VTSAX)
   - Probably too granular for this tool's scope

## References

- Historical returns: https://www.portfoliovisualizer.com/
- Asset correlation data: https://www.blackrock.com/corporate/literature/whitepaper/bii-strategic-asset-allocation-2021.pdf
- Vanguard fund characteristics: https://investor.vanguard.com/
