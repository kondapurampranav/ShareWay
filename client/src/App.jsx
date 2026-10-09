// client/src/App.jsx
// Root component — React Router setup.
// Each member adds their own routes in the relevant section below.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// ── Member 1 ──────────────────────────────────────────────────────────────────
import LoginPage           from './pages/auth/LoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import ProfilePage         from './pages/profile/ProfilePage';
import EditProfilePage     from './pages/profile/EditProfilePage';
import CommunityPage       from './pages/profile/CommunityPage';

// ── Member 2 ──────────────────────────────────────────────────────────────────
import MyCommutesPage       from './pages/commutes/MyCommutesPage';
import CreateCommutePage    from './pages/commutes/CreateCommutePage';
import EditCommutePage      from './pages/commutes/EditCommutePage';
import CommuteDetailPage    from './pages/commutes/CommuteDetailPage';
import RecurringSchedulePage from './pages/commutes/RecurringSchedulePage';

// ── Member 3 ──────────────────────────────────────────────────────────────────
import MyRideRequestsPage    from './pages/ride-requests/MyRideRequestsPage';
import CreateRideRequestPage from './pages/ride-requests/CreateRideRequestPage';
import RideRequestDetailPage from './pages/ride-requests/RideRequestDetailPage';
import DiscoverCommutesPage  from './pages/ride-requests/DiscoverCommutesPage';
import MyBookingsPage        from './pages/bookings/MyBookingsPage';
import BookingDetailPage     from './pages/bookings/BookingDetailPage';
import NegotiationPage       from './pages/bookings/NegotiationPage';

// ── Member 4 ──────────────────────────────────────────────────────────────────
import NotificationsPage  from './pages/notifications/NotificationsPage';
import RateUserPage       from './pages/ratings/RateUserPage';
import ReportUserPage     from './pages/reports/ReportUserPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage   from './pages/admin/AdminMembersPage';
import AdminReportsPage   from './pages/admin/AdminReportsPage';
import AdminCommutesPage  from './pages/admin/AdminCommutesPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pending"  element={<PendingApprovalPage />} />

          {/* Member 1 */}
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/profile/edit"  element={<EditProfilePage />} />
          <Route path="/community"     element={<CommunityPage />} />

          {/* Member 2 */}
          <Route path="/commutes"              element={<MyCommutesPage />} />
          <Route path="/commutes/new"          element={<CreateCommutePage />} />
          <Route path="/commutes/:id"          element={<CommuteDetailPage />} />
          <Route path="/commutes/:id/edit"     element={<EditCommutePage />} />
          <Route path="/recurring"             element={<RecurringSchedulePage />} />

          {/* Member 3 */}
          <Route path="/discover"              element={<DiscoverCommutesPage />} />
          <Route path="/ride-requests"         element={<MyRideRequestsPage />} />
          <Route path="/ride-requests/new"     element={<CreateRideRequestPage />} />
          <Route path="/ride-requests/:id"     element={<RideRequestDetailPage />} />
          <Route path="/bookings"              element={<MyBookingsPage />} />
          <Route path="/bookings/:id"          element={<BookingDetailPage />} />
          <Route path="/bookings/:id/negotiate" element={<NegotiationPage />} />

          {/* Member 4 */}
          <Route path="/notifications"         element={<NotificationsPage />} />
          <Route path="/rate/:bookingId"        element={<RateUserPage />} />
          <Route path="/report/:userId"         element={<ReportUserPage />} />
          <Route path="/admin"                  element={<AdminDashboardPage />} />
          <Route path="/admin/members"          element={<AdminMembersPage />} />
          <Route path="/admin/reports"          element={<AdminReportsPage />} />
          <Route path="/admin/commutes"         element={<AdminCommutesPage />} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
