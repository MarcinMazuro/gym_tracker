import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getActiveWorkoutSession, cancelWorkoutSession } from '@/api/workouts';
import type { WorkoutSession } from '@/api/workouts';

export function MainLayout() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    // Check for active session on mount and auth change
    useEffect(() => {
        if (isAuthenticated) {
            checkActiveSession();
        } else {
            setActiveSession(null);
            setShowBanner(false);
        }
    }, [isAuthenticated]);

    // Listen for workout finished event
    useEffect(() => {
        const handleWorkoutFinished = () => {
            setActiveSession(null);
            setShowBanner(false);
        };
        window.addEventListener('workoutFinished', handleWorkoutFinished);
        return () => window.removeEventListener('workoutFinished', handleWorkoutFinished);
    }, []);

    // Hide banner when on tracker page
    useEffect(() => {
        if (location.pathname === '/tracker') {
            setShowBanner(false);
        } else if (activeSession) {
            setShowBanner(true);
        }
    }, [location.pathname, activeSession]);

    const checkActiveSession = async () => {
        try {
            const session = await getActiveWorkoutSession();
            setActiveSession(session);
            // Only show banner if not on tracker page
            if (location.pathname !== '/tracker') {
                setShowBanner(true);
            }
        } catch (err) {
            setActiveSession(null);
            setShowBanner(false);
        }
    };

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

    const handleCancelWorkout = async () => {
        if (!activeSession) return;
        
        const confirmed = window.confirm('Are you sure you want to cancel this workout? All progress will be lost.');
        if (!confirmed) return;
        
        try {
            await cancelWorkoutSession(activeSession.id);
            setActiveSession(null);
            setShowBanner(false);
            window.dispatchEvent(new Event('workoutFinished'));
        } catch (error) {
            console.error('Failed to cancel workout:', error);
            alert('Failed to cancel workout. Please try again.');
        }
    };

    const handleResumeWorkout = () => {
        setShowBanner(false);
        navigate('/tracker');
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
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Active Workout Banner */}
            {showBanner && activeSession && (
                <div className="bg-green-600 text-white">
                    <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">💪</span>
                            <div>
                                <p className="font-semibold">Workout in Progress</p>
                                <p className="text-sm text-green-100">
                                    {activeSession.plan_details?.name || 'Active Workout'} • {activeSession.logged_sets?.length || 0} sets logged
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleResumeWorkout}
                                className="flex-1 sm:flex-none bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-green-50 transition-colors"
                            >
                                Continue Workout
                            </button>
                            <button
                                onClick={handleCancelWorkout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                aria-label="Cancel workout"
                                title="Cancel workout"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
}
