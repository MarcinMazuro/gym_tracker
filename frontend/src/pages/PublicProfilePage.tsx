import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProfileByUsername } from '../api/profiles';
import type { PublicProfile } from '../api/profiles';
function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (username) {
            getPublicProfileByUsername(username)
                .then(setProfile)
                .catch(() => setError('Profile not found or is private.'))
                .finally(() => setIsLoading(false));
        }
    }, [username]);

    if (isLoading) return <div className="text-center p-8">Loading profile...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-indigo-600">
                {profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : profile?.username}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
                @{profile?.username} &middot; Member since: {new Date(profile?.date_joined || '').toLocaleDateString()}
            </p>
            <div className="space-y-4">
                <div><span className="font-bold text-gray-700">Gender:</span><span className="ml-2 text-gray-800">{profile?.gender || 'Not specified'}</span></div>
                <div><span className="font-bold text-gray-700">Weight:</span><span className="ml-2 text-gray-800">{profile?.weight ? `${profile.weight} kg` : 'Not specified'}</span></div>
                <div><span className="font-bold text-gray-700">Height:</span><span className="ml-2 text-gray-800">{profile?.height ? `${profile.height} cm` : 'Not specified'}</span></div>
                <div><span className="font-bold text-gray-700">Body Fat:</span><span className="ml-2 text-gray-800">{profile?.body_fat_percentage ? `${profile.body_fat_percentage}%` : 'Not specified'}</span></div>
            </div>
        </div>
    );
}

export default PublicProfilePage;