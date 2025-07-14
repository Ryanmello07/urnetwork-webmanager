import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAutoLogin = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hasAttemptedAutoLogin = useRef(false);
  const isProcessingAutoLogin = useRef(false);

  useEffect(() => {
    // Only attempt auto-login once and if not already authenticated
    if (hasAttemptedAutoLogin.current || isAuthenticated || isProcessingAutoLogin.current) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get('auth_code');

    if (authCode && authCode.trim()) {
      hasAttemptedAutoLogin.current = true;
      isProcessingAutoLogin.current = true;
      
      console.log('Auto-login detected with auth code:', authCode);
      
      // Auto-fill the auth code input and submit the form
      setTimeout(() => {
        const authCodeInput = document.getElementById('authCode') as HTMLInputElement;
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (authCodeInput && submitButton) {
          // Fill the input
          authCodeInput.value = authCode.trim();
          
          // Trigger input event to update React state
          const inputEvent = new Event('input', { bubbles: true });
          authCodeInput.dispatchEvent(inputEvent);
          
          // Submit the form
          setTimeout(() => {
            submitButton.click();
            
            // Clear the auth_code from URL after attempting login
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('auth_code');
            window.history.replaceState({}, '', newUrl.toString());
          }, 100);
        }
        
        isProcessingAutoLogin.current = false;
      }, 500);
    }
  }, [isAuthenticated, location.search]);

  return {
    isAutoLoginAttempted: hasAttemptedAutoLogin.current,
    isProcessingAutoLogin: isProcessingAutoLogin.current
  };
};