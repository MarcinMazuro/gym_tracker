// frontend/src/pages/WorkoutPlansPage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyWorkoutPlans, deleteWorkoutPlan } from '@/api/workouts';
import type { WorkoutPlan } from '@/api/workouts';

export default function WorkoutPlansPage() {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(true);
        getMyWorkoutPlans()
            .then(data => {
                setPlans(data);
                setError('');
            })
            .catch(() => {
                setError('Failed to fetch workout plans.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const handleStartWorkout = (plan: WorkoutPlan) => {
        // We'll pass the plan to the tracker page via state
        navigate('/tracker', { state: { plan } });
    };

    const handleDeletePlan = async (planId: number) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) {
            return;
        }

        try {
            await deleteWorkoutPlan(planId);
            setPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
        } catch (err) {
            setError('Failed to delete plan.');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-gray-500">Loading plans...</p>;
        }
        if (error) {
            return <p className="text-red-500">{error}</p>;
        }
        if (plans.length === 0) {
            return (
                <p className="text-gray-500">
                    You haven't created any workout plans yet.
                </p>
            );
        }

        return (
            <ul className="space-y-4">
                {plans.map(plan => (
                    <li key={plan.id} className="p-4 bg-white shadow-md rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div>
                                <h2 className="text-xl font-bold text-indigo-600">{plan.name}</h2>
                                <p className="text-gray-600 mt-1">{plan.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2 mt-4 sm:mt-0 shrink-0">
                                <button
                                    onClick={() => handleStartWorkout(plan)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                                >
                                    Start Workout
                                </button>
                                <Link
                                    to={`/workouts/${plan.id}/edit`}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Workout Plans</h1>
                <Link
                    to="/workouts/new"
                    className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700"
                >
                    + Create New Plan
                </Link>
            </div>
            
            <div className="mt-8">
                {renderContent()}
            </div>
        </div>
    );
}