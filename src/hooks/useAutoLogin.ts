import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAutoLogin = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasAttemptedAutoLogin = useRef(false);
  const lastAttemptedCode = useRef<string | null>(null);

  useEffect(() => {
    // Only attempt auto-login once and if not already authenticated
    if (hasAttemptedAutoLogin.current || isAuthenticated) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get('auth_code');

    if (authCode && authCode.trim() && authCode !== lastAttemptedCode.current) {
      hasAttemptedAutoLogin.current = true;
      lastAttemptedCode.current = authCode;
      
      console.log('Auto-login detected with auth code:', authCode);
      
      // Auto-fill the auth code input and trigger form submission
      setTimeout(() => {
        const authCodeInput = document.getElementById('authCode') as HTMLInputElement;
        const form = authCodeInput?.closest('form') as HTMLFormElement;
        
        if (authCodeInput && form) {
          // Fill the input
          authCodeInput.value = authCode.trim();
          
          // Trigger multiple events to ensure React state is updated
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          authCodeInput.dispatchEvent(inputEvent);
          authCodeInput.dispatchEvent(changeEvent);
          
          // Focus the input to ensure it's active
          authCodeInput.focus();
          
          // Submit the form after a short delay to ensure state is updated
          setTimeout(() => {
            // Try multiple methods to submit the form
            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            
            if (submitButton && !submitButton.disabled) {
              submitButton.click();
            } else {
              // If button is still disabled, trigger form submission directly
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);
            }
            
            // Clear the auth_code from URL after attempting login
            navigate(location.pathname, { replace: true });
          }, 200);
        }
      }, 300);
    }
  }, [isAuthenticated, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for authentication failures to clear the form and URL
  useEffect(() => {
    // If we attempted auto-login but are not loading and not authenticated, it failed
    //
    // This is mostly correct, however this logic also runs initially after the page loads,
    // because during that time, AuthContext stays in a not loading and not authenticated state.
    // After the first render, AuthContext sets its token state from localStorage.
    //
    // Right now it's safe to leave it as-is.
    if (hasAttemptedAutoLogin.current && !isLoading && !isAuthenticated) {
      console.log('Auto-login failed, clearing form and URL');
      
      // Clear the auth code input
      const authCodeInput = document.getElementById('authCode') as HTMLInputElement;
      if (authCodeInput) {
        authCodeInput.value = '';
        
        // Trigger events to update React state
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        authCodeInput.dispatchEvent(inputEvent);
        authCodeInput.dispatchEvent(changeEvent);
      }
      
      // Clear the auth_code from URL
      if (location.search.includes('auth_code')) {
        navigate(location.pathname, { replace: true });
      }
      
      // Reset the attempt tracking
      hasAttemptedAutoLogin.current = false;
      lastAttemptedCode.current = null;
    }
  }, [isLoading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isAutoLoginAttempted: hasAttemptedAutoLogin.current,
  };
};