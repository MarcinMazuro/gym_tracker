import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getExercises } from '@/api/exercises';
import type { Exercise } from '@/api/exercises';

function ExercisesListPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(0);

    // Filter states
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [category, setCategory] = useState('');
    // Add more filter states as needed

    // Store the actual filters used for the last search
    const [appliedFilters, setAppliedFilters] = useState<{ name?: string; level?: string; category?: string }>({});

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Fetch exercises when filters or page change
    useEffect(() => {
        setIsLoading(true);
        getExercises(currentPage, appliedFilters)
            .then(data => {
                setExercises(data.results);
                setTotalPages(Math.ceil(data.count / 10)); 
            })
            .catch(() => setError('Failed to load exercises. Please try again later.'))
            .finally(() => setIsLoading(false));
    }, [currentPage, appliedFilters]);

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
    };

    // When user clicks "Search", apply the current filter values
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedFilters({
            name: name.trim() || undefined,
            level: level || undefined,
            category: category || undefined,
        });
        setSearchParams({ page: '1' }); // Reset to first page on new search
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Exercise Library</h1>

            {/* Filter/Search Form */}
            <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleSearch}>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        placeholder="Search by name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <select
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">All</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">All</option>
                        <option value="strength">Strength</option>
                        <option value="cardio">Cardio</option>
                        <option value="stretching">Stretching</option>
                        {/* Add more categories as needed */}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Search
                </button>
            </form>

            <div className="bg-white shadow-md rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {isLoading ? (
                        <li className="p-4 text-center text-gray-500">Loading exercises...</li>
                    ) : error ? (
                        <li className="p-4 text-center text-red-500">{error}</li>
                    ) : exercises && exercises.length > 0 ? (
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
