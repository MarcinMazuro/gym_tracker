import { Link } from 'react-router-dom';
import type { Profile, PublicProfile } from '@/api/profiles';

interface ProfileViewProps {
    profile: Partial<Profile | PublicProfile>;
    isOwner: boolean; // Flag to determine if the viewer is the owner
}

export function ProfileView({ profile, isOwner }: ProfileViewProps) {
    const displayName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.username;

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">{displayName}</h1>
                    <p className="text-md text-gray-500 mt-1">
                        @{profile.username} &middot; Member since: {new Date(profile.date_joined || '').toLocaleDateString()}
                    </p>
                </div>
                {isOwner && (
                    <div className="flex gap-2">
                        <Link
                            to="/profile/edit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Edit Profile
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-700">Personal Info</h3>
                    <p><span className="font-semibold">Gender:</span> {profile.gender || 'Not specified'}</p>
                    {isOwner && <p><span className="font-semibold">Email:</span> { (profile as Profile).email }</p>}
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-700">Physical Stats</h3>
                    <p><span className="font-semibold">Weight:</span> {profile.weight ? `${profile.weight} kg` : 'Not specified'}</p>
                    <p><span className="font-semibold">Height:</span> {profile.height ? `${profile.height} cm` : 'Not specified'}</p>
                    <p><span className="font-semibold">Body Fat:</span> {profile.body_fat_percentage ? `${profile.body_fat_percentage}%` : 'Not specified'}</p>
                </div>

                {isOwner && (
                    <div className="border-t pt-4 md:col-span-2">
                        <h3 className="font-bold text-gray-700">Account Settings</h3>
                        <Link to="/change-password" className="text-blue-500 hover:underline">
                            Change Password
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}