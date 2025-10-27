import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExerciseById } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';

function ExerciseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            getExerciseById(id)
                .then(setExercise)
                .catch(() => setError('Exercise not found.'))
                .finally(() => setIsLoading(false));
        }
    }, [id]);

    if (isLoading) {
        return <div className="text-center p-8">Loading exercise details...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    if (!exercise) {
        return null;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold text-gray-800">{exercise.name}</h1>
                <Link to="/exercises" className="text-blue-500 hover:underline whitespace-nowrap">
                    &larr; Back to Library
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-800">Category:</span> <span className="capitalize">{exercise.category}</span></p>
                <p><span className="font-semibold text-gray-800">Equipment:</span> <span className="capitalize">{exercise.equipment}</span></p>
                <p><span className="font-semibold text-gray-800">Level:</span> <span className="capitalize">{exercise.level}</span></p>
                <p><span className="font-semibold text-gray-800">Mechanic:</span> <span className="capitalize">{exercise.mechanic || 'N/A'}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                <div>
                    <h3 className="font-bold text-gray-700 mb-2">Primary Muscles</h3>
                    <div className="flex flex-wrap gap-2">
                        {(exercise.primary_muscles ?? []).map(muscle => (
                            <span key={muscle} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{muscle}</span>
                        ))}
                    </div>
                </div>
                {(exercise.secondary_muscles ?? []).length > 0 && (
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Secondary Muscles</h3>
                        <div className="flex flex-wrap gap-2">
                            {(exercise.secondary_muscles ?? []).map(muscle => (
                                <span key={muscle} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{muscle}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-bold text-gray-700 mb-2">Instructions</h3>
                {exercise.instructions && exercise.instructions.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        {exercise.instructions.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-gray-500">No instructions available for this exercise.</p>
                )}
            </div>
        </div>
    );
}

export default ExerciseDetailPage;
