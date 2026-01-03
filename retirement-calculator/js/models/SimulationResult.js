export class SimulationResult {
    constructor({
        outcomes = [],
        accountBreakdowns = [],
        percentiles = null,
        mean = 0,
        median = 0,
        timestamp = null,
        yearlyOutcomes = [] // Array of arrays: yearlyOutcomes[year][simulationIndex] = netWorth
    } = {}) {
        this.outcomes = outcomes; // Array of final net worth values
        this.accountBreakdowns = accountBreakdowns; // Array of account breakdown objects
        this.percentiles = percentiles || { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
        this.mean = mean;
        this.median = median;
        this.timestamp = timestamp || Date.now();
        this.yearlyOutcomes = yearlyOutcomes; // Year-by-year tracking for time series
    }

    /**
     * Get the outcome value at a specific percentile
     * @param {number} percentile - Percentile value (0-100)
     * @returns {number} - Net worth at that percentile
     */
    getPercentile(percentile) {
        const index = Math.floor((percentile / 100) * this.outcomes.length);
        return this.outcomes[Math.min(index, this.outcomes.length - 1)];
    }

    /**
     * Get the median account breakdown
     * @returns {Object} - Account breakdown at median outcome
     */
    getMedianAccountBreakdown() {
        const medianIndex = Math.floor(this.outcomes.length / 2);
        return this.accountBreakdowns[medianIndex] || {};
    }

    /**
     * Get histogram data for charting
     * @param {number} numBuckets - Number of histogram buckets
     * @returns {Object} - { labels: string[], counts: number[], boundaries: number[] }
     */
    getHistogramData(numBuckets = 50) {
        if (this.outcomes.length === 0) {
            return { labels: [], counts: [], boundaries: [] };
        }

        const min = Math.min(...this.outcomes);
        const max = Math.max(...this.outcomes);
        const range = max - min;
        const bucketSize = range / numBuckets;

        // Initialize buckets
        const counts = new Array(numBuckets).fill(0);
        const boundaries = [];

        // Calculate bucket boundaries
        for (let i = 0; i <= numBuckets; i++) {
            boundaries.push(min + (i * bucketSize));
        }

        // Count outcomes in each bucket
        for (const outcome of this.outcomes) {
            let bucketIndex = Math.floor((outcome - min) / bucketSize);
            // Handle edge case where outcome === max
            if (bucketIndex >= numBuckets) bucketIndex = numBuckets - 1;
            counts[bucketIndex]++;
        }

        // Create labels for each bucket
        const labels = [];
        for (let i = 0; i < numBuckets; i++) {
            const start = boundaries[i];
            const end = boundaries[i + 1];
            const midpoint = (start + end) / 2;
            labels.push(this.formatCurrency(midpoint, 0));
        }

        return { labels, counts, boundaries };
    }

    /**
     * Format currency for display
     * @param {number} value - Value to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted currency string
     */
    formatCurrency(value, decimals = 0) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(decimals)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(decimals)}K`;
        } else {
            return `$${value.toFixed(decimals)}`;
        }
    }

    /**
     * Get summary statistics
     * @returns {Object} - Summary statistics
     */
    getSummary() {
        return {
            mean: this.mean,
            median: this.median,
            min: this.outcomes[0],
            max: this.outcomes[this.outcomes.length - 1],
            percentiles: this.percentiles,
            sampleSize: this.outcomes.length
        };
    }

    /**
     * Get yearly percentile data for time series charting
     * @param {number} currentAge - Current age for x-axis labels
     * @returns {Object} - { labels: [], p10: [], p50: [], p90: [] }
     */
    getYearlyPercentiles(currentAge) {
        if (!this.yearlyOutcomes || this.yearlyOutcomes.length === 0) {
            return { labels: [], p10: [], p50: [], p90: [] };
        }

        const labels = [];
        const p10Data = [];
        const p50Data = [];
        const p90Data = [];

        // For each year, calculate percentiles across all simulations
        for (let year = 0; year < this.yearlyOutcomes.length; year++) {
            const yearData = this.yearlyOutcomes[year];

            // Sort the outcomes for this year
            const sorted = [...yearData].sort((a, b) => a - b);

            // Calculate percentiles
            const p10Index = Math.floor(sorted.length * 0.10);
            const p50Index = Math.floor(sorted.length * 0.50);
            const p90Index = Math.floor(sorted.length * 0.90);

            labels.push(currentAge + year);
            p10Data.push(sorted[p10Index]);
            p50Data.push(sorted[p50Index]);
            p90Data.push(sorted[p90Index]);
        }

        return { labels, p10: p10Data, p50: p50Data, p90: p90Data };
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            outcomes: this.outcomes,
            accountBreakdowns: this.accountBreakdowns,
            percentiles: this.percentiles,
            mean: this.mean,
            median: this.median,
            timestamp: this.timestamp
        };
    }

    /**
     * Create SimulationResult from a plain object
     */
    static fromJSON(json) {
        return new SimulationResult(json);
    }
}
