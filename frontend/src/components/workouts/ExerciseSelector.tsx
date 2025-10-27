// frontend/src/components/workouts/ExerciseSelector.tsx

import { useState, useEffect, useMemo } from 'react';
import type { Exercise } from '@/api/exercises';
import { getExercises } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner'; // We will use this now

interface ExerciseSelectorProps {
    onSelect: (exercise: Exercise) => void;
}

// Full list of exercises, fetched once
let allExercises: Exercise[] = [];
let exercisesFetched = false;

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (exercisesFetched) {
            setIsLoading(false);
            return;
        }
        
        // --- 1. THE FIX for the type error ---
        // '1000' is now a string to match the function signature
        getExercises(1, { limit: '1000' }) 
            .then(data => {
                allExercises = data.results;
                exercisesFetched = true;
                setError('');
            })
            .catch(() => setError('Failed to load exercises'))
            .finally(() => setIsLoading(false));
    }, []);

    const filteredExercises = useMemo(() => {
        if (!searchTerm) {
            return allExercises;
        }
        return allExercises.filter(ex =>
            ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // --- 2. THE FIX for the spinner ---
    if (isLoading) {
        return (
            <div className="p-4 h-[400px] flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="max-h-[400px] flex flex-col">
            <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search exercises..."
                className="p-2 border border-gray-300 rounded-md sticky top-0"
            />
            <ul className="overflow-y-auto mt-2 space-y-1">
                {filteredExercises.length === 0 && (
                    <li className="p-2 text-gray-500 text-center">No exercises found.</li>
                )}
                {filteredExercises.map(ex => (
                    <li key={ex.id}>
                        <button
                            onClick={() => onSelect(ex)}
                            className="w-full text-left p-2 hover:bg-indigo-100 rounded"
                        >
                            {ex.name}
                            <span className="text-xs text-gray-500 block capitalize">
                                {ex.primary_muscles.join(', ')}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}