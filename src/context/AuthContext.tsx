'use client';

import { createContext, useEffect, useRef, useState } from "react";
import { AUTH_CHANGE_EVENT, useAuth } from "@/app/hooks/useAuth";
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
    const [authCheckId, setAuthCheckId] = useState(0);
    const hasRedirectedRef = useRef(false);
    const logoutRef = useRef(logout);
    const redirectToLoginRef = useRef(redirectToLogin);
    const showNotificationRef = useRef(showNotification);

    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    useEffect(() => {
        redirectToLoginRef.current = redirectToLogin;
    }, [redirectToLogin]);

    useEffect(() => {
        showNotificationRef.current = showNotification;
    }, [showNotification]);

    useEffect(() => {
        const handleAuthChange = () => {
            setAuthCheckId((prev) => prev + 1);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const ensureAuthenticated = async () => {
            const storedAccess = accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
            const storedRefresh = refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
            const accessExpiration = Number(localStorage.getItem("accessExpiration") || 0)
            const isExpired = !storedAccess || accessExpiration < Date.now() + 10_000;

            if (!storedRefresh) {
                setAuthStatus(AuthStatus.UNAUTHENTICATED);
                return;
            }

            if (isExpired) {
                try {
                    await getNewAccessToken(storedRefresh);
                } catch (error) {
                    if (!cancelled) {
                        setAuthStatus(AuthStatus.UNAUTHENTICATED);
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
    }, [accessToken, refreshToken, authCheckId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (authStatus === AuthStatus.AUTHENTICATED) {
            hasRedirectedRef.current = false;
        }
    }, [authStatus]);

    useEffect(() => {
        if (authStatus !== AuthStatus.UNAUTHENTICATED) return;
        if (hasRedirectedRef.current) return;
        hasRedirectedRef.current = true;
        showNotificationRef.current('Sessão expirada', 'error');
        logoutRef.current();
        redirectToLoginRef.current();
    }, [authStatus]);

    return (
        <AuthContext.Provider value={{ authStatus }}>
            {children}
        </AuthContext.Provider>
    );
}
