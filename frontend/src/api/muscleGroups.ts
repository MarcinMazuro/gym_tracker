import { apiClient } from "./client";
import type { AxiosResponse } from "axios";

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

export const getMuscleGroups = (): Promise<MuscleGroup> => {
    return apiClient
        .get<PaginatedResponse<MuscleGroupFromAPI>>("/exercises/muscle-groups/")
        .then((response: AxiosResponse<PaginatedResponse<MuscleGroupFromAPI>>) => {
            const names = response.data.results.map(group => group.name);
            return { names };
        });
}