// frontend/src/pages/WorkoutTrackerPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    startWorkoutSession,
    logSet,
    finishWorkoutSession
} from '@/api/workouts';
import type {
    WorkoutPlan,
    WorkoutSession,
    LoggedSetInput
} from '@/api/workouts';
import { getExercises } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

// Helper to convert seconds to MM:SS format
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// We will fetch exercises once and store them
let allExercises: Exercise[] = [];

export default function WorkoutTrackerPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- Core State ---
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
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

    // --- Initialization Effect (on mount) ---
    useEffect(() => {
        const initializeWorkout = async () => {
            try {
                // 1. Check if a plan was passed from the previous page
                const planFromState: WorkoutPlan | undefined = location.state?.plan;
                if (!planFromState) {
                    setError("No workout plan was selected.");
                    navigate('/workouts'); // Go back to safety
                    return;
                }
                setPlan(planFromState);

                // 2. Fetch all exercises if not already fetched
                if (allExercises.length === 0) {
                    const exerciseData = await getExercises(1, { limit: '1000' });
                    allExercises = exerciseData.results;
                }
                
                // 3. Create the session in the backend
                const newSession = await startWorkoutSession({
                    plan: planFromState.id,
                    date_started: new Date().toISOString(),
                });
                setSession(newSession);

            } catch (err) {
                setError('Failed to start workout session.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeWorkout();
    }, [location.state, navigate]);

    // --- Rest Timer Countdown Effect ---
    useEffect(() => {
        if (!isResting) return;

        if (restTimer <= 0) {
            setIsResting(false);
            // Optionally play a sound here
            return;
        }

        const interval = setInterval(() => {
            setRestTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    
    // --- Memoized derived state ---
    // These values update whenever the state machine changes
    const { currentGroup, currentSet, exercise, isLastSetInGroup, isLastGroup } = useMemo(() => {
        if (!plan) return {};
        
        const group = plan.groups[currentGroupIndex];
        if (!group) return {};
        
        const set = group.sets[currentSetIndex];
        if (!set) return {};

        return {
            currentGroup: group,
            currentSet: set,
            exercise: allExercises.find(e => e.id === set.exercise),
            isLastSetInGroup: currentSetIndex === group.sets.length - 1,
            isLastGroup: currentGroupIndex === plan.groups.length - 1,
        };
    }, [plan, currentGroupIndex, currentSetIndex]);

    // --- Effect to pre-populate form ---
    // This runs when the currentSet changes
    useEffect(() => {
        if (currentSet) {
            // Pre-fill with target reps/weight for user convenience
            setReps(currentSet.target_reps || '');
            setWeight(currentSet.target_weight || '');
        }
    }, [currentSet]);


    // --- Action Handlers ---

    const handleLogSet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !currentSet || !exercise) return;

        const setData: LoggedSetInput = {
            session_id: session.id,
            exercise: exercise.id,
            planned_set: currentSet.id,
            order: (session.logged_sets?.length || 0) + 1,
            actual_reps: parseInt(reps),
            actual_weight: weight || '0', // Ensure weight is not empty
        };

        try {
            const loggedSet = await logSet(setData);
            // Add new set to local session state
            setSession(prev => prev ? { ...prev, logged_sets: [...prev.logged_sets, loggedSet] } : null);

            // --- This is the key flow logic ---
            if (isLastSetInGroup) {
                // Do not advance. Wait for user to click "Next Group"
            } else {
                // Not the last set, so start timer (if any) and advance
                const rest = currentSet.rest_time_after;
                if (rest && rest > 0) {
                    setRestTimer(rest);
                    setIsResting(true);
                }
                // Move to next set
                setCurrentSetIndex(prev => prev + 1);
            }

        } catch (err) {
            setError('Failed to log set.');
        }
    };
    
    const handleNextGroup = () => {
        if (isLastGroup) {
            handleFinishWorkout();
        } else {
            // Advance to the next group and reset set index
            setCurrentGroupIndex(prev => prev + 1);
            setCurrentSetIndex(0);
        }
    };

    const handleFinishWorkout = async () => {
        if (!session) return;
        if (!window.confirm("Are you sure you want to finish this workout?")) return;
        
        try {
            await finishWorkoutSession(session.id, new Date().toISOString());
            navigate('/history'); // Success! Go to history page.
        } catch (err) {
            setError('Failed to save workout.');
        }
    };
    
    const handleSkipRest = () => {
        setRestTimer(0);
        setIsResting(false);
    };

    // --- Render Logic ---
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-[80vh]"><Spinner /></div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    // --- Render Rest Timer ---
    if (isResting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <p className="text-2xl text-gray-500">REST</p>
                <h1 className="text-8xl sm:text-9xl font-bold my-4">{formatTime(restTimer)}</h1>
                <button
                    onClick={handleSkipRest}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg hover:bg-indigo-700"
                >
                    Skip Rest
                </button>
            </div>
        );
    }

    if (!plan || !session || !currentGroup || !currentSet || !exercise) {
        return <div className="p-4 text-center text-gray-500">Could not load workout details.</div>;
    }

    // --- Render Active Workout ---
    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold truncate">{plan.name}</h1>
            <p className="text-lg text-gray-600">
                Group {currentGroupIndex + 1}: {currentGroup.name || exercise.name}
            </p>

            <div className="my-8 p-6 bg-white shadow-2xl rounded-lg">
                <p className="text-sm font-medium text-gray-500">
                    Set {currentSetIndex + 1} of {currentGroup.sets.length}
                </p>
                <h2 className="text-4xl font-bold text-indigo-600 my-2">
                    {exercise.name}
                </h2>
                <div className="text-lg text-gray-700">
                    Target: 
                    <span className="font-bold"> {currentSet.target_reps || 'N/A'} Reps</span>
                    {currentSet.target_weight && 
                        <span className="font-bold"> @ {currentSet.target_weight} kg</span>
                    }
                </div>

                {/* --- LOGGING FORM --- */}
                <form onSubmit={handleLogSet} className="mt-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            value={reps}
                            onChange={e => setReps(e.target.value)}
                            placeholder="Actual Reps"
                            className="w-full p-4 border border-gray-300 rounded-md text-xl"
                            required
                        />
                        <input
                            type="number"
                            step="0.25"
                            value={weight}
                            onChange={e => setWeight(e.target.value)}
                            placeholder="Weight (kg)"
                            className="w-full p-4 border border-gray-300 rounded-md text-xl"
                            required
                        />
                    </div>
                    
                    {!isLastSetInGroup && (
                        <button
                            type="submit"
                            className="w-full p-4 bg-green-600 text-white rounded-md text-xl font-bold hover:bg-green-700"
                        >
                            Log Set
                        </button>
                    )}
                </form>

                {/* --- GROUP NAVIGATION --- */}
                {isLastSetInGroup && (
                    <button
                        // We must use the *logging* handler for the last set
                        onClick={handleLogSet}
                        className="w-full p-4 mt-4 bg-green-600 text-white rounded-md text-xl font-bold hover:bg-green-700"
                    >
                        Log Final Set
                    </button>
                )}
            </div>

            {/* --- "Up Next" / "Next Group" --- */}
            <div className="text-center">
                {isLastSetInGroup ? (
                    <button
                        onClick={handleNextGroup}
                        className="w-full p-4 bg-indigo-600 text-white rounded-md text-xl font-bold hover:bg-indigo-700"
                    >
                        {isLastGroup ? 'Finish Workout' : 'Next Exercise Group'}
                    </button>
                ) : (
                    <div className="text-gray-500">
                        Up Next: Set {currentSetIndex + 2}
                        (Rest: {currentSet.rest_time_after || '0'}s)
                    </div>
                )}
            </div>
        </div>
    );
}