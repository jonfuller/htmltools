export class Scenario {
    constructor({
        id = null,
        name = '',
        description = '',
        contributionChanges = [], // Array of contribution change objects
        color = null // Color for chart visualization
    } = {}) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.description = description;
        this.contributionChanges = contributionChanges || [];
        this.color = color || this.generateColor();
    }

    /**
     * Generate a random color for chart visualization
     */
    generateColor() {
        const colors = [
            'rgb(37, 99, 235)',    // Blue
            'rgb(16, 185, 129)',   // Green
            'rgb(239, 68, 68)',    // Red
            'rgb(168, 85, 247)',   // Purple
            'rgb(245, 158, 11)',   // Amber
            'rgb(236, 72, 153)',   // Pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            contributionChanges: this.contributionChanges,
            color: this.color
        };
    }

    /**
     * Create a Scenario from a plain object
     */
    static fromJSON(json) {
        return new Scenario(json);
    }

    /**
     * Clone the scenario
     */
    clone() {
        return Scenario.fromJSON(this.toJSON());
    }
}
