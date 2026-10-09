// client/src/utils/constants.js
// Keep in sync with server/src/config/constants.js
// OWNER: Member 1

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
};

export const COMMUTE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const RIDE_REQUEST_STATUS = {
  OPEN: 'OPEN',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

export const VEHICLE_TYPE = {
  BIKE: 'BIKE',
  CAR: 'CAR',
};

export const VEHICLE_LABELS = {
  BIKE: '🏍️ Bike',
  CAR: '🚗 Car',
};
