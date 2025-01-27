import React, { createContext, useContext, useState, useEffect } from 'react';
import { logout } from '../services/api';
import api from '../services/api';  // Add this import
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Get new CSRF token
                    await api.get('/auth/csrf-token');
                    
                    // Verify token
                    const response = await api.get('/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });

                    if (response.data.valid) {
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                        setIsAuthenticated(true);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    // Add session timeout handling
    useEffect(() => {
        let sessionTimeout;

        const resetSessionTimeout = () => {
            if (sessionTimeout) clearTimeout(sessionTimeout);
            sessionTimeout = setTimeout(() => {
                logout();
            }, 900000); // 15 minutes
        };

        if (isAuthenticated) {
            resetSessionTimeout();
            // Reset timeout on user activity
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            const activityHandler = () => resetSessionTimeout();
            events.forEach(event => document.addEventListener(event, activityHandler));

            return () => {
                if (sessionTimeout) clearTimeout(sessionTimeout);
                events.forEach(event => document.removeEventListener(event, activityHandler));
            };
        }
    }, [isAuthenticated]);

    const login = async (userData, authToken, csrfToken) => {
        try {
            setUser(userData);
            setToken(authToken);
            setIsAuthenticated(true);
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('csrfToken', csrfToken); // Store CSRF token
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully!');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
