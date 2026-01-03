# Retirement Projection Calculator

A Monte Carlo simulation-based retirement planning tool that projects your net worth at retirement under various contribution scenarios.

## Features

- **Monte Carlo Simulation**: Run thousands of simulations using log-normal return distribution for realistic projections
- **Multiple Account Types**: Support for 401(k), Traditional IRA, Roth IRA, and Taxable Brokerage accounts
- **Employer Matching**: Model 401(k) employer match contributions
- **Contribution Scenarios**: Create timeline-based scenarios to model stopping or changing contributions
- **Social Security**: Include Social Security benefits in projections
- **Inflation Adjustment**: All results shown in today's dollars
- **Interactive Visualizations**: Histogram showing distribution of outcomes with percentile markers
- **Local Storage**: Automatically saves your data in the browser

## Getting Started

1. Open `index.html` in a modern web browser
2. Fill in your basic information (age, retirement age, salary)
3. Add your retirement accounts
4. (Optional) Create contribution timeline scenarios
5. (Optional) Include Social Security estimates
6. Click "Run Simulation" to see projections

## Usage Guide

### Basic Information

- **Current Age**: Your age today
- **Retirement Age**: Age you plan to retire
- **Annual Salary**: Used for calculating employer match
- **Inflation Rate**: Expected annual inflation (default: 2.5%)
- **Return Preset**: Choose conservative (5%/12%), moderate (7%/15%), or aggressive (9%/18%) market assumptions

### Adding Accounts

Click "Add Account" to add retirement accounts:

- **Account Name**: Descriptive name (e.g., "Vanguard 401k")
- **Account Type**: 401(k), Traditional IRA, Roth IRA, or Taxable
- **Current Balance**: Today's account balance
- **Annual Contribution**: How much you're contributing per year
- **Employer Match**: For 401(k) only - specify match rate and cap

### Contribution Timeline

Create scenarios to model changes to contributions over time:

- **Example**: "Stop 401k contributions in 3 years" to see impact of reducing contributions
- **Example**: "Increase Roth IRA to $7,000 in 2 years" to model ramping up contributions

### Running Simulations

- Default: 10,000 simulations (good balance of accuracy and speed)
- Higher numbers are more accurate but take longer
- Results show 10th, 50th (median), and 90th percentile outcomes

### Understanding Results

- **10th Percentile**: Pessimistic scenario (only 10% of outcomes worse)
- **Median**: Expected outcome (50% above, 50% below)
- **90th Percentile**: Optimistic scenario (only 10% of outcomes better)
- **Histogram**: Shows full distribution of possible outcomes
- **Account Breakdown**: Shows projected value of each account at median outcome

## Technical Details

### Monte Carlo Method

The simulator uses a log-normal distribution for investment returns:
- Prevents negative returns that can occur with normal distribution
- Models the multiplicative nature of compound growth
- More accurately represents real market behavior

### Inflation Adjustment

All projected values are converted to "today's dollars" by discounting future values at the inflation rate. This makes it easier to understand what your retirement nest egg will actually be worth in terms of current purchasing power.

### Social Security

Social Security is modeled as a simple present value calculation of benefits received between start age and retirement age. This is a simplified approach - actual Social Security planning should consider more factors.

### Data Persistence

All inputs are automatically saved to browser localStorage. Your data persists across browser sessions but is stored locally only (never sent to a server).

## Future Enhancements

This is designed as a modular platform for multiple retirement tools. Potential additions:

- Withdrawal strategy calculator (4% rule, dynamic withdrawal)
- Tax optimization (Roth conversion analysis)
- Asset allocation optimizer
- Healthcare cost estimator
- Required Minimum Distribution (RMD) calculator

## Browser Compatibility

Requires a modern browser with ES6 module support:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Disclaimer

This calculator provides educational projections based on assumptions and historical data. Actual investment returns will vary significantly. Past performance does not guarantee future results. Consult a qualified financial advisor for personalized retirement planning advice.

## License

This project is provided as-is for educational purposes.
