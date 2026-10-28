import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getCurrentUser, setCurrentUser, removeCurrentUser, removeAuthToken, setAuthToken, type UserProfile } from '../api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  quickLoginAs: (userObj: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (getCurrentUser()) {
          const profile = await api.getMe();
          setUser(profile);
          setCurrentUser(profile);
        }
      } catch (err) {
        removeAuthToken();
        removeCurrentUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setAuthToken(res.access_token);
    setCurrentUser(res.user);
    setUser(res.user);
  };

  const quickLoginAs = async (demoUser: any) => {
    let payload: any = { role: demoUser.role };
    if (demoUser.role === 'student') {
      payload.enrollment_no = demoUser.enrollment_no || 'EN2023CS0481';
      payload.password = demoUser.password || 'StudentPass@123';
      payload.phone = demoUser.phone;
      payload.otp = demoUser.otp || '123456';
    } else {
      payload.email = demoUser.email;
      payload.password = demoUser.password || 'DemoPass@123';
    }
    await login(payload);
  };

  const logout = () => {
    removeAuthToken();
    removeCurrentUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, quickLoginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
