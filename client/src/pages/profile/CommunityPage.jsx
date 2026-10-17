// client/src/pages/profile/CommunityPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import * as authService from '../../services/authService';

export default function CommunityPage() {
  const { user } = useAuth();
  const primaryMembership = user?.memberships?.[0];
  const community = primaryMembership?.community;

  const [members, setMembers] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (community?.id) {
      setLoadingMembers(true);
      api
        .get(`/communities/${community.id}/members`)
        .then((res) => setMembers(res.data.data || []))
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    }

    authService
      .getCommunities()
      .then((res) => setAllCommunities(res.data.data || []))
      .catch(() => {});
  }, [community?.id]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Campus Communities
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Verified institutional networks ensuring trusted campus rides
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-gray-600 hover:text-indigo-600 transition"
          >
            ← Back to Profile
          </Link>
        </div>

        {/* Current Community Hero */}
        {community ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
                  🏛️
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{community.name}</h2>
                  <p className="text-xs text-indigo-600 font-medium">
                    Verified Domain: {community.domain || 'Open'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    primaryMembership.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Status: {primaryMembership.status}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-600">
              {community.description || 'Verified academic or workplace carpooling hub.'}
            </p>

            {/* Community Members List */}
            <div className="mt-8">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                Fellow Community Members ({members.length})
              </h3>

              {loadingMembers ? (
                <div className="py-6 text-center text-xs text-gray-400">Loading members...</div>
              ) : members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {m.user.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{m.user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No other members visible in this directory.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
            <span className="text-4xl block mb-2">🏫</span>
            <h2 className="text-lg font-bold text-gray-900">Join a Campus Community</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Select an affiliated institution to unlock rides and book shared commutes with fellow students.
            </p>
          </div>
        )}

        {/* Explore Other Communities */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Available Communities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allCommunities.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-900">{c.name}</h3>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {c.domain || 'Public'}
                  </span>
                </div>
                {c.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
