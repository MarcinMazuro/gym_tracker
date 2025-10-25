import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">🏋️ Gym Tracker</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container mx-auto p-8">
                <h2 className="text-3xl font-bold mb-4">
                    Welcome, {user?.username}!
                </h2>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Username:</strong> {user?.username}</p>
                    <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
