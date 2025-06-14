import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/api";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (
        username: string,
        password: string,
        fullName?: string
    ) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const AUTH_TOKEN_KEY = "sgs_auth_token";
const AUTH_USER_KEY = "sgs_auth_user";

// Utility functions for localStorage
const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error("Failed to get stored token:", error);
        return null;
    }
};

const getStoredUser = (): User | null => {
    try {
        const userData = localStorage.getItem(AUTH_USER_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error("Failed to get stored user:", error);
        return null;
    }
};

const setStoredToken = (token: string): void => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
        console.error("Failed to store token:", error);
    }
};

const setStoredUser = (user: User): void => {
    try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.error("Failed to store user:", error);
    }
};

const clearStoredAuth = (): void => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
    } catch (error) {
        console.error("Failed to clear stored auth:", error);
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Initialize auth state on mount
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);

            // Try to restore from localStorage
            const storedToken = getStoredToken();
            const storedUser = getStoredUser();

            if (storedToken && storedUser) {
                // Set token in API client
                apiClient.setToken(storedToken);

                // Set user in state - this was missing!
                setUser(storedUser);

                console.log(
                    "Auth restored from localStorage:",
                    storedUser.username
                );
            } else {
                // No stored auth data, user needs to login
                console.log("No stored auth data found");
            }
        } catch (error) {
            console.error("Auth initialization failed:", error);
            // Clear everything on initialization failure
            clearStoredAuth();
            apiClient.clearToken();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true);

            const response = await apiClient.login({ username, password });

            if (response.data?.token && response.data?.user) {
                // Set token in API client
                apiClient.setToken(response.data.token);

                // Set user in context
                setUser(response.data.user);

                // Persist to localStorage
                setStoredToken(response.data.token);
                setStoredUser(response.data.user);

                toast.success("Welcome back. Logged in successfully");

                // Navigate to dashboard
                navigate("/dashboard");
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.message || error.message || "Login failed";
            toast.error(errorMessage || "Login failed");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (
        username: string,
        password: string,
        fullName?: string
    ) => {
        try {
            setIsLoading(true);

            await apiClient.register({
                username,
                password,
                fullName,
            });

            toast.success("Account created successfully. Proceed to login");
            // Navigate to login page (not register)
            navigate("/login");
        } catch (error: any) {
            const errorMessage =
                error.response?.message ||
                error.message ||
                "Registration failed";

            toast.error(errorMessage || "Registration failed");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        // Clear user from context
        setUser(null);

        // Clear from API client
        apiClient.clearToken();

        // Clear from localStorage
        clearStoredAuth();

        toast.success("Logged out successfully");

        // Navigate to login page
        navigate("/login");
    };

    const refreshUser = async () => {
        try {
            if (!apiClient.isAuthenticated()) {
                return;
            }

            const response = await apiClient.getCurrentUser();
            if (response.data) {
                setUser(response.data);
                // Update stored user data
                setStoredUser(response.data);
            } else {
                // If refresh fails, clear everything
                setUser(null);
                clearStoredAuth();
                apiClient.clearToken();
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
            // On refresh failure, clear auth state
            setUser(null);
            clearStoredAuth();
            apiClient.clearToken();
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user && !!getStoredToken(), // Check both user and token exist
        login,
        register,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Hook for checking if user is authenticated
export function useRequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, isLoading, navigate]);

    return { isAuthenticated, isLoading };
}
