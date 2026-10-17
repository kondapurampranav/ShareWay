// client/src/pages/admin/AdminReportsPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import * as adminService from '../../services/adminService';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;

    adminService
      .getReports(params)
      .then((res) => setReports(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load safety reports.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateReport = async (reportId, newStatus) => {
    try {
      setActionLoading(true);
      await adminService.updateReport(reportId, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Dismissed', value: 'DISMISSED' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Safety & Conduct Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review community member complaints, conduct inquiries, and resolve safety flags
          </p>
        </div>

        {/* Status Tabs */}
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

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Reported User</th>
                  <th className="py-3 px-5">Reporter</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5">Details</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">{r.reported.name}</div>
                        <div className="text-xs text-gray-400">{r.reported.email}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-gray-800">{r.reporter.name}</div>
                        <div className="text-xs text-gray-400">{r.reporter.email}</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-gray-900">
                        {r.reason}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate">
                        {r.description || 'No detailed note provided.'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            r.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-700'
                              : r.status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 text-amber-700'
                              : r.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setAdminNotes(r.adminNotes || '');
                          }}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium px-3 py-1.5 rounded-lg transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-400">
                      No reports found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Reviewing Report */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Report Review</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Reported User:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedReport.reported.name} ({selectedReport.reported.email})
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Reason:</span>
                  <p className="font-medium text-red-600">{selectedReport.reason}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Description:</span>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-xl mt-1 text-xs whitespace-pre-wrap">
                    {selectedReport.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Administrator Notes:
                  </label>
                  <textarea
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdateReport(selectedReport.id, 'UNDER_REVIEW')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition"
                >
                  Mark Under Review
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReport(selectedReport.id, 'RESOLVED')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Resolve Report
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReport(selectedReport.id, 'DISMISSED')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
