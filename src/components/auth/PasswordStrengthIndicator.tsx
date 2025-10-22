import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export interface PasswordValidation {
  isValid: boolean;
  strength: number;
  checks: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export const validatePassword = (password: string): PasswordValidation => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = (passedChecks / 5) * 100;
  const isValid = passedChecks >= 4; // At least 4 out of 5 criteria

  return { isValid, strength, checks };
};

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const validation = useMemo(() => validatePassword(password), [password]);

  if (!password) return null;

  const getStrengthColor = () => {
    if (validation.strength < 40) return 'bg-destructive';
    if (validation.strength < 80) return 'bg-warning';
    return 'bg-success';
  };

  const getStrengthText = () => {
    if (validation.strength < 40) return 'Weak';
    if (validation.strength < 80) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={`font-medium ${
            validation.strength < 40 ? 'text-destructive' : 
            validation.strength < 80 ? 'text-warning' : 
            'text-success'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${validation.strength}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className={`flex items-center gap-2 ${validation.checks.minLength ? 'text-success' : 'text-muted-foreground'}`}>
          {validation.checks.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center gap-2 ${validation.checks.hasUpperCase ? 'text-success' : 'text-muted-foreground'}`}>
          {validation.checks.hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One uppercase letter</span>
        </div>
        <div className={`flex items-center gap-2 ${validation.checks.hasLowerCase ? 'text-success' : 'text-muted-foreground'}`}>
          {validation.checks.hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One lowercase letter</span>
        </div>
        <div className={`flex items-center gap-2 ${validation.checks.hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
          {validation.checks.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One number</span>
        </div>
        <div className={`flex items-center gap-2 ${validation.checks.hasSpecialChar ? 'text-success' : 'text-muted-foreground'}`}>
          {validation.checks.hasSpecialChar ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One special character</span>
        </div>
      </div>
    </div>
  );
};
