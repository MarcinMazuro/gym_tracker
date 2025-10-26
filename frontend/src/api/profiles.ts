import { apiClient } from './client';

export interface Profile {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_public: boolean;
    gender: 'M' | 'F' | null;
    weight: number | null;
    height: number | null;
    body_fat_percentage: number | null;
    updated_at: string;
    date_joined: string;
    about_me: string | null;
}

export interface PublicProfile {
    username: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    weight: number | null;
    height: number | null;
    body_fat_percentage: number | null;
    date_joined: string;
    about_me: string | null;
}

export const getMyProfile = (): Promise<Profile> => {
    return apiClient.get('/profiles/me/').then(res => res.data);
};

export const updateMyProfile = (data: Partial<Profile>): Promise<Profile> => {
    return apiClient.patch('/profiles/me/', data).then(res => res.data);
};

export const getPublicProfiles = (): Promise<PublicProfile[]> => {
    return apiClient.get('/profiles/').then(res => res.data);
};

export const getPublicProfileByUsername = (username: string): Promise<PublicProfile> => {
    return apiClient.get(`/profiles/${username}/`).then(res => res.data);
};