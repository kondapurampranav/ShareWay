// client/src/pages/profile/ProfilePage.jsx
// OWNER: Member 1

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-gray-500">
        Please sign in to view your profile.
      </div>
    );
  }

  const primaryMembership = user.memberships?.[0];
  const community = primaryMembership?.community;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Cover */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative" />

          {/* User Info Section */}
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-6 gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md border border-gray-100">
                  <div className="w-full h-full rounded-xl bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/profile/edit"
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Badges / Meta */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                {user.role}
              </span>
              {primaryMembership && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    primaryMembership.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {primaryMembership.status === 'APPROVED' ? '🛡️ Verified Member' : '⏳ Pending Verification'}
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {user.phone || 'Not provided'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
                  Member Since
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Campus Community
                </h2>
                <Link
                  to="/community"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View Community →
                </Link>
              </div>

              {community ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">{community.name}</h3>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Domain: {community.domain || 'Open'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                    {primaryMembership.status}
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
                  Not joined to any community yet.
                </div>
              )}
            </div>

            {/* Return navigation */}
            <div className="mt-8 text-center">
              <Link
                to="/discover"
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                ← Back to Rides
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
