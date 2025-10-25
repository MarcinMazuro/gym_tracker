import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatus('idle');

    try {
      await authApi.requestPasswordReset(email);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.email?.[0] || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

        {status === 'success' ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <p className="text-green-600 font-semibold mb-2">Email Sent!</p>
            <p className="text-gray-600 mb-4">
              Check your email for password reset instructions.
            </p>
            <Link 
              to="/login" 
              className="text-blue-500 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="your@email.com"
                  required
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
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-500 hover:underline">
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PasswordResetPage;
