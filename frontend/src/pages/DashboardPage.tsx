import { useState, useEffect } from 'react';
import { getMyProfile } from '@/api/profiles';
import type { Profile } from '@/api/profiles';
import { ProfileView } from '@/components/profile/ProfileView';

function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getMyProfile()
            .then(setProfile)
            .catch(() => setError('Failed to load your profile data.'))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-8">
            {isLoading && <div className="text-center p-8">Loading your dashboard...</div>}
            {error && <div className="text-center p-8 text-red-500">{error}</div>}
            {profile && <ProfileView profile={profile} isOwner={true} />}
        </div>
    );
}

export default DashboardPage;
