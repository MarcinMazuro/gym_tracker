import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

function VerifyEmailPage() {
    const { key } = useParams<{ key: string }>();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!key) {
            setStatus('error');
            setMessage('Verification key is missing.');
            return;
        }

        const verify = async () => {
            try {
                await authApi.verifyEmail(key);
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now log in.');
            } catch (error) {
                setStatus('error');
                setMessage('Failed to verify email. The link may be invalid or expired.');
                console.error('Email verification failed:', error);
            }
        };

        verify();
    }, [key]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
                <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
                <p className={`mb-6 ${status === 'error' ? 'text-red-500' : 'text-gray-700'}`}>
                    {message}
                </p>
                {status !== 'verifying' && (
                    <Link
                        to="/login"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                    >
                        Go to Login
                    </Link>
                )}
            </div>
        </div>
    );
}

export default VerifyEmailPage;
