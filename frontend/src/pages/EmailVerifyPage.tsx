import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

function EmailVerifyPage() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        await authApi.verifyEmail(key);
        setStatus('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.detail || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [key, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-2">Verifying Email...</h1>
            <p className="text-gray-600">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h1>
            <p className="text-gray-600 mb-4">
              Your email has been successfully verified.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login in 3 seconds...
            </p>
            <Link 
              to="/login" 
              className="inline-block mt-4 text-blue-500 hover:underline"
            >
              Go to Login now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              to="/login" 
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailVerifyPage;
