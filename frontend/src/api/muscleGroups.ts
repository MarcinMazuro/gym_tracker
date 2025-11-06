import { apiClient } from "./client";

export interface MuscleGroup {
    names: string[];
}

export interface MuscleGroupFromAPI {
    id: number;
    name: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Fetches the list of all muscle groups.
 * @returns A promise that resolves to an array of MuscleGroupFromAPI objects.
 */
export const getMuscleGroups = async (): Promise<MuscleGroupFromAPI[]> => {
    const response = await apiClient.get<MuscleGroupFromAPI[]>("/exercises/muscle-groups/");
    return response.data;
}
