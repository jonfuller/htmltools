import { formatCurrency, formatCompactCurrency } from '../utils/formatters.js';

export class ResultsDisplay {
    constructor(accountManager) {
        this.accountManager = accountManager;
        this.distributionChart = null;
        this.timeSeriesChart = null;
    }

    /**
     * Display simulation results
     * @param {SimulationResult} result - Simulation results
     * @param {number} currentAge - Current age for time series labels
     */
    display(result, currentAge) {
        // Show results section
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';

        // Update summary cards
        this.updateSummaryCards(result);

        // Update time series chart
        this.updateTimeSeriesChart(result, currentAge);

        // Update distribution chart
        this.updateDistributionChart(result);

        // Update breakdown table
        this.updateBreakdownTable(result);

        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Update summary cards with percentile values
     * @param {SimulationResult} result - Simulation results
     */
    updateSummaryCards(result) {
        document.getElementById('result-p10').textContent = formatCompactCurrency(result.percentiles.p10);
        document.getElementById('result-p50').textContent = formatCompactCurrency(result.percentiles.p50);
        document.getElementById('result-p90').textContent = formatCompactCurrency(result.percentiles.p90);
    }

    /**
     * Update time series chart showing growth over time
     * @param {SimulationResult} result - Simulation results
     * @param {number} currentAge - Current age
     */
    updateTimeSeriesChart(result, currentAge) {
        const canvas = document.getElementById('results-timeseries-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.timeSeriesChart) {
            this.timeSeriesChart.destroy();
        }

        // Get yearly percentile data
        const yearlyData = result.getYearlyPercentiles(currentAge);

        // Create chart
        this.timeSeriesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearlyData.labels,
                datasets: [
                    {
                        label: '90th Percentile (Optimistic)',
                        data: yearlyData.p90,
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Median (50th)',
                        data: yearlyData.p50,
                        borderColor: 'rgb(37, 99, 235)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: '10th Percentile (Pessimistic)',
                        data: yearlyData.p10,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                return `Age ${items[0].label}`;
                            },
                            label: (context) => {
                                return `${context.dataset.label}: ${formatCompactCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        },
                        ticks: {
                            maxRotation: 0,
                            callback: function(value, index) {
                                // Show every 5th year
                                if (index % 5 === 0) {
                                    return yearlyData.labels[index];
                                }
                                return '';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Net Worth (Today\'s Dollars)'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCompactCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update histogram chart
     * @param {SimulationResult} result - Simulation results
     */
    updateDistributionChart(result) {
        const canvas = document.getElementById('results-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.distributionChart) {
            this.distributionChart.destroy();
        }

        // Get histogram data
        const histogramData = result.getHistogramData(50);

        // Create percentile annotations
        const annotations = {
            p10: {
                type: 'line',
                xMin: this.findBucketIndex(result.percentiles.p10, histogramData.boundaries),
                xMax: this.findBucketIndex(result.percentiles.p10, histogramData.boundaries),
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: '10th %ile',
                    position: 'start'
                }
            },
            p50: {
                type: 'line',
                xMin: this.findBucketIndex(result.percentiles.p50, histogramData.boundaries),
                xMax: this.findBucketIndex(result.percentiles.p50, histogramData.boundaries),
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 3,
                label: {
                    display: true,
                    content: 'Median',
                    position: 'start'
                }
            },
            p90: {
                type: 'line',
                xMin: this.findBucketIndex(result.percentiles.p90, histogramData.boundaries),
                xMax: this.findBucketIndex(result.percentiles.p90, histogramData.boundaries),
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: '90th %ile',
                    position: 'start'
                }
            }
        };

        // Create chart
        this.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: histogramData.labels,
                datasets: [{
                    label: 'Frequency',
                    data: histogramData.counts,
                    backgroundColor: 'rgba(37, 99, 235, 0.6)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const index = items[0].dataIndex;
                                const boundaries = histogramData.boundaries;
                                const start = boundaries[index];
                                const end = boundaries[index + 1];
                                return `${formatCompactCurrency(start, 0)} - ${formatCompactCurrency(end, 0)}`;
                            },
                            label: (context) => {
                                const count = context.parsed.y;
                                const total = histogramData.counts.reduce((a, b) => a + b, 0);
                                const percent = ((count / total) * 100).toFixed(1);
                                return `${count} outcomes (${percent}%)`;
                            }
                        }
                    },
                    annotation: {
                        annotations: annotations
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Net Worth at Retirement (Today\'s Dollars)'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            callback: function(value, index) {
                                // Show every nth label to avoid crowding
                                if (index % 5 === 0) {
                                    return histogramData.labels[index];
                                }
                                return '';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Simulations'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Find the bucket index for a value
     * @param {number} value - Value to find
     * @param {number[]} boundaries - Bucket boundaries
     * @returns {number} - Bucket index
     */
    findBucketIndex(value, boundaries) {
        for (let i = 0; i < boundaries.length - 1; i++) {
            if (value >= boundaries[i] && value < boundaries[i + 1]) {
                return i;
            }
        }
        return boundaries.length - 2;
    }

    /**
     * Update breakdown table
     * @param {SimulationResult} result - Simulation results
     */
    updateBreakdownTable(result) {
        const tbody = document.getElementById('results-table-body');
        const medianBreakdown = result.getMedianAccountBreakdown();
        const accounts = this.accountManager.getAccounts();

        let rows = '';
        let totalCurrent = 0;
        let totalProjected = 0;

        // Add rows for each account
        for (const [accountId, breakdown] of Object.entries(medianBreakdown)) {
            let currentBalance = 0;

            if (accountId === 'social_security') {
                currentBalance = 0; // SS has no current balance
            } else {
                const account = accounts.find(a => a.id === accountId);
                currentBalance = account ? account.currentBalance : 0;
                totalCurrent += currentBalance;
            }

            const projectedBalance = breakdown.balance;
            totalProjected += projectedBalance;
            const growth = projectedBalance - currentBalance;

            rows += `
                <tr>
                    <td>${breakdown.name}</td>
                    <td>${formatCurrency(currentBalance)}</td>
                    <td>${formatCurrency(projectedBalance)}</td>
                    <td style="color: ${growth >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                        ${formatCurrency(growth)}
                        ${growth >= 0 ? '↑' : '↓'}
                    </td>
                </tr>
            `;
        }

        // Add total row
        const totalGrowth = totalProjected - totalCurrent;
        rows += `
            <tr style="font-weight: 600; border-top: 2px solid var(--border-color);">
                <td>Total</td>
                <td>${formatCurrency(totalCurrent)}</td>
                <td>${formatCurrency(totalProjected)}</td>
                <td style="color: ${totalGrowth >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${formatCurrency(totalGrowth)}
                    ${totalGrowth >= 0 ? '↑' : '↓'}
                </td>
            </tr>
        `;

        tbody.innerHTML = rows;
    }

    /**
     * Display comparison of multiple scenarios
     * @param {Array} results - Array of {scenario, result} objects
     * @param {number} currentAge - Current age for time series labels
     */
    displayComparison(results, currentAge) {
        // Show results section
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';

        // Update summary cards with first scenario
        this.updateSummaryCards(results[0].result);

        // Update time series chart with all scenarios
        this.updateTimeSeriesChartComparison(results, currentAge);

        // Update distribution chart with all scenarios
        this.updateDistributionChartComparison(results);

        // Update breakdown table with comparison
        this.updateBreakdownTableComparison(results);

        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Update time series chart with multiple scenarios
     * @param {Array} results - Array of {scenario, result} objects
     * @param {number} currentAge - Current age
     */
    updateTimeSeriesChartComparison(results, currentAge) {
        const canvas = document.getElementById('results-timeseries-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.timeSeriesChart) {
            this.timeSeriesChart.destroy();
        }

        // Create datasets for each scenario
        const datasets = [];
        for (const {scenario, result} of results) {
            const yearlyData = result.getYearlyPercentiles(currentAge);

            // Add median line for this scenario
            datasets.push({
                label: `${scenario.name} (Median)`,
                data: yearlyData.p50,
                borderColor: scenario.color,
                backgroundColor: scenario.color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 3,
                fill: false,
                tension: 0.4
            });
        }

        // Create chart
        this.timeSeriesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: results[0].result.getYearlyPercentiles(currentAge).labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Scenario Comparison',
                        font: { size: 14 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                return `Age ${items[0].label}`;
                            },
                            label: (context) => {
                                return `${context.dataset.label}: ${formatCompactCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Net Worth (Today\'s Dollars)'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCompactCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update distribution chart with multiple scenarios
     * @param {Array} results - Array of {scenario, result} objects
     */
    updateDistributionChartComparison(results) {
        const canvas = document.getElementById('results-chart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.distributionChart) {
            this.distributionChart.destroy();
        }

        // Create datasets for each scenario
        const datasets = [];
        for (const {scenario, result} of results) {
            const histogramData = result.getHistogramData(30); // Fewer buckets for comparison

            datasets.push({
                label: scenario.name,
                data: histogramData.counts,
                backgroundColor: scenario.color.replace('rgb', 'rgba').replace(')', ', 0.6)'),
                borderColor: scenario.color,
                borderWidth: 1
            });
        }

        // Use first scenario's labels
        const labels = results[0].result.getHistogramData(30).labels;

        // Create chart
        this.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution Comparison',
                        font: { size: 14 }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Net Worth at Retirement (Today\'s Dollars)'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Simulations'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Update breakdown table with comparison
     * @param {Array} results - Array of {scenario, result} objects
     */
    updateBreakdownTableComparison(results) {
        const tbody = document.getElementById('results-table-body');

        let rows = '';

        // Add header row with scenario names
        rows += `
            <tr style="background-color: var(--background);">
                <th>Scenario</th>
                <th>10th Percentile</th>
                <th>Median</th>
                <th>90th Percentile</th>
            </tr>
        `;

        // Add row for each scenario
        for (const {scenario, result} of results) {
            rows += `
                <tr>
                    <td style="font-weight: 600; border-left: 4px solid ${scenario.color};">${scenario.name}</td>
                    <td>${formatCurrency(result.percentiles.p10)}</td>
                    <td>${formatCurrency(result.percentiles.p50)}</td>
                    <td>${formatCurrency(result.percentiles.p90)}</td>
                </tr>
            `;
        }

        tbody.innerHTML = rows;
    }

    /**
     * Hide results section
     */
    hide() {
        document.getElementById('results-section').style.display = 'none';
    }
}
