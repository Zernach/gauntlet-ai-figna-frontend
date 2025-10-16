/**
 * Performance monitoring utility for voice agent operations
 * Tracks timing and provides metrics for optimization
 */

interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private timers: Map<string, number> = new Map();
    private enabled: boolean = false; // Set to true to enable monitoring

    /**
     * Start timing an operation
     */
    startTimer(operation: string): void {
        if (!this.enabled) return;
        this.timers.set(operation, performance.now());
    }

    /**
     * End timing and record metric
     */
    endTimer(operation: string): number | null {
        if (!this.enabled) return null;

        const startTime = this.timers.get(operation);
        if (startTime === undefined) return null;

        const duration = performance.now() - startTime;
        this.metrics.push({
            operation,
            duration,
            timestamp: Date.now()
        });

        this.timers.delete(operation);

        // Keep only last 100 metrics to prevent memory bloat
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }

        return duration;
    }

    /**
     * Get statistics for a specific operation
     */
    getStats(operation: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        p50: number;
        p95: number;
        p99: number;
    } | null {
        if (!this.enabled) return null;

        const operationMetrics = this.metrics
            .filter(m => m.operation === operation)
            .map(m => m.duration)
            .sort((a, b) => a - b);

        if (operationMetrics.length === 0) return null;

        const sum = operationMetrics.reduce((a, b) => a + b, 0);
        const count = operationMetrics.length;

        return {
            count,
            average: sum / count,
            min: operationMetrics[0],
            max: operationMetrics[count - 1],
            p50: operationMetrics[Math.floor(count * 0.5)],
            p95: operationMetrics[Math.floor(count * 0.95)],
            p99: operationMetrics[Math.floor(count * 0.99)]
        };
    }

    /**
     * Get all recent metrics
     */
    getAllMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.timers.clear();
    }

    /**
     * Enable performance monitoring
     */
    enable(): void {
        this.enabled = true;
    }

    /**
     * Disable performance monitoring
     */
    disable(): void {
        this.enabled = false;
    }

    /**
     * Check if monitoring is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export type for use in other files
export type { PerformanceMetric };

