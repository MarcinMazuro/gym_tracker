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
import { ExerciseSelector } from '@/components/workouts/ExerciseSelector';
import { Spinner } from '@/components/common/Spinner';
import { restTimerStorage } from '@/utils/restTimerStorage';
import type { RestTimerState } from '@/utils/restTimerStorage';

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
    const [reps, setReps] = useState('0');
    const [weight, setWeight] = useState('0');

    // --- Custom Exercise State ---
    const [showCustomExercise, setShowCustomExercise] = useState(false);
    const [customExercise, setCustomExercise] = useState<Exercise | null>(null);
    const [customReps, setCustomReps] = useState('0');
    const [customWeight, setCustomWeight] = useState('0');

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

                    const savedRestTimer = restTimerStorage.load();
                    if (savedRestTimer && restTimerStorage.isForSession(savedRestTimer, activeSession.id)) {
                        const remaining = restTimerStorage.getRemainingTime(savedRestTimer);
                        
                        if (remaining > 0) {
                            // Rest period still active
                            setTargetRestTime(savedRestTimer.targetDuration);
                            setRestTimer(remaining);
                            setIsResting(true);
                            console.log(`Restored rest timer: ${remaining}s remaining of ${savedRestTimer.targetDuration}s`);
                        } else {
                            // Rest period has expired
                            console.log('Rest period has expired during absence');
                            restTimerStorage.clear();
                            setIsResting(false);
                        }
                    } else {
                        // EXISTING: Only calculate from logged sets if no saved timer
                        if (activeSession.logged_sets && activeSession.logged_sets.length > 0) {
                            const lastSet = activeSession.logged_sets[activeSession.logged_sets.length - 1];
                            const lastSetTime = new Date(lastSet.completed_at).getTime();
                            const now = Date.now();
                            const elapsedSeconds = Math.floor((now - lastSetTime) / 1000);
                            
                            const lastSetPlan = activeSession.plan_details.groups
                                .flatMap(g => g.sets)
                                .find(s => s.id === lastSet.planned_set);
                            
                            if (lastSetPlan?.rest_time_after && lastSetPlan.rest_time_after > 0) {
                                const remainingRest = lastSetPlan.rest_time_after - elapsedSeconds;
                                const expectedNextSetIndex = (activeSession.logged_sets.length % activeSession.plan_details.groups[activeSession.current_group_index].sets.length);
                                const actualCurrentSetIndex = activeSession.current_set_index;
                                
                                if (remainingRest > 0 && expectedNextSetIndex === actualCurrentSetIndex) {
                                    setTargetRestTime(lastSetPlan.rest_time_after);
                                    setRestTimer(remainingRest);
                                    setIsResting(true);
                                    
                                    // Save to localStorage for future refreshes
                                    restTimerStorage.save({
                                        sessionId: activeSession.id,
                                        startTime: lastSetTime,
                                        targetDuration: lastSetPlan.rest_time_after,
                                        exerciseName: currentExercise?.name
                                    });
                                }
                            }
                        }
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
                    // Also add exercises from logged sets
                    activeSession.logged_sets.forEach(set => exerciseIds.add(set.exercise));

                    if (!cachedExercises) {
                        cachedExercises = await getExercisesByIds(Array.from(exerciseIds));
                    }
                    setExercises(cachedExercises);

                    // Pre-fill current set - DEFAULT TO 0 if not specified
                    const currentGroup = activeSession.plan_details.groups[activeSession.current_group_index];
                    const currentSet = currentGroup?.sets[activeSession.current_set_index];
                    if (currentSet) {
                        setReps(currentSet.target_reps || '0');
                        setWeight(currentSet.target_weight || '0');
                    }

                    // Calculate rest timer from last logged set if applicable
                    if (activeSession.logged_sets && activeSession.logged_sets.length > 0) {
                        const lastSet = activeSession.logged_sets[activeSession.logged_sets.length - 1];
                        const lastSetTime = new Date(lastSet.completed_at).getTime();
                        const now = Date.now();
                        const elapsedSeconds = Math.floor((now - lastSetTime) / 1000);
                        
                        const lastSetPlan = activeSession.plan_details.groups
                            .flatMap(g => g.sets)
                            .find(s => s.id === lastSet.planned_set);
                        
                        if (lastSetPlan?.rest_time_after && lastSetPlan.rest_time_after > 0) {
                            const remainingRest = lastSetPlan.rest_time_after - elapsedSeconds;
                            const expectedNextSetIndex = (activeSession.logged_sets.length % activeSession.plan_details.groups[activeSession.current_group_index].sets.length);
                            const actualCurrentSetIndex = activeSession.current_set_index;
                            
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

                // Clear location.state
                navigate('.', { replace: true, state: null });

                // Pre-fill first set - DEFAULT TO 0 if not specified
                const firstSet = planFromState.groups[0]?.sets[0];
                if (firstSet) {
                    setReps(firstSet.target_reps || '0');
                    setWeight(firstSet.target_weight || '0');
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
            setReps(currentSet.target_reps || '0');
            setWeight(currentSet.target_weight || '0');
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
            current_group_index: currentGroupIndex,
            current_set_index: isLastSetInGroup ? currentSetIndex : currentSetIndex + 1,
        };

        try {
            const loggedSet = await logSet(setData);
            
            setSession(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    logged_sets: [...prev.logged_sets, loggedSet],
                    current_group_index: currentGroupIndex,
                    current_set_index: isLastSetInGroup ? currentSetIndex : currentSetIndex + 1,
                };
            });

            if (isLastSetInGroup) {
                // Clear rest timer when moving to next group
                restTimerStorage.clear();
                if (!isLastGroup) {
                    await handleNextGroup();
                } else {
                    setReps('0');
                    setWeight('0');
                }
            } else {
                const rest = currentSet.rest_time_after;
                if (rest && rest > 0) {
                    setTargetRestTime(rest);
                    setRestTimer(rest);
                    setIsResting(true);
                    
                    // NEW: Save rest timer to localStorage
                    restTimerStorage.save({
                        sessionId: session.id,
                        startTime: Date.now(),
                        targetDuration: rest,
                        exerciseName: currentExercise.name
                    });
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

    const handleLogCustomSet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !customExercise || isPerformingAction) {
            return;
        }

        setIsPerformingAction(true);
        setError('');

        // Add exercise to list if not already there
        if (!exercises.find(ex => ex.id === customExercise.id)) {
            setExercises(prev => [...prev, customExercise]);
        }

        const setData: LoggedSetInput = {
            session_id: session.id,
            exercise: customExercise.id,
            planned_set: undefined, // No planned set for custom exercises
            order: (session.logged_sets?.length || 0) + 1,
            actual_reps: parseInt(customReps) || 0,
            actual_weight: customWeight || '0',
        };

        try {
            const loggedSet = await logSet(setData);
            
            setSession(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    logged_sets: [...prev.logged_sets, loggedSet],
                };
            });

            // Reset custom form
            setCustomExercise(null);
            setCustomReps('0');
            setCustomWeight('0');
            setShowCustomExercise(false);

        } catch (err) {
            console.error('Failed to log custom set:', err);
            setError('Failed to log custom set. Please try again.');
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
            await updateSessionProgress(session.id, {
                current_group_index: newGroupIndex,
                current_set_index: 0
            });

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

    // 5. Update handleFinishWorkout to clear localStorage
    const handleFinishWorkout = async () => {
        if (!session || isFinishingRef.current) return;
        
        const shouldConfirm = session.logged_sets.length === 0;
        
        if (shouldConfirm && !window.confirm('Are you sure you want to finish this workout?')) {
            return;
        }

        isFinishingRef.current = true;
        setIsPerformingAction(true);
        
        try {
            await finishWorkoutSession(session.id);
            
            // NEW: Clear rest timer from localStorage
            restTimerStorage.clear();
            
            setSession(null);
            setPlan(null);
            setExercises([]);
            setCurrentGroupIndex(0);
            setCurrentSetIndex(0);
            setReps('0');
            setWeight('0');
            setIsResting(false);
            setRestTimer(0);
            setTargetRestTime(0);
            
            navigate('.', { replace: true, state: null });
            navigate('/history', { replace: true });
        } catch (err) {
            console.error('Failed to finish workout:', err);
            setError('Failed to save workout.');
            isFinishingRef.current = false;
        } finally {
            setIsPerformingAction(false);
        }
    };

    // 6. Update handleCancelWorkout to clear localStorage
    const handleCancelWorkout = async () => {
        if (!session || isFinishingRef.current) return;
        if (!window.confirm('Are you sure you want to cancel this workout? All progress will be saved.')) return;
        
        isFinishingRef.current = true;
        setIsPerformingAction(true);
        
        try {
            await cancelWorkoutSession(session.id);
            
            // NEW: Clear rest timer from localStorage
            restTimerStorage.clear();
            
            setSession(null);
            setPlan(null);
            setExercises([]);
            setCurrentGroupIndex(0);
            setCurrentSetIndex(0);
            setReps('0');
            setWeight('0');
            setIsResting(false);
            setRestTimer(0);
            setTargetRestTime(0);
            
            navigate('.', { replace: true, state: null });
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

        try {
            const nextSetIndex = currentSetIndex + 1;
            
            await updateSessionProgress(session.id, {
                current_group_index: currentGroupIndex,
                current_set_index: nextSetIndex
            });

            // NEW: Clear rest timer from localStorage
            restTimerStorage.clear();
            
            setRestTimer(0);
            setIsResting(false);
            setTargetRestTime(0);
            
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
            restTimerStorage.clear();
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
        const savedTimer = restTimerStorage.load();
        const elapsed = savedTimer ? restTimerStorage.getElapsedTime(savedTimer) : 0;
        
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
                <div className="mb-4">
                    <p className="text-xl text-gray-500 uppercase tracking-wide">Rest Time</p>
                    {currentExercise && (
                        <p className="text-lg text-gray-600 mt-2">{currentExercise.name}</p>
                    )}
                    {/* NEW: Show elapsed time info */}
                    {savedTimer && elapsed > targetRestTime && (
                        <p className="text-sm text-orange-600 mt-2">
                            ⚠️ Rest period ended {restTimerStorage.formatTime(elapsed - targetRestTime)} ago
                        </p>
                    )}
                </div>
                
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
                            stroke={restTimer > 0 ? "#4f46e5" : "#f97316"}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 120}`}
                            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-bold font-mono">
                            {restTimer > 0 ? restTimerStorage.formatTime(restTimer) : '00:00'}
                        </span>
                        {restTimer === 0 && (
                            <span className="text-sm text-orange-600 mt-2">Time's up!</span>
                        )}
                    </div>
                </div>
                
                {/* NEW: Show total elapsed time */}
                {savedTimer && elapsed > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                        <p>Total rest time: {restTimerStorage.formatTime(elapsed)}</p>
                        <p>Target: {restTimerStorage.formatTime(targetRestTime)}</p>
                    </div>
                )}
                
                <button
                    onClick={handleSkipRest}
                    disabled={isPerformingAction}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-md text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPerformingAction ? 'Continuing...' : (restTimer > 0 ? 'Skip Rest' : 'Continue Workout')}
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
                            {currentSet.target_reps || 'Not specified'} Reps
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
                                placeholder="0"
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
                                placeholder="0"
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

            {/* Add Custom Exercise */}
            <div className="mb-6">
                {!showCustomExercise ? (
                    <button
                        onClick={() => setShowCustomExercise(true)}
                        className="w-full p-4 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium"
                    >
                        + Add Custom Exercise
                    </button>
                ) : (
                    <div className="p-6 bg-white shadow-lg rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add Custom Exercise</h3>
                            <button
                                onClick={() => {
                                    setShowCustomExercise(false);
                                    setCustomExercise(null);
                                    setCustomReps('0');
                                    setCustomWeight('0');
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {!customExercise ? (
                            <ExerciseSelector onSelect={(ex) => setCustomExercise(ex)} />
                        ) : (
                            <form onSubmit={handleLogCustomSet} className="space-y-4">
                                <div className="p-3 bg-indigo-50 rounded-md">
                                    <p className="font-bold text-indigo-900">{customExercise.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => setCustomExercise(null)}
                                        className="text-sm text-indigo-600 hover:underline mt-1"
                                    >
                                        Change exercise
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reps *
                                        </label>
                                        <input
                                            type="number"
                                            value={customReps}
                                            onChange={e => setCustomReps(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-indigo-500 outline-none"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Weight (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={customWeight}
                                            onChange={e => setCustomWeight(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-indigo-500 outline-none"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isPerformingAction}
                                    className="w-full p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {isPerformingAction ? 'Logging...' : 'Log Custom Set'}
                                </button>
                            </form>
                        )}
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