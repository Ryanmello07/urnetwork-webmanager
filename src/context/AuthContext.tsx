import React, { createContext, useState, useEffect, useContext } from 'react';
import { login } from '../services/api';
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
        toast.success('Successfully authenticated!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      localStorage.removeItem('byToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('byToken');
    setToken(null);
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