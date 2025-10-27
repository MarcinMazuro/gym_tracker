// frontend/src/pages/WorkoutBuilderPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { WorkoutPlanInput, ExerciseGroup, PlannedSet } from '@/api/workouts';
import { createWorkoutPlan, updateWorkoutPlan, getWorkoutPlanDetails } from '@/api/workouts';
import type { Exercise } from '@/api/exercises';
import { getExercises } from '@/api/exercises';
import { ExerciseGroupBuilder } from '@/components/workouts/ExerciseGroupBuilder';
import { Spinner } from '@/components/common/Spinner';

// Helper to create a new, empty group
const createNewGroup = (order: number): Omit<ExerciseGroup, 'id'> => ({
    order: order,
    name: '',
    sets: [],
});

export default function WorkoutBuilderPage() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(planId);

    const [plan, setPlan] = useState<WorkoutPlanInput>({
        name: '',
        description: '',
        groups: [createNewGroup(1)], // Start with one empty group
    });

    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch exercises and (if editing) plan details
    useEffect(() => {
        const fetchExercises = getExercises(1, { limit: 1000 }).then(data => {
            setAllExercises(data.results);
        });

        const fetchPlan = async () => {
            if (!isEditMode) return;
            try {
                const planData = await getWorkoutPlanDetails(Number(planId));
                // We just need the fields for WorkoutPlanInput
                setPlan({
                    name: planData.name,
                    description: planData.description || '',
                    groups: planData.groups.map(g => ({
                        order: g.order,
                        name: g.name || '',
                        sets: g.sets.map(s => ({
                            exercise: s.exercise,
                            order: s.order,
                            target_reps: s.target_reps || '',
                            target_weight: s.target_weight || '',
                            rest_time_after: s.rest_time_after || null,
                        }))
                    }))
                });
            } catch (err) {
                setError('Failed to load workout plan.');
            }
        };

        Promise.all([fetchExercises, fetchPlan()])
            .catch(() => setError('Failed to load page data.'))
            .finally(() => setIsLoading(false));
    }, [planId, isEditMode]);

    const handleGroupChange = (index: number, newGroupData: Omit<ExerciseGroup, 'id'>) => {
        const newGroups = [...plan.groups];
        newGroups[index] = newGroupData;
        setPlan(prev => ({ ...prev, groups: newGroups }));
    };

    const handleAddGroup = () => {
        const newGroup = createNewGroup(plan.groups.length + 1);
        setPlan(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    };

    const handleDeleteGroup = (index: number) => {
        const newGroups = plan.groups
            .filter((_, i) => i !== index)
            .map((g, i) => ({ ...g, order: i + 1 })); // Re-order
        
        if (newGroups.length === 0) {
            newGroups.push(createNewGroup(1)); // Always have at least one group
        }
        setPlan(prev => ({ ...prev, groups: newGroups }));
    };

    const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
        const newGroups = [...plan.groups];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newGroups.length) return;

        [newGroups[index], newGroups[newIndex]] = [newGroups[newIndex], newGroups[index]]; // Swap
        
        setPlan(prev => ({ 
            ...prev, 
            groups: newGroups.map((g, i) => ({ ...g, order: i + 1 })) // Re-order all
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            if (isEditMode) {
                await updateWorkoutPlan(Number(planId), plan);
            } else {
                await createWorkoutPlan(plan);
            }
            navigate('/workouts'); // Success! Go back to the list.
        } catch (err) {
            setError('Failed to save plan. Please try again.');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }

    return (
        <form className="max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
            <h1 className="text-3xl font-bold">
                {isEditMode ? 'Edit Workout Plan' : 'Create New Plan'}
            </h1>
            
            {/* Plan Details */}
            <div className="p-4 bg-white shadow-md rounded-lg">
                <input
                    type="text"
                    value={plan.name}
                    onChange={e => setPlan(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Plan Name (e.g. Push Day A)"
                    className="w-full text-2xl font-bold border-b-2 p-2 focus:border-indigo-500 outline-none"
                    required
                />
                <textarea
                    value={plan.description || ''}
                    onChange={e => setPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Plan Description (optional)"
                    className="w-full mt-4 p-2 border border-gray-300 rounded-md"
                    rows={3}
                />
            </div>

            {/* Exercise Groups */}
            <div className="space-y-6">
                {plan.groups.map((group, index) => (
                    <ExerciseGroupBuilder
                        key={index} // Not ideal, but fine for this
                        group={group}
                        allExercises={allExercises}
                        onChange={(newGroup) => handleGroupChange(index, newGroup)}
                        onDelete={() => handleDeleteGroup(index)}
                        onMove={(dir) => handleMoveGroup(index, dir)}
                        isFirst={index === 0}
                        isLast={index === plan.groups.length - 1}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={handleAddGroup}
                className="w-full p-3 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium"
            >
                + Add Exercise Group
            </button>

            {error && <p className="text-red-500">{error}</p>}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    {isSaving ? <Spinner /> : 'Save Plan'}
                </button>
            </div>
        </form>
    );
}
