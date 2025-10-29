import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWorkoutSessions } from '@/api/workouts';
import type { WorkoutSession } from '@/api/workouts';
import { Spinner } from '@/components/common/Spinner';

export default function WorkoutHistoryPage() {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        getMyWorkoutSessions()
            .then(data => {
                let sessionsData: WorkoutSession[] = [];
                if (data && Array.isArray((data as any).results)) {
                    sessionsData = (data as any).results;
                } 
                // Check if data is already the array we expected
                else if (Array.isArray(data)) {
                    sessionsData = data;
                } 
                // Handle unexpected data structure
                else {
                    console.error("Unexpected data structure from getMyWorkoutSessions:", data);
                    setError('Failed to parse workout history.');
                    return;
                }
                
                // Sort sessions by date_started in descending order (most recent first)
                sessionsData.sort((a, b) => new Date(b.date_started).getTime() - new Date(a.date_started).getTime());
                setSessions(sessionsData);
            })
            .catch(() => {
                setError('Failed to fetch workout history.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center mt-20"><Spinner /></div>;
        }
        if (error) {
            return <p className="text-red-500 p-4 text-center">{error}</p>;
        }
        if (sessions.length === 0) {
            return (
                <p className="text-gray-500 text-center">
                    You haven't completed any workouts yet.
                </p>
            );
        }

        return (
            <ul className="space-y-4">
                {sessions.map(session => (
                    <li key={session.id} className="p-4 bg-white shadow-md rounded-lg">
                        <Link to={`/history/${session.id}`} className="block hover:bg-gray-50 p-2">
                            <h2 className="text-xl font-bold text-indigo-600">
                                {session?.plan_name} Workout on {new Date(session.date_started).toLocaleDateString()}
                            </h2>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Workout History</h1>
            {renderContent()}
        </div>
    );
}
