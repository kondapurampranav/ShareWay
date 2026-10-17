// client/src/pages/auth/RegisterPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import { MEMBERSHIP_STATUS } from '../../utils/constants';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    communityId: '',
  });

  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active communities for dropdown
  useEffect(() => {
    authService
      .getCommunities()
      .then((res) => {
        const list = res.data?.data || [];
        setCommunities(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, communityId: list[0].id }));
        }
      })
      .catch(() => {
        // Fallback default community if backend is unreachable or not yet seeded
        setCommunities([
          { id: 'default-dsce', name: 'DSCE College', domain: '@dsce.edu.in' },
        ]);
      })
      .finally(() => setLoadingCommunities(false));
  }, []);

  const selectedCommunity = communities.find((c) => c.id === formData.communityId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Community domain check reminder
    if (selectedCommunity?.domain) {
      const expected = selectedCommunity.domain.startsWith('@')
        ? selectedCommunity.domain.slice(1).toLowerCase()
        : selectedCommunity.domain.toLowerCase();
      const userDomain = formData.email.split('@')[1]?.toLowerCase();
      if (userDomain !== expected) {
        setError(`For ${selectedCommunity.name}, your email must end with ${selectedCommunity.domain}`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        communityId: formData.communityId || undefined,
      };

      const result = await register(payload);
      const registeredUser = result.user;
      const mem = registeredUser.memberships?.[0];

      if (mem && mem.status === MEMBERSHIP_STATUS.PENDING) {
        navigate('/pending', { replace: true });
      } else {
        navigate('/discover', { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please check your information.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-3xl shadow-lg shadow-indigo-200 mb-3">
            🚗
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Join ShareWay</h1>
          <p className="text-sm text-gray-500 mt-1">
            Safe, verified carpooling with your campus community
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <span className="text-red-500 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Kumar"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Community / Campus *
            </label>
            <select
              name="communityId"
              value={formData.communityId}
              onChange={handleChange}
              disabled={loadingCommunities}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.domain ? `(${c.domain})` : ''}
                </option>
              ))}
            </select>
            {selectedCommunity?.domain && (
              <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-medium">
                <span>🛡️ Verified domain required:</span>
                <span className="underline">{selectedCommunity.domain}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Institutional Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={
                selectedCommunity?.domain
                  ? `name${selectedCommunity.domain}`
                  : 'you@college.edu'
              }
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
