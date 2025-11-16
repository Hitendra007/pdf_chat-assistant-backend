import React, { useState, useContext, useEffect, createContext, useRef } from "react";
import { signup as apiSignup, login as apiLogin, logout as apiLogout, checkAuthStatus } from "../api/Auth.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState('');
    const checkingAuthRef = useRef(false);
    
    const checkAuth = async () => {
        // Prevent multiple simultaneous auth checks
        if (checkingAuthRef.current) {
            return;
        }
        
        try {
            checkingAuthRef.current = true;
            const response = await checkAuthStatus();
            if (response.status === 200) {
                // AuthStatus response structure: response.data.data = {authenticated: true, user: {id, email}}
                const userData = response.data.data?.user;
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                // User not authenticated - this is expected for logged out users
                setIsAuthenticated(false);
                setUser(null);
            } else {
                console.error("Auth check failed:", err);
            }
        } finally {
            setLoading(false);
            checkingAuthRef.current = false;
        }
    };
    

    const login = async (email, password) => {
        try {
            const response = await apiLogin(email, password);
            if (response.status === 200) {
                // Login response structure: response.data.data = {user_id, email, access_token}
                // Create user object from the response
                const userData = {
                    id: response.data.data.user_id,
                    email: response.data.data.email
                };
                setUser(userData);
                setIsAuthenticated(true);
                setToken(response.data.data.access_token);
            }
        } catch (err) {
            throw err;
        }
    };

    const signup = async (email, password) => {
        try {
            const response = await apiSignup(email, password);
            if (response.status === 201) {
                console.log('Successful signup');
            } else {
                console.log("Signup failed: ", response.status);
            }
        } catch (err) {
            console.log("Error during signup: ", err);
            throw err;
        }
    };

    const logout = async () => {
        try {
            const response = await apiLogout();
            if (response.status === 200) {
                setUser(null);
                setIsAuthenticated(false);
                setToken('');
            }
        } catch (err) {
            console.log(err);
            // Even if logout fails, clear local state
            setUser(null);
            setIsAuthenticated(false);
            setToken('');
        }
    };

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, token, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);