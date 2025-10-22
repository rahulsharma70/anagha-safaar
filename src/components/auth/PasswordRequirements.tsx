import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const PasswordRequirements = () => {
  return (
    <Alert className="bg-info/5 border-info/20">
      <Info className="h-4 w-4 text-info" />
      <AlertDescription className="text-xs space-y-1 ml-2">
        <p className="font-semibold text-foreground">Password Requirements:</p>
        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
          <li>At least 8 characters long</li>
          <li>One uppercase letter (A-Z)</li>
          <li>One lowercase letter (a-z)</li>
          <li>One number (0-9)</li>
          <li>One special character (!@#$%^&*)</li>
          <li>Not a commonly used password</li>
        </ul>
        <p className="text-muted-foreground pt-1">
          These requirements are enforced by our secure backend system.
        </p>
      </AlertDescription>
    </Alert>
  );
};
