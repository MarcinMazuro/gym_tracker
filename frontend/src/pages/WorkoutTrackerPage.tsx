import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    getActiveWorkoutSession,
    startWorkoutSession,
    logSet,
    finishWorkoutSession,
    cancelWorkoutSession,
    updateSessionProgress
} from '@/api/workouts';
import type {
    WorkoutPlan,
    WorkoutSession,
    LoggedSetInput,
    PlannedSet
} from '@/api/workouts';
import { getExercisesByIds } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

let cachedExercises: Exercise[] | null = null;

export default function WorkoutTrackerPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- Core State ---
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- State Machine ---
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    
    // --- Form State ---
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');

    // --- Timer State ---
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const [targetRestTime, setTargetRestTime] = useState(0);

    // --- Action State ---
    const [isPerformingAction, setIsPerformingAction] = useState(false);

    // Use ref to prevent multiple finish calls
    const isFinishingRef = useRef(false);

    // --- Initialization: Check for active session or start new one ---
    useEffect(() => {
        const initializeWorkout = async () => {
            try {
                // 1. Check if there's an active session
                let activeSession: WorkoutSession | null = null;
                try {
                    activeSession = await getActiveWorkoutSession();
                    console.log('Found active session:', activeSession);
                } catch (err: any) {
                    if (err.response?.status !== 404) {
                        throw err;
                    }
                }

                // 2. If we have an active session, resume it
                if (activeSession) {
                    if (!activeSession.plan_details) {
                        setError('Active session has no plan details.');
                        setIsLoading(false);
                        return;
                    }

                    setPlan(activeSession.plan_details);
                    setSession(activeSession);
                    
                    // Restore position
                    setCurrentGroupIndex(activeSession.current_group_index);
                    setCurrentSetIndex(activeSession.current_set_index);

                    // Fetch exercises for this plan
                    const exerciseIds = new Set<number>();
                    activeSession.plan_details.groups.forEach(group => {
                        group.sets.forEach(set => exerciseIds.add(set.exercise));
                    });

                    if (!cachedExercises) {
                        cachedExercises = await getExercisesByIds(Array.from(exerciseIds));
                    }
                    setExercises(cachedExercises);

                    // Pre-fill current set
                    const currentGroup = activeSession.plan_details.groups[activeSession.current_group_index];
                    const currentSet = currentGroup?.sets[activeSession.current_set_index];
                    if (currentSet) {
                        setReps(currentSet.target_reps || '');
                        setWeight(currentSet.target_weight || '');
                    }

                    // Calculate rest timer from last logged set if applicable
                    if (activeSession.logged_sets && activeSession.logged_sets.length > 0) {
                        const lastSet = activeSession.logged_sets[activeSession.logged_sets.length - 1];
                        const lastSetTime = new Date(lastSet.completed_at).getTime();
                        const now = Date.now();
                        const elapsedSeconds = Math.floor((now - lastSetTime) / 1000);
                        
                        // Find the rest time for the last set
                        const lastSetPlan = activeSession.plan_details.groups
                            .flatMap(g => g.sets)
                            .find(s => s.id === lastSet.planned_set);
                        
                        if (lastSetPlan?.rest_time_after && lastSetPlan.rest_time_after > 0) {
                            const remainingRest = lastSetPlan.rest_time_after - elapsedSeconds;
                            
                            // Only show rest if we're still on the same set (haven't advanced yet)
                            // Check if we're on the next set after the logged one
                            const expectedNextSetIndex = (activeSession.logged_sets.length % activeSession.plan_details.groups[activeSession.current_group_index].sets.length);
                            const actualCurrentSetIndex = activeSession.current_set_index;
                            
                            // If indexes match, we haven't advanced yet, so show rest
                            if (remainingRest > 0 && expectedNextSetIndex === actualCurrentSetIndex) {
                                setTargetRestTime(lastSetPlan.rest_time_after);
                                setRestTimer(remainingRest);
                                setIsResting(true);
                            }
                        }
                    }

                    setIsLoading(false);
                    return;
                }

                // 3. No active session - check if a plan was passed to start a new one
                const planFromState: WorkoutPlan | undefined = location.state?.plan;
                if (!planFromState) {
                    setError('No workout plan was selected and no active session found.');
                    setIsLoading(false);
                    return;
                }
                
                if (!planFromState.groups || planFromState.groups.length === 0) {
                    setError('This workout plan has no exercise groups.');
                    setIsLoading(false);
                    return;
                }

                setPlan(planFromState);

                // Fetch exercises
                const exerciseIds = new Set<number>();
                planFromState.groups.forEach(group => {
                    group.sets.forEach(set => exerciseIds.add(set.exercise));
                });

                if (!cachedExercises) {
                    cachedExercises = await getExercisesByIds(Array.from(exerciseIds));
                }
                setExercises(cachedExercises);
                
                // Create new session
                const newSession = await startWorkoutSession({
                    plan: planFromState.id,
                    date_started: new Date().toISOString(),
                });
                setSession(newSession);

                // Pre-fill first set
                const firstSet = planFromState.groups[0]?.sets[0];
                if (firstSet) {
                    setReps(firstSet.target_reps || '');
                    setWeight(firstSet.target_weight || '');
                }

            } catch (err: any) {
                console.error('Failed to initialize workout:', err);
                setError(err.response?.data?.error || 'Failed to initialize workout session.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeWorkout();
    }, []);

    // --- Rest Timer Countdown ---
    useEffect(() => {
        if (!isResting || restTimer <= 0) {
            if (isResting && restTimer <= 0) {
                setIsResting(false);
            }
            return;
        }

        const interval = setInterval(() => {
            setRestTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    
    // --- Get current set and exercise ---
    const getCurrentSet = (): PlannedSet | null => {
        if (!plan) return null;
        const group = plan.groups[currentGroupIndex];
        if (!group) return null;
        return group.sets[currentSetIndex] || null;
    };

    const getCurrentExercise = (): Exercise | null => {
        const currentSet = getCurrentSet();
        if (!currentSet) return null;
        return exercises.find(e => e.id === currentSet.exercise) || null;
    };

    const currentSet = getCurrentSet();
    const currentExercise = getCurrentExercise();
    const currentGroup = plan?.groups[currentGroupIndex];
    const isLastSetInGroup = currentSet && currentGroup ? currentSetIndex === currentGroup.sets.length - 1 : false;
    const isLastGroup = plan ? currentGroupIndex === plan.groups.length - 1 : false;

    // --- Pre-fill form when set changes ---
    useEffect(() => {
        if (currentSet && !isResting) {
            setReps(currentSet.target_reps || '');
            setWeight(currentSet.target_weight || '');
        }
    }, [currentSetIndex, currentGroupIndex, isResting, currentSet]);


    // --- Action Handlers ---

    const handleLogSet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !currentSet || !currentExercise || isPerformingAction) {
            return;
        }

        setIsPerformingAction(true);
        setError('');

        const setData: LoggedSetInput = {
            session_id: session.id,
            exercise: currentExercise.id,
            planned_set: 'id' in currentSet ? currentSet.id : undefined,
            order: (session.logged_sets?.length || 0) + 1,
            actual_reps: parseInt(reps) || 0,
            actual_weight: weight || '0',
            // Update progress when logging set
            current_group_index: currentGroupIndex,
            current_set_index: isLastSetInGroup ? currentSetIndex : currentSetIndex + 1,
        };

        try {
            const loggedSet = await logSet(setData);
            
            // Update local session state
            setSession(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    logged_sets: [...prev.logged_sets, loggedSet],
                    current_group_index: currentGroupIndex,
                    current_set_index: isLastSetInGroup ? currentSetIndex : currentSetIndex + 1,
                };
            });

            // --- Flow logic ---
            if (isLastSetInGroup) {
                // FIX 3: Auto-advance to next group (unless it's the last group)
                if (!isLastGroup) {
                    // Automatically move to next group
                    await handleNextGroup();
                } else {
                    // Last group - clear form and wait for user to finish
                    setReps('');
                    setWeight('');
                }
            } else {
                // Move to next set
                const rest = currentSet.rest_time_after;
                if (rest && rest > 0) {
                    setTargetRestTime(rest);
                    setRestTimer(rest);
                    setIsResting(true);
                }
                setCurrentSetIndex(prev => prev + 1);
            }

        } catch (err) {
            console.error('Failed to log set:', err);
            setError('Failed to log set. Please try again.');
        } finally {
            setIsPerformingAction(false);
        }
    };
    
    const handleNextGroup = async () => {
        if (!session || isPerformingAction) return;

        setIsPerformingAction(true);

        if (isLastGroup) {
            await handleFinishWorkout();
            return;
        }

        const newGroupIndex = currentGroupIndex + 1;
        
        try {
            // Update progress on backend
            await updateSessionProgress(session.id, {
                current_group_index: newGroupIndex,
                current_set_index: 0
            });

            // Update local state
            setCurrentGroupIndex(newGroupIndex);
            setCurrentSetIndex(0);
            setIsResting(false);
            setRestTimer(0);
            setTargetRestTime(0);
        } catch (err) {
            console.error('Failed to update progress:', err);
            setError('Failed to save progress.');
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleFinishWorkout = async () => {
        if (!session || isFinishingRef.current) return;
        
        // For last set, don't ask for confirmation
        const shouldConfirm = session.logged_sets.length === 0;
        
        if (shouldConfirm && !window.confirm('Are you sure you want to finish this workout?')) {
            return;
        }

        isFinishingRef.current = true;
        setIsPerformingAction(true);
        
        try {
            await finishWorkoutSession(session.id);
            
            // Clear all state
            setSession(null);
            setPlan(null);
            setExercises([]);
            setCurrentGroupIndex(0);
            setCurrentSetIndex(0);
            setReps('');
            setWeight('');
            setIsResting(false);
            setRestTimer(0);
            setTargetRestTime(0);
            
            // Notify layout to update
            window.dispatchEvent(new Event('workoutFinished'));
            
            // Navigate to history
            navigate('/history', { replace: true });
        } catch (err) {
            console.error('Failed to finish workout:', err);
            setError('Failed to save workout.');
            isFinishingRef.current = false;
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleCancelWorkout = async () => {
        if (!session || isFinishingRef.current) return;
        if (!window.confirm('Are you sure you want to cancel this workout? All progress will be saved.')) return;
        
        isFinishingRef.current = true;
        setIsPerformingAction(true);
        
        try {
            await cancelWorkoutSession(session.id);
            
            // Clear all state BEFORE navigating
            setSession(null);
            setPlan(null);
            setExercises([]);
            setCurrentGroupIndex(0);
            setCurrentSetIndex(0);
            setReps('');
            setWeight('');
            setIsResting(false);
            setRestTimer(0);
            setTargetRestTime(0);
            
            // Notify layout to update
            window.dispatchEvent(new Event('workoutFinished'));
            
            // Navigate with replace to prevent back button issues
            navigate('/history', { replace: true });
        } catch (err) {
            console.error('Failed to cancel workout:', err);
            setError('Failed to cancel workout.');
            isFinishingRef.current = false;
        } finally {
            setIsPerformingAction(false);
        }
    };
    
    const handleSkipRest = async () => {
        if (!session || isPerformingAction) return;

        setIsPerformingAction(true);

        // FIX 2: Update backend when skipping rest
        // This advances us to the next set on the backend
        try {
            const nextSetIndex = currentSetIndex + 1;
            
            await updateSessionProgress(session.id, {
                current_group_index: currentGroupIndex,
                current_set_index: nextSetIndex
            });

            // Update local state
            setRestTimer(0);
            setIsResting(false);
            setTargetRestTime(0);
            
            // Update session state
            setSession(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    current_group_index: currentGroupIndex,
                    current_set_index: nextSetIndex
                };
            });
        } catch (err) {
            console.error('Failed to skip rest:', err);
            // Even if backend fails, update UI
            setRestTimer(0);
            setIsResting(false);
            setTargetRestTime(0);
        } finally {
            setIsPerformingAction(false);
        }
    };

    // --- Render Logic ---
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Spinner />
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/workouts')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                    Back to Workouts
                </button>
            </div>
        );
    }

    // --- Render Rest Timer ---
    if (isResting) {
        const progress = targetRestTime > 0 ? ((targetRestTime - restTimer) / targetRestTime) * 100 : 0;
        
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
                <div className="mb-4">
                    <p className="text-xl text-gray-500 uppercase tracking-wide">Rest Time</p>
                    {currentExercise && (
                        <p className="text-lg text-gray-600 mt-2">{currentExercise.name}</p>
                    )}
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-64 h-64 mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="#4f46e5"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 120}`}
                            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-bold font-mono">
                            {formatTime(restTimer)}
                        </span>
                    </div>
                </div>
                
                <button
                    onClick={handleSkipRest}
                    disabled={isPerformingAction}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-md text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPerformingAction ? 'Skipping...' : 'Skip Rest'}
                </button>
            </div>
        );
    }

    if (!plan || !session || !currentGroup || !currentSet || !currentExercise) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-500 mb-4">Could not load workout details.</p>
                <button
                    onClick={() => navigate('/workouts')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                    Back to Workouts
                </button>
            </div>
        );
    }

    // --- Render Active Workout ---
    return (
        <div className="max-w-2xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{plan.name}</h1>
                <p className="text-base sm:text-lg text-gray-600">
                    Group {currentGroupIndex + 1} of {plan.groups.length}
                    {currentGroup.name && `: ${currentGroup.name}`}
                </p>
                <p className="text-sm text-gray-500">
                    Session will auto-save your progress ✓
                </p>
            </div>

            {/* Current Set Card */}
            <div className="my-8 p-6 bg-white shadow-2xl rounded-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Set {currentSetIndex + 1} of {currentGroup.sets.length}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-indigo-600 my-2">
                            {currentExercise.name}
                        </h2>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>{session.logged_sets?.length || 0} sets logged</p>
                    </div>
                </div>

                {/* Target Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-600 mb-1">Target:</p>
                    <div className="text-lg text-gray-800">
                        <span className="font-bold">
                            {currentSet.target_reps || 'N/A'} Reps
                        </span>
                        {currentSet.target_weight && (
                            <span className="font-bold ml-4">
                                @ {currentSet.target_weight} kg
                            </span>
                        )}
                    </div>
                    {currentSet.rest_time_after && (
                        <p className="text-sm text-gray-600 mt-1">
                            Rest after: {currentSet.rest_time_after}s
                        </p>
                    )}
                </div>

                {/* LOGGING FORM */}
                <form onSubmit={handleLogSet} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reps Completed *
                            </label>
                            <input
                                type="number"
                                value={reps}
                                onChange={e => setReps(e.target.value)}
                                placeholder="Reps"
                                className="w-full p-4 border-2 border-gray-300 rounded-md text-xl focus:border-indigo-500 outline-none"
                                required
                                min="0"
                                disabled={isPerformingAction}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weight (kg) *
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                placeholder="Weight"
                                className="w-full p-4 border-2 border-gray-300 rounded-md text-xl focus:border-indigo-500 outline-none"
                                required
                                min="0"
                                disabled={isPerformingAction}
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isPerformingAction}
                        className="w-full p-4 bg-green-600 text-white rounded-md text-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPerformingAction ? 'Logging...' : (isLastSetInGroup ? (isLastGroup ? 'Log Final Set' : 'Log Set & Next Group') : 'Log Set & Continue')}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}
            </div>

            {/* Navigation - Only show if last set and last group */}
            {isLastSetInGroup && isLastGroup && (
                <button
                    onClick={handleFinishWorkout}
                    disabled={isPerformingAction}
                    className="w-full p-4 bg-indigo-600 text-white rounded-md text-xl font-bold hover:bg-indigo-700 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPerformingAction ? 'Finishing...' : '✓ Finish Workout'}
                </button>
            )}

            {!isLastSetInGroup && currentSet.rest_time_after && (
                <div className="text-center text-gray-500 mb-4">
                    <p>Next: Set {currentSetIndex + 2} after {currentSet.rest_time_after}s rest</p>
                </div>
            )}

            {/* Cancel Button */}
            <button
                onClick={handleCancelWorkout}
                disabled={isPerformingAction}
                className="w-full p-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPerformingAction ? 'Canceling...' : 'Cancel Workout'}
            </button>
        </div>
    );
}
