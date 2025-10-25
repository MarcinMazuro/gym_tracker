import { apiClient } from './client';
import { storage } from '@/utils/storage';
import type {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User
} from '@/types/auth';


//Auth API - functions to interact with Django authentication endpoints
export const authApi = {
    //Login user
    //POST /auth/login/
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);

        //Save tokens and user data to storage
        const { access, refresh, user } = response.data;
        storage.setAccessToken(access);
        storage.setRefreshToken(refresh);
        storage.setUser(user);

        return response.data;
    },

    //Register new user
    //POST /auth/registration/
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/registration/', data);

        // Save tokens and user data to storage
        const { access, refresh, user } = response.data;
        storage.setAccessToken(access);
        storage.setRefreshToken(refresh);
        storage.setUser(user);

        return response.data;
    },


    //Logout user
    //POST /auth/logout/
    //Note: Even if API call fails, we clear local storage
    logout: async (): Promise<void> => {
        try {
            const refreshToken = storage.getRefreshToken();
            if (refreshToken) {
                // Blacklist the refresh token on the backend
                await apiClient.post('/auth/logout/', { refresh: refreshToken });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue to clear local storage even if API fails
        } finally {
            // Always clear local storage
            storage.clearAuth();
        }
    },


    //Get current user data
    //GET /auth/user/
    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>('/auth/user/');

        // Update user data in storage
        storage.setUser(response.data);

        return response.data;
    },


    //Verify email address
    //POST /auth/registration/verify-email/
    verifyEmail: async (key: string): Promise<void> => {
        await apiClient.post('/auth/registration/verify-email/', { key });
    },

    //Resend verification email
    //POST /auth/registration/resend-email/
    resendVerificationEmail: async (email: string): Promise<void> => {
        await apiClient.post('/auth/registration/resend-email/', { email });
    },


    //Request password reset
    //POST /auth/password/reset/
    requestPasswordReset: async (email: string): Promise<void> => {
        await apiClient.post('/auth/password/reset/', { email });
    },

    //Confirm password reset with token
    //POST /auth/password/reset/confirm/
    confirmPasswordReset: async (
        uid: string,
        token: string,
        newPassword1: string,
        newPassword2: string
    ): Promise<void> => {
        await apiClient.post('/auth/password/reset/confirm/', {
            uid,
            token,
            new_password1: newPassword1,
            new_password2: newPassword2,
        });
    },


    //Change password (when logged in)
    //POST /auth/password/change/
    changePassword: async (
        oldPassword: string,
        newPassword1: string,
        newPassword2: string
    ): Promise<void> => {
        await apiClient.post('/auth/password/change/', {
            old_password: oldPassword,
            new_password1: newPassword1,
            new_password2: newPassword2,
        });
    },
};
