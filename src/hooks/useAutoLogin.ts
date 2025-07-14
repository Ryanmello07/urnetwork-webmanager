import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAutoLogin = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hasAttemptedAutoLogin = useRef(false);

  useEffect(() => {
    // Only attempt auto-login once and if not already authenticated
    if (hasAttemptedAutoLogin.current || isAuthenticated) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get('auth_code');

    if (authCode && authCode.trim()) {
      hasAttemptedAutoLogin.current = true;
      
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
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('auth_code');
            window.history.replaceState({}, '', newUrl.toString());
          }, 200);
        }
      }, 300);
    }
  }, [isAuthenticated, location.search]);

  return {
    isAutoLoginAttempted: hasAttemptedAutoLogin.current,
  };
};