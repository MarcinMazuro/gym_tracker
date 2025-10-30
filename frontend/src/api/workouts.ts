import { apiClient } from './client';

// --- TYPES ---

export interface PlannedSet {
    id: number;
    exercise: number;
    order: number;
    target_reps?: string | null;
    target_weight?: string | null;
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
    completed_at: string;
}

export type LoggedSetInput = {
    session_id: number;
    exercise: number;
    planned_set?: number | null;
    order: number;
    actual_reps: number;
    actual_weight: string | number;
    actual_rest_time?: number | null;
    current_group_index?: number;
    current_set_index?: number;
};

export interface WorkoutSession {
    id: number;
    owner_username: string;
    plan?: number | null;
    plan_name?: string | null;
    plan_details?: WorkoutPlan;
    status: 'in_progress' | 'completed';
    current_group_index: number;
    current_set_index: number;
    date_started: string;
    date_finished?: string | null;
    notes?: string | null;
    logged_sets: LoggedSet[];
}

export type StartSessionInput = {
    plan?: number;
    date_started: string;
};

export type UpdateProgressInput = {
    current_group_index?: number;
    current_set_index?: number;
};

// --- API FUNCTIONS ---

const API_URL = '/workouts/';

// --- Workout Plans ---

export const getMyWorkoutPlans = (): Promise<WorkoutPlan[]> => {
    return apiClient.get(`${API_URL}plans/`).then(res => res.data);
};

export const getWorkoutPlanDetails = (planId: number): Promise<WorkoutPlan> => {
    return apiClient.get(`${API_URL}plans/${planId}/`).then(res => res.data);
};

export const createWorkoutPlan = (planData: WorkoutPlanInput): Promise<WorkoutPlan> => {
    return apiClient.post(`${API_URL}plans/`, planData).then(res => res.data);
};

export const updateWorkoutPlan = (planId: number, planData: WorkoutPlanInput): Promise<WorkoutPlan> => {
    return apiClient.put(`${API_URL}plans/${planId}/`, planData).then(res => res.data);
};

export const deleteWorkoutPlan = (planId: number): Promise<void> => {
    return apiClient.delete(`${API_URL}plans/${planId}/`).then(res => res.data);
};

// --- Workout Sessions ---

export const getMyWorkoutSessions = (params?: { page?: number; status?: string }): Promise<{ results: WorkoutSession[]; count: number; next: string | null; previous: string | null }> => {
    return apiClient.get(`${API_URL}sessions/`, { params }).then(res => res.data);
};

export const getPublicWorkoutSessions = (username: string): Promise<{ results: WorkoutSession[]; count: number; next: string | null; previous: string | null }> => {
    return apiClient.get(`${API_URL}sessions/user/${username}/`).then(res => res.data);
};

export const getActiveWorkoutSession = (): Promise<WorkoutSession> => {
    return apiClient.get(`${API_URL}sessions/active/`).then(res => res.data);
};

export const startWorkoutSession = (sessionData: StartSessionInput): Promise<WorkoutSession> => {
    return apiClient.post(`${API_URL}sessions/`, sessionData).then(res => res.data);
};

export const getWorkoutSessionDetails = (sessionId: number): Promise<WorkoutSession> => {
    return apiClient.get(`${API_URL}sessions/${sessionId}/`).then(res => res.data);
};

export const updateSessionProgress = (
    sessionId: number,
    progress: UpdateProgressInput
): Promise<WorkoutSession> => {
    return apiClient.patch(`${API_URL}sessions/${sessionId}/update_progress/`, progress)
        .then(res => res.data);
};

export const finishWorkoutSession = (sessionId: number): Promise<WorkoutSession> => {
    return apiClient.post(`${API_URL}sessions/${sessionId}/finish/`).then(res => res.data);
};

export const cancelWorkoutSession = (sessionId: number): Promise<WorkoutSession> => {
    return apiClient.post(`${API_URL}sessions/${sessionId}/cancel/`).then(res => res.data);
};

// --- Logged Sets ---

export const logSet = (setData: LoggedSetInput): Promise<LoggedSet> => {
    return apiClient.post(`${API_URL}logged-sets/`, setData).then(res => res.data);
};

export const deleteWorkoutSession = (sessionId: number): Promise<void> => {
    return apiClient.delete(`${API_URL}sessions/${sessionId}/`).then(res => res.data);
};

export const updateWorkoutSessionNotes = (sessionId: number, notes: string): Promise<WorkoutSession> => {
    return apiClient.patch(`${API_URL}sessions/${sessionId}/`, { notes }).then(res => res.data);
};

export const updateLoggedSet = (
    setId: number,
    data: { actual_reps?: number; actual_weight?: string }
): Promise<LoggedSet> => {
    return apiClient.patch(`${API_URL}logged-sets/${setId}/`, data).then(res => res.data);
};

export const deleteLoggedSet = (setId: number): Promise<void> => {
    return apiClient.delete(`${API_URL}logged-sets/${setId}/`).then(res => res.data);
};