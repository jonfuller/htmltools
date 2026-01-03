import { Scenario } from '../models/Scenario.js';

export class ScenarioManager {
    constructor(scenarioBuilder) {
        this.scenarioBuilder = scenarioBuilder;
        this.scenarios = [];
        this.selectedScenarios = new Set();
        this.onScenariosChanged = null;

        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Save scenario button
        document.getElementById('save-scenario-btn').addEventListener('click', () => {
            this.openSaveScenarioModal();
        });

        // Save scenario form submit
        document.getElementById('save-scenario-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScenario();
        });

        // Cancel button
        document.getElementById('save-scenario-cancel').addEventListener('click', () => {
            this.closeSaveScenarioModal();
        });

        // Modal close button
        document.querySelector('#save-scenario-modal .modal-close').addEventListener('click', () => {
            this.closeSaveScenarioModal();
        });

        // Close modal when clicking outside
        document.getElementById('save-scenario-modal').addEventListener('click', (e) => {
            if (e.target.id === 'save-scenario-modal') {
                this.closeSaveScenarioModal();
            }
        });

        // Compare scenarios button
        document.getElementById('compare-scenarios-btn').addEventListener('click', () => {
            this.compareScenarios();
        });

        // Clear selection button
        document.getElementById('clear-comparison-btn').addEventListener('click', () => {
            this.clearSelection();
        });
    }

    /**
     * Open the save scenario modal
     */
    openSaveScenarioModal() {
        const modal = document.getElementById('save-scenario-modal');
        const form = document.getElementById('save-scenario-form');
        form.reset();
        modal.classList.add('active');
    }

    /**
     * Close the save scenario modal
     */
    closeSaveScenarioModal() {
        document.getElementById('save-scenario-modal').classList.remove('active');
    }

    /**
     * Save the current timeline as a scenario
     */
    saveScenario() {
        const formData = new FormData(document.getElementById('save-scenario-form'));
        const name = formData.get('name');
        const description = formData.get('description') || '';

        // Get current contribution changes from scenario builder
        const contributionChanges = this.scenarioBuilder.getScenarios();

        const scenario = new Scenario({
            name,
            description,
            contributionChanges: JSON.parse(JSON.stringify(contributionChanges)) // Deep clone
        });

        this.scenarios.push(scenario);
        this.render();
        this.closeSaveScenarioModal();

        if (this.onScenariosChanged) {
            this.onScenariosChanged(this.scenarios);
        }
    }

    /**
     * Delete a scenario
     * @param {string} scenarioId - Scenario ID to delete
     */
    deleteScenario(scenarioId) {
        if (confirm('Are you sure you want to delete this scenario?')) {
            this.scenarios = this.scenarios.filter(s => s.id !== scenarioId);
            this.selectedScenarios.delete(scenarioId);
            this.render();

            if (this.onScenariosChanged) {
                this.onScenariosChanged(this.scenarios);
            }
        }
    }

    /**
     * Toggle scenario selection for comparison
     * @param {string} scenarioId - Scenario ID to toggle
     */
    toggleScenarioSelection(scenarioId) {
        if (this.selectedScenarios.has(scenarioId)) {
            this.selectedScenarios.delete(scenarioId);
        } else {
            // Limit to 3 scenarios for comparison
            if (this.selectedScenarios.size >= 3) {
                alert('You can compare up to 3 scenarios at once.');
                return;
            }
            this.selectedScenarios.add(scenarioId);
        }

        this.render();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedScenarios.clear();
        this.render();
    }

    /**
     * Trigger comparison of selected scenarios
     */
    compareScenarios() {
        if (this.selectedScenarios.size < 2) {
            alert('Please select at least 2 scenarios to compare.');
            return;
        }

        const selectedScenarioObjects = this.scenarios.filter(s =>
            this.selectedScenarios.has(s.id)
        );

        // Trigger comparison event
        if (this.onCompareRequested) {
            this.onCompareRequested(selectedScenarioObjects);
        }
    }

    /**
     * Render scenarios list
     */
    render() {
        const container = document.getElementById('saved-scenarios-list');
        const comparisonControls = document.getElementById('scenario-comparison-controls');

        if (this.scenarios.length === 0) {
            container.innerHTML = '<p class="empty-state">No scenarios saved. Create a contribution timeline above and save it as a scenario.</p>';
            comparisonControls.style.display = 'none';
            return;
        }

        container.innerHTML = this.scenarios.map(scenario => this.renderScenarioCard(scenario)).join('');

        // Show comparison controls if there are scenarios
        comparisonControls.style.display = this.scenarios.length > 1 ? 'block' : 'none';

        // Attach event listeners
        this.scenarios.forEach(scenario => {
            const checkbox = document.getElementById(`select-${scenario.id}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.toggleScenarioSelection(scenario.id);
                });
            }

            document.getElementById(`delete-scenario-${scenario.id}`).addEventListener('click', () => {
                this.deleteScenario(scenario.id);
            });
        });
    }

    /**
     * Render a single scenario card
     * @param {Scenario} scenario - Scenario to render
     * @returns {string} - HTML string
     */
    renderScenarioCard(scenario) {
        const isSelected = this.selectedScenarios.has(scenario.id);
        const changeCount = scenario.contributionChanges.length;

        return `
            <div class="scenario-card ${isSelected ? 'selected' : ''}" style="border-left: 4px solid ${scenario.color}">
                <div class="scenario-card-header">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <input type="checkbox"
                               id="select-${scenario.id}"
                               ${isSelected ? 'checked' : ''}
                               style="width: 1.125rem; height: 1.125rem; cursor: pointer;">
                        <div class="scenario-card-title">${scenario.name}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-small btn-danger" id="delete-scenario-${scenario.id}">Delete</button>
                    </div>
                </div>
                ${scenario.description ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">${scenario.description}</p>` : ''}
                <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.5rem;">
                    ${changeCount} timeline ${changeCount === 1 ? 'change' : 'changes'}
                </p>
            </div>
        `;
    }

    /**
     * Load scenarios from data
     * @param {Object[]} scenariosData - Array of scenario data objects
     */
    loadScenarios(scenariosData) {
        this.scenarios = scenariosData.map(data => new Scenario(data));
        this.render();
    }

    /**
     * Get all scenarios
     * @returns {Scenario[]} - Array of scenarios
     */
    getScenarios() {
        return this.scenarios;
    }

    /**
     * Get selected scenarios
     * @returns {Scenario[]} - Array of selected scenarios
     */
    getSelectedScenarios() {
        return this.scenarios.filter(s => this.selectedScenarios.has(s.id));
    }
}
