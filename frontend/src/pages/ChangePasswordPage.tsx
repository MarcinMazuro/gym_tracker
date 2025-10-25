import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';

function ChangePasswordPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword1: '',
        newPassword2: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStatus('idle');

        if (formData.newPassword1 !== formData.newPassword2) {
            setError('New passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await authApi.changePassword(
                formData.oldPassword,
                formData.newPassword1,
                formData.newPassword2
            );
            setStatus('success');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setStatus('error');
            setError(
                err.response?.data?.old_password?.[0] ||
                err.response?.data?.new_password2?.[0] ||
                'Failed to change password'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">🏋️ Gym Tracker</h1>
                    <Link to="/dashboard" className="text-blue-500 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </nav>

            <div className="container mx-auto p-8 max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-6">Change Password</h1>
                    <p className="text-gray-600 mb-6">
                        Change password for: <strong>{user?.username}</strong>
                    </p>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <p className="text-green-600 font-semibold mb-2">Password Changed!</p>
                            <p className="text-gray-600 mb-4">
                                Your password has been successfully updated.
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={formData.oldPassword}
                                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={formData.newPassword1}
                                    onChange={(e) => setFormData({ ...formData, newPassword1: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={formData.newPassword2}
                                    onChange={(e) => setFormData({ ...formData, newPassword2: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                    minLength={8}
                                />
                            </div>

                            {status === 'error' && (
                                <div className="mb-4 text-red-500 text-sm">{error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {isLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChangePasswordPage;
