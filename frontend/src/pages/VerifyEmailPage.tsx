import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';

function VerifyEmailPage() {
    const { key } = useParams<{ key: string }>();
    const { user } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [resendErr, setResendErr] = useState('');

    useEffect(() => {
        if (!key) {
            setStatus('error');
            setMessage('Verification key is missing.');
            return;
        }

        // If the user is already logged in and verified, treat as success (idempotent)
        if (user?.email_verified === true) {
            setStatus('success');
            setMessage('Your email is already verified. You can now log in.');
            return;
        }

        const verify = async () => {
            try {
                await authApi.verifyEmail(key);
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now log in.');
            } catch (error: any) {
                // Parse backend detail if present
                const detail = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || '';
                const detailLower = (typeof detail === 'string' ? detail : '').toLowerCase();
                // Many backends return messages like "E-mail is already verified." or "Email already confirmed"
                if (detailLower.includes('already') && (detailLower.includes('confirm') || detailLower.includes('verif'))) {
                    setStatus('success');
                    setMessage('Your email is already verified. You can now log in.');
                    return;
                }

                // On failure, if the user is logged in, re-check current user info.
                // If already verified, treat it as success to make the flow idempotent.
                try {
                    const me = await authApi.getCurrentUser();
                    if (me?.email_verified) {
                        setStatus('success');
                        setMessage('Your email is already verified. You can now log in.');
                        return;
                    }
                } catch (_) {
                    // Not logged in or cannot fetch user; fall through to error UI
                }
                setStatus('error');
                setMessage('Failed to verify email. The link may be invalid or expired.');
                console.error('Email verification failed:', error);
            }
        };

        verify();
        // We intentionally do not include `user` in deps to avoid re-running
        // when AuthContext updates; verification is tied to the provided key.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const handleResend = async () => {
        if (!user?.email) return;
        setResending(true);
        setResendMsg('');
        setResendErr('');
        try {
            await authApi.resendVerificationEmail(user.email);
            setResendMsg('A new verification e-mail has been sent. Please check your inbox.');
        } catch (e: any) {
            const detail = e?.response?.data?.detail || 'Failed to resend verification e-mail. Please try again.';
            setResendErr(detail);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
                <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
                <p className={`mb-6 ${status === 'error' ? 'text-red-500' : 'text-gray-700'}`}>
                    {message}
                </p>
                {status === 'error' && user?.email && (
                    <div className="mb-4">
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {resending ? 'Resending…' : `Resend verification to ${user.email}`}
                        </button>
                        {resendMsg && <p className="mt-2 text-green-600 text-sm">{resendMsg}</p>}
                        {resendErr && <p className="mt-2 text-red-600 text-sm">{resendErr}</p>}
                    </div>
                )}
                {status !== 'verifying' && (
                    <Link
                        to="/login"
                        className="inline-block w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800"
                    >
                        Go to Login
                    </Link>
                )}
            </div>
        </div>
    );
}

export default VerifyEmailPage;
