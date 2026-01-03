import { formatCurrency } from '../utils/formatters.js';

export class ScenarioBuilder {
    constructor(accountManager) {
        this.accountManager = accountManager;
        this.scenarios = []; // Array of contribution changes
        this.currentEditingIndex = null;
        this.onScenariosChanged = null; // Callback when scenarios are modified

        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Add scenario button
        document.getElementById('add-scenario-btn').addEventListener('click', () => {
            this.openScenarioModal();
        });

        // Scenario form submit
        document.getElementById('scenario-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScenario();
        });

        // Cancel button
        document.getElementById('scenario-cancel').addEventListener('click', () => {
            this.closeScenarioModal();
        });

        // Modal close button
        document.querySelector('#scenario-modal .modal-close').addEventListener('click', () => {
            this.closeScenarioModal();
        });

        // Close modal when clicking outside
        document.getElementById('scenario-modal').addEventListener('click', (e) => {
            if (e.target.id === 'scenario-modal') {
                this.closeScenarioModal();
            }
        });
    }

    /**
     * Open the scenario modal for adding or editing
     * @param {number} index - Scenario index to edit (null for new)
     */
    openScenarioModal(index = null) {
        this.currentEditingIndex = index;
        const modal = document.getElementById('scenario-modal');
        const form = document.getElementById('scenario-form');
        const title = document.getElementById('scenario-modal-title');

        form.reset();
        this.updateAccountDropdown();

        if (index !== null) {
            // Edit mode
            title.textContent = 'Edit Contribution Change';
            const scenario = this.scenarios[index];
            if (scenario) {
                this.populateForm(scenario);
            }
        } else {
            // Add mode
            title.textContent = 'Add Contribution Change';
        }

        modal.classList.add('active');
    }

    /**
     * Close the scenario modal
     */
    closeScenarioModal() {
        document.getElementById('scenario-modal').classList.remove('active');
        this.currentEditingIndex = null;
    }

    /**
     * Update the account dropdown with current accounts
     */
    updateAccountDropdown() {
        const select = document.getElementById('scenario-account');
        const accounts = this.accountManager.getAccounts();

        select.innerHTML = '<option value="">Select an account...</option>';

        for (const account of accounts) {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            select.appendChild(option);
        }
    }

    /**
     * Populate form with scenario data
     * @param {Object} scenario - Scenario to edit
     */
    populateForm(scenario) {
        document.getElementById('scenario-account').value = scenario.accountId;
        document.getElementById('scenario-year').value = scenario.yearFromNow;
        document.getElementById('scenario-contribution').value = scenario.newContribution;
        document.getElementById('scenario-description').value = scenario.description;
    }

    /**
     * Save scenario from form
     */
    saveScenario() {
        const formData = new FormData(document.getElementById('scenario-form'));

        const scenario = {
            accountId: formData.get('accountId'),
            yearFromNow: parseInt(formData.get('yearFromNow')) || 1,
            newContribution: parseFloat(formData.get('newContribution')) || 0,
            description: formData.get('description')
        };

        // Validate that account exists
        const account = this.accountManager.getAccounts().find(a => a.id === scenario.accountId);
        if (!account) {
            alert('Please select a valid account');
            return;
        }

        if (this.currentEditingIndex !== null) {
            // Update existing scenario
            this.scenarios[this.currentEditingIndex] = scenario;
        } else {
            // Add new scenario
            this.scenarios.push(scenario);
        }

        // Update account's contribution changes
        this.syncScenariosToAccounts();

        this.render();
        this.closeScenarioModal();

        if (this.onScenariosChanged) {
            this.onScenariosChanged(this.scenarios);
        }
    }

    /**
     * Delete a scenario
     * @param {number} index - Scenario index to delete
     */
    deleteScenario(index) {
        if (confirm('Are you sure you want to delete this timeline change?')) {
            this.scenarios.splice(index, 1);
            this.syncScenariosToAccounts();
            this.render();

            if (this.onScenariosChanged) {
                this.onScenariosChanged(this.scenarios);
            }
        }
    }

    /**
     * Sync scenarios to account contribution changes
     */
    syncScenariosToAccounts() {
        const accounts = this.accountManager.getAccounts();

        // Clear all contribution changes
        for (const account of accounts) {
            account.contributionChanges = [];
        }

        // Add scenarios to their respective accounts
        for (const scenario of this.scenarios) {
            const account = accounts.find(a => a.id === scenario.accountId);
            if (account) {
                account.contributionChanges.push({
                    yearFromNow: scenario.yearFromNow,
                    newContribution: scenario.newContribution,
                    description: scenario.description
                });
            }
        }

        // Sort contribution changes by year for each account
        for (const account of accounts) {
            account.contributionChanges.sort((a, b) => a.yearFromNow - b.yearFromNow);
        }
    }

    /**
     * Render scenarios list
     */
    render() {
        const container = document.getElementById('scenarios-list');
        const accounts = this.accountManager.getAccounts();

        if (this.scenarios.length === 0) {
            container.innerHTML = '<p class="empty-state">No timeline changes scheduled.</p>';
            return;
        }

        // Sort scenarios by year
        const sortedScenarios = [...this.scenarios].sort((a, b) => a.yearFromNow - b.yearFromNow);

        container.innerHTML = sortedScenarios.map((scenario, originalIndex) => {
            // Find the original index for event listeners
            const index = this.scenarios.indexOf(scenario);
            return this.renderScenarioCard(scenario, index, accounts);
        }).join('');

        // Attach event listeners
        this.scenarios.forEach((scenario, index) => {
            document.getElementById(`edit-scenario-${index}`).addEventListener('click', () => {
                this.openScenarioModal(index);
            });

            document.getElementById(`delete-scenario-${index}`).addEventListener('click', () => {
                this.deleteScenario(index);
            });
        });
    }

    /**
     * Render a single scenario card
     * @param {Object} scenario - Scenario to render
     * @param {number} index - Scenario index
     * @param {Account[]} accounts - Array of accounts
     * @returns {string} - HTML string
     */
    renderScenarioCard(scenario, index, accounts) {
        const account = accounts.find(a => a.id === scenario.accountId);
        const accountName = account ? account.name : 'Unknown Account';

        return `
            <div class="scenario-card">
                <div class="scenario-card-header">
                    <div class="scenario-card-title">
                        Year ${scenario.yearFromNow}: ${scenario.description}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-small btn-secondary" id="edit-scenario-${index}">Edit</button>
                        <button class="btn btn-small btn-danger" id="delete-scenario-${index}">Delete</button>
                    </div>
                </div>
                <div class="scenario-card-body">
                    <div class="account-info">
                        <div class="account-info-label">Account</div>
                        <div class="account-info-value">${accountName}</div>
                    </div>
                    <div class="account-info">
                        <div class="account-info-label">New Contribution</div>
                        <div class="account-info-value">${formatCurrency(scenario.newContribution)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load scenarios from data
     * @param {Object[]} scenariosData - Array of scenario data objects
     */
    loadScenarios(scenariosData) {
        this.scenarios = scenariosData || [];
        this.syncScenariosToAccounts();
        this.render();
    }

    /**
     * Get all scenarios
     * @returns {Object[]} - Array of scenarios
     */
    getScenarios() {
        return this.scenarios;
    }
}
