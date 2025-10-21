import * as Sentry from '@sentry/react';
import { logger } from './logger';

class MonitoringService {
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (dsn) {
      Sentry.init({
        dsn,
        environment: import.meta.env.NODE_ENV,
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        beforeSend(event) {
          // Filter out development errors
          if (import.meta.env.NODE_ENV === 'development') {
            return null;
          }
          return event;
        },
      });

      this.isInitialized = true;
      logger.info('Sentry monitoring initialized');
    } else {
      logger.warn('Sentry DSN not provided, monitoring disabled');
    }
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser(user);
    logger.info('Sentry user set', { userId: user.id });
  }

  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', error);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });

    logger.error('Exception captured by Sentry', error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) {
      logger.warn('Sentry not initialized, logging message locally', { message, level });
      return;
    }

    Sentry.captureMessage(message, level);
    logger.info(`Message captured by Sentry: ${message}`);
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    Sentry.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.setContext(key, context);
  }

  // Performance monitoring
  startTransaction(name: string, op: string): any {
    if (!this.isInitialized) return null;

    // Note: startTransaction is deprecated in newer Sentry versions
    // Use startSpan or startInactiveSpan instead
    return null;
  }

  // Custom metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message: `Metric: ${name} = ${value}`,
      category: 'metric',
      level: 'info',
      data: { name, value, tags },
    });

    logger.info(`Metric tracked: ${name} = ${value}`, { metadata: { name, value, tags } });
  }

  // Health check
  trackHealthCheck(service: string, status: 'healthy' | 'unhealthy', responseTime?: number): void {
    this.trackMetric(`health_check_${service}`, status === 'healthy' ? 1 : 0, {
      service,
      status,
      responseTime: responseTime?.toString() || 'unknown',
    });
  }

  // API monitoring
  trackAPICall(endpoint: string, method: string, status: number, responseTime: number): void {
    this.trackMetric('api_response_time', responseTime, {
      endpoint,
      method,
      status: status.toString(),
    });

    this.trackMetric('api_call_count', 1, {
      endpoint,
      method,
      status: status.toString(),
    });

    logger.trackAPICall(endpoint, method, status, responseTime);
  }

  // User behavior tracking
  trackUserBehavior(action: string, component: string, metadata?: Record<string, any>): void {
    this.addBreadcrumb(`User ${action}`, 'user_action');
    
    this.trackMetric('user_action_count', 1, {
      action,
      component,
    });

    logger.trackUserAction(action, component, metadata);
  }

  // Error boundary integration
  captureErrorBoundary(error: Error, errorInfo: any): void {
    this.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  // Performance monitoring helpers
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.trackMetric(`performance_${name}`, duration);
    logger.trackPerformance(name, duration);

    return result;
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.trackMetric(`performance_${name}`, duration);
    logger.trackPerformance(name, duration);

    return result;
  }
}

export const monitoringService = new MonitoringService();
