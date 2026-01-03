import { SimulationResult } from '../models/SimulationResult.js';
import { randomLogNormal, mean, calculatePercentiles } from '../utils/statistics.js';

export class MonteCarloSimulator {
    constructor() {
        this.onProgress = null; // Callback for progress updates
    }

    /**
     * Run Monte Carlo simulation
     * @param {Account[]} accounts - Array of Account objects
     * @param {SimulationParams} params - Simulation parameters
     * @returns {Promise<SimulationResult>} - Simulation results
     */
    async runSimulation(accounts, params) {
        const outcomes = [];
        const accountBreakdowns = [];
        const yearsToRetirement = params.getYearsToRetirement();

        // Initialize yearly outcomes array: yearlyOutcomes[year] = array of outcomes for that year
        const yearlyOutcomes = Array.from({ length: yearsToRetirement + 1 }, () => []);

        const startTime = Date.now();

        for (let i = 0; i < params.numberOfSimulations; i++) {
            const outcome = this.simulateSinglePath(accounts, params, yearsToRetirement);
            outcomes.push(outcome.totalNetWorth);
            accountBreakdowns.push(outcome.accountBreakdown);

            // Store yearly values for this simulation
            for (let year = 0; year <= yearsToRetirement; year++) {
                yearlyOutcomes[year].push(outcome.yearlyValues[year]);
            }

            // Report progress every 100 iterations
            if (this.onProgress && i % 100 === 0) {
                this.onProgress(i, params.numberOfSimulations);
            }

            // Yield control every 500 iterations to keep UI responsive
            if (i % 500 === 0) {
                await this.sleep(0);
            }
        }

        const endTime = Date.now();
        console.log(`Simulation completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

        // Report completion
        if (this.onProgress) {
            this.onProgress(params.numberOfSimulations, params.numberOfSimulations);
        }

        return this.processResults(outcomes, accountBreakdowns, yearlyOutcomes);
    }

    /**
     * Simulate a single path through retirement
     * @param {Account[]} accounts - Array of accounts
     * @param {SimulationParams} params - Simulation parameters
     * @param {number} years - Years to retirement
     * @returns {Object} - { totalNetWorth, accountBreakdown }
     */
    simulateSinglePath(accounts, params, years) {
        // Initialize account balances
        const accountBalances = new Map();
        for (const account of accounts) {
            accountBalances.set(account.id, account.currentBalance);
        }

        // Track net worth at each year (including year 0)
        const yearlyValues = [];

        // Calculate initial net worth (year 0)
        let currentNetWorth = 0;
        for (const balance of accountBalances.values()) {
            currentNetWorth += balance;
        }
        yearlyValues.push(currentNetWorth);

        // Simulate year by year
        for (let year = 0; year < years; year++) {
            // Generate this year's market return
            const annualReturn = randomLogNormal(
                params.returnDistribution.mean,
                params.returnDistribution.stdDev
            );

            // Update each account
            for (const account of accounts) {
                const currentBalance = accountBalances.get(account.id);

                // Get contribution for this year (considering timeline changes)
                const contribution = account.getContributionForYear(year);

                // Calculate employer match if applicable
                const employerMatch = this.calculateEmployerMatch(account, contribution, params.currentSalary);

                // Calculate new balance: (balance + contributions + match) × (1 + return)
                const newBalance = (currentBalance + contribution + employerMatch) * (1 + annualReturn);

                accountBalances.set(account.id, newBalance);
            }

            // Calculate total net worth at end of this year
            let totalNetWorth = 0;
            for (const balance of accountBalances.values()) {
                totalNetWorth += balance;
            }

            // Store this year's net worth (in today's dollars)
            yearlyValues.push(this.adjustForInflation(totalNetWorth, params.inflationRate, year + 1));
        }

        // Calculate final total net worth
        let totalNetWorth = 0;
        for (const balance of accountBalances.values()) {
            totalNetWorth += balance;
        }

        // Add Social Security present value if configured
        const ssValue = this.calculateSocialSecurityValue(params, years);
        totalNetWorth += ssValue;

        // Adjust for inflation to get value in today's dollars
        const todayNetWorth = this.adjustForInflation(totalNetWorth, params.inflationRate, years);

        // Create account breakdown object
        const accountBreakdown = {};
        for (const [accountId, balance] of accountBalances.entries()) {
            const account = accounts.find(a => a.id === accountId);
            accountBreakdown[accountId] = {
                name: account.name,
                type: account.type,
                balance: this.adjustForInflation(balance, params.inflationRate, years)
            };
        }

        if (ssValue > 0) {
            accountBreakdown['social_security'] = {
                name: 'Social Security',
                type: 'social_security',
                balance: this.adjustForInflation(ssValue, params.inflationRate, years)
            };
        }

        return {
            totalNetWorth: todayNetWorth,
            accountBreakdown,
            yearlyValues
        };
    }

    /**
     * Calculate employer match for a contribution
     * @param {Account} account - Account object
     * @param {number} contribution - Employee contribution
     * @param {number} salary - Annual salary
     * @returns {number} - Employer match amount
     */
    calculateEmployerMatch(account, contribution, salary) {
        // Only 401k accounts can have employer match
        if (!account.employerMatch || account.type !== '401k') {
            return 0;
        }

        const { rate, capPercent } = account.employerMatch;

        // Calculate maximum matchable contribution (cap % of salary)
        const maxMatchableContribution = salary * (capPercent / 100);

        // Employer matches up to the cap
        const matchableAmount = Math.min(contribution, maxMatchableContribution);

        // Apply match rate
        return matchableAmount * (rate / 100);
    }

    /**
     * Calculate present value of Social Security at retirement
     * @param {SimulationParams} params - Simulation parameters
     * @param {number} yearsToRetirement - Years until retirement
     * @returns {number} - Present value of Social Security
     */
    calculateSocialSecurityValue(params, yearsToRetirement) {
        if (!params.socialSecurity || params.socialSecurity.monthlyBenefit <= 0) {
            return 0;
        }

        const { startAge, monthlyBenefit } = params.socialSecurity;

        // If starting to collect before retirement, calculate years of benefits received by retirement
        const yearsReceiving = Math.max(0, params.retirementAge - startAge);

        if (yearsReceiving <= 0) {
            return 0;
        }

        // Simple present value: years × 12 months × monthly benefit
        // This represents the value of SS benefits received between start age and retirement age
        // More sophisticated models could discount these payments, but keeping it simple
        return yearsReceiving * 12 * monthlyBenefit;
    }

    /**
     * Adjust future value for inflation to get today's dollars
     * @param {number} futureValue - Value in future dollars
     * @param {number} inflationRate - Annual inflation rate
     * @param {number} years - Number of years
     * @returns {number} - Value in today's dollars
     */
    adjustForInflation(futureValue, inflationRate, years) {
        return futureValue / Math.pow(1 + inflationRate, years);
    }

    /**
     * Process simulation results into SimulationResult object
     * @param {number[]} outcomes - Array of net worth outcomes
     * @param {Object[]} accountBreakdowns - Array of account breakdown objects
     * @param {Array[]} yearlyOutcomes - Array of yearly outcome arrays
     * @returns {SimulationResult} - Processed results
     */
    processResults(outcomes, accountBreakdowns, yearlyOutcomes) {
        // Sort outcomes
        const sortedOutcomes = [...outcomes].sort((a, b) => a - b);

        // Calculate statistics
        const percentiles = calculatePercentiles(sortedOutcomes);
        const meanValue = mean(sortedOutcomes);
        const medianValue = percentiles.p50;

        return new SimulationResult({
            outcomes: sortedOutcomes,
            accountBreakdowns,
            percentiles,
            mean: meanValue,
            median: medianValue,
            timestamp: Date.now(),
            yearlyOutcomes
        });
    }

    /**
     * Sleep for a specified duration (yields control to event loop)
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} - Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
