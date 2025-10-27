// frontend/src/pages/SessionDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkoutSessionDetails } from '@/api/workouts';
import { getExercises } from '@/api/exercises';
import type { WorkoutSession, LoggedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

// Store all exercises to avoid re-fetching
let allExercises: Exercise[] = [];

export default function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            if (!sessionId) {
                setError('No session ID provided.');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch exercises if we haven't already
                if (allExercises.length === 0) {
                    const exerciseData = await getExercises(1, { limit: '1000' });
                    allExercises = exerciseData.results;
                }

                const sessionData = await getWorkoutSessionDetails(Number(sessionId));
                setSession(sessionData);

            } catch (err) {
                setError('Failed to load workout session.');
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, [sessionId]);

    const getExerciseName = (id: number) => {
        return allExercises.find(ex => ex.id === id)?.name || 'Unknown Exercise';
    };

    // Group sets by exercise for a cleaner display
    const setsByExercise = session?.logged_sets.reduce((acc, set) => {
        if (!acc[set.exercise]) {
            acc[set.exercise] = [];
        }
        acc[set.exercise].push(set);
        return acc;
    }, {} as Record<number, LoggedSet[]>);

    if (isLoading) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }

    if (error) {
        return <p className="text-red-500 p-4 text-center">{error}</p>;
    }

    if (!session) {
        return <p className="p-4 text-center">Session not found.</p>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link to="/history" className="text-indigo-600 hover:underline">&larr; Back to History</Link>
            <h1 className="text-3xl font-bold mt-4">
                Workout on {new Date(session.date_started).toLocaleDateString()}
            </h1>
            <p className="text-gray-600">
                Finished: {session.date_finished ? new Date(session.date_finished).toLocaleTimeString() : 'In Progress'}
            </p>
            {session.notes && <p className="mt-4 p-4 bg-gray-50 rounded-md">{session.notes}</p>}

            <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-semibold">Logged Sets</h2>
                {setsByExercise && Object.entries(setsByExercise).map(([exerciseId, sets]) => (
                    <div key={exerciseId} className="p-4 bg-white shadow-md rounded-lg">
                        <h3 className="text-xl font-bold text-indigo-600">
                            {getExerciseName(Number(exerciseId))}
                        </h3>
                        <table className="min-w-full mt-2 divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Set</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reps</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sets.map((set, index) => (
                                    <tr key={set.id}>
                                        <td className="px-4 py-2 whitespace-nowrap font-medium">{index + 1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{set.actual_reps}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{set.actual_weight}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}