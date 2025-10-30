import { apiClient } from "./client";
import type { AxiosResponse } from "axios";

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

export const getCategory = (): Promise<Category> => {
    return apiClient
        .get<PaginatedResponse<CategoryFromAPI>>("/exercises/categories/")
        .then((response: AxiosResponse<PaginatedResponse<CategoryFromAPI>>) => {
            const names = response.data.results.map(item => item.category);
            return { names };
        });
}
