import { useState } from 'react';
import { AuthContext } from './AuthStateContext';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        return storedToken && storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const loading = false;

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
