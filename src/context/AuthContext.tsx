import React, { createContext, useState, useEffect, useContext } from 'react';
import { login } from '../services/api';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('byToken');
    if (storedToken) {
      setToken(storedToken);
      // Try to establish Supabase session with stored token
      establishSupabaseSession(storedToken);
    }
    setIsLoading(false);
  }, []);

  const establishSupabaseSession = async (jwt: string) => {
    try {
      // Sign in to Supabase using the JWT token
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'custom',
        token: jwt,
      });
      
      if (error) {
        console.warn('Failed to establish Supabase session:', error.message);
        // If JWT-based auth fails, try anonymous session as fallback
        await supabase.auth.signInAnonymously();
      }
    } catch (error) {
      console.warn('Error establishing Supabase session:', error);
      // Fallback to anonymous session
      try {
        await supabase.auth.signInAnonymously();
      } catch (anonError) {
        console.error('Failed to establish anonymous Supabase session:', anonError);
      }
    }
  };

  const handleLogin = async (authCode: string) => {
    setIsLoading(true);
    try {
      const response = await login(authCode);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.by_jwt) {
        localStorage.setItem('byToken', response.by_jwt);
        setToken(response.by_jwt);
        
        // Establish Supabase session after successful API login
        await establishSupabaseSession(response.by_jwt);
        
        toast.success('Successfully authenticated!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      localStorage.removeItem('byToken');
      setToken(null);
      // Sign out from Supabase on login failure
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('byToken');
    setToken(null);
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};