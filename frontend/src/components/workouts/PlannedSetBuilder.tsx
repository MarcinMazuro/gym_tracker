// frontend/src/components/workouts/PlannedSetBuilder.tsx

import type { PlannedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';

interface PlannedSetBuilderProps {
    set: PlannedSet;
    allExercises: Exercise[]; // Pass the full list to avoid re-fetching
    onChange: (field: keyof PlannedSet, value: any) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}

export function PlannedSetBuilder({ 
    set, 
    allExercises, 
    onChange, 
    onDelete,
    onMove,
    isFirst,
    isLast
}: PlannedSetBuilderProps) {
    
    // Find the full exercise object from the ID
    const exercise = allExercises.find(e => e.id === set.exercise);

    return (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0 font-bold text-gray-600 sm:w-24">
                Set {set.order}
                {exercise && <div className="text-sm font-normal text-indigo-600">{exercise.name}</div>}
            </div>

            <div className="grid grid-cols-2 sm:flex-wrap sm:flex-row gap-3 grow">
                {/* Reps Input */}
                <input
                    type="text"
                    value={set.target_reps || ''}
                    onChange={e => onChange('target_reps', e.target.value)}
                    placeholder="Reps (e.g. 8-12)"
                    className="p-2 border border-gray-300 rounded-md w-full"
                    aria-label="Target Reps"
                />
                
                {/* Weight Input */}
                <input
                    type="number"
                    value={set.target_weight || ''}
                    onChange={e => onChange('target_weight', e.target.value)}
                    placeholder="Weight (kg)"
                    className="p-2 border border-gray-300 rounded-md w-full"
                    aria-label="Target Weight"
                />

                {/* Rest Input */}
                <input
                    type="number"
                    value={set.rest_time_after || ''}
                    onChange={e => onChange('rest_time_after', e.target.value)}
                    placeholder="Rest (sec)"
                    className="p-2 border border-gray-300 rounded-md w-full"
                    aria-label="Rest Time After"
                />
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center justify-end sm:w-auto">
                <button
                    onClick={() => onMove('up')}
                    disabled={isFirst}
                    className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                    aria-label="Move set up"
                >
                    ▲
                </button>
                <button
                    onClick={() => onMove('down')}
                    disabled={isLast}
                    className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                    aria-label="Move set down"
                >
                    ▼
                </button>
                <button
                    onClick={onDelete}
                    className="p-1 text-red-500 hover:text-red-700"
                    aria-label="Delete set"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
