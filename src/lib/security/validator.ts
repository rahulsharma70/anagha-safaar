// src/lib/security/validator.ts
import { logger } from '../logger';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  data?: any;
}

export class InputValidator {
  private static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  private static urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    const validatedData: any = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`);
        continue;
      }

      // Skip validation if value is empty and not required
      if (!rules.required && (value === undefined || value === null || value === '')) {
        validatedData[field] = value;
        continue;
      }

      // Type validation
      if (rules.type) {
        const typeError = this.validateType(value, rules.type, field);
        if (typeError) {
          fieldErrors.push(typeError);
          continue;
        }
      }

      // Length validation for strings
      if (rules.type === 'string' || typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          fieldErrors.push(`${field} must be at least ${rules.minLength} characters long`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          fieldErrors.push(`${field} must be no more than ${rules.maxLength} characters long`);
        }
      }

      // Numeric validation
      if (rules.type === 'number' || typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          fieldErrors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          fieldErrors.push(`${field} must be no more than ${rules.max}`);
        }
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`);
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (customResult !== true) {
          fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
        }
      }

      if (fieldErrors.length === 0) {
        validatedData[field] = value;
      } else {
        errors[field] = fieldErrors;
      }
    }

    const isValid = Object.keys(errors).length === 0;
    
    if (!isValid) {
      logger.warn('Validation failed:', { errors, data });
    }

    return {
      isValid,
      errors,
      data: isValid ? validatedData : undefined,
    };
  }

  private static validateType(value: any, type: string, field: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !this.emailPattern.test(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      case 'phone':
        if (typeof value !== 'string' || !this.phonePattern.test(value)) {
          return `${field} must be a valid phone number`;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return `${field} must be a valid date`;
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.urlPattern.test(value)) {
          return `${field} must be a valid URL`;
        }
        break;
    }
    return null;
  }

  // Sanitize input data
  static sanitize(data: any): any {
    if (typeof data === 'string') {
      return data
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }
    
    return data;
  }

  // Validate booking data
  static validateBooking(data: any): ValidationResult {
    const schema: ValidationSchema = {
      item_id: { required: true, type: 'string', minLength: 1 },
      item_type: { 
        required: true, 
        type: 'string',
        custom: (value) => ['hotel', 'flight', 'tour'].includes(value) || 'Invalid item type'
      },
      start_date: { required: true, type: 'date' },
      end_date: { type: 'date' },
      guests_count: { 
        required: true, 
        type: 'number', 
        min: 1, 
        max: 20 
      },
      total_amount: { 
        required: true, 
        type: 'number', 
        min: 0 
      },
      currency: { 
        required: true, 
        type: 'string',
        custom: (value) => ['INR', 'USD', 'EUR'].includes(value) || 'Invalid currency'
      },
      guest_details: {
        required: true,
        custom: (value) => {
          if (!value || typeof value !== 'object') {
            return 'Guest details are required';
          }
          const nameValid = value.fullName && typeof value.fullName === 'string';
          const emailValid = value.email && this.emailPattern.test(value.email);
          const phoneValid = value.phone && this.phonePattern.test(value.phone);
          
          if (!nameValid) return 'Full name is required';
          if (!emailValid) return 'Valid email is required';
          if (!phoneValid) return 'Valid phone number is required';
          
          return true;
        }
      }
    };

    return this.validate(data, schema);
  }

  // Validate search parameters
  static validateSearchParams(data: any, type: 'hotel' | 'flight' | 'tour'): ValidationResult {
    let schema: ValidationSchema = {};

    switch (type) {
      case 'hotel':
        schema = {
          cityCode: { required: true, type: 'string', minLength: 3, maxLength: 10 },
          checkInDate: { required: true, type: 'date' },
          checkOutDate: { required: true, type: 'date' },
          adults: { required: true, type: 'number', min: 1, max: 10 },
          rooms: { required: true, type: 'number', min: 1, max: 5 },
          currency: { required: true, type: 'string' }
        };
        break;
      case 'flight':
        schema = {
          originLocationCode: { required: true, type: 'string', minLength: 3, maxLength: 3 },
          destinationLocationCode: { required: true, type: 'string', minLength: 3, maxLength: 3 },
          departureDate: { required: true, type: 'date' },
          returnDate: { type: 'date' },
          adults: { required: true, type: 'number', min: 1, max: 9 },
          children: { type: 'number', min: 0, max: 9 },
          infants: { type: 'number', min: 0, max: 9 },
          travelClass: { type: 'string' },
          currency: { required: true, type: 'string' }
        };
        break;
      case 'tour':
        schema = {
          location: { required: true, type: 'string', minLength: 2 },
          duration: { required: true, type: 'number', min: 1, max: 30 },
          travelers: { required: true, type: 'number', min: 1, max: 20 },
          budget: { required: true, type: 'number', min: 1000 },
          interests: { type: 'string' }
        };
        break;
    }

    return this.validate(data, schema);
  }

  // Validate payment data
  static validatePayment(data: any): ValidationResult {
    const schema: ValidationSchema = {
      amount: { required: true, type: 'number', min: 1 },
      currency: { required: true, type: 'string' },
      receipt: { required: true, type: 'string', minLength: 1 },
      payment_method: { 
        required: true, 
        type: 'string',
        custom: (value) => ['upi', 'card', 'netbanking', 'wallet'].includes(value) || 'Invalid payment method'
      }
    };

    return this.validate(data, schema);
  }

  // Validate user registration
  static validateUserRegistration(data: any): ValidationResult {
    const schema: ValidationSchema = {
      email: { required: true, type: 'email' },
      password: { 
        required: true, 
        type: 'string', 
        minLength: 8,
        custom: (value) => {
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          
          if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
          if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
          if (!hasNumbers) return 'Password must contain at least one number';
          if (!hasSpecialChar) return 'Password must contain at least one special character';
          
          return true;
        }
      },
      full_name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
      phone: { required: true, type: 'phone' },
      marketing_consent: { type: 'boolean' }
    };

    return this.validate(data, schema);
  }
}

export const inputValidator = InputValidator;
