// frontend/src/api/workouts.ts

import { apiClient } from './client';

// --- 1. TYPES (Matching your Django Models) ---

export interface PlannedSet {
    id: number;
    exercise: number; // The ID of the exercise
    order: number;
    target_reps?: string | null;
    target_weight?: string | null; // Decimals are strings
    rest_time_after?: number | null;
}

export interface ExerciseGroup {
    id: number;
    order: number;
    name?: string | null;
    sets: PlannedSet[];
}

export interface WorkoutPlan {
    id: number;
    owner_username: string;
    name: string;
    description?: string | null;
    groups: ExerciseGroup[];
}

// Input type for creating/updating a plan (omits read-only fields)
export type WorkoutPlanInput = Omit<WorkoutPlan, 'id' | 'owner_username'>;

export interface LoggedSet {
    id: number;
    session: number;
    exercise: number;
    planned_set?: number | null;
    order: number;
    actual_reps: number;
    actual_weight: string;
    actual_rest_time?: number | null;
}

// Input type for logging a set
export type LoggedSetInput = {
    session_id: number; // We must tell the backend which session
    exercise: number;
    planned_set?: number | null;
    order: number;
    actual_reps: number;
    actual_weight: string | number;
    actual_rest_time?: number | null;
};

export interface WorkoutSession {
    id: number;
    owner_username: string;
    plan?: number | null;
    date_started: string; // ISO date string
    date_finished?: string | null;
    notes?: string | null;
    logged_sets: LoggedSet[]; // Will be read-only in list/detail
}

// Input type for starting a session
export type StartSessionInput = {
    plan?: number;
    date_started: string;
};

// --- 2. API FUNCTIONS ---

const API_URL = '/workouts/';

// --- Workout Plans (The Routines) ---

export const getMyWorkoutPlans = (): Promise<WorkoutPlan[]> => {
    return apiClient.get(`${API_URL}plans/`).then(res => res.data);
};

export const getWorkoutPlanDetails = (planId: number): Promise<WorkoutPlan> => {
    return apiClient.get(`${API_URL}plans/${planId}/`).then(res => res.data);
};

export const createWorkoutPlan = (planData: WorkoutPlanInput): Promise<WorkoutPlan> => {
    return apiClient.post(`${API_URL}plans/`, planData).then(res => res.data);
};

// --- THIS IS THE CORRECTED FUNCTION ---
export const updateWorkoutPlan = (planId: number, planData: WorkoutPlanInput): Promise<WorkoutPlan> => {
    return apiClient.put(`${API_URL}plans/${planId}/`, planData).then(res => res.data);
};

export const deleteWorkoutPlan = (planId: number): Promise<void> => {
    return apiClient.delete(`${API_URL}plans/${planId}/`).then(res => res.data);
};


// --- Workout Sessions (The History) ---

export const getMyWorkoutSessions = (): Promise<WorkoutSession[]> => {
    return apiClient.get(`${API_URL}sessions/`).then(res => res.data);
};

export const startWorkoutSession = (sessionData: StartSessionInput): Promise<WorkoutSession> => {
    return apiClient.post(`${API_URL}sessions/`, sessionData).then(res => res.data);
};

export const finishWorkoutSession = (sessionId: number, finishDate: string): Promise<WorkoutSession> => {
    // We only update the 'date_finished' field
    return apiClient.patch(`${API_URL}sessions/${sessionId}/`, { date_finished: finishDate })
        .then(res => res.data);
};

export const getWorkoutSessionDetails = (sessionId: number): Promise<WorkoutSession> => {
    return apiClient.get(`${API_URL}sessions/${sessionId}/`).then(res => res.data);
};


// --- Logged Sets (During a Workout) ---

export const logSet = (setData: LoggedSetInput): Promise<LoggedSet> => {
    return apiClient.post(`${API_URL}logged-sets/`, setData).then(res => res.data);
};