import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { AuthContextType, User } from '../types/index';
import * as api from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = api.getToken();
            if (token) {
                try {
                    const profile = await api.getProfile();
                    setUser(profile);
                } catch (error) {
                    console.error("Session validation failed:", error);
                    api.clearToken(); // Clear invalid token
                }
            }
            setIsAuthLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = useCallback(async (username: string, password_provided: string) => {
        const { user: authenticatedUser, token } = await api.login(username, password_provided);
        if (authenticatedUser && token) {
            api.setToken(token);
            setUser(authenticatedUser);
        } else {
            throw new Error('Invalid username or password.');
        }
    }, []);

    const logout = useCallback(() => {
        api.clearToken();
        setUser(null);
    }, []);

    const loginAsUser = useCallback(async (username: string) => {
        const { user: authenticatedUser, token } = await api.loginAsUser(username);
         if (authenticatedUser && token) {
            api.setToken(token);
            setUser(authenticatedUser);
        } else {
            throw new Error(`User "${username}" not found or login failed.`);
        }
    }, []);


    const updateCurrentUser = useCallback(async (userData: Partial<User>) => {
        if (!user) throw new Error("No user is logged in.");
        const updatedUser = await api.updateUser(user.username, userData);
        setUser(updatedUser);
    }, [user]);

    const value: AuthContextType = {
        user,
        isAuthLoading,
        login,
        logout,
        updateCurrentUser,
        loginAsUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};