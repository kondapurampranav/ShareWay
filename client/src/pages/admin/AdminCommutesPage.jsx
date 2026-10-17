// client/src/pages/admin/AdminCommutesPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import * as adminService from '../../services/adminService';

export default function AdminCommutesPage() {
  const [commutes, setCommutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCommutes = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;

    adminService
      .getCommutes(params)
      .then((res) => setCommutes(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load commutes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommutes();
  }, [statusFilter]);

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Active Commutes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor community ride postings, vehicle assignments, and seat capacities
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Commutes Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Route</th>
                  <th className="py-3 px-5">Driver</th>
                  <th className="py-3 px-5">Departure</th>
                  <th className="py-3 px-5">Vehicle & Seats</th>
                  <th className="py-3 px-5">Contribution</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      Loading commutes...
                    </td>
                  </tr>
                ) : commutes.length > 0 ? (
                  commutes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">
                          {c.origin} → {c.destination}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-gray-900">{c.driver.name}</div>
                        <div className="text-xs text-gray-400">{c.driver.email}</div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600">
                        {new Date(c.departureTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-700">
                        <span className="font-medium">{c.vehicleType}</span> (
                        {c.availableSeats}/{c.totalSeats} open)
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        ₹{Number(c.contributionPerSeat).toFixed(0)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            c.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-700'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-700'
                              : c.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      No commutes found.
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
