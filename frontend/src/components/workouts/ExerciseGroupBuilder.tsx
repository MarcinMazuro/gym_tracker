// frontend/src/components/workouts/ExerciseGroupBuilder.tsx

import { useState, useEffect } from 'react';
import type { ExerciseGroup, PlannedSet, WorkoutPlanInput } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { PlannedSetBuilder } from './PlannedSetBuilder';
import { ExerciseSelector } from './ExerciseSelector'; // We'll use this

// Helper to create a new, empty set
const createNewSet = (exerciseId: number, order: number): Omit<PlannedSet, 'id'> => ({
    exercise: exerciseId,
    order: order,
    target_reps: '',
    target_weight: '',
    rest_time_after: null,
});

interface ExerciseGroupBuilderProps {
    group: Omit<ExerciseGroup, 'id'>;
    allExercises: Exercise[]; // Pass the full list
    onChange: (newGroup: Omit<ExerciseGroup, 'id'>) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}

export function ExerciseGroupBuilder({ 
    group, 
    allExercises, 
    onChange, 
    onDelete,
    onMove,
    isFirst,
    isLast
}: ExerciseGroupBuilderProps) {
    
    // "simple" mode tracks one exercise and uniform set/rep/rest
    const [isSimpleMode, setIsSimpleMode] = useState(true);
    const [simpleExercise, setSimpleExercise] = useState<Exercise | null>(null);
    const [simpleSets, setSimpleSets] = useState('3');
    const [simpleReps, setSimpleReps] = useState('8-12');
    const [simpleRest, setSimpleRest] = useState('180');

    const [isPickingExercise, setIsPickingExercise] = useState(false);

    // This effect syncs the "simple" state to the "advanced" group data
    useEffect(() => {
        if (!isSimpleMode) return; // Only run when in simple mode
        
        const exerciseId = simpleExercise?.id;
        if (!exerciseId) {
            onChange({ ...group, sets: [] }); // Clear sets if no exercise
            return;
        }

        const numSets = parseInt(simpleSets) || 0;
        const newSets: Omit<PlannedSet, 'id'>[] = [];
        for (let i = 0; i < numSets; i++) {
            newSets.push({
                exercise: exerciseId,
                order: i + 1,
                target_reps: simpleReps,
                target_weight: '', // Weight is always custom
                rest_time_after: parseInt(simpleRest) || null,
            });
        }
        onChange({ ...group, sets: newSets });

    }, [isSimpleMode, simpleExercise, simpleSets, simpleReps, simpleRest]);

    // This effect tries to load "simple" mode from "advanced" data
    useEffect(() => {
        const { sets } = group;
        if (sets.length === 0) {
            setIsSimpleMode(true);
            return;
        }

        // Check if all sets use the same exercise, reps, and rest
        const firstSet = sets[0];
        const exerciseId = firstSet.exercise;
        const reps = firstSet.target_reps;
        const rest = firstSet.rest_time_after;

        const isUniform = sets.every(
            s => s.exercise === exerciseId && s.target_reps === reps && s.rest_time_after === rest
        );

        if (isUniform) {
            setIsSimpleMode(true);
            setSimpleExercise(allExercises.find(e => e.id === exerciseId) || null);
            setSimpleSets(sets.length.toString());
            setSimpleReps(reps || '');
            setSimpleRest(rest?.toString() || '');
        } else {
            // Data is complex, force "Advanced" mode
            setIsSimpleMode(false);
        }
    }, [allExercises, group.sets]); // Run once on load

    // --- "Advanced" Mode Handlers ---

    const handleSetChange = (index: number, field: keyof PlannedSet, value: any) => {
        const newSets = [...group.sets];
        newSets[index] = { ...newSets[index], [field]: value };
        onChange({ ...group, sets: newSets });
    };

    const handleSetDelete = (index: number) => {
        const newSets = group.sets.filter((_, i) => i !== index)
            .map((s, i) => ({ ...s, order: i + 1 })); // Re-order
        onChange({ ...group, sets: newSets });
    };

    const handleSetMove = (index: number, direction: 'up' | 'down') => {
        const newSets = [...group.sets];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newSets.length) return;

        [newSets[index], newSets[newIndex]] = [newSets[newIndex], newSets[index]]; // Swap
        
        onChange({ 
            ...group, 
            sets: newSets.map((s, i) => ({ ...s, order: i + 1 })) // Re-order all
        });
    };

    const handleAddSet = () => {
        // Add a set with the first exercise by default, or empty
        const lastExercise = group.sets[group.sets.length - 1]?.exercise || allExercises[0]?.id;
        if (!lastExercise) return; // No exercises loaded?
        
        const newSet = createNewSet(lastExercise, group.sets.length + 1);
        onChange({ ...group, sets: [...group.sets, newSet] });
    };

    const handleSelectExercise = (exercise: Exercise) => {
        if (isSimpleMode) {
            setSimpleExercise(exercise);
        } else {
            // Add a new set with this exercise
            const newSet = createNewSet(exercise.id, group.sets.length + 1);
            onChange({ ...group, sets: [...group.sets, newSet] });
        }
        setIsPickingExercise(false);
    };


    return (
        <div className="p-4 bg-white shadow-lg rounded-lg border border-gray-200">
            {/* Group Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b">
                <input
                    type="text"
                    value={group.name || ''}
                    onChange={e => onChange({ ...group, name: e.target.value })}
                    placeholder={`Group ${group.order} (e.g. "Main Lift")`}
                    className="p-2 border-b-2 border-gray-300 focus:border-indigo-500 outline-none text-xl font-bold"
                />
                <div className="flex gap-2 items-center justify-end">
                    <button
                        onClick={() => onMove('up')}
                        disabled={isFirst}
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                        aria-label="Move group up"
                    >
                        ▲
                    </button>
                    <button
                        onClick={() => onMove('down')}
                        disabled={isLast}
                        className="p-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30"
                        aria-label="Move group down"
                    >
                        ▼
                    </button>
                    <button
                        onClick={onDelete}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                    >
                        Delete Group
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-end gap-2 my-4">
                <button
                    onClick={() => setIsSimpleMode(true)}
                    className={`px-3 py-1 rounded-md text-sm ${isSimpleMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Simple
                </button>
                <button
                    onClick={() => setIsSimpleMode(false)}
                    className={`px-3 py-1 rounded-md text-sm ${!isSimpleMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Advanced
                </button>
            </div>

            {/* Exercise Picker Modal */}
            {isPickingExercise && (
                <div className="p-4 border border-gray-300 rounded-md my-4">
                    <ExerciseSelector onSelect={handleSelectExercise} />
                </div>
            )}

            {/* --- Simple Mode UI --- */}
            {isSimpleMode && (
                <div className="space-y-4">
                    <div className="p-3 border rounded-md shadow-sm bg-white">
                        <label className="block text-sm font-medium text-gray-700">Exercise</label>
                        <button
                            onClick={() => setIsPickingExercise(!isPickingExercise)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md text-left"
                        >
                            {simpleExercise ? simpleExercise.name : 'Click to select...'}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <input
                            type="number"
                            value={simpleSets}
                            onChange={e => setSimpleSets(e.target.value)}
                            placeholder="Sets"
                            className="p-2 border border-gray-300 rounded-md"
                            aria-label="Number of sets"
                        />
                        <input
                            type="text"
                            value={simpleReps}
                            onChange={e => setSimpleReps(e.target.value)}
                            placeholder="Reps (e.g. 8-12)"
                            className="p-2 border border-gray-300 rounded-md"
                            aria-label="Reps per set"
                        />
                        <input
                            type="number"
                            value={simpleRest}
                            onChange={e => setSimpleRest(e.target.value)}
                            placeholder="Rest (sec)"
                            className="p-2 border border-gray-300 rounded-md"
                            aria-label="Rest between sets"
                        />
                    </div>
                </div>
            )}

            {/* --- Advanced Mode UI --- */}
            {!isSimpleMode && (
                <div className="space-y-3">
                    {group.sets.map((set, index) => (
                        <PlannedSetBuilder
                            key={index} // Use index as key for dynamic list
                            set={set}
                            allExercises={allExercises}
                            onChange={(field, value) => handleSetChange(index, field, value)}
                            onDelete={() => handleSetDelete(index)}
                            onMove={(dir) => handleSetMove(index, dir)}
                            isFirst={index === 0}
                            isLast={index === group.sets.length - 1}
                        />
                    ))}
                    <button
                        onClick={() => setIsPickingExercise(!isPickingExercise)}
                        className="w-full p-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                    >
                        {isPickingExercise ? 'Close Picker' : '+ Add Set (Select Exercise)'}
                    </button>
                </div>
            )}
        </div>
    );
}