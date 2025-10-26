import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function MainLayout() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-xl font-bold text-indigo-600">
                        🏋️ Gym Tracker
                    </Link>
                    <div className="flex items-center gap-4">
                        {/* Common link for all users */}
                        <Link to="/profiles" className="text-gray-600 hover:text-indigo-600">
                            Profiles
                        </Link>

                        {isAuthenticated ? (
                            // Links for authenticated users
                            <>
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
                            // Links for guests
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
                </div>
            </nav>

            {/* Page Content */}
            <main className="container mx-auto p-4 md:p-8">
                <Outlet /> {/* Child routes will be rendered here */}
            </main>
        </div>
    );
}
