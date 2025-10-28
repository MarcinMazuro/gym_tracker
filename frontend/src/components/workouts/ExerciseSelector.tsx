// frontend/src/components/workouts/ExerciseSelector.tsx

import { useState, useEffect } from 'react';
import type { Exercise } from '@/api/exercises';
import { getExercises } from '@/api/exercises';
import { Spinner } from '@/components/common/Spinner';

interface ExerciseSelectorProps {
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounced search function
    useEffect(() => {
        // Don't search on mount, only when user types
        if (!hasSearched && searchTerm === '') return;

        const timeoutId = setTimeout(() => {
            performSearch();
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentPage]);

    const performSearch = async () => {
        if (searchTerm.trim().length < 2) {
            setExercises([]);
            setTotalPages(0);
            return;
        }

        setIsLoading(true);
        setError('');
        setHasSearched(true);

        try {
            const filters: { [key: string]: string } = {
                name: searchTerm.trim()
            };

            const data = await getExercises(currentPage, filters);
            setExercises(data.results);
            setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 per page
        } catch (err) {
            console.error('Failed to search exercises:', err);
            setError('Failed to search exercises');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to page 1 on new search
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    return (
        <div className="flex flex-col border border-gray-300 rounded-md bg-white">
            {/* Search Input */}
            <div className="p-3 border-b sticky top-0 bg-white z-10">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search exercises by name (min 2 characters)..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                    Type at least 2 characters to search
                </p>
            </div>

            {/* Results Area */}
            <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                {!hasSearched && searchTerm.length < 2 && (
                    <div className="p-8 text-center text-gray-500">
                        <p>Enter at least 2 characters to search for exercises</p>
                    </div>
                )}

                {searchTerm.length >= 2 && isLoading && (
                    <div className="p-8 flex justify-center">
                        <Spinner />
                    </div>
                )}

                {error && (
                    <div className="p-4 text-center">
                        <p className="text-red-500 mb-2">{error}</p>
                        <button
                            type="button"
                            onClick={performSearch}
                            className="text-indigo-600 hover:underline text-sm"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && hasSearched && exercises.length === 0 && searchTerm.length >= 2 && (
                    <div className="p-8 text-center text-gray-500">
                        <p>No exercises found matching "{searchTerm}"</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                )}

                {!isLoading && exercises.length > 0 && (
                    <ul>
                        {exercises.map(ex => (
                            <li key={ex.id} className="border-b border-gray-100 last:border-b-0">
                                <button
                                    onClick={() => onSelect(ex)}
                                    className="w-full text-left p-3 hover:bg-indigo-50 transition-colors"
                                >
                                    <div className="font-medium text-gray-900">{ex.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                                        <span className="capitalize">{ex.category}</span>
                                        {ex.primary_muscles.length > 0 && (
                                            <>
                                                <span>•</span>
                                                {ex.primary_muscles.map(m => (
                                                    <span key={m} className="bg-indigo-100 px-2 py-0.5 rounded capitalize">
                                                        {m}
                                                    </span>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}