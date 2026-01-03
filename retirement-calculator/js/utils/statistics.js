/**
 * Calculate percentile value from sorted array
 * @param {number[]} sortedArray - Array of values (must be sorted)
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} - Value at the specified percentile
 */
export function percentile(sortedArray, percentile) {
    if (!sortedArray || sortedArray.length === 0) {
        return 0;
    }

    if (percentile <= 0) return sortedArray[0];
    if (percentile >= 100) return sortedArray[sortedArray.length - 1];

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
        return sortedArray[lower];
    }

    // Linear interpolation between adjacent values
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calculate mean (average) of an array
 * @param {number[]} array - Array of numbers
 * @returns {number} - Mean value
 */
export function mean(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
}

/**
 * Calculate median of an array
 * @param {number[]} array - Array of numbers (will be sorted)
 * @returns {number} - Median value
 */
export function median(array) {
    if (!array || array.length === 0) return 0;
    const sorted = [...array].sort((a, b) => a - b);
    return percentile(sorted, 50);
}

/**
 * Calculate standard deviation
 * @param {number[]} array - Array of numbers
 * @returns {number} - Standard deviation
 */
export function standardDeviation(array) {
    if (!array || array.length === 0) return 0;
    const avg = mean(array);
    const squareDiffs = array.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate all common percentiles
 * @param {number[]} sortedArray - Array of values (must be sorted)
 * @returns {Object} - Object with p10, p25, p50, p75, p90
 */
export function calculatePercentiles(sortedArray) {
    return {
        p10: percentile(sortedArray, 10),
        p25: percentile(sortedArray, 25),
        p50: percentile(sortedArray, 50),
        p75: percentile(sortedArray, 75),
        p90: percentile(sortedArray, 90)
    };
}

/**
 * Generate a normally distributed random number using Box-Muller transform
 * @param {number} mean - Mean of the distribution
 * @param {number} stdDev - Standard deviation of the distribution
 * @returns {number} - Random number from normal distribution
 */
export function randomNormal(mean = 0, stdDev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
}

/**
 * Generate a log-normally distributed random number
 * Used for modeling investment returns (prevents negative values)
 * @param {number} mean - Expected return (e.g., 0.07 for 7%)
 * @param {number} stdDev - Volatility (e.g., 0.15 for 15%)
 * @returns {number} - Random return value
 */
export function randomLogNormal(mean, stdDev) {
    // Adjust parameters for log-normal distribution
    // E[X] = exp(mu + sigma^2/2)
    // Var[X] = (exp(sigma^2) - 1) * exp(2*mu + sigma^2)
    // Solving for mu and sigma:
    const mu = Math.log(1 + mean) - 0.5 * Math.pow(stdDev, 2);
    const sigma = stdDev;

    // Generate normal random variable
    const z = randomNormal(0, 1);

    // Convert to log-normal and subtract 1 to get return
    return Math.exp(mu + sigma * z) - 1;
}
