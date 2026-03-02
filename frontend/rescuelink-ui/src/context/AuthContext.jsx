import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function normalizeAuth(raw) {
  if (!raw) return null;
  if (raw.user) {
    return {
      token: raw.token || '',
      user: {
        ...raw.user,
        role: raw.user?.role || 'USER'
      }
    };
  }
  if (raw.id || raw.email) {
    return {
      token: raw.token || '',
      user: {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        bloodGroup: raw.bloodGroup,
        emergencyContact: raw.emergencyContact,
        role: raw.role || 'USER'
      }
    };
  }
  return null;
}

function readStoredAuth() {
  const authRaw = localStorage.getItem('auth');
  if (authRaw) {
    try {
      return normalizeAuth(JSON.parse(authRaw));
    } catch {
      return null;
    }
  }

  const legacyUser = localStorage.getItem('user');
  if (legacyUser) {
    try {
      return normalizeAuth(JSON.parse(legacyUser));
    } catch {
      return null;
    }
  }

  return null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = useCallback((payload, remember = true) => {
    const normalized = normalizeAuth(payload);
    setAuth(normalized);
    if (remember) {
      localStorage.setItem('auth', JSON.stringify(normalized));
      localStorage.removeItem('user');
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
  }, []);

  const updateUser = useCallback((partialUser) => {
    setAuth((current) => {
      if (!current) return current;
      const updated = {
        ...current,
        user: {
          ...current.user,
          ...partialUser
        }
      };
      localStorage.setItem('auth', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    auth,
    user: auth?.user || null,
    token: auth?.token || '',
    role: auth?.user?.role || null,
    isAuthenticated: Boolean(auth?.user),
    login,
    logout,
    updateUser
  }), [auth, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
