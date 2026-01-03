# HTML Tools

A collection of browser-based financial planning and productivity tools built with vanilla HTML, CSS, and JavaScript. All tools run entirely in your browser with no data sent to any server.

## Available Tools

### Retirement Projection Calculator

Monte Carlo simulation-based retirement planning tool to project your net worth at retirement under various scenarios.

**Features:**
- 10,000-simulation Monte Carlo projections using log-normal return distributions
- Multiple account types: 401(k), Traditional IRA, Roth IRA, HSA, ESOP, Taxable Brokerage
- Pre-tax and post-tax account designations
- Employer 401(k) matching calculations
- Contribution timeline scenarios (model stopping/changing contributions over time)
- Scenario comparison (compare up to 3 different strategies side-by-side)
- Social Security benefit estimates
- Inflation-adjusted results (all values in today's dollars)
- Time series visualization of wealth accumulation at 10th/50th/90th percentiles
- Distribution histogram of retirement outcomes
- Export/import configurations as JSON

**[Launch Retirement Calculator →](retirement-calculator/)**

See the [Retirement Calculator README](retirement-calculator/README.md) for detailed documentation.

## Running Locally

These tools use ES6 modules and require serving via HTTP. You can use any static file server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (with npx)
npx http-server

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Privacy

All tools run entirely client-side in your browser. No data is transmitted to any server. All calculations happen locally, and any data persistence uses browser localStorage only.

## Technology

- Vanilla JavaScript (ES6 modules)
- Chart.js for visualization
- No frameworks, no build process, no dependencies beyond Chart.js CDN

## License

BSD 3-Clause License - see [LICENSE](LICENSE) file for details.

## Contributing

This is a personal project, but issues and suggestions are welcome.

## Future Tools

Planned additions to this collection:
- Withdrawal strategy calculator
- Tax optimization tools
- Asset allocation optimizer
- Healthcare cost estimator
