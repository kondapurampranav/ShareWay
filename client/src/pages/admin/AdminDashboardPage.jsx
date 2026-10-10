// client/src/pages/admin/AdminDashboardPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from './AdminNav';
import * as adminService from '../../services/adminService';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = () => {
    setLoading(true);
    adminService
      .getStats()
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard metrics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickApprove = async (membershipId) => {
    try {
      await adminService.updateMember(membershipId, { status: 'APPROVED' });
      fetchStats();
    } catch {
      alert('Failed to approve member.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Overview</h1>
            <p className="text-sm text-gray-500 mt-1">
              Community health, active verification queues, and rides
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Members
              </span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {loading ? '—' : stats?.totalMembers ?? 0}
            </p>
            <p className="text-xs text-green-600 font-medium mt-1">
              {stats?.approvedMembers ?? 0} verified & active
            </p>
          </div>

          <Link
            to="/admin/members?status=PENDING"
            className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm hover:border-amber-300 transition block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Pending Verification
              </span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">⏳</span>
            </div>
            <p className="text-3xl font-bold text-amber-600 mt-3 group-hover:scale-105 transition-transform inline-block">
              {loading ? '—' : stats?.pendingMembers ?? 0}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Click to review queue →
            </p>
          </Link>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Commutes
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">🚗</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {loading ? '—' : stats?.activeCommutes ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.totalCommutes ?? 0} total trips scheduled
            </p>
          </div>

          <Link
            to="/admin/reports"
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Safety Reports
              </span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl text-lg">🛡️</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {loading ? '—' : stats?.openReports ?? 0}
            </p>
            <p className="text-xs text-rose-600 font-medium mt-1">
              Open investigations
            </p>
          </Link>
        </div>

        {/* Pending Banner if any */}
        {stats?.pendingMembers > 0 && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 className="text-sm font-bold text-amber-900">
                  {stats.pendingMembers} student(s) waiting for community verification
                </h2>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review and verify institutional emails to allow them to book and post rides.
                </p>
              </div>
            </div>
            <Link
              to="/admin/members?status=PENDING"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition whitespace-nowrap text-center"
            >
              Review Pending Members
            </Link>
          </div>
        )}

        {/* Recent Members Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Registrations</h2>
            <Link
              to="/admin/members"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View All Members →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Campus Community</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentMembers && stats.recentMembers.length > 0 ? (
                  stats.recentMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-gray-900">{m.user.name}</div>
                        <div className="text-xs text-gray-400">{m.user.email}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-gray-700">{m.community.name}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                          {m.user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            m.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : m.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {m.status === 'PENDING' ? (
                          <button
                            onClick={() => handleQuickApprove(m.id)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-gray-400">
                      No registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
