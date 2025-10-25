import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

function ResetPasswordPage() {
    const { key } = useParams<{ key: string }>();
    const navigate = useNavigate();
    const [newPassword1, setNewPassword1] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!key) {
            setError('Invalid reset link. Please request a new one.');
            return;
        }

        // Token may contain hyphens. Split only on the first hyphen.
        const sepIndex = key.indexOf('-');
        if (sepIndex === -1) {
            setError('Invalid reset link format. Please request a new one.');
            return;
        }
        const uid = key.slice(0, sepIndex).trim();
        const token = key.slice(sepIndex + 1).trim();
        if (!uid || !token) {
            setError('Invalid reset link format. Please request a new one.');
            return;
        }

        if (newPassword1 !== newPassword2) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.confirmPasswordReset(uid, token, newPassword1, newPassword2);
            setSuccess('Password has been reset successfully! You can now log in.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const errorData = err.response?.data;
            const errorMessage = Object.values(errorData || {}).flat().join(' ') || 'Failed to reset password. The link may be invalid or expired.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <input type="password" value={newPassword1} onChange={(e) => setNewPassword1(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                        <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
                    </div>

                    {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
                    {success && <div className="mb-4 text-green-500 text-sm">{success}</div>}

                    <button type="submit" disabled={isLoading || !!success} className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                {success && (
                    <p className="mt-4 text-center text-sm">
                        <Link to="/login" className="text-blue-500 hover:underline">Go to Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
