import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react'; // 1. Import useState

export function MainLayout() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    // 2. Add state for mobile menu toggle
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Helper to close menu on link click (for mobile)
    const handleMobileLinkClick = (path: string) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    // Helper to close menu on logout
    const handleMobileLogout = async () => {
        setIsMenuOpen(false);
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation Bar 
                - Added `relative` for positioning the mobile dropdown
            */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link 
                        to={isAuthenticated ? "/dashboard" : "/login"} 
                        className="text-xl font-bold text-indigo-600"
                        // Close menu if logo is clicked
                        onClick={() => setIsMenuOpen(false)}
                    >
                        🏋️ Gym Tracker
                    </Link>

                    {/* 3. Desktop Navigation Links 
                        - `hidden` on mobile, `md:flex` on medium screens and up
                    */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/profiles" className="text-gray-600 hover:text-indigo-600">
                            Profiles
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/exercises" className="text-gray-600 hover:text-indigo-600">
                                    Exercises
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

                    {/* 4. Hamburger Menu Button
                        - `md:hidden` to show only on mobile
                    */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-indigo-600 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                // "X" Icon
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            ) : (
                                // Hamburger Icon
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* 5. Mobile Menu Dropdown
                    - Renders conditionally based on `isMenuOpen`
                    - `md:hidden` ensures it's only for mobile
                    - `absolute` positions it below the nav bar
                */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-20">
                        <div className="flex flex-col px-4 pt-2 pb-4 gap-2">
                            {/* We use buttons for navigation to leverage our helper functions */}
                            <button onClick={() => handleMobileLinkClick('/profiles')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                Profiles
                            </button>
                            {isAuthenticated ? (
                                <>
                                    <button onClick={() => handleMobileLinkClick('/exercises')} className="text-gray-600 hover:text-indigo-600 text-left py-2">
                                        Exercises
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

            {/* Page Content
                - Your original responsive padding `p-4 md:p-8` is great!
            */}
            <main className="container mx-auto p-4 md:p-8">
                <Outlet /> {/* Child routes will be rendered here */}
            </main>
        </div>
    );
}