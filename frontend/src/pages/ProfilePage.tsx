import React, { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile} from '../api/profiles';
import type { Profile } from '../api/profiles';

function ProfilePage() {
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        getMyProfile()
            .then(data => {
                setProfile(data);
                setIsLoading(false);
            })
            .catch(() => {
                setError('Failed to load profile.');
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setProfile(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const payload = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                is_public: profile.is_public,
                gender: profile.gender || null,
                weight: profile.weight || null,
                height: profile.height || null,
                body_fat_percentage: profile.body_fat_percentage || null,
            };
            const updatedProfile = await updateMyProfile(payload);
            setProfile(updatedProfile);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    if (isLoading) return <div className="text-center p-8">Loading profile...</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-sm text-gray-500 mb-6">
                Member since: {new Date(profile.date_joined || '').toLocaleDateString()}
            </p>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {success && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">First Name</label>
                        <input type="text" name="first_name" value={profile.first_name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Last Name</label>
                        <input type="text" name="last_name" value={profile.last_name || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Email</label>
                    <input type="email" value={profile.email || ''} disabled className="w-full px-3 py-2 border rounded-md bg-gray-200" />
                </div>
                <div>
                    <label htmlFor="gender" className="block text-gray-700 font-bold mb-2">Gender</label>
                    <select id="gender" name="gender" value={profile.gender || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Prefer not to say</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Weight (kg)</label>
                        <input type="number" name="weight" value={profile.weight || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Height (cm)</label>
                        <input type="number" name="height" value={profile.height || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Body Fat (%)</label>
                        <input type="number" name="body_fat_percentage" value={profile.body_fat_percentage || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                </div>
                <div className="flex items-center pt-2">
                    <input type="checkbox" id="is_public" name="is_public" checked={profile.is_public || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">Make my profile public</label>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 mt-4">
                    Save Changes
                </button>
            </form>
        </div>
    );
}

export default ProfilePage;
