import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types/auth.types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('wms_access_token'));
  const [activeBranch, setActiveBranchState] = useState<string>(
    sessionStorage.getItem('wms_active_branch') || 'ALL',
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setActiveBranch = (branch: string) => {
    setActiveBranchState(branch);
    sessionStorage.setItem('wms_active_branch', branch);
  };

  useEffect(() => {
    localStorage.removeItem('wms_access_token');
    localStorage.removeItem('wms_active_branch');

    async function loadCurrentUser() {
      const storedToken = sessionStorage.getItem('wms_access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.get<User>('/auth/me');
        setUser(currentUser);
        if (currentUser.branch && currentUser.branch !== 'ALL') {
          setActiveBranch(currentUser.branch);
        }
      } catch {
        sessionStorage.removeItem('wms_access_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    sessionStorage.setItem('wms_access_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);

    const initialBranch = res.user.branch || 'ALL';
    setActiveBranch(initialBranch);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    sessionStorage.removeItem('wms_access_token');
    sessionStorage.removeItem('wms_active_branch');
    localStorage.removeItem('wms_access_token');
    localStorage.removeItem('wms_active_branch');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBranch,
        setActiveBranch,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
