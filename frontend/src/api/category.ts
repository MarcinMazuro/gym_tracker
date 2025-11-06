import { apiClient } from "./client";

// This interface is no longer used by the getCategory function
export interface Category {
    names: string[];
}

export interface CategoryFromAPI {
    category: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Fetches the list of all categories.
 * @returns A promise that resolves to an array of CategoryFromAPI objects.
 */
export const getCategory = async (): Promise<CategoryFromAPI[]> => {
    const response = await apiClient.get<CategoryFromAPI[]>('/exercises/categories/');
    return response.data;
};