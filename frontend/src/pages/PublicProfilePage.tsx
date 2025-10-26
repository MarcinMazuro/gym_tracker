import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProfileByUsername } from '../api/profiles';
import type { PublicProfile } from '../api/profiles';
import { ProfileView } from '@/components/profile/ProfileView';

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

    return (
        <div className="container mx-auto p-4 md:p-8">
            {isLoading && <div className="text-center p-8">Loading profile...</div>}
            {error && <div className="text-center p-8 text-red-500">{error}</div>}
            {profile && <ProfileView profile={profile} isOwner={false} />}
        </div>
    );
}

export default PublicProfilePage;
