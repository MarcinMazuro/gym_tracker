import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicWorkoutSessions } from '@/api/workouts';
import type { WorkoutSession } from '@/api/workouts';
import { Spinner } from '@/components/common/Spinner';

interface PublicWorkoutHistoryProps {
    username: string;
}

function calculateDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function PublicWorkoutHistory({ username }: PublicWorkoutHistoryProps) {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        setError('');
        
        getPublicWorkoutSessions(username)
            .then(data => {
                // Handle both array and paginated response
                if (Array.isArray(data)) {
                    setSessions(data);
                } else if (data && Array.isArray(data.results)) {
                    setSessions(data.results);
                } else {
                    setSessions([]);
                }
            })
            .catch((err: any) => {
                if (err.response?.status === 403) {
                    setError('This user\'s workout history is not public.');
                } else {
                    setError('Failed to load workout history.');
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [username]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{error}</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No workout history available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Workout History</h2>
            
            <div className="space-y-3">
                {sessions.map(session => (
                    <Link
                        key={session.id}
                        to={`/workouts/${session.id}/public`}
                        className="block p-4 bg-white shadow-md rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-indigo-600">
                                    {session.plan_name || 'Custom Workout'}
                                </h3>
                                
                                <div className="text-sm text-gray-600 space-y-1 mt-2">
                                    <p>
                                        📅 {new Date(session.date_started).toLocaleDateString()} at{' '}
                                        {new Date(session.date_started).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    
                                    {session.date_finished && (
                                        <p>
                                            ⏱️ Duration: {calculateDuration(session.date_started, session.date_finished)}
                                        </p>
                                    )}
                                    
                                    <p>
                                        💪 {(session as any).set_count || session.logged_sets?.length || 0} sets completed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}