// frontend/src/utils/restTimerStorage.ts

/**
 * Utility for persisting rest timer state across browser refreshes
 */

const REST_TIMER_KEY = 'workout_rest_timer';

export interface RestTimerState {
    sessionId: number;
    startTime: number; // Unix timestamp in milliseconds
    targetDuration: number; // Total rest duration in seconds
    exerciseName?: string;
}

export const restTimerStorage = {
    /**
     * Save rest timer state to localStorage
     */
    save: (state: RestTimerState): void => {
        try {
            localStorage.setItem(REST_TIMER_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save rest timer state:', error);
        }
    },

    /**
     * Load rest timer state from localStorage
     */
    load: (): RestTimerState | null => {
        try {
            const stored = localStorage.getItem(REST_TIMER_KEY);
            if (!stored) return null;
            
            const state = JSON.parse(stored) as RestTimerState;
            
            // Validate the structure
            if (!state.sessionId || !state.startTime || !state.targetDuration) {
                return null;
            }
            
            return state;
        } catch (error) {
            console.error('Failed to load rest timer state:', error);
            return null;
        }
    },

    /**
     * Calculate remaining rest time in seconds
     * Returns 0 if rest period has ended
     */
    getRemainingTime: (state: RestTimerState): number => {
        const now = Date.now();
        const elapsed = Math.floor((now - state.startTime) / 1000);
        const remaining = state.targetDuration - elapsed;
        return Math.max(0, remaining);
    },

    /**
     * Calculate elapsed time in seconds
     */
    getElapsedTime: (state: RestTimerState): number => {
        const now = Date.now();
        return Math.floor((now - state.startTime) / 1000);
    },

    /**
     * Check if rest period has expired
     */
    hasExpired: (state: RestTimerState): boolean => {
        return restTimerStorage.getRemainingTime(state) === 0;
    },

    /**
     * Clear rest timer state from localStorage
     */
    clear: (): void => {
        try {
            localStorage.removeItem(REST_TIMER_KEY);
        } catch (error) {
            console.error('Failed to clear rest timer state:', error);
        }
    },

    /**
     * Check if stored timer belongs to a specific session
     */
    isForSession: (state: RestTimerState | null, sessionId: number): boolean => {
        return state !== null && state.sessionId === sessionId;
    },

    /**
     * Format time for display (MM:SS)
     */
    formatTime: (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};
