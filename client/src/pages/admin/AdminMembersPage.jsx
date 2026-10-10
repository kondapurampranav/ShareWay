// client/src/pages/admin/AdminMembersPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminNav from './AdminNav';
import * as adminService from '../../services/adminService';

export default function AdminMembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const fetchMembers = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    adminService
      .getMembers(params)
      .then((res) => setMembers(res.data.data.members || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load member list.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleUpdateStatus = async (membershipId, newStatus) => {
    try {
      await adminService.updateMember(membershipId, { status: newStatus });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member status.');
    }
  };

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'PENDING' },
    { label: 'Active', value: 'APPROVED' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Community Members</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify campus identities, manage statuses, and oversee member permissions
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setSearchParams(tab.value ? { status: tab.value } : {});
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Members Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-5">Community</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      Loading members...
                    </td>
                  </tr>
                ) : members.length > 0 ? (
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">{m.user.name}</div>
                        <div className="text-xs text-gray-400">{m.user.email}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-gray-800">{m.community.name}</span>
                        {m.community.domain && (
                          <span className="text-xs text-gray-400 block">{m.community.domain}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500">
                        {m.user.phone || '—'}
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
                              : m.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        {m.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-2.5 py-1 rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'REJECTED')}
                              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2.5 py-1 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {m.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'SUSPENDED')}
                            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium px-2.5 py-1 rounded-lg transition"
                          >
                            Suspend
                          </button>
                        )}
                        {m.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                            className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-medium px-2.5 py-1 rounded-lg transition"
                          >
                            Reactivate
                          </button>
                        )}
                        {m.status === 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium px-2.5 py-1 rounded-lg transition"
                          >
                            Re-approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      No members matching the current filter.
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
