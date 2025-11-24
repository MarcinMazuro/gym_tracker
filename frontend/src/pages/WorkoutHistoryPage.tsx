import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWorkoutSessions, deleteWorkoutSession } from '@/api/workouts';
import type { WorkoutSession } from '@/api/workouts';
import { Spinner } from '@/components/common/Spinner';

export default function WorkoutHistoryPage() {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter] = useState<'all' | 'completed'>('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        loadSessions();
    }, [currentPage, filter]);

    const loadSessions = () => {
        setIsLoading(true);
        setError('');
        
        const params: { page?: number; status?: string } = { page: currentPage };
        if (filter === 'completed') {
            params.status = 'completed';
        }
        
        getMyWorkoutSessions(params)
            .then(data => {
                setSessions(data.results);
                setTotalCount(data.count);
                setTotalPages(Math.ceil(data.count / itemsPerPage));
            })
            .catch(() => {
                setError('Failed to fetch workout history.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleDelete = async (sessionId: number, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this workout session?')) {
            return;
        }

        try {
            await deleteWorkoutSession(sessionId);
            // Reload current page
            loadSessions();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete session.');
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading && sessions.length === 0) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">Workout History</h1>
                
                {/* Stats */}
                <p className="text-gray-600 mb-4">
                    Total workouts: {totalCount}
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Sessions List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                    <Link
                        to="/workouts"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                    >
                        Start a Workout
                    </Link>
                </div>
            ) : (
                <>
                    <ul className="space-y-4">
                        {sessions.map(session => (
                            <li key={session.id} className="bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow">
                                <Link
                                    to={`/history/${session.id}`}
                                    className="block p-4 sm:p-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h2 className="text-lg sm:text-xl font-bold text-indigo-600">
                                                    {session.plan_name || 'Custom Workout'}
                                                </h2>
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 space-y-1">
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
                                                    💪 {(session as any).set_count || session.logged_sets?.length || 0} sets logged
                                                </p>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        {session.status !== 'in_progress' && (
                                            <button
                                                onClick={(e) => handleDelete(session.id, e)}
                                                className="self-start sm:self-center bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 w-full sm:w-auto"
                            >
                                ← Previous
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {/* Show page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 rounded-md text-sm ${
                                                currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="text-gray-500">...</span>
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className="px-3 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 w-full sm:w-auto"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Page Info */}
                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} workouts
                    </div>
                </>
            )}
        </div>
    );
}

// Helper function to calculate workout duration
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
