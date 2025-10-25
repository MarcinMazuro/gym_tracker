export interface User {
    pk: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    email_verified?: boolean; // present when authenticated via our API
}

//Login credentials (POST /auth/login/)
export interface LoginCredentials {
    username: string;
    password: string;
}

//Registration data (POST /auth/registration/)
export interface RegisterData {
    username: string;
    email: string;
    password1: string;
    password2: string;
}

//Auth response from backend after login/registration
export interface AuthResponse {
    access: string;         // JWT Access Token (short-lived)
    refresh: string;        // JWT Refresh Token (long-lived)
    user: User;            // Logged in user data
}

//API error response
export interface ApiError {
    [key: string]: string[];  // e.g. { "email": ["This field is required."] }
}

//Authentication state in the app
export interface AuthState {
    user: User | null;       // Logged in user or null
    isAuthenticated: boolean; // Whether user is authenticated
    isLoading: boolean;      // Whether auth check is in progress
}
