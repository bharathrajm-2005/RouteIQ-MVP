import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('routeiq_token');
    const storedUser = localStorage.getItem('routeiq_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (authResponse) => {
    localStorage.setItem('routeiq_token', authResponse.token);
    localStorage.setItem('routeiq_user', JSON.stringify({
      userId: authResponse.userId,
      email: authResponse.email,
      companyName: authResponse.companyName,
    }));
    setToken(authResponse.token);
    setUser({
      userId: authResponse.userId,
      email: authResponse.email,
      companyName: authResponse.companyName,
    });
  };

  const logout = () => {
    localStorage.removeItem('routeiq_token');
    localStorage.removeItem('routeiq_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
