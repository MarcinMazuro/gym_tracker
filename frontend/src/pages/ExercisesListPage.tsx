import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getExercises } from '@/api/exercises';
import { getMuscleGroups } from '@/api/muscleGroups';
import { getCategory } from '@/api/category';
import type { Exercise } from '@/api/exercises';
// You might want to add an icon library, e.g., react-icons
// import { FiFilter } from 'react-icons/fi';

function ExercisesListPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(0);

    // Filter states
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [primaryMuscles, setPrimaryMuscles] = useState('');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    
    // --- New state for mobile filter dropdown ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    // -------------------------------------------

    const [appliedFilters, setAppliedFilters] = useState<{ name?: string; category?: string; primary_muscles?: string }>({});

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // (Omitted useEffect hooks for brevity - no changes there)
    useEffect(() => {
        getMuscleGroups()
            .then(data => setMuscleGroups(data.names))
            .catch(() => setError('Failed to load muscle groups.'));
    }, []);

    useEffect(() => {
        getCategory()
            .then(data => setCategories(data.names))
            .catch(() => setError('Failed to load categories.'));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        // ... (fetch logic)
        getExercises(currentPage, appliedFilters)
            .then(data => {
                setExercises(data.results);
                setTotalPages(Math.ceil(data.count / 10)); 
            })
            .catch(() => setError('Failed to load exercises. Please try again later.'))
            .finally(() => setIsLoading(false));
    }, [currentPage, appliedFilters]);

    // (Omitted handlePageChange - no changes)
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        setSearchParams(params);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsFilterOpen(false); // <-- Close mobile dropdown on search
        const newFilters = {
            name: name.trim() || undefined,
            category: category || undefined,
            primary_muscles: primaryMuscles || undefined,
        };
        setAppliedFilters(newFilters);
        
        const params = new URLSearchParams({ page: '1' });
        if (newFilters.name) params.set('name', newFilters.name);
        if (newFilters.category) params.set('category', newFilters.category);
        if (newFilters.primary_muscles) params.set('primary_muscles', newFilters.primary_muscles);
        setSearchParams(params);
    };

    useEffect(() => {
        setName(searchParams.get('name') || '');
        setCategory(searchParams.get('category') || '');
        setPrimaryMuscles(searchParams.get('primary_muscles') || '');

        setAppliedFilters({
            name: searchParams.get('name') || undefined,
            category: searchParams.get('category') || undefined,
            primary_muscles: searchParams.get('primary_muscles') || undefined,
        });
    // We only want this to run once on initial load, so we disable the lint rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount to populate from URL


    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Exercise Library</h1>

            {/* --- Updated Filter Form ---
                Add `relative` to a wrapper div to contain the absolute dropdown 
            */}
            <div className="relative mb-6">
                <form onSubmit={handleSearch}>
                    
                    {/* 1. Mobile Filter Bar (Visible < lg) */}
                    <div className="lg:hidden flex gap-2">
                        {/* Mobile Name Search */}
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="grow block w-full border-gray-300 rounded-md shadow-sm"
                            placeholder="Search by name"
                        />
                        {/* Mobile "Filters" Toggle Button */}
                        <button
                            type="button" // Use type="button" to prevent form submission
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="shrink-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"
                        >
                            {/* <FiFilter /> */}
                            Filters
                        </button>
                    </div>

                    {/* 2. Mobile Filter Dropdown (Conditional) */}
                    {isFilterOpen && (
                        <div className="lg:hidden absolute top-full w-full bg-white shadow-lg rounded-md p-4 mt-2 z-10 border border-gray-200">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="filter-category-mobile" className="block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        id="filter-category-mobile"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    >
                                        <option value="">All</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="filter-muscle-mobile" className="block text-sm font-medium text-gray-700">Muscle Group</label>
                                    <select
                                        id="filter-muscle-mobile"
                                        value={primaryMuscles}
                                        onChange={e => setPrimaryMuscles(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    >
                                        <option value="">All</option>
                                        {muscleGroups.map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Mobile Search Button */}
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Desktop Filter Grid (Visible >= lg) */}
                    <div className="hidden lg:grid grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="filter-name-desktop" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                id="filter-name-desktop"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                placeholder="Search by name"
                            />
                        </div>
                        <div>
                            <label htmlFor="filter-category-desktop" className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                id="filter-category-desktop"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">All</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-muscle-desktop" className="block text-sm font-medium text-gray-700">Muscle Group</label>
                            <select
                                id="filter-muscle-desktop"
                                value={primaryMuscles}
                                onChange={e => setPrimaryMuscles(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">All</option>
                                {muscleGroups.map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>
                        {/* Desktop Search Button */}
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Results List (No Changes) --- */}
            <div className="bg-white shadow-md rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {/* ... (loading/error/results mapping) ... */}
                    {isLoading ? (
                        <li className="p-4 text-center text-gray-500">Loading exercises...</li>
                    ) : error ? (
                        <li className="p-4 text-center text-red-500">{error}</li>
                    ) : exercises && exercises.length > 0 ? (
                        exercises.map(exercise => (
                            <li key={exercise.id}>
                                <Link to={`/exercises/${exercise.id}`} className="block hover:bg-gray-50 p-4">
                                    <p className="font-semibold text-indigo-600 truncate">{exercise.name}</p>
                                    <p className="text-sm text-gray-500 capitalize truncate">
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

            {/* --- Pagination (No Changes) --- */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-8">
                    {/* ... (buttons) ... */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 w-full sm:w-auto"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 w-full sm:w-auto"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExercisesListPage;