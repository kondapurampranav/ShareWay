// client/src/pages/auth/LoginPage.jsx
// OWNER: Member 1

import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, MEMBERSHIP_STATUS } from '../../utils/constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    if (user) {
      if (user.role === ROLES.PLATFORM_ADMIN || user.role === ROLES.COMMUNITY_ADMIN) {
        navigate('/admin', { replace: true });
        return;
      }
      const primaryMembership = user.memberships?.[0];
      if (primaryMembership && primaryMembership.status === MEMBERSHIP_STATUS.PENDING) {
        navigate('/pending', { replace: true });
        return;
      }
      const from = location.state?.from?.pathname || '/discover';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const data = await login({ email: email.trim(), password });
      
      const loggedUser = data.user;
      if (loggedUser.role === ROLES.PLATFORM_ADMIN || loggedUser.role === ROLES.COMMUNITY_ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        const mem = loggedUser.memberships?.[0];
        if (mem && mem.status === MEMBERSHIP_STATUS.PENDING) {
          navigate('/pending', { replace: true });
        } else {
          navigate('/discover', { replace: true });
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors?.[0]?.msg) ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick demo test login
  const setDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-3xl shadow-lg shadow-indigo-200 mb-3">
            🚗
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ShareWay</h1>
          <p className="text-sm text-gray-500 mt-1">Verified Community Carpooling</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <span className="text-red-500 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@dsce.edu.in"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Helper */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center uppercase tracking-wider mb-2 font-semibold">
            Quick Demo Accounts
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setDemoCredentials('rahul@dsce.edu.in')}
              className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg transition"
            >
              🚗 Driver (Rahul)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('priya@dsce.edu.in')}
              className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg transition"
            >
              🎒 Passenger (Priya)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@dsce.edu.in')}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg transition"
            >
              👑 Admin
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
