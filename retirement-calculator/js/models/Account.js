export class Account {
    constructor({
        id = null,
        name = '',
        type = '401k',
        currentBalance = 0,
        annualContribution = 0,
        employerMatch = null,
        contributionChanges = [],
        taxTreatment = null
    } = {}) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.type = type; // '401k' | 'traditional_ira' | 'roth_ira' | 'taxable'
        this.currentBalance = parseFloat(currentBalance) || 0;
        this.annualContribution = parseFloat(annualContribution) || 0;
        this.employerMatch = employerMatch; // { rate: 0.5, capPercent: 6 } or null
        this.contributionChanges = contributionChanges || [];

        // Set tax treatment: 'pre_tax' | 'post_tax'
        // Default based on account type if not specified
        if (taxTreatment) {
            this.taxTreatment = taxTreatment;
        } else {
            this.taxTreatment = this.getDefaultTaxTreatment();
        }
    }

    /**
     * Get default tax treatment based on account type
     */
    getDefaultTaxTreatment() {
        const defaults = {
            '401k': 'pre_tax', // Traditional 401k by default, but can be Roth
            'traditional_ira': 'pre_tax',
            'roth_ira': 'post_tax',
            'hsa': 'pre_tax', // Triple tax advantage, but treating as pre-tax for simplicity
            'esop': 'pre_tax', // Usually deferred like traditional 401k
            'taxable': 'post_tax'
        };
        return defaults[this.type] || 'pre_tax';
    }

    /**
     * Get the display name for the account type
     */
    getTypeDisplay() {
        const typeMap = {
            '401k': '401(k)',
            'traditional_ira': 'Traditional IRA',
            'roth_ira': 'Roth IRA',
            'hsa': 'HSA',
            'esop': 'ESOP',
            'taxable': 'Taxable Brokerage'
        };
        return typeMap[this.type] || this.type;
    }

    /**
     * Get the contribution amount for a specific year
     * @param {number} year - Years from now
     * @returns {number} - Annual contribution amount
     */
    getContributionForYear(year) {
        let contribution = this.annualContribution;

        // Apply all contribution changes up to and including this year
        // Sort changes by year to ensure they're applied in order
        const sortedChanges = [...this.contributionChanges].sort((a, b) => a.yearFromNow - b.yearFromNow);

        for (const change of sortedChanges) {
            if (year >= change.yearFromNow) {
                contribution = change.newContribution;
            }
        }

        return contribution;
    }

    /**
     * Check if this account can have employer match
     */
    canHaveEmployerMatch() {
        return this.type === '401k';
    }

    /**
     * Get display text for tax treatment
     */
    getTaxTreatmentDisplay() {
        return this.taxTreatment === 'pre_tax' ? 'Pre-Tax (Traditional)' : 'Post-Tax (Roth)';
    }

    /**
     * Check if account type allows choosing tax treatment
     */
    canChangeTaxTreatment() {
        // Only 401k can be either traditional or Roth
        // Other account types are fixed
        return this.type === '401k';
    }

    /**
     * Get annual contribution limit for this account type (2024 limits)
     */
    getContributionLimit() {
        const limits = {
            '401k': 23000,
            'traditional_ira': 7000,
            'roth_ira': 7000,
            'hsa': 8300, // Family coverage limit (2024)
            'esop': Infinity, // Employer-driven, no standard limit
            'taxable': Infinity
        };
        return limits[this.type] || Infinity;
    }

    /**
     * Validate the account data
     * @returns {Object} - { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Account name is required');
        }

        if (this.currentBalance < 0) {
            errors.push('Current balance cannot be negative');
        }

        if (this.annualContribution < 0) {
            errors.push('Annual contribution cannot be negative');
        }

        const limit = this.getContributionLimit();
        if (this.annualContribution > limit) {
            errors.push(`Annual contribution exceeds ${this.getTypeDisplay()} limit of $${limit.toLocaleString()}`);
        }

        if (this.employerMatch && !this.canHaveEmployerMatch()) {
            errors.push('Employer match is only available for 401(k) accounts');
        }

        if (this.employerMatch) {
            if (this.employerMatch.rate < 0 || this.employerMatch.rate > 1) {
                errors.push('Employer match rate must be between 0 and 100%');
            }
            if (this.employerMatch.capPercent < 0 || this.employerMatch.capPercent > 100) {
                errors.push('Employer match cap must be between 0 and 100% of salary');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            currentBalance: this.currentBalance,
            annualContribution: this.annualContribution,
            employerMatch: this.employerMatch,
            contributionChanges: this.contributionChanges,
            taxTreatment: this.taxTreatment
        };
    }

    /**
     * Create an Account from a plain object
     */
    static fromJSON(json) {
        return new Account(json);
    }

    /**
     * Clone the account
     */
    clone() {
        return Account.fromJSON(this.toJSON());
    }
}
