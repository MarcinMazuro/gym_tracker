// frontend/src/components/workouts/ExerciseGroupBuilder.tsx

import { useState } from 'react';
import type { ExerciseGroup, PlannedSet } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { PlannedSetBuilder } from './PlannedSetBuilder';
import { ExerciseSelector } from './ExerciseSelector';

// Type for group without ID
type GroupInput = Omit<ExerciseGroup, 'id'>;

// Helper to create a new, empty set with temporary ID
const createNewSet = (exerciseId: number, order: number): PlannedSet => ({
    id: -Date.now(), // Temporary negative ID for new sets
    exercise: exerciseId,
    order: order,
    target_reps: '',
    target_weight: '',
    rest_time_after: 120, // Default 2 minutes
});

interface ExerciseGroupBuilderProps {
    group: GroupInput;
    allExercises: Exercise[];
    onChange: (newGroup: GroupInput) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onExerciseSelected: (exercise: Exercise) => void;
    isFirst: boolean;
    isLast: boolean;
}

export function ExerciseGroupBuilder({ 
    group, 
    allExercises, 
    onChange, 
    onDelete,
    onMove,
    onExerciseSelected,
    isFirst,
    isLast
}: ExerciseGroupBuilderProps) {
    
    const [isPickingExercise, setIsPickingExercise] = useState(false);

    const handleSetChange = (index: number, field: keyof PlannedSet, value: any) => {
        const newSets = [...group.sets];
        newSets[index] = { ...newSets[index], [field]: value };
        onChange({ ...group, sets: newSets });
    };

    const handleSetDelete = (index: number) => {
        const newSets = group.sets
            .filter((_, i) => i !== index)
            .map((s, i) => ({ ...s, order: i + 1 })); // Re-order
        onChange({ ...group, sets: newSets });
    };

    const handleSetMove = (index: number, direction: 'up' | 'down') => {
        const newSets = [...group.sets];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newSets.length) return;

        // Swap sets
        [newSets[index], newSets[newIndex]] = [newSets[newIndex], newSets[index]];
        
        onChange({ 
            ...group, 
            sets: newSets.map((s, i) => ({ ...s, order: i + 1 })) // Re-order all
        });
    };

    const handleSelectExercise = (exercise: Exercise) => {
        // Notify parent that this exercise was selected
        onExerciseSelected(exercise);
        
        // Add a new set with this exercise
        const newSet = createNewSet(exercise.id, group.sets.length + 1);
        onChange({ ...group, sets: [...group.sets, newSet] });
        setIsPickingExercise(false);
    };

    const handleDuplicateSet = (index: number) => {
        const setToDuplicate = group.sets[index];
        const newSet = {
            ...setToDuplicate,
            order: group.sets.length + 1,
        };
        onChange({ ...group, sets: [...group.sets, newSet] });
    };

    return (
        <div className="p-4 bg-white shadow-lg rounded-lg border border-gray-200">
            {/* Group Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b">
                <input
                    type="text"
                    value={group.name || ''}
                    onChange={e => onChange({ ...group, name: e.target.value })}
                    placeholder={`Group ${group.order} name (e.g., "Warm Up", "Main Lift", "Superset")`}
                    className="p-2 border-b-2 border-gray-300 focus:border-indigo-500 outline-none text-xl font-bold"
                />
                <div className="flex gap-2 items-center justify-end">
                    <button
                        type="button"
                        onClick={() => onMove('up')}
                        disabled={isFirst}
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move group up"
                        title="Move group up"
                    >
                        ▲
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={isLast}
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move group down"
                        title="Move group down"
                    >
                        ▼
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                    >
                        Delete Group
                    </button>
                </div>
            </div>

            {/* Exercise Picker Modal */}
            {isPickingExercise && (
                <div className="my-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">Select Exercise</h3>
                        <button
                            type="button"
                            onClick={() => setIsPickingExercise(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕ Close
                        </button>
                    </div>
                    <ExerciseSelector onSelect={handleSelectExercise} />
                </div>
            )}

            {/* Sets List */}
            <div className="space-y-3 mt-4">
                {group.sets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No sets added yet. Click "Add Set" to get started.
                    </div>
                )}
                
                {group.sets.map((set, index) => (
                    <PlannedSetBuilder
                        key={index}
                        set={set}
                        allExercises={allExercises}
                        onChange={(field, value) => handleSetChange(index, field, value)}
                        onDelete={() => handleSetDelete(index)}
                        onMove={(dir) => handleSetMove(index, dir)}
                        onDuplicate={() => handleDuplicateSet(index)}
                        isFirst={index === 0}
                        isLast={index === group.sets.length - 1}
                    />
                ))}
            </div>

            {/* Add Set Button */}
            <button
                type="button"
                onClick={() => setIsPickingExercise(true)}
                className="w-full p-3 mt-4 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium"
            >
                + Add Set
            </button>
        </div>
    );
}