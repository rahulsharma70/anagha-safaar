import { useEffect, useState } from 'react';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

const AUTO_LOGOUT_SECONDS = 60;

export const SessionExpirationModal = () => {
  const { isSessionExpiring, refreshSession, signOut } = useAuthSecurity();
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_LOGOUT_SECONDS);

  useEffect(() => {
    if (!isSessionExpiring) {
      setSecondsRemaining(AUTO_LOGOUT_SECONDS);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionExpiring, signOut]);

  const handleStaySignedIn = async () => {
    await refreshSession();
    setSecondsRemaining(AUTO_LOGOUT_SECONDS);
  };

  const progress = (secondsRemaining / AUTO_LOGOUT_SECONDS) * 100;

  return (
    <AlertDialog open={isSessionExpiring}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session is about to expire due to inactivity. You will be automatically logged out
            in {secondsRemaining} seconds to protect your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Time remaining: {secondsRemaining}s
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={signOut}>Sign Out Now</AlertDialogCancel>
          <AlertDialogAction onClick={handleStaySignedIn}>
            Stay Signed In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
