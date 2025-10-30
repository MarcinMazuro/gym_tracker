import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicWorkoutSessionDetails } from '@/api/workouts';
import { getExercisesByIds } from '@/api/exercises';
import type { WorkoutSession, LoggedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

export default function PublicWorkoutDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPublicSession = async () => {
            if (!sessionId) {
                setError('No session ID provided.');
                setIsLoading(false);
                return;
            }

            try {
                const sessionData = await getPublicWorkoutSessionDetails(Number(sessionId));
                setSession(sessionData);

                // Fetch exercises to display their names
                const exerciseIds = new Set(sessionData.logged_sets.map(s => s.exercise));
                if (exerciseIds.size > 0) {
                    const fetchedExercises = await getExercisesByIds(Array.from(exerciseIds));
                    setExercises(fetchedExercises);
                }
            } catch (err) {
                setError('Failed to load workout session. It may be private or does not exist.');
            } finally {
                setIsLoading(false);
            }
        };

        loadPublicSession();
    }, [sessionId]);

    const getExerciseName = (id: number) => {
        return exercises.find(ex => ex.id === id)?.name || 'Unknown Exercise';
    };

    // Group sets by exercise for a structured display
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
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline">
                    ← Go Back
                </button>
            </div>
        );
    }

    if (!session) {
        return <p className="p-4 text-center">Session not found.</p>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline mb-2 block">
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold">
                        {session.plan_name || 'Workout'}
                    </h1>
                    <p className="text-gray-600">
                        by <Link to={`/profile/${session.owner_username}`} className="font-semibold hover:underline">{session.owner_username}</Link> on {new Date(session.date_started).toLocaleDateString()}
                    </p>
                    {session.date_finished && (
                        <p className="text-sm text-gray-500">
                            Finished: {new Date(session.date_finished).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Notes Section */}
            <div className="mb-8 p-4 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                    {session.notes || 'No notes added.'}
                </p>
            </div>

            {/* Logged Sets */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Logged Sets</h2>
                {setsByExercise && Object.entries(setsByExercise).map(([exerciseId, sets]) => (
                    <div key={exerciseId} className="p-4 bg-white shadow-md rounded-lg">
                        <h3 className="text-xl font-bold text-indigo-600 mb-3">
                            {getExerciseName(Number(exerciseId))}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
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
                                            <td className="px-4 py-3 whitespace-nowrap font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{set.actual_reps}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{set.actual_weight}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
                
                {(!setsByExercise || Object.keys(setsByExercise).length === 0) && (
                    <p className="text-gray-500 text-center py-8">No sets logged in this session.</p>
                )}
            </div>
        </div>
    );
}