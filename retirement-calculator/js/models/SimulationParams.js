export class SimulationParams {
    // Preset return distributions
    static PRESETS = {
        conservative: { mean: 0.05, stdDev: 0.12 },
        moderate: { mean: 0.07, stdDev: 0.15 },
        aggressive: { mean: 0.09, stdDev: 0.18 }
    };

    constructor({
        currentAge = 35,
        retirementAge = 65,
        currentSalary = 100000,
        inflationRate = 0.025,
        numberOfSimulations = 10000,
        returnPreset = 'moderate',
        returnDistribution = null,
        socialSecurity = null
    } = {}) {
        this.currentAge = parseInt(currentAge) || 35;
        this.retirementAge = parseInt(retirementAge) || 65;
        this.currentSalary = parseFloat(currentSalary) || 100000;
        this.inflationRate = parseFloat(inflationRate) / 100 || 0.025; // Convert from percentage
        this.numberOfSimulations = parseInt(numberOfSimulations) || 10000;
        this.returnPreset = returnPreset || 'moderate';

        // If returnDistribution is provided, use it; otherwise use preset
        if (returnDistribution) {
            this.returnDistribution = {
                mean: parseFloat(returnDistribution.mean) || 0.07,
                stdDev: parseFloat(returnDistribution.stdDev) || 0.15
            };
        } else {
            this.returnDistribution = SimulationParams.PRESETS[this.returnPreset] || SimulationParams.PRESETS.moderate;
        }

        this.socialSecurity = socialSecurity ? {
            startAge: parseInt(socialSecurity.startAge) || 67,
            monthlyBenefit: parseFloat(socialSecurity.monthlyBenefit) || 0
        } : null;
    }

    /**
     * Get the number of years until retirement
     */
    getYearsToRetirement() {
        return Math.max(0, this.retirementAge - this.currentAge);
    }

    /**
     * Update return distribution from preset
     */
    updateFromPreset(preset) {
        if (SimulationParams.PRESETS[preset]) {
            this.returnPreset = preset;
            this.returnDistribution = SimulationParams.PRESETS[preset];
        }
    }

    /**
     * Set custom return distribution
     */
    setCustomReturns(mean, stdDev) {
        this.returnPreset = 'custom';
        this.returnDistribution = {
            mean: parseFloat(mean) || 0.07,
            stdDev: parseFloat(stdDev) || 0.15
        };
    }

    /**
     * Validate the simulation parameters
     * @returns {Object} - { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (this.currentAge < 18 || this.currentAge > 100) {
            errors.push('Current age must be between 18 and 100');
        }

        if (this.retirementAge < 18 || this.retirementAge > 100) {
            errors.push('Retirement age must be between 18 and 100');
        }

        if (this.retirementAge <= this.currentAge) {
            errors.push('Retirement age must be greater than current age');
        }

        if (this.currentSalary < 0) {
            errors.push('Current salary cannot be negative');
        }

        if (this.inflationRate < 0 || this.inflationRate > 0.2) {
            errors.push('Inflation rate should be between 0% and 20%');
        }

        if (this.returnDistribution.mean < 0 || this.returnDistribution.mean > 0.3) {
            errors.push('Expected return should be between 0% and 30%');
        }

        if (this.returnDistribution.stdDev < 0 || this.returnDistribution.stdDev > 0.5) {
            errors.push('Volatility should be between 0% and 50%');
        }

        if (this.numberOfSimulations < 100 || this.numberOfSimulations > 100000) {
            errors.push('Number of simulations should be between 100 and 100,000');
        }

        if (this.socialSecurity) {
            if (this.socialSecurity.startAge < 62 || this.socialSecurity.startAge > 70) {
                errors.push('Social Security start age should be between 62 and 70');
            }
            if (this.socialSecurity.monthlyBenefit < 0) {
                errors.push('Social Security benefit cannot be negative');
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
            currentAge: this.currentAge,
            retirementAge: this.retirementAge,
            currentSalary: this.currentSalary,
            inflationRate: this.inflationRate * 100, // Convert back to percentage
            numberOfSimulations: this.numberOfSimulations,
            returnPreset: this.returnPreset,
            returnDistribution: this.returnDistribution,
            socialSecurity: this.socialSecurity
        };
    }

    /**
     * Create SimulationParams from a plain object
     */
    static fromJSON(json) {
        return new SimulationParams(json);
    }
}
