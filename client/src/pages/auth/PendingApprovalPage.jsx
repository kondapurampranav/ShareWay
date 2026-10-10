// client/src/pages/auth/PendingApprovalPage.jsx
// OWNER: Member 1

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MEMBERSHIP_STATUS } from '../../utils/constants';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);

  const primaryMembership = user?.memberships?.[0];
  const communityName = primaryMembership?.community?.name || 'Your Community';

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const updatedUser = await refreshUser();
      const mem = updatedUser?.memberships?.[0];
      if (mem && mem.status === MEMBERSHIP_STATUS.APPROVED) {
        navigate('/discover', { replace: true });
      } else {
        setMessage('Status is still pending verification. Please check back shortly.');
      }
    } catch {
      setMessage('Failed to check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        {/* Pending Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 text-3xl shadow-sm mb-4">
          ⏳
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Membership Pending Approval
        </h1>
        
        <p className="text-sm text-gray-600 mt-2">
          Your request to join <span className="font-semibold text-gray-900">{communityName}</span> is awaiting verification by the community administrator.
        </p>

        {/* Info box */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 text-left text-xs text-amber-900 space-y-2">
          <p className="font-semibold">Why is this required?</p>
          <p className="text-amber-800">
            ShareWay is a verified community platform. All members are verified to ensure maximum safety, trust, and transparent shared rides.
          </p>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
            {message}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-lg shadow-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Checking status...</span>
              </>
            ) : (
              <span>Refresh Status</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl focus:outline-none transition-all text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
