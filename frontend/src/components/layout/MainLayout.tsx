import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react'; // Added useEffect
import { getActiveWorkoutSession } from '@/api/workouts'; // Import the API function
import type { WorkoutSession } from '@/api/workouts'; // Import the type

export function MainLayout() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null); // New state for active session

    // New effect to fetch active session when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            getActiveWorkoutSession()
                .then(setActiveSession)
                .catch(() => setActiveSession(null)); // Ignore errors, just set to null
        } else {
            setActiveSession(null);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleWorkoutCanceled = () => {
            setActiveSession(null);
        };
        window.addEventListener('workoutCanceled', handleWorkoutCanceled);
        return () => window.removeEventListener('workoutCanceled', handleWorkoutCanceled);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleMobileLinkClick = (path: string) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    const handleMobileLogout = async () => {
        setIsMenuOpen(false);
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link 
                        to={isAuthenticated ? "/dashboard" : "/login"} 
                        className="text-xl font-bold text-indigo-600"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        🏋️ Gym Tracker
                    </Link>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/profiles" className="text-gray-600 hover:text-indigo-600">
                            Profiles
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/exercises" className="text-gray-600 hover:text-indigo-600">
                                    Exercises
                                </Link>
                                <Link to="/workouts" className="text-gray-600 hover:text-indigo-600">
                                    My Plans
                                </Link>
                                <Link to="/history" className="text-gray-600 hover:text-indigo-600">
                                    History
                                </Link>
                                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">
                                    My Dashboard
                                </Link>
                                {/* New: Resume Workout button, only if active session exists */}
                                {activeSession && (
                                    <Link
                                        to="/tracker"
                                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                                    >
                                        Resume Workout
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-indigo-600 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-20">
                        <div className="flex flex-col px-4 pt-2 pb-4 gap-2">
                            <button onClick={() => handleMobileLinkClick('/profiles')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                Profiles
                            </button>
                            {isAuthenticated ? (
                                <>
                                    <button onClick={() => handleMobileLinkClick('/exercises')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        Exercises
                                    </button>
                                    <button onClick={() => handleMobileLinkClick('/workouts')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        My Plans
                                    </button>
                                    <button onClick={() => handleMobileLinkClick('/history')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        History
                                    </button>
                                    <button onClick={() => handleMobileLinkClick('/dashboard')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        My Dashboard
                                    </button>
                                    {/* New: Resume Workout button in mobile menu, only if active session exists */}
                                    {activeSession && (
                                        <button
                                            onClick={() => handleMobileLinkClick('/tracker')}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 text-left"
                                        >
                                            Resume Workout
                                        </button>
                                    )}
                                    <button
                                        onClick={handleMobileLogout}
                                        className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 text-left"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => handleMobileLinkClick('/login')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        Login
                                    </button>
                                    <button
                                        onClick={() => handleMobileLinkClick('/register')}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 text-center"
                                    >
                                        Register
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main className="container mx-auto p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
}