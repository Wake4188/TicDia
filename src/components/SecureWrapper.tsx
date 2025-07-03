
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sanitizeErrorMessage } from '@/utils/security';

interface SecureWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const SecureWrapper = ({ 
  children, 
  requireAuth = false, 
  redirectTo = '/auth' 
}: SecureWrapperProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      console.log('Redirecting unauthenticated user to:', redirectTo);
      navigate(redirectTo);
    }
  }, [user, loading, requireAuth, redirectTo, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-wikitok-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

export default SecureWrapper;
