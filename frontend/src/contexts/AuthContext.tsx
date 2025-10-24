import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { storage } from '@/utils/storage';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';

//Auth context type definition
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

//Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Auth Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

//Auth Provider Component
//Wraps the app and provides authentication state
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    //Check if user is authenticated on mount
    //Restores session from localStorage
    const checkAuth = async () => {
        setIsLoading(true);
        try {
            //Check if we have a token
            const hasToken = storage.isAuthenticated();

            if (hasToken) {
                //Try to get current user from API
                //This also validates the token
                const userData = await authApi.getCurrentUser();
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                //No token - user is not logged in
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            //Token is invalid or expired
            console.error('Auth check failed:', error);
            storage.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    //Login user
    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const { user: userData } = await authApi.login(credentials);
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login failed:', error);
            throw error; // Re-throw so component can handle it
        } finally {
            setIsLoading(false);
        }
    };

    //Register new user
    const register = async (data: RegisterData) => {
        setIsLoading(true);
        try {
            const { user: userData } = await authApi.register(data);
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error; //Re-throw so component can handle it
        } finally {
            setIsLoading(false);
        }
    };

    
    //Logout user
    const logout = async () => {
        setIsLoading(true);
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    };

    //Check auth on component mount
    useEffect(() => {
        checkAuth();
    }, []);

    //Context value
    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

//Custom hook to use Auth Context
//Must be used within AuthProvider
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
