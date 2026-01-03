import { AccountManager } from './ui/AccountManager.js';
import { ScenarioBuilder } from './ui/ScenarioBuilder.js';
import { ScenarioManager } from './ui/ScenarioManager.js';
import { ResultsDisplay } from './ui/ResultsDisplay.js';
import { MonteCarloSimulator } from './services/MonteCarloSimulator.js';
import { SimulationParams } from './models/SimulationParams.js';

class RetirementCalculator {
    constructor() {
        this.accountManager = new AccountManager();
        this.scenarioBuilder = new ScenarioBuilder(this.accountManager);
        this.scenarioManager = new ScenarioManager(this.scenarioBuilder);
        this.resultsDisplay = new ResultsDisplay(this.accountManager);
        this.simulator = new MonteCarloSimulator();

        this.initEventListeners();
        this.loadFromLocalStorage();

        // Set up callbacks
        this.accountManager.onAccountsChanged = () => {
            this.saveToLocalStorage();
            this.scenarioBuilder.render(); // Re-render scenarios in case account was deleted
        };

        this.scenarioBuilder.onScenariosChanged = () => {
            this.saveToLocalStorage();
        };

        this.scenarioManager.onScenariosChanged = () => {
            this.saveToLocalStorage();
        };

        this.scenarioManager.onCompareRequested = (scenarios) => {
            this.compareScenarios(scenarios);
        };

        // Set up simulator progress callback
        this.simulator.onProgress = (current, total) => {
            this.updateProgress(current, total);
        };
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Export/Import buttons
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportConfiguration();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.importConfiguration(e.target.files[0]);
        });

        // Basic params form
        const basicForm = document.getElementById('basic-params-form');
        basicForm.addEventListener('change', () => {
            this.saveToLocalStorage();
        });

        // Return preset selector
        const presetSelect = document.getElementById('return-preset');
        presetSelect.addEventListener('change', (e) => {
            const customReturns = document.getElementById('custom-returns');
            customReturns.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            this.saveToLocalStorage();
        });

        // Social Security toggle
        const ssEnabled = document.getElementById('ss-enabled');
        ssEnabled.addEventListener('change', (e) => {
            const ssForm = document.getElementById('ss-form');
            ssForm.style.display = e.target.checked ? 'block' : 'none';
            this.saveToLocalStorage();
        });

        // Social Security form
        const ssForm = document.getElementById('ss-form');
        ssForm.addEventListener('change', () => {
            this.saveToLocalStorage();
        });

        // Simulation settings
        const simSettings = document.getElementById('sim-settings');
        simSettings.addEventListener('change', () => {
            this.saveToLocalStorage();
        });

        // Run simulation button
        const runButton = document.getElementById('run-simulation-btn');
        runButton.addEventListener('click', () => {
            this.runSimulation();
        });
    }

    /**
     * Run the Monte Carlo simulation
     */
    async runSimulation() {
        // Validate inputs
        const accounts = this.accountManager.getAccounts();
        if (accounts.length === 0) {
            alert('Please add at least one account before running the simulation.');
            return;
        }

        const params = this.getSimulationParams();
        const validation = params.validate();
        if (!validation.valid) {
            alert('Invalid simulation parameters:\n\n' + validation.errors.join('\n'));
            return;
        }

        // Show loading indicator
        const runButton = document.getElementById('run-simulation-btn');
        const loadingDiv = document.getElementById('simulation-loading');
        runButton.disabled = true;
        loadingDiv.style.display = 'block';

        try {
            // Run simulation
            const result = await this.simulator.runSimulation(accounts, params);

            // Display results
            this.resultsDisplay.display(result, params.currentAge);

            // Hide loading indicator
            loadingDiv.style.display = 'none';
            runButton.disabled = false;
        } catch (error) {
            console.error('Simulation error:', error);
            alert('An error occurred while running the simulation. Please check the console for details.');
            loadingDiv.style.display = 'none';
            runButton.disabled = false;
        }
    }

    /**
     * Compare multiple scenarios
     * @param {Scenario[]} scenarios - Array of scenarios to compare
     */
    async compareScenarios(scenarios) {
        // Validate inputs
        const accounts = this.accountManager.getAccounts();
        if (accounts.length === 0) {
            alert('Please add at least one account before running comparisons.');
            return;
        }

        const params = this.getSimulationParams();
        const validation = params.validate();
        if (!validation.valid) {
            alert('Invalid simulation parameters:\n\n' + validation.errors.join('\n'));
            return;
        }

        // Show loading indicator
        const runButton = document.getElementById('run-simulation-btn');
        const loadingDiv = document.getElementById('simulation-loading');
        const loadingText = document.querySelector('#simulation-loading p');
        runButton.disabled = true;
        loadingDiv.style.display = 'block';

        try {
            const results = [];

            // Run simulation for each scenario
            for (let i = 0; i < scenarios.length; i++) {
                const scenario = scenarios[i];
                loadingText.innerHTML = `Running simulation for "${scenario.name}" (<span id="loading-progress">0</span>)...`;

                // Clone accounts and apply scenario contribution changes
                const scenarioAccounts = accounts.map(account => {
                    const clonedAccount = account.clone();
                    // Clear existing contribution changes
                    clonedAccount.contributionChanges = [];

                    // Apply this scenario's contribution changes
                    const accountChanges = scenario.contributionChanges.filter(
                        change => change.accountId === account.id
                    );
                    clonedAccount.contributionChanges = accountChanges.map(change => ({
                        yearFromNow: change.yearFromNow,
                        newContribution: change.newContribution,
                        description: change.description
                    }));

                    return clonedAccount;
                });

                // Run simulation
                const result = await this.simulator.runSimulation(scenarioAccounts, params);
                results.push({
                    scenario,
                    result
                });
            }

            // Display comparison results
            this.resultsDisplay.displayComparison(results, params.currentAge);

            // Hide loading indicator
            loadingDiv.style.display = 'none';
            runButton.disabled = false;
            loadingText.innerHTML = 'Running <span id="loading-progress">0</span> simulations...';
        } catch (error) {
            console.error('Comparison error:', error);
            alert('An error occurred while running the comparison. Please check the console for details.');
            loadingDiv.style.display = 'none';
            runButton.disabled = false;
            loadingText.innerHTML = 'Running <span id="loading-progress">0</span> simulations...';
        }
    }

    /**
     * Update progress display
     * @param {number} current - Current simulation number
     * @param {number} total - Total simulations
     */
    updateProgress(current, total) {
        const progressSpan = document.getElementById('loading-progress');
        if (progressSpan) {
            progressSpan.textContent = current.toLocaleString();
        }
    }

    /**
     * Get simulation parameters from form
     * @returns {SimulationParams} - Simulation parameters
     */
    getSimulationParams() {
        const currentAge = parseInt(document.getElementById('current-age').value) || 35;
        const retirementAge = parseInt(document.getElementById('retirement-age').value) || 65;
        const currentSalary = parseFloat(document.getElementById('current-salary').value) || 100000;
        const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 2.5;
        const numberOfSimulations = parseInt(document.getElementById('num-simulations').value) || 10000;

        const returnPreset = document.getElementById('return-preset').value;
        let returnDistribution = null;

        if (returnPreset === 'custom') {
            const expectedReturn = parseFloat(document.getElementById('expected-return').value) / 100 || 0.07;
            const volatility = parseFloat(document.getElementById('volatility').value) / 100 || 0.15;
            returnDistribution = {
                mean: expectedReturn,
                stdDev: volatility
            };
        }

        let socialSecurity = null;
        if (document.getElementById('ss-enabled').checked) {
            socialSecurity = {
                startAge: parseInt(document.getElementById('ss-start-age').value) || 67,
                monthlyBenefit: parseFloat(document.getElementById('ss-monthly-benefit').value) || 2500
            };
        }

        return new SimulationParams({
            currentAge,
            retirementAge,
            currentSalary,
            inflationRate,
            numberOfSimulations,
            returnPreset,
            returnDistribution,
            socialSecurity
        });
    }

    /**
     * Save application state to localStorage
     */
    saveToLocalStorage() {
        const state = {
            accounts: this.accountManager.getAccounts().map(a => a.toJSON()),
            timelineScenarios: this.scenarioBuilder.getScenarios(),
            savedScenarios: this.scenarioManager.getScenarios().map(s => s.toJSON()),
            basicParams: {
                currentAge: document.getElementById('current-age').value,
                retirementAge: document.getElementById('retirement-age').value,
                currentSalary: document.getElementById('current-salary').value,
                inflationRate: document.getElementById('inflation-rate').value,
                returnPreset: document.getElementById('return-preset').value,
                expectedReturn: document.getElementById('expected-return').value,
                volatility: document.getElementById('volatility').value,
                numSimulations: document.getElementById('num-simulations').value
            },
            socialSecurity: {
                enabled: document.getElementById('ss-enabled').checked,
                startAge: document.getElementById('ss-start-age').value,
                monthlyBenefit: document.getElementById('ss-monthly-benefit').value
            }
        };

        try {
            localStorage.setItem('retirementCalculatorState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    /**
     * Load application state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const stateJson = localStorage.getItem('retirementCalculatorState');
            if (!stateJson) {
                return;
            }

            const state = JSON.parse(stateJson);

            // Load accounts
            if (state.accounts && state.accounts.length > 0) {
                this.accountManager.loadAccounts(state.accounts);
            }

            // Load timeline scenarios (contribution changes)
            if (state.timelineScenarios || state.scenarios) {
                this.scenarioBuilder.loadScenarios(state.timelineScenarios || state.scenarios);
            }

            // Load saved scenarios (for comparison)
            if (state.savedScenarios) {
                this.scenarioManager.loadScenarios(state.savedScenarios);
            }

            // Load basic params
            if (state.basicParams) {
                document.getElementById('current-age').value = state.basicParams.currentAge || 35;
                document.getElementById('retirement-age').value = state.basicParams.retirementAge || 65;
                document.getElementById('current-salary').value = state.basicParams.currentSalary || 100000;
                document.getElementById('inflation-rate').value = state.basicParams.inflationRate || 2.5;
                document.getElementById('return-preset').value = state.basicParams.returnPreset || 'moderate';
                document.getElementById('expected-return').value = state.basicParams.expectedReturn || 7.0;
                document.getElementById('volatility').value = state.basicParams.volatility || 15.0;
                document.getElementById('num-simulations').value = state.basicParams.numSimulations || 10000;

                // Show custom returns if needed
                const customReturns = document.getElementById('custom-returns');
                customReturns.style.display = state.basicParams.returnPreset === 'custom' ? 'flex' : 'none';
            }

            // Load Social Security
            if (state.socialSecurity) {
                document.getElementById('ss-enabled').checked = state.socialSecurity.enabled || false;
                document.getElementById('ss-start-age').value = state.socialSecurity.startAge || 67;
                document.getElementById('ss-monthly-benefit').value = state.socialSecurity.monthlyBenefit || 2500;

                const ssForm = document.getElementById('ss-form');
                ssForm.style.display = state.socialSecurity.enabled ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    /**
     * Export configuration to JSON file
     */
    exportConfiguration() {
        try {
            const state = {
                accounts: this.accountManager.getAccounts().map(a => a.toJSON()),
                timelineScenarios: this.scenarioBuilder.getScenarios(),
                savedScenarios: this.scenarioManager.getScenarios().map(s => s.toJSON()),
                basicParams: {
                    currentAge: document.getElementById('current-age').value,
                    retirementAge: document.getElementById('retirement-age').value,
                    currentSalary: document.getElementById('current-salary').value,
                    inflationRate: document.getElementById('inflation-rate').value,
                    returnPreset: document.getElementById('return-preset').value,
                    expectedReturn: document.getElementById('expected-return').value,
                    volatility: document.getElementById('volatility').value,
                    numSimulations: document.getElementById('num-simulations').value
                },
                socialSecurity: {
                    enabled: document.getElementById('ss-enabled').checked,
                    startAge: document.getElementById('ss-start-age').value,
                    monthlyBenefit: document.getElementById('ss-monthly-benefit').value
                },
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            // Create blob and download
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retirement-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Configuration exported successfully');
        } catch (error) {
            console.error('Error exporting configuration:', error);
            alert('Failed to export configuration. Please check the console for details.');
        }
    }

    /**
     * Import configuration from JSON file
     * @param {File} file - JSON file to import
     */
    async importConfiguration(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const state = JSON.parse(text);

            // Validate state structure
            if (!state.accounts && !state.basicParams) {
                throw new Error('Invalid configuration file');
            }

            // Load accounts
            if (state.accounts && state.accounts.length > 0) {
                this.accountManager.loadAccounts(state.accounts);
            }

            // Load timeline scenarios
            if (state.timelineScenarios || state.scenarios) {
                this.scenarioBuilder.loadScenarios(state.timelineScenarios || state.scenarios);
            }

            // Load saved scenarios
            if (state.savedScenarios) {
                this.scenarioManager.loadScenarios(state.savedScenarios);
            }

            // Load basic params
            if (state.basicParams) {
                document.getElementById('current-age').value = state.basicParams.currentAge || 35;
                document.getElementById('retirement-age').value = state.basicParams.retirementAge || 65;
                document.getElementById('current-salary').value = state.basicParams.currentSalary || 100000;
                document.getElementById('inflation-rate').value = state.basicParams.inflationRate || 2.5;
                document.getElementById('return-preset').value = state.basicParams.returnPreset || 'moderate';
                document.getElementById('expected-return').value = state.basicParams.expectedReturn || 7.0;
                document.getElementById('volatility').value = state.basicParams.volatility || 15.0;
                document.getElementById('num-simulations').value = state.basicParams.numSimulations || 10000;

                const customReturns = document.getElementById('custom-returns');
                customReturns.style.display = state.basicParams.returnPreset === 'custom' ? 'flex' : 'none';
            }

            // Load Social Security
            if (state.socialSecurity) {
                document.getElementById('ss-enabled').checked = state.socialSecurity.enabled || false;
                document.getElementById('ss-start-age').value = state.socialSecurity.startAge || 67;
                document.getElementById('ss-monthly-benefit').value = state.socialSecurity.monthlyBenefit || 2500;

                const ssForm = document.getElementById('ss-form');
                ssForm.style.display = state.socialSecurity.enabled ? 'block' : 'none';
            }

            // Save to localStorage
            this.saveToLocalStorage();

            // Clear the file input
            document.getElementById('import-file-input').value = '';

            alert('Configuration imported successfully!');
            console.log('Configuration imported successfully');
        } catch (error) {
            console.error('Error importing configuration:', error);
            alert('Failed to import configuration. Please make sure the file is a valid retirement calculator configuration.');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RetirementCalculator();
});
