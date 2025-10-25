import type { User } from '@/types/auth';

//Centralized constants
const KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
} as const;

//Get access token from storage
export const getAccessToken = (): string | null => {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
};

//Set access token in storage
export const setAccessToken = (token: string): void => {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
};

//Get refresh token from storage
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
};

//Set refresh token in storage
export const setRefreshToken = (token: string): void => {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
};

//Get User from storage
export const getUser = (): User | null => {
    const userJson = localStorage.getItem(KEYS.USER);
    if (userJson == null) {
        return null;
    }

    try {
        return JSON.parse(userJson) as User;
    } catch (error) {
        console.error('Failed to parse user data from storage: ', error);
        return null;
    }
};

//Set user data in storage
export const setUser = (user: User): void => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

//Clear all auth data from storage
//Called on logout
export const clearAuth = (): void => {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
};

//Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return getAccessToken() !== null;
};

//Storage utility object
//In native replace localStorage with AsyncStorage
export const storage = {
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    getUser,
    setUser,
    clearAuth,
    isAuthenticated,
};
