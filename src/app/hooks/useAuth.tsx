"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useUtils } from "./useUtils";

export const useAuth = () => {
    const router = useRouter();
    const { showNotification } = useUtils();
    const [accessToken, setAccessToken] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    );
    const [refreshToken, setRefreshToken] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    );
    const [accessExpiration, setAccessExpiration] = useState<number | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('accessExpiration');
        return stored ? Number(stored) : null;
    });

    const getAccessExpiration = (token: string | null) : number => {
        if (!token) return 0;
        const decoded = jwtDecode<{ exp?: number }>(token);
        // exp vem em segundos; converte para ms para comparar com Date.now()
        return decoded?.exp ? decoded.exp * 1000 : 0;
    }

    const storeAuthTokens = (accessToken: string, refreshToken: string) : void => {
        const expirationMs = getAccessExpiration(accessToken);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setAccessExpiration(expirationMs);
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('accessExpiration', String(expirationMs));
        }
    }

    const removeAuthTokens = () : void => {
        setAccessToken(null);
        setRefreshToken(null);
        setAccessExpiration(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('accessExpiration');
        }
    }

    const getNewAccessToken = async (refreshToken: string | null) : Promise<string> => {
        if (!refreshToken) {
            throw new Error('No refresh token');
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/users/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!response.ok) {
            throw new Error('Failed to refresh tokens');
        }
        const data = await response.json();
        
        const newAccess = data.access;
        const newRefresh = data.refresh ?? refreshToken;
        storeAuthTokens(newAccess, newRefresh);
        return newAccess;
    }

    const login = async (username: string, password: string) : Promise<boolean> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/users/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password})
            })

            if (response.status === 401 || response.status === 403) {
                showNotification('Usuário ou senha inválidos', 'error');
                return false;
            }

            const data = await response.json()

            storeAuthTokens(data.access, data.refresh)

            showNotification('Login realizado com sucesso', 'success');

            router.replace('/');

            return true;
        } catch (error) {
            showNotification('Erro ao fazer login: ' + error, 'error');
            return false;
        }

    }

    const logout = () : void => {
        removeAuthTokens();
        router.replace('/login');
    }

    const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) : Promise<Response> => {
        const baseHeaders: HeadersInit = {
            ...(options.headers || {}),
        };
        if (accessToken) {
            baseHeaders['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers: baseHeaders,
            });

            if (response.status === 401 || response.status === 403) {
                try {
                    const newAccessToken = await getNewAccessToken(refreshToken);
                    const retryHeaders: HeadersInit = {
                        ...(options.headers || {}),
                        'Authorization': `Bearer ${newAccessToken}`,
                    };
                    response = await fetch(url, {
                        ...options,
                        headers: retryHeaders,
                    });
                } catch (error) {
                    showNotification('Erro ao renovar token: ' + error, 'error');
                    logout();
                    throw new Error('Failed to make authenticated request');
                }
            }

            return response;

        } catch (error) {
            showNotification('Erro ao fazer requisição: ' + error, 'error');
            throw error;
        }

    }

    const redirectToLogin = () : void => {
        router.replace('/login');
    }

    return { login, makeAuthenticatedRequest, redirectToLogin, getNewAccessToken, logout, accessToken, refreshToken, accessExpiration };
}
