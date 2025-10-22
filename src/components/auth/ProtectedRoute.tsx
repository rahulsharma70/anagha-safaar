import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/auth',
}: ProtectedRouteProps) => {
  const { user } = useAuth();
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && !user && !loading) {
      navigate(redirectTo, { state: { from: window.location.pathname } });
    }
  }, [user, requireAuth, redirectTo, navigate, loading]);

  useEffect(() => {
    if (requireAdmin && !loading && role !== 'admin') {
      navigate('/access-denied');
    }
  }, [role, requireAdmin, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requireAdmin && role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};
