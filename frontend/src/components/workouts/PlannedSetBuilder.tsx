// frontend/src/components/workouts/PlannedSetBuilder.tsx

import type { PlannedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';

// Type for set without ID
type SetInput = Omit<PlannedSet, 'id'>;

interface PlannedSetBuilderProps {
    set: SetInput;
    allExercises: Exercise[];
    onChange: (field: keyof SetInput, value: any) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onDuplicate: () => void;
    isFirst: boolean;
    isLast: boolean;
}

export function PlannedSetBuilder({ 
    set, 
    allExercises, 
    onChange, 
    onDelete,
    onMove,
    onDuplicate,
    isFirst,
    isLast
}: PlannedSetBuilderProps) {
    
    // Find the full exercise object from the ID
    const exercise = allExercises.find(e => e.id === set.exercise);

    return (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex flex-col gap-3">
            {/* Set Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-bold text-gray-600">Set {set.order}</div>
                    {exercise && (
                        <div className="text-sm font-medium text-indigo-600 mt-1">
                            {exercise.name}
                        </div>
                    )}
                    {!exercise && (
                        <div className="text-sm text-red-500 mt-1">
                            Exercise not found (ID: {set.exercise})
                        </div>
                    )}
                </div>

                {/* Control Buttons */}
                <div className="flex gap-1 items-center">
                    <button
                        type="button"
                        onClick={() => onMove('up')}
                        disabled={isFirst}
                        className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move set up"
                        title="Move up"
                    >
                        ▲
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={isLast}
                        className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move set down"
                        title="Move down"
                    >
                        ▼
                    </button>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                        aria-label="Duplicate set"
                        title="Duplicate"
                    >
                        📋
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-1 text-red-500 hover:text-red-700"
                        aria-label="Delete set"
                        title="Delete"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Set Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Reps Input */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Target Reps
                    </label>
                    <input
                        type="text"
                        value={set.target_reps || ''}
                        onChange={e => onChange('target_reps', e.target.value)}
                        placeholder="e.g., 8-12"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                
                {/* Weight Input */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Target Weight (kg)
                    </label>
                    <input
                        type="number"
                        step="0.25"
                        value={set.target_weight || ''}
                        onChange={e => onChange('target_weight', e.target.value)}
                        placeholder="Optional"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Rest Input */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rest After (seconds)
                    </label>
                    <input
                        type="number"
                        value={set.rest_time_after || ''}
                        onChange={e => onChange('rest_time_after', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 120"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
}