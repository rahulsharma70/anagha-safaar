import mixpanel from 'mixpanel-browser';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  message?: string;
  errors?: any;
  level?: string;
  data?: any;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow any additional properties
}

class Logger {
  private isDevelopment = import.meta.env.NODE_ENV === 'development';
  private mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;

  constructor() {
    if (this.mixpanelToken && !this.isDevelopment) {
      mixpanel.init(this.mixpanelToken, {
        debug: this.isDevelopment,
        track_pageview: true,
        persistence: 'localStorage',
      });
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  private logToMixpanel(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.mixpanelToken || this.isDevelopment) return;

    try {
      const eventName = `log_${level}`;
      const properties = {
        message,
        level,
        timestamp: new Date().toISOString(),
        ...context,
      };

      mixpanel.track(eventName, properties);
    } catch (error) {
      console.error('Failed to log to Mixpanel:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.logToConsole(LogLevel.DEBUG, message, context);
    this.logToMixpanel(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logToConsole(LogLevel.INFO, message, context);
    this.logToMixpanel(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logToConsole(LogLevel.WARN, message, context);
    this.logToMixpanel(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.logToConsole(LogLevel.ERROR, message, errorContext);
    this.logToMixpanel(LogLevel.ERROR, message, errorContext);
  }

  // Analytics tracking methods
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.mixpanelToken) return;

    try {
      mixpanel.track(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  identifyUser(userId: string, properties?: Record<string, any>): void {
    if (!this.mixpanelToken) return;

    try {
      mixpanel.identify(userId);
      if (properties) {
        mixpanel.people.set(properties);
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.mixpanelToken) return;

    try {
      mixpanel.people.set(properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  // Performance tracking
  trackPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      action: 'performance',
      metadata: {
        operation,
        duration,
        ...metadata,
      },
    });

    this.trackEvent('performance_metric', {
      operation,
      duration,
      ...metadata,
    });
  }

  // API call tracking
  trackAPICall(endpoint: string, method: string, status: number, duration: number): void {
    this.info(`API Call: ${method} ${endpoint} - ${status} (${duration}ms)`, {
      action: 'api_call',
      metadata: {
        endpoint,
        method,
        status,
        duration,
      },
    });

    this.trackEvent('api_call', {
      endpoint,
      method,
      status,
      duration,
      success: status >= 200 && status < 300,
    });
  }

  // User action tracking
  trackUserAction(action: string, component: string, metadata?: Record<string, any>): void {
    this.info(`User Action: ${action} in ${component}`, {
      action,
      component,
      metadata,
    });

    this.trackEvent('user_action', {
      action,
      component,
      ...metadata,
    });
  }

  // Error tracking
  trackError(error: Error, context?: LogContext): void {
    this.error('Application Error', error, context);

    this.trackEvent('application_error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }
}

export const logger = new Logger();
