'use client';

import { createContext, useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useUtils } from "@/app/hooks/useUtils";


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
    const {  redirectToLogin, getNewAccessToken, accessToken, refreshToken, logout } = useAuth();
    const { showNotification } = useUtils();
    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);

    useEffect(() => {
        let cancelled = false;
        const ensureAuthenticated = async () => {
            const accessExpiration = Number(localStorage.getItem("accessExpiration") || 0)
            const isExpired = !accessToken || accessExpiration < Date.now() + 10_000;

            if (!refreshToken) {
                setAuthStatus(AuthStatus.UNAUTHENTICATED);
                showNotification('Sessão expirada', 'error');
                return;
            }

            if (isExpired) {
                try {
                    await getNewAccessToken(refreshToken);
                } catch (error) {
                    if (!cancelled) {
                        setAuthStatus(AuthStatus.UNAUTHENTICATED);
                        showNotification('Sessão expirada', 'error');
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
    }, [accessToken, refreshToken, logout]); // eslint-disable-line react-hooks/exhaustive-deps

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
