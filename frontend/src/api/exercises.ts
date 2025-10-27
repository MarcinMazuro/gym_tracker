import { apiClient } from './client';
import type { AxiosResponse } from 'axios';

// Interface for a single exercise, matching the serializer
export interface Exercise {
    id: number;
    name: string;
    force: string | null;
    level: string;
    mechanic: string | null;
    category: string;
    equipment: string | null;
    primary_muscles: string[];
    secondary_muscles: string[];
    instructions: string[];
}

// Generic interface for paginated API responses from DRF
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Fetches a paginated list of exercises.
 * @param page The page number to fetch.
 */
export const getExercises = (page: number): Promise<PaginatedResponse<Exercise>> => {
    // Określ typ odpowiedzi i wyodrębnij .data
    return apiClient.get<PaginatedResponse<Exercise>>(`/exercises/?page=${page}`)
        .then((response: AxiosResponse<PaginatedResponse<Exercise>>) => response.data);
};

/**
 * Fetches a single exercise by its ID.
 * @param id The ID of the exercise to fetch.
 */
export const getExerciseById = (id: string): Promise<Exercise> => {
    // Określ typ odpowiedzi i wyodrębnij .data
    return apiClient.get<Exercise>(`/exercises/${id}/`)
        .then((response: AxiosResponse<Exercise>) => response.data);
};