import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProfiles } from '../api/profiles';
import type { PublicProfile } from '../api/profiles';

// If your API returns { results: PublicProfile[] }
type ProfilesApiResponse = PublicProfile[] | { results: PublicProfile[] };

function ProfilesListPage() {
    const [profiles, setProfiles] = useState<PublicProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getPublicProfiles()
            .then((data: ProfilesApiResponse) => {
                if (Array.isArray(data)) {
                    setProfiles(data);
                } else if (data && Array.isArray((data as { results: PublicProfile[] }).results)) {
                    setProfiles((data as { results: PublicProfile[] }).results);
                } else {
                    setProfiles([]);
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="text-center p-8">Loading profiles...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8">
            <h1 className="text-3xl font-bold mb-6">Public Profiles</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                    <Link to={`/profiles/${profile.username}`} key={profile.username} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h2 className="text-xl font-bold text-indigo-600">
                            {profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.username}
                        </h2>
                        <p className="text-sm text-gray-500">@{profile.username}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ProfilesListPage;
