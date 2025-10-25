import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

function PasswordResetConfirmPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
      setError('Passwords do not match');
      return;
    }

    if (!uid || !token) {
      setError('Invalid reset link');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.confirmPasswordReset(
        uid,
        token,
        formData.newPassword1,
        formData.newPassword2
      );
      setStatus('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setError(
        err.response?.data?.new_password2?.[0] || 
        err.response?.data?.token?.[0] || 
        'Failed to reset password. Link may be expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>

        {status === 'success' ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-green-600 font-semibold mb-2">Password Reset!</p>
            <p className="text-gray-600 mb-4">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login in 3 seconds...
            </p>
            <Link 
              to="/login" 
              className="text-blue-500 hover:underline"
            >
              Go to Login now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={formData.newPassword1}
                onChange={(e) => setFormData({...formData, newPassword1: e.target.value})}
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
                onChange={(e) => setFormData({...formData, newPassword2: e.target.value})}
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
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;