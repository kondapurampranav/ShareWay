// server/src/routes/index.js
// Mounts all route groups under /api.
// Each member adds their own router here.

const { Router } = require('express');

const authRoutes             = require('./auth.routes');
const communityRoutes        = require('./community.routes');
const userRoutes             = require('./user.routes');
const commuteRoutes          = require('./commute.routes');
const recurringRoutes        = require('./recurringSchedule.routes');
const rideRequestRoutes      = require('./rideRequest.routes');
const rideOfferRoutes        = require('./rideOffer.routes');
const bookingRoutes          = require('./booking.routes');
const contributionRoutes     = require('./contribution.routes');
const notificationRoutes     = require('./notification.routes');
const ratingRoutes           = require('./rating.routes');
const reportRoutes           = require('./report.routes');
const adminRoutes            = require('./admin.routes');

const router = Router();

router.use('/auth',               authRoutes);
router.use('/communities',        communityRoutes);
router.use('/users',              userRoutes);
router.use('/commutes',           commuteRoutes);
router.use('/recurring-schedules', recurringRoutes);
router.use('/ride-requests',      rideRequestRoutes);
router.use('/ride-offers',        rideOfferRoutes);
router.use('/bookings',           bookingRoutes);
router.use('/contributions',      contributionRoutes);
router.use('/notifications',      notificationRoutes);
router.use('/ratings',            ratingRoutes);
router.use('/reports',            reportRoutes);
router.use('/admin',              adminRoutes);

module.exports = router;
