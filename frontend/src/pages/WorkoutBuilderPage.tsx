// frontend/src/pages/WorkoutBuilderPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { WorkoutPlanInput, ExerciseGroup } from '@/api/workouts';
import { createWorkoutPlan, updateWorkoutPlan, getWorkoutPlanDetails } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { getExercisesByIds } from '@/api/exercises';
import { ExerciseGroupBuilder } from '@/components/workouts/ExerciseGroupBuilder';
import { Spinner } from '@/components/common/Spinner';

// Type for group without ID (used during creation/editing)
type GroupInput = Omit<ExerciseGroup, 'id'>;

// Helper to create a new, empty group
const createNewGroup = (order: number): GroupInput => ({
    order: order,
    name: '',
    sets: [],
});

export default function WorkoutBuilderPage() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(planId);

    // Use a more flexible type for plan during editing
    const [plan, setPlan] = useState<{
        name: string;
        description: string;
        groups: GroupInput[];
    }>({
        name: '',
        description: '',
        groups: [createNewGroup(1)], // Start with one empty group
    });

    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch plan details if editing (exercises loaded on-demand or as needed)
    useEffect(() => {
        const loadData = async () => {
            try {
                // If editing, fetch the plan
                if (isEditMode && planId) {
                    const planData = await getWorkoutPlanDetails(Number(planId));
                    
                    // Get unique exercise IDs used in this plan
                    const usedExerciseIds = new Set<number>();
                    planData.groups.forEach(g => {
                        g.sets.forEach(s => usedExerciseIds.add(s.exercise));
                    });
                    
                    // Fetch ONLY the exercises used in this plan (not all exercises!)
                    if (usedExerciseIds.size > 0) {
                        // Fetch exercises by their IDs in a single request
                        const exerciseIds = Array.from(usedExerciseIds);
                        const neededExercises = await getExercisesByIds(exerciseIds);
                        setAllExercises(neededExercises);
                    }
                    
                    setPlan({
                        name: planData.name,
                        description: planData.description || '',
                        groups: planData.groups.map(g => ({
                            order: g.order,
                            name: g.name || '',
                            sets: g.sets.map(s => ({
                                id: s.id,
                                exercise: s.exercise,
                                order: s.order,
                                target_reps: s.target_reps || '',
                                target_weight: s.target_weight || '',
                                rest_time_after: s.rest_time_after || null,
                            }))
                        }))
                    });
                }
                // If creating new plan, don't load any exercises
                // They will be searched on-demand when user clicks "Add Set"
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load page data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [planId, isEditMode]);

    const handleGroupChange = (index: number, newGroupData: GroupInput) => {
        const newGroups = [...plan.groups];
        newGroups[index] = newGroupData;
        setPlan(prev => ({ ...prev, groups: newGroups }));
    };
    
    const handleExerciseSelected = (exercise: Exercise) => {
        // Add exercise to our list if not already there
        if (!allExercises.find(e => e.id === exercise.id)) {
            setAllExercises(prev => [...prev, exercise]);
        }
    };

    const handleAddGroup = () => {
        const newGroup = createNewGroup(plan.groups.length + 1);
        setPlan(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    };

    const handleDeleteGroup = (index: number) => {
        if (plan.groups.length === 1) {
            alert('You must have at least one group in your workout plan.');
            return;
        }

        const newGroups = plan.groups
            .filter((_, i) => i !== index)
            .map((g, i) => ({ ...g, order: i + 1 })); // Re-order
        
        setPlan(prev => ({ ...prev, groups: newGroups }));
    };

    const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
        const newGroups = [...plan.groups];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newGroups.length) return;

        // Swap groups
        [newGroups[index], newGroups[newIndex]] = [newGroups[newIndex], newGroups[index]];
        
        setPlan(prev => ({ 
            ...prev, 
            groups: newGroups.map((g, i) => ({ ...g, order: i + 1 })) // Re-order all
        }));
    };

    const validatePlan = (): string | null => {
        if (!plan.name.trim()) {
            return 'Please enter a plan name.';
        }

        if (plan.groups.length === 0) {
            return 'Your plan must have at least one exercise group.';
        }

        for (let i = 0; i < plan.groups.length; i++) {
            const group = plan.groups[i];
            if (group.sets.length === 0) {
                return `Group ${i + 1} has no sets. Please add at least one set or remove the group.`;
            }

            for (let j = 0; j < group.sets.length; j++) {
                const set = group.sets[j];
                if (!set.exercise) {
                    return `Group ${i + 1}, Set ${j + 1} has no exercise selected.`;
                }
            }
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationError = validatePlan();
        if (validationError) {
            alert(validationError);
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            if (isEditMode && planId) {
                await updateWorkoutPlan(Number(planId), plan as WorkoutPlanInput);
            } else {
                await createWorkoutPlan(plan as WorkoutPlanInput);
            }
            navigate('/workouts'); // Success! Go back to the list.
        } catch (err: any) {
            console.error('Failed to save plan:', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to save plan. Please try again.';
            setError(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Spinner />
            </div>
        );
    }

    return (
        <form className="max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">
                    {isEditMode ? 'Edit Workout Plan' : 'Create New Plan'}
                </h1>
                <Link
                    to="/workouts"
                    className="text-indigo-600 hover:underline"
                >
                    ← Back to Plans
                </Link>
            </div>
            
            {/* Plan Details */}
            <div className="p-4 bg-white shadow-md rounded-lg">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Name *
                    </label>
                    <input
                        type="text"
                        value={plan.name}
                        onChange={e => setPlan(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Push Day A, Full Body Workout"
                        className="w-full text-xl font-bold border-2 border-gray-300 p-3 rounded-md focus:border-indigo-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        value={plan.description || ''}
                        onChange={e => setPlan(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add any notes about this workout plan..."
                        className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-indigo-500 outline-none"
                        rows={3}
                    />
                </div>
            </div>

            {/* Exercise Groups */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Exercise Groups</h2>
                {plan.groups.map((group, index) => (
                    <ExerciseGroupBuilder
                        key={index}
                        group={group}
                        allExercises={allExercises}
                        onChange={(newGroup) => handleGroupChange(index, newGroup)}
                        onDelete={() => handleDeleteGroup(index)}
                        onMove={(dir) => handleMoveGroup(index, dir)}
                        onExerciseSelected={handleExerciseSelected}
                        isFirst={index === 0}
                        isLast={index === plan.groups.length - 1}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={handleAddGroup}
                className="w-full p-4 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium text-lg"
            >
                + Add Exercise Group
            </button>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-4 border-t">
                <Link
                    to="/workouts"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                    {isSaving && <Spinner />}
                    {isSaving ? 'Saving...' : (isEditMode ? 'Update Plan' : 'Create Plan')}
                </button>
            </div>
        </form>
    );
}