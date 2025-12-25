"use client"
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "@/lib/env";
import { useUtils } from "./useUtils";

export const AUTH_CHANGE_EVENT = "auth-change";

type UserInfo = {
    username: string;
    first_name?: string;
    last_name?: string;
    is_superuser: boolean;
    isSuperAdmin: boolean;
};

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    accessExpiration: number | null;
    userInfo: UserInfo | null;
};

const AUTH_STORAGE_KEYS = new Set(["accessToken", "refreshToken", "accessExpiration", "userInfo"]);

const DEFAULT_AUTH_STATE: AuthState = {
    accessToken: null,
    refreshToken: null,
    accessExpiration: null,
    userInfo: null,
};

const createDefaultState = (): AuthState => ({
    ...DEFAULT_AUTH_STATE,
});

const readAuthStateFromStorage = (): AuthState => {
    if (typeof window === "undefined") {
        return createDefaultState();
    }

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const expirationRaw = localStorage.getItem("accessExpiration");
    const userInfoRaw = localStorage.getItem("userInfo");

    let storedUserInfo: UserInfo | null = null;
    if (userInfoRaw) {
        try {
            storedUserInfo = JSON.parse(userInfoRaw) as UserInfo;
        } catch {
            storedUserInfo = null;
        }
    }

    const accessExpiration = expirationRaw ? Number(expirationRaw) : null;

    return {
        accessToken,
        refreshToken,
        accessExpiration: Number.isFinite(accessExpiration) ? accessExpiration : null,
        userInfo: storedUserInfo,
    };
};

const isUserInfoEqual = (a: UserInfo | null, b: UserInfo | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return (
        a.username === b.username &&
        a.first_name === b.first_name &&
        a.last_name === b.last_name &&
        a.is_superuser === b.is_superuser &&
        a.isSuperAdmin === b.isSuperAdmin
    );
};

const isStateEqual = (a: AuthState, b: AuthState): boolean => {
    return (
        a.accessToken === b.accessToken &&
        a.refreshToken === b.refreshToken &&
        a.accessExpiration === b.accessExpiration &&
        isUserInfoEqual(a.userInfo, b.userInfo)
    );
};

let authState: AuthState = createDefaultState();
let lastFetchedUserInfoToken: string | null = null;
let pendingUserInfoToken: string | null = null;
let skipNextAuthEventSync = false;
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
    subscribers.forEach((listener) => listener());
};

const persistAuthState = (state: AuthState) => {
    if (typeof window === "undefined") return;

    if (state.accessToken) {
        localStorage.setItem("accessToken", state.accessToken);
    } else {
        localStorage.removeItem("accessToken");
    }

    if (state.refreshToken) {
        localStorage.setItem("refreshToken", state.refreshToken);
    } else {
        localStorage.removeItem("refreshToken");
    }

    if (typeof state.accessExpiration === "number" && !Number.isNaN(state.accessExpiration)) {
        localStorage.setItem("accessExpiration", String(state.accessExpiration));
    } else {
        localStorage.removeItem("accessExpiration");
    }

    if (state.userInfo) {
        localStorage.setItem("userInfo", JSON.stringify(state.userInfo));
    } else {
        localStorage.removeItem("userInfo");
    }
};

const setAuthState = (nextState: AuthState) => {
    authState = nextState;
    persistAuthState(authState);
    if (authState.userInfo && authState.accessToken) {
        lastFetchedUserInfoToken = authState.accessToken;
    } else if (!authState.accessToken) {
        lastFetchedUserInfoToken = null;
    }
    notifySubscribers();
};

const mergeAuthState = (partial: Partial<AuthState>) => {
    setAuthState({
        ...authState,
        ...partial,
    });
};

const syncStateFromStorage = () => {
    if (typeof window === "undefined") return;
    const storedState = readAuthStateFromStorage();

    if (isStateEqual(storedState, authState)) {
        return;
    }

    authState = storedState;
    pendingUserInfoToken = null;
    if (storedState.userInfo && storedState.accessToken) {
        lastFetchedUserInfoToken = storedState.accessToken;
    } else if (!storedState.accessToken) {
        lastFetchedUserInfoToken = null;
    }
    notifySubscribers();
};

if (typeof window !== "undefined") {
    authState = readAuthStateFromStorage();
    if (authState.userInfo && authState.accessToken) {
        lastFetchedUserInfoToken = authState.accessToken;
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key && !AUTH_STORAGE_KEYS.has(event.key)) {
            return;
        }
        syncStateFromStorage();
    };

    const handleAuthEvent = () => {
        if (skipNextAuthEventSync) {
            skipNextAuthEventSync = false;
            return;
        }
        syncStateFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthEvent);
}

const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => {
        subscribers.delete(listener);
    };
};

const getClientSnapshot = () => authState;
const getServerSnapshot = () => DEFAULT_AUTH_STATE;

const getAccessExpiration = (token: string | null): number => {
    if (!token) return 0;
    const decoded = jwtDecode<{ exp?: number }>(token);
    return decoded?.exp ? decoded.exp * 1000 : 0;
};

const emitAuthChange = () => {
    if (typeof window !== "undefined") {
        skipNextAuthEventSync = true;
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
};

const requestUserInfo = async (token: string): Promise<UserInfo> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user info");
    }

    return response.json();
};

const refreshUserInfo = async (token: string | null, force = false): Promise<void> => {
    if (!token) {
        pendingUserInfoToken = null;
        lastFetchedUserInfoToken = null;
        mergeAuthState({ userInfo: null });
        return;
    }

    if (!force) {
        if (lastFetchedUserInfoToken === token && authState.userInfo) {
            return;
        }
        if (pendingUserInfoToken === token) {
            return;
        }
    }

    pendingUserInfoToken = token;
    try {
        const data = await requestUserInfo(token);
        if (pendingUserInfoToken !== token) return;
        lastFetchedUserInfoToken = token;
        mergeAuthState({ userInfo: data });
    } catch (error) {
        if (pendingUserInfoToken !== token) return;
        console.error("Unable to fetch user info", error);
        mergeAuthState({ userInfo: null });
    } finally {
        if (pendingUserInfoToken === token) {
            pendingUserInfoToken = null;
        }
    }
};

const storeAuthTokens = (accessToken: string, refreshToken: string): void => {
    const expirationMs = getAccessExpiration(accessToken);
    mergeAuthState({
        accessToken,
        refreshToken,
        accessExpiration: expirationMs,
    });
    emitAuthChange();
    void refreshUserInfo(accessToken, true);
};

const removeAuthTokens = (): void => {
    pendingUserInfoToken = null;
    lastFetchedUserInfoToken = null;
    setAuthState(createDefaultState());
    emitAuthChange();
};

export const useAuth = () => {
    const router = useRouter();
    const { showNotification } = useUtils();
    const { accessToken, refreshToken, accessExpiration, userInfo } = useSyncExternalStore(
        subscribe,
        getClientSnapshot,
        getServerSnapshot
    );

    useEffect(() => {
        if (!accessToken) return;
        void refreshUserInfo(accessToken);
    }, [accessToken]);

    const getNewAccessToken = async (refreshTokenParam: string | null): Promise<string> => {
        if (!refreshTokenParam) {
            throw new Error("No refresh token");
        }

        const response = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshTokenParam }),
        });

        if (!response.ok) {
            throw new Error("Failed to refresh tokens");
        }

        const data = await response.json();
        const newAccess = data.access;
        const newRefresh = data.refresh ?? refreshTokenParam;
        storeAuthTokens(newAccess, newRefresh);
        return newAccess;
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/token/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 401 || response.status === 403) {
                showNotification("Usuário ou senha inválidos", "error");
                return false;
            }

            const data = await response.json();
            storeAuthTokens(data.access, data.refresh);
            showNotification("Login realizado com sucesso", "success");
            router.replace("/");
            return true;
        } catch (error) {
            showNotification("Erro ao fazer login: " + error, "error");
            return false;
        }
    };

    const logout = (): void => {
        removeAuthTokens();
        router.replace("/login");
    };

    const makeAuthenticatedRequest = async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const buildHeaders = (token?: string | null) => {
            const headers = new Headers(options.headers ?? undefined);
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        };

        const baseHeaders = buildHeaders(accessToken);

        try {
            let response = await fetch(url, {
                ...options,
                headers: baseHeaders,
            });

            if (response.status === 401 || response.status === 403) {
                try {
                    const newAccessToken = await getNewAccessToken(refreshToken);
                    const retryHeaders = buildHeaders(newAccessToken);
                    response = await fetch(url, {
                        ...options,
                        headers: retryHeaders,
                    });
                } catch (error) {
                    showNotification("Erro ao renovar token: " + error, "error");
                    logout();
                    throw new Error("Failed to make authenticated request");
                }
            }

            return response;

        } catch (error) {
            showNotification("Erro ao fazer requisição: " + error, "error");
            throw error;
        }
    };

    const redirectToLogin = (): void => {
        router.replace("/login");
    };

    const isSuperAdmin = Boolean(userInfo?.is_superuser || userInfo?.isSuperAdmin);

    return {
        login,
        makeAuthenticatedRequest,
        redirectToLogin,
        getNewAccessToken,
        logout,
        accessToken,
        refreshToken,
        accessExpiration,
        isSuperAdmin,
        userInfo,
    };
};
