/**
 * Format a number as currency
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Format a number as compact currency (e.g., $1.2M, $450K)
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted compact currency string
 */
export function formatCompactCurrency(value, decimals = 1) {
    if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(decimals)}M`;
    } else if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(decimals)}K`;
    } else {
        return formatCurrency(value, 0);
    }
}

/**
 * Format a number as percentage
 * @param {number} value - Value to format (e.g., 0.07 for 7%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted percentage string
 */
export function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number with commas
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted number string
 */
export function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Parse currency string to number
 * @param {string} str - Currency string (e.g., "$1,234.56")
 * @returns {number} - Parsed number
 */
export function parseCurrency(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
}

/**
 * Parse percentage string to decimal
 * @param {string} str - Percentage string (e.g., "7.5%")
 * @returns {number} - Decimal value (e.g., 0.075)
 */
export function parsePercent(str) {
    if (typeof str === 'number') return str / 100;
    if (!str) return 0;
    return (parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0) / 100;
}

/**
 * Format a date timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format time duration in seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g., "2.5s", "1m 30s")
 */
export function formatDuration(seconds) {
    if (seconds < 1) {
        return `${Math.round(seconds * 1000)}ms`;
    } else if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }
}

/**
 * Clamp a number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Round to a specific number of decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded value
 */
export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
