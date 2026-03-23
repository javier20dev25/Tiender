/**
 * Simple performance monitoring utility for Tiender
 */
type MetricName = 'SocialStorePage_Load' | 'Dashboard_Load' | 'ProductSwipe' | 'CartAdd' | 'PaypalRedirect' | 'ReportGeneration';

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(name: MetricName) {
    if (import.meta.env.DEV) {
      this.marks.set(name, performance.now());
      console.log(`[Perf] Start: ${name}`);
    }
  }

  end(name: MetricName) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(`[Perf] ${name} took ${duration.toFixed(2)}ms`);
      }
      this.marks.delete(name);
      return duration;
    }
    return 0;
  }
}

export const Perf = new PerformanceMonitor();
