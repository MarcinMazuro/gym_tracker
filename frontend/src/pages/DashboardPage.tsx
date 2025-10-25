import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/api/auth';

function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const [resendMsg, setResendMsg] = useState<string>('');
    const [resendErr, setResendErr] = useState<string>('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleResend = async () => {
        if (!user?.email) return;
        setSending(true);
        setResendMsg('');
        setResendErr('');
        try {
            await authApi.resendVerificationEmail(user.email);
            setResendMsg('Verification e-mail has been sent. Please check your inbox.');
        } catch (e: any) {
            const detail = e?.response?.data?.detail || 'Failed to resend verification e-mail. Please try again.';
            setResendErr(detail);
        } finally {
            setSending(false);
        }
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

                {/* Email not verified banner */}
                {user && user.email_verified === false && (
                    <div className="mb-6 p-4 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800">
                        <p className="mb-3 font-medium">Your e-mail is not verified yet.</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleResend}
                                disabled={sending}
                                className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {sending ? 'Sending…' : 'Resend verification e-mail'}
                            </button>
                            {resendMsg && <span className="text-green-700">{resendMsg}</span>}
                            {resendErr && <span className="text-red-600">{resendErr}</span>}
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Username:</strong> {user?.username}</p>
                    <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                    <div className="mt-4">
                        <Link to="/change-password"
                            className="text-blue-500 hover:underline"
                        >
                            Change Password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
