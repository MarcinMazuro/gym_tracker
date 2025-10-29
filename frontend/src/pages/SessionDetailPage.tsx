import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getWorkoutSessionDetails,
    deleteWorkoutSession,
    updateWorkoutSessionNotes,
    updateLoggedSet,
    deleteLoggedSet
} from '@/api/workouts';
import { getExercisesByIds } from '@/api/exercises';
import type { WorkoutSession, LoggedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

export default function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Edit states
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState('');
    const [editingSetId, setEditingSetId] = useState<number | null>(null);
    const [editReps, setEditReps] = useState('');
    const [editWeight, setEditWeight] = useState('');

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const loadSession = async () => {
        if (!sessionId) {
            setError('No session ID provided.');
            setIsLoading(false);
            return;
        }

        try {
            const sessionData = await getWorkoutSessionDetails(Number(sessionId));
            setSession(sessionData);
            setNotesValue(sessionData.notes || '');

            // Fetch exercises
            const exerciseIds = new Set(sessionData.logged_sets.map(s => s.exercise));
            if (exerciseIds.size > 0) {
                const fetchedExercises = await getExercisesByIds(Array.from(exerciseIds));
                setExercises(fetchedExercises);
            }
        } catch (err) {
            setError('Failed to load workout session.');
        } finally {
            setIsLoading(false);
        }
    };

    const getExerciseName = (id: number) => {
        return exercises.find(ex => ex.id === id)?.name || 'Unknown Exercise';
    };

    const handleDeleteSession = async () => {
        if (!session) return;
        if (!window.confirm('Are you sure you want to delete this workout session? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteWorkoutSession(session.id);
            navigate('/history');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete session.');
        }
    };

    const handleSaveNotes = async () => {
        if (!session) return;

        try {
            const updatedSession = await updateWorkoutSessionNotes(session.id, notesValue);
            setSession(updatedSession);
            setIsEditingNotes(false);
        } catch (err) {
            setError('Failed to save notes.');
        }
    };

    const handleEditSet = (set: LoggedSet) => {
        setEditingSetId(set.id);
        setEditReps(set.actual_reps.toString());
        setEditWeight(set.actual_weight.toString());
    };

    const handleSaveSet = async (setId: number) => {
        try {
            await updateLoggedSet(setId, {
                actual_reps: parseInt(editReps),
                actual_weight: editWeight
            });
            
            // Reload session to get updated data
            await loadSession();
            setEditingSetId(null);
        } catch (err) {
            setError('Failed to update set.');
        }
    };

    const handleDeleteSet = async (setId: number) => {
        if (!window.confirm('Are you sure you want to delete this set?')) return;

        try {
            await deleteLoggedSet(setId);
            await loadSession();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete set.');
        }
    };

    // Group sets by exercise for display
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

    if (error && !session) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Link to="/history" className="text-indigo-600 hover:underline">
                    ← Back to History
                </Link>
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
                    <Link to="/history" className="text-indigo-600 hover:underline">
                        ← Back to History
                    </Link>
                    <h1 className="text-3xl font-bold mt-2">
                        {session.plan_name || 'Workout'}
                    </h1>
                    <p className="text-gray-600">
                        {new Date(session.date_started).toLocaleDateString()} at{' '}
                        {new Date(session.date_started).toLocaleTimeString()}
                    </p>
                    {session.date_finished && (
                        <p className="text-sm text-gray-500">
                            Finished: {new Date(session.date_finished).toLocaleTimeString()}
                        </p>
                    )}
                </div>
                
                {session.status !== 'in_progress' && (
                    <button
                        onClick={handleDeleteSession}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm"
                    >
                        Delete Session
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Notes Section */}
            <div className="mb-8 p-4 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">Notes</h2>
                    {!isEditingNotes && (
                        <button
                            onClick={() => setIsEditingNotes(true)}
                            className="text-indigo-600 hover:underline text-sm"
                        >
                            Edit
                        </button>
                    )}
                </div>
                
                {isEditingNotes ? (
                    <div>
                        <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                            placeholder="Add notes about this workout..."
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleSaveNotes}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingNotes(false);
                                    setNotesValue(session.notes || '');
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {session.notes || 'No notes added.'}
                    </p>
                )}
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
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Set
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Reps
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Weight (kg)
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sets.map((set, index) => (
                                        <tr key={set.id}>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {editingSetId === set.id ? (
                                                    <input
                                                        type="number"
                                                        value={editReps}
                                                        onChange={e => setEditReps(e.target.value)}
                                                        className="w-20 p-1 border border-gray-300 rounded"
                                                        min="0"
                                                    />
                                                ) : (
                                                    set.actual_reps
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {editingSetId === set.id ? (
                                                    <input
                                                        type="number"
                                                        step="0.25"
                                                        value={editWeight}
                                                        onChange={e => setEditWeight(e.target.value)}
                                                        className="w-20 p-1 border border-gray-300 rounded"
                                                        min="0"
                                                    />
                                                ) : (
                                                    set.actual_weight
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {editingSetId === set.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveSet(set.id)}
                                                            className="text-green-600 hover:underline text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSetId(null)}
                                                            className="text-gray-600 hover:underline text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSet(set)}
                                                            className="text-indigo-600 hover:underline text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSet(set.id)}
                                                            className="text-red-600 hover:underline text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
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
