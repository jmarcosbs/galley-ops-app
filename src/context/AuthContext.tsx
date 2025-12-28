'use client';

import { createContext, useEffect, useRef, useState } from "react";
import { AUTH_CHANGE_EVENT, useAuth } from "@/app/hooks/useAuth";
import { useUtils } from "@/app/hooks/useUtils";

const TOKEN_REFRESH_RETRY_DELAY = 5000;
const AUTH_ERROR_STATUSES = new Set([401, 403]);

const isRefreshAuthError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const potentialError = error as { status?: number };
    if (typeof potentialError.status !== "number") return false;
    return AUTH_ERROR_STATUSES.has(potentialError.status);
};


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
    const refreshRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectionNotifiedRef = useRef(false);

    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    useEffect(() => {
        redirectToLoginRef.current = redirectToLogin;
    }, [redirectToLogin]);

    useEffect(() => {
        showNotificationRef.current = showNotification;
    }, [showNotification]);

    const clearRefreshRetry = () => {
        if (refreshRetryTimeoutRef.current) {
            clearTimeout(refreshRetryTimeoutRef.current);
            refreshRetryTimeoutRef.current = null;
        }
    };

    const scheduleRefreshRetry = () => {
        if (typeof window === "undefined") return;
        if (refreshRetryTimeoutRef.current) return;
        refreshRetryTimeoutRef.current = window.setTimeout(() => {
            refreshRetryTimeoutRef.current = null;
            setAuthCheckId((prev) => prev + 1);
        }, TOKEN_REFRESH_RETRY_DELAY);
    };

    const notifyReconnectionAttempt = () => {
        if (reconnectionNotifiedRef.current) return;
        reconnectionNotifiedRef.current = true;
        showNotificationRef.current("Sem conexão com o servidor, tentando reconectar…", "info");
    };

    const resetReconnectionNotice = () => {
        reconnectionNotifiedRef.current = false;
    };

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
                clearRefreshRetry();
                resetReconnectionNotice();
                setAuthStatus(AuthStatus.UNAUTHENTICATED);
                return;
            }

            if (isExpired) {
                try {
                    await getNewAccessToken(storedRefresh);
                } catch (error) {
                    if (!cancelled) {
                        if (isRefreshAuthError(error)) {
                            clearRefreshRetry();
                            resetReconnectionNotice();
                            setAuthStatus(AuthStatus.UNAUTHENTICATED);
                        } else {
                            setAuthStatus(AuthStatus.LOADING);
                            notifyReconnectionAttempt();
                            scheduleRefreshRetry();
                        }
                    }
                    return;
                }
            }

            if (!cancelled) {
                clearRefreshRetry();
                resetReconnectionNotice();
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

    useEffect(() => {
        return () => {
            clearRefreshRetry();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ authStatus }}>
            {children}
        </AuthContext.Provider>
    );
}
