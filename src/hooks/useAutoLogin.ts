import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useAutoLogin = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasAttemptedAutoLogin = useRef(false);

  useEffect(() => {
    // Only attempt auto-login once and if not already authenticated
    if (hasAttemptedAutoLogin.current || isAuthenticated || isLoading) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get('auth_code');

    if (authCode) {
      hasAttemptedAutoLogin.current = true;
      
      // Show a loading toast
      const loadingToast = toast.loading('Authenticating with provided code...');
      
      // Attempt automatic login
      login(authCode)
        .then(() => {
          toast.dismiss(loadingToast);
          // Clear the auth_code from URL after successful login
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('auth_code');
          window.history.replaceState({}, '', newUrl.toString());
          
          // Navigate to the main dashboard
          navigate('/', { replace: true });
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          console.error('Auto-login failed:', error);
          
          // Clear the auth_code from URL even if login failed
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('auth_code');
          window.history.replaceState({}, '', newUrl.toString());
          
          // Show error message
          toast.error('Automatic authentication failed. Please try logging in manually.');
        });
    }
  }, [login, isAuthenticated, isLoading, location.search, navigate]);

  return {
    isAutoLoginAttempted: hasAttemptedAutoLogin.current
  };
};