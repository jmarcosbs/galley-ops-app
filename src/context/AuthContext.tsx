'use client';

import { createContext, useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";


enum AuthStatus {
    AUTHENTICATED = 'authenticated',
    UNAUTHENTICATED = 'unauthenticated',
    LOADING = 'loading',
}

interface AuthContextProps {
    authStatus: AuthStatus;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {  login, makeAuthenticatedRequest, redirectToLogin, getNewAccessToken, accessToken, refreshToken, logout } = useAuth();

    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);

    useEffect(() => {
        let cancelled = false;
        const ensureAuthenticated = async () => {
            const accessExpiration = Number(localStorage.getItem("accessExpiration") || 0)
            const nearExpiry = !accessToken || accessExpiration < Date.now() + 10_000;

            if (!refreshToken) {
                setAuthStatus(AuthStatus.UNAUTHENTICATED);
                return;
            }

            if (nearExpiry) {
                try {
                    await getNewAccessToken(refreshToken);
                } catch (error) {
                    if (!cancelled) {
                        setAuthStatus(AuthStatus.UNAUTHENTICATED);
                        logout();
                    }
                    return;
                }
            }

            if (!cancelled) {
                setAuthStatus(AuthStatus.AUTHENTICATED);
            }
        };
        ensureAuthenticated();
        return () => {
            cancelled = true;
        }
    }, [getNewAccessToken, accessToken, refreshToken, logout]);

    useEffect(() => {
        if (authStatus === AuthStatus.UNAUTHENTICATED) {
            redirectToLogin();
            return;
        }
    }, [authStatus, redirectToLogin]);

    return (
        <AuthContext.Provider value={{ authStatus }}>
            {children}
        </AuthContext.Provider>
    );
}
