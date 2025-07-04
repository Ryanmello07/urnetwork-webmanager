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
      // Set the Supabase session with the stored token
      supabase.auth.setSession({
        access_token: storedToken,
        refresh_token: '', // We don't have a refresh token in this case
      });
    }
    setIsLoading(false);
  }, []);

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
        
        // Set the Supabase session with the JWT token
        await supabase.auth.setSession({
          access_token: response.by_jwt,
          refresh_token: '', // We don't have a refresh token in this case
        });
        
        toast.success('Successfully authenticated!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      localStorage.removeItem('byToken');
      setToken(null);
      // Clear Supabase session on error
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