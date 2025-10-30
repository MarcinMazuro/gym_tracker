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
        // 1. Reduced padding on small screens: p-4, scales up to sm:p-8
        <div className="max-w-4xl mx-auto mt-10 p-4 sm:p-8 bg-white rounded-lg shadow-md">
            
            {/* 2. Header stacks on mobile: flex-col, then sm:flex-row */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                    {/* 3. Smaller heading on mobile: text-3xl, then sm:text-4xl */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{displayName}</h1>
                    {/* 4. Smaller subtext on mobile: text-sm, then sm:text-base */}
                    <p className="text-sm sm:text-base text-gray-500 mt-1">
                        @{profile.username} &middot; Member since: {new Date(profile.date_joined || '').toLocaleDateString()}
                    </p>
                </div>
                {isOwner && (
                    <div className="flex">
                        <Link
                            to="/profile/edit"
                            // 5. Button is full-width on mobile (w-full) and auto-width on sm+
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full sm:w-auto text-center sm:text-left"
                        >
                            Edit Profile
                        </Link>
                    </div>
                )}
            </div>

            {profile.about_me && (
                <div className="mb-6 border-t pt-4">
                    <h3 className="font-bold text-gray-700 mb-2">About Me</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{profile.about_me}</p>
                </div>
            )}

            {/* This grid was already responsive! 
                - 'grid-cols-1' is the default (for mobile)
                - 'md:grid-cols-2' applies at the medium breakpoint and up
            */}
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
                    // This was also already responsive. 
                    // It spans 1 column on mobile (default) and 2 columns on md+
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