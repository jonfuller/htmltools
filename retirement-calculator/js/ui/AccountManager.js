import { Account } from '../models/Account.js';
import { formatCurrency } from '../utils/formatters.js';

export class AccountManager {
    constructor() {
        this.accounts = [];
        this.currentEditingId = null;
        this.onAccountsChanged = null; // Callback when accounts are modified

        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Add account button
        document.getElementById('add-account-btn').addEventListener('click', () => {
            this.openAccountModal();
        });

        // Account form submit
        document.getElementById('account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        // Cancel button
        document.getElementById('account-cancel').addEventListener('click', () => {
            this.closeAccountModal();
        });

        // Modal close button
        document.querySelector('#account-modal .modal-close').addEventListener('click', () => {
            this.closeAccountModal();
        });

        // Close modal when clicking outside
        document.getElementById('account-modal').addEventListener('click', (e) => {
            if (e.target.id === 'account-modal') {
                this.closeAccountModal();
            }
        });

        // Account type change - show/hide employer match and update tax treatment
        document.getElementById('account-type').addEventListener('change', (e) => {
            this.updateEmployerMatchVisibility(e.target.value);
            this.updateTaxTreatmentVisibility(e.target.value);
        });

        // Employer match checkbox
        document.getElementById('account-has-match').addEventListener('change', (e) => {
            document.getElementById('employer-match-fields').style.display =
                e.target.checked ? 'block' : 'none';
        });
    }

    /**
     * Open the account modal for adding or editing
     * @param {string} accountId - Account ID to edit (null for new)
     */
    openAccountModal(accountId = null) {
        this.currentEditingId = accountId;
        const modal = document.getElementById('account-modal');
        const form = document.getElementById('account-form');
        const title = document.getElementById('account-modal-title');

        form.reset();

        if (accountId) {
            // Edit mode
            title.textContent = 'Edit Account';
            const account = this.accounts.find(a => a.id === accountId);
            if (account) {
                this.populateForm(account);
            }
        } else {
            // Add mode
            title.textContent = 'Add Account';
            this.updateEmployerMatchVisibility('401k');
            this.updateTaxTreatmentVisibility('401k');
        }

        modal.classList.add('active');
    }

    /**
     * Close the account modal
     */
    closeAccountModal() {
        document.getElementById('account-modal').classList.remove('active');
        this.currentEditingId = null;
    }

    /**
     * Populate form with account data
     * @param {Account} account - Account to edit
     */
    populateForm(account) {
        document.getElementById('account-name').value = account.name;
        document.getElementById('account-type').value = account.type;
        document.getElementById('account-balance').value = account.currentBalance;
        document.getElementById('account-contribution').value = account.annualContribution;
        document.getElementById('account-tax-treatment').value = account.taxTreatment;

        this.updateEmployerMatchVisibility(account.type);
        this.updateTaxTreatmentVisibility(account.type);

        if (account.employerMatch) {
            document.getElementById('account-has-match').checked = true;
            document.getElementById('employer-match-fields').style.display = 'block';
            document.getElementById('match-rate').value = account.employerMatch.rate;
            document.getElementById('match-cap').value = account.employerMatch.capPercent;
        } else {
            document.getElementById('account-has-match').checked = false;
            document.getElementById('employer-match-fields').style.display = 'none';
        }
    }

    /**
     * Update employer match field visibility based on account type
     * @param {string} accountType - Account type
     */
    updateEmployerMatchVisibility(accountType) {
        const matchCheckbox = document.getElementById('account-has-match');
        const matchLabel = matchCheckbox.closest('.toggle-label');

        if (accountType === '401k') {
            matchLabel.style.display = 'flex';
        } else {
            matchLabel.style.display = 'none';
            matchCheckbox.checked = false;
            document.getElementById('employer-match-fields').style.display = 'none';
        }
    }

    /**
     * Update tax treatment field based on account type
     * @param {string} accountType - Account type
     */
    updateTaxTreatmentVisibility(accountType) {
        const taxTreatmentGroup = document.getElementById('tax-treatment-group');
        const taxTreatmentSelect = document.getElementById('account-tax-treatment');

        // Set default value and enable/disable based on account type
        const defaults = {
            '401k': 'pre_tax', // Can choose
            'traditional_ira': 'pre_tax',
            'roth_ira': 'post_tax',
            'hsa': 'pre_tax',
            'esop': 'pre_tax',
            'taxable': 'post_tax'
        };

        taxTreatmentSelect.value = defaults[accountType] || 'pre_tax';

        // Only 401k can choose between traditional and Roth
        if (accountType === '401k') {
            taxTreatmentSelect.disabled = false;
            taxTreatmentGroup.style.opacity = '1';
        } else {
            taxTreatmentSelect.disabled = true;
            taxTreatmentGroup.style.opacity = '0.6';
        }
    }

    /**
     * Save account from form
     */
    saveAccount() {
        const formData = new FormData(document.getElementById('account-form'));

        const accountData = {
            name: formData.get('name'),
            type: formData.get('type'),
            currentBalance: parseFloat(formData.get('currentBalance')) || 0,
            annualContribution: parseFloat(formData.get('annualContribution')) || 0,
            taxTreatment: formData.get('taxTreatment')
        };

        // Handle employer match
        const hasMatch = document.getElementById('account-has-match').checked;
        if (hasMatch && accountData.type === '401k') {
            accountData.employerMatch = {
                rate: parseFloat(formData.get('matchRate')) || 0,
                capPercent: parseFloat(formData.get('matchCap')) || 0
            };
        }

        if (this.currentEditingId) {
            // Update existing account
            const index = this.accounts.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                accountData.id = this.currentEditingId;
                accountData.contributionChanges = this.accounts[index].contributionChanges;
                this.accounts[index] = new Account(accountData);
            }
        } else {
            // Add new account
            this.accounts.push(new Account(accountData));
        }

        this.render();
        this.closeAccountModal();

        if (this.onAccountsChanged) {
            this.onAccountsChanged(this.accounts);
        }
    }

    /**
     * Delete an account
     * @param {string} accountId - Account ID to delete
     */
    deleteAccount(accountId) {
        if (confirm('Are you sure you want to delete this account?')) {
            this.accounts = this.accounts.filter(a => a.id !== accountId);
            this.render();

            if (this.onAccountsChanged) {
                this.onAccountsChanged(this.accounts);
            }
        }
    }

    /**
     * Render accounts list
     */
    render() {
        const container = document.getElementById('accounts-list');

        if (this.accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">No accounts added yet. Click "Add Account" to get started.</p>';
            return;
        }

        container.innerHTML = this.accounts.map(account => this.renderAccountCard(account)).join('');

        // Attach event listeners to account cards
        this.accounts.forEach(account => {
            document.getElementById(`edit-${account.id}`).addEventListener('click', () => {
                this.openAccountModal(account.id);
            });

            document.getElementById(`delete-${account.id}`).addEventListener('click', () => {
                this.deleteAccount(account.id);
            });
        });
    }

    /**
     * Render a single account card
     * @param {Account} account - Account to render
     * @returns {string} - HTML string
     */
    renderAccountCard(account) {
        const matchInfo = account.employerMatch
            ? `${account.employerMatch.rate}% up to ${account.employerMatch.capPercent}% of salary`
            : 'None';

        return `
            <div class="account-card">
                <div class="account-card-header">
                    <div class="account-card-title">${account.name}</div>
                    <div class="card-actions">
                        <button class="btn btn-small btn-secondary" id="edit-${account.id}">Edit</button>
                        <button class="btn btn-small btn-danger" id="delete-${account.id}">Delete</button>
                    </div>
                </div>
                <div class="account-card-body">
                    <div class="account-info">
                        <div class="account-info-label">Type</div>
                        <div class="account-info-value">${account.getTypeDisplay()}</div>
                    </div>
                    <div class="account-info">
                        <div class="account-info-label">Tax Treatment</div>
                        <div class="account-info-value">${account.getTaxTreatmentDisplay()}</div>
                    </div>
                    <div class="account-info">
                        <div class="account-info-label">Current Balance</div>
                        <div class="account-info-value">${formatCurrency(account.currentBalance)}</div>
                    </div>
                    <div class="account-info">
                        <div class="account-info-label">Annual Contribution</div>
                        <div class="account-info-value">${formatCurrency(account.annualContribution)}</div>
                    </div>
                    ${account.canHaveEmployerMatch() ? `
                    <div class="account-info">
                        <div class="account-info-label">Employer Match</div>
                        <div class="account-info-value">${matchInfo}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Load accounts from data
     * @param {Object[]} accountsData - Array of account data objects
     */
    loadAccounts(accountsData) {
        this.accounts = accountsData.map(data => new Account(data));
        this.render();
    }

    /**
     * Get all accounts
     * @returns {Account[]} - Array of accounts
     */
    getAccounts() {
        return this.accounts;
    }
}
