import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getExercises } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';

function ExercisesListPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(0);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        setIsLoading(true);
        getExercises(currentPage)
            .then(data => {
                setExercises(data.results);
                // DRF's default page size is often 10.
                // You might need to adjust this if you change the backend setting.
                setTotalPages(Math.ceil(data.count / 10)); 
            })
            .catch(() => setError('Failed to load exercises. Please try again later.'))
            .finally(() => setIsLoading(false));
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading exercises...</div>;
    }

        if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Exercise Library</h1>
            <div className="bg-white shadow-md rounded-lg">
                {/* CHANGE IS HERE: Add a check for exercises array */}
                <ul className="divide-y divide-gray-200">
                    {exercises && exercises.length > 0 ? (
                        exercises.map(exercise => (
                            <li key={exercise.id}>
                                <Link to={`/exercises/${exercise.id}`} className="block hover:bg-gray-50 p-4">
                                    <p className="font-semibold text-indigo-600">{exercise.name}</p>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {exercise.primary_muscles.join(', ')}
                                    </p>
                                </Link>
                            </li>
                        ))
                    ) : (
                        // Show a message if there are no exercises
                        <li className="p-4 text-center text-gray-500">No exercises found.</li>
                    )}
                </ul>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExercisesListPage;
